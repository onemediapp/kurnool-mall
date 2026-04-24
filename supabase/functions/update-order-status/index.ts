import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, preflight } from '../_shared/cors.ts'
import { sendPush } from '../_shared/push.ts'

function errorResponse(req: Request, message: string, code: string, status = 400) {
  return new Response(
    JSON.stringify({ data: null, error: { message, code } }),
    { status, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
  )
}

function successResponse<T>(req: Request, data: T) {
  return new Response(
    JSON.stringify({ data, error: null }),
    { status: 200, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
  )
}

// Valid state machine transitions
const TRANSITIONS: Record<string, string[]> = {
  pending:          ['accepted', 'rejected', 'cancelled'],
  accepted:         ['preparing', 'cancelled'],
  preparing:        ['ready'],
  ready:            ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  rejected:         [],
  delivered:        [],
  cancelled:        [],
}

serve(async (req) => {
  const pre = preflight(req)
  if (pre) return pre

  if (req.method !== 'POST') {
    return errorResponse(req, 'Method not allowed', 'METHOD_NOT_ALLOWED', 405)
  }

  try {
    // ─── 1. Auth check ───────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return errorResponse(req, 'Missing authorization', 'UNAUTHORIZED', 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const adminClient = createClient(supabaseUrl, serviceKey)

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return errorResponse(req, 'Unauthorized', 'UNAUTHORIZED', 401)

    // ─── 2. Parse body ────────────────────────────────────────
    const body = await req.json()
    const { order_id, status, rejection_reason, rider_name, rider_phone } = body

    if (!order_id || !status) {
      return errorResponse(req, 'Missing order_id or status', 'VALIDATION_ERROR')
    }

    // ─── 3. Fetch current order ───────────────────────────────
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('*, vendor:vendors(user_id)')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return errorResponse(req, 'Order not found', 'ORDER_NOT_FOUND', 404)
    }

    // ─── 4. Role-based validation ─────────────────────────────
    const { data: userProfile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = userProfile?.role as string | undefined

    // Vendor can only update their own orders
    if (userRole === 'vendor') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vendorUserId = (order.vendor as any)?.user_id
      if (vendorUserId !== user.id) {
        return errorResponse(req, 'Not authorized to update this order', 'FORBIDDEN', 403)
      }
      // Vendors cannot assign riders or mark delivered
      if (['out_for_delivery', 'delivered'].includes(status)) {
        return errorResponse(req, 'Vendors cannot perform this action', 'FORBIDDEN', 403)
      }
    }

    // ─── 5. Validate state machine transition ──────────────────
    const currentStatus = order.status as string
    const allowedNext = TRANSITIONS[currentStatus] || []

    if (!allowedNext.includes(status)) {
      return errorResponse(
        req,
        `Cannot transition from '${currentStatus}' to '${status}'`,
        'INVALID_TRANSITION'
      )
    }

    // ─── 6. Business rules for specific transitions ───────────
    if (status === 'out_for_delivery') {
      if (!rider_name || !rider_phone) {
        return errorResponse(
          req,
          'Rider name and phone are required for out_for_delivery',
          'RIDER_REQUIRED'
        )
      }
    }

    // ─── 7. Build update payload ──────────────────────────────
    const updatePayload: Record<string, unknown> = { status }

    if (status === 'rejected' && rejection_reason) {
      updatePayload.rejection_reason = rejection_reason
    }

    if (status === 'out_for_delivery') {
      updatePayload.rider_name = rider_name
      updatePayload.rider_phone = rider_phone
    }

    // ─── 8. UPDATE order ──────────────────────────────────────
    const { data: updatedOrder, error: updateError } = await adminClient
      .from('orders')
      .update(updatePayload)
      .eq('id', order_id)
      .select('*, order_items(*)')
      .single()

    if (updateError || !updatedOrder) {
      return errorResponse(req, 'Failed to update order', 'UPDATE_FAILED', 500)
    }

    // Customer-visible statuses get a push; internal transitions stay silent.
    const customerFacing: Record<string, { title: string; body: (n: string) => string }> = {
      accepted: { title: 'Order accepted', body: (n) => `Order ${n} is being prepared.` },
      rejected: { title: 'Order rejected', body: (n) => `Order ${n} was rejected.` },
      preparing: { title: 'Order preparing', body: (n) => `Your order ${n} is being prepared.` },
      ready: { title: 'Ready for pickup', body: (n) => `Order ${n} is ready. Rider on the way.` },
      out_for_delivery: { title: 'Out for delivery', body: (n) => `Order ${n} is on its way!` },
      delivered: { title: 'Delivered', body: (n) => `Order ${n} delivered. Enjoy!` },
      cancelled: { title: 'Order cancelled', body: (n) => `Order ${n} was cancelled.` },
    }
    const notice = customerFacing[updatedOrder.status as string]
    if (notice && updatedOrder.customer_id) {
      await sendPush({
        user_id: updatedOrder.customer_id as string,
        title: notice.title,
        body: notice.body(updatedOrder.order_number as string),
        data: { type: 'order_status', order_id: updatedOrder.id },
        app: 'customer',
      })
    }

    return successResponse(req, updatedOrder)

  } catch (err) {
    return errorResponse(
      req,
      'Internal server error: ' + (err instanceof Error ? err.message : 'Unknown'),
      'INTERNAL_ERROR',
      500
    )
  }
})
