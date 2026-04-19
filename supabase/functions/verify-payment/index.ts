import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function errorResponse(message: string, code: string, status = 400) {
  return new Response(
    JSON.stringify({ data: null, error: { message, code } }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function successResponse<T>(data: T) {
  return new Response(
    JSON.stringify({ data, error: null }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405)
  }

  try {
    // ─── 1. Auth check ───────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return errorResponse('Missing authorization', 'UNAUTHORIZED', 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const razorpaySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const adminClient = createClient(supabaseUrl, serviceKey)

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    // ─── 2. Parse body ────────────────────────────────────────
    const body = await req.json()
    const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return errorResponse('Missing required payment fields', 'VALIDATION_ERROR')
    }

    // ─── 3. Verify order belongs to user ─────────────────────
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, customer_id, payment_status, razorpay_order_id')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return errorResponse('Order not found', 'ORDER_NOT_FOUND', 404)
    }

    if (order.customer_id !== user.id) {
      return errorResponse('Not authorized', 'FORBIDDEN', 403)
    }

    // ─── 4. Check idempotency ─────────────────────────────────
    if (order.payment_status === 'paid') {
      return successResponse({ already_paid: true, message: 'Payment already verified' })
    }

    // ─── 5. Verify Razorpay signature (HMAC-SHA256) ───────────
    const signatureData = `${razorpay_order_id}|${razorpay_payment_id}`
    const hmac = createHmac('sha256', razorpaySecret)
    hmac.update(signatureData)
    const computedSignature = hmac.digest('hex')

    if (computedSignature !== razorpay_signature) {
      // Mark payment as failed
      await adminClient
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', order_id)

      return errorResponse('Invalid payment signature', 'SIGNATURE_MISMATCH', 400)
    }

    // ─── 6. Mark payment as paid ──────────────────────────────
    const { data: updatedOrder, error: updateError } = await adminClient
      .from('orders')
      .update({
        payment_status: 'paid',
        razorpay_payment_id,
      })
      .eq('id', order_id)
      .select()
      .single()

    if (updateError) {
      return errorResponse('Failed to update payment status', 'UPDATE_FAILED', 500)
    }

    return successResponse({ order: updatedOrder, verified: true })

  } catch (err) {
    return errorResponse(
      'Internal server error: ' + (err instanceof Error ? err.message : 'Unknown'),
      'INTERNAL_ERROR',
      500
    )
  }
})
