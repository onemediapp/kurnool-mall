import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return errorResponse('Missing authorization', 'UNAUTHORIZED', 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const adminClient = createClient(supabaseUrl, serviceKey)

    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const body = await req.json()
    const { booking_id, to_status, otp, note } = body

    if (!booking_id || !to_status) {
      return errorResponse('Missing required fields', 'VALIDATION_ERROR')
    }

    // Fetch booking + check actor permission
    const { data: booking, error: bookErr } = await adminClient
      .from('service_bookings')
      .select('*, provider:providers(id, user_id)')
      .eq('id', booking_id)
      .single()

    if (bookErr || !booking) return errorResponse('Booking not found', 'BOOKING_NOT_FOUND', 404)

    // Determine role
    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = profile?.role
    const providerUserId = (booking.provider as unknown as { user_id?: string } | null)?.user_id
    const isAdmin = role === 'admin'
    const isAssignedProvider = providerUserId && providerUserId === user.id
    const isCustomer = booking.customer_id === user.id

    if (!isAdmin && !isAssignedProvider && !isCustomer) {
      return errorResponse('Forbidden', 'FORBIDDEN', 403)
    }

    // Transition-specific rules
    if (to_status === 'in_progress') {
      // Require OTP match, provider or admin only
      if (!isAdmin && !isAssignedProvider) {
        return errorResponse('Only the assigned provider can start the job', 'FORBIDDEN', 403)
      }
      if (!otp) return errorResponse('OTP required', 'OTP_REQUIRED')
      const hash = await sha256(String(otp))
      if (hash !== booking.otp_hash) return errorResponse('Invalid OTP', 'OTP_INVALID')
    }

    if (['cancelled'].includes(to_status) && !isAdmin && !isCustomer && !isAssignedProvider) {
      return errorResponse('Forbidden', 'FORBIDDEN', 403)
    }

    if (['confirmed', 'rejected', 'en_route', 'completed', 'paid'].includes(to_status)) {
      if (!isAdmin && !isAssignedProvider) {
        return errorResponse('Forbidden', 'FORBIDDEN', 403)
      }
    }

    // Invoke authoritative FSM
    const { data: updated, error: rpcErr } = await adminClient.rpc('transition_booking_status', {
      p_booking_id: booking_id,
      p_to_status: to_status,
      p_actor_id: user.id,
      p_note: note ?? null,
    })

    if (rpcErr) return errorResponse(rpcErr.message, 'TRANSITION_INVALID')

    // Mark otp_verified_at when starting
    if (to_status === 'in_progress') {
      await adminClient
        .from('service_bookings')
        .update({ otp_verified_at: new Date().toISOString() })
        .eq('id', booking_id)
    }

    // Notify customer
    await adminClient.from('notification_log').insert({
      user_id: booking.customer_id,
      channel: 'in_app',
      type: 'booking',
      title: `Booking ${to_status.replace('_', ' ')}`,
      body: `Your booking ${booking.booking_number} is now ${to_status.replace('_', ' ')}.`,
      meta: { booking_id },
    })

    // Update provider total_jobs on completion
    if (to_status === 'completed' && booking.provider_id) {
      await adminClient.rpc('increment_provider_jobs', { p_provider_id: booking.provider_id }).catch(async () => {
        // Fallback: manual increment
        const { data: p } = await adminClient
          .from('providers')
          .select('total_jobs')
          .eq('id', booking.provider_id)
          .single()
        if (p) {
          await adminClient
            .from('providers')
            .update({ total_jobs: (p.total_jobs ?? 0) + 1 })
            .eq('id', booking.provider_id)
        }
      })
    }

    return successResponse({ booking: updated })
  } catch (err) {
    return errorResponse(
      'Internal server error: ' + (err instanceof Error ? err.message : 'Unknown'),
      'INTERNAL_ERROR',
      500
    )
  }
})
