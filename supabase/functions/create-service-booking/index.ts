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
    const { package_id, scheduled_at, address, notes, auto_assign } = body

    if (!package_id || !scheduled_at || !address) {
      return errorResponse('Missing required fields', 'VALIDATION_ERROR')
    }

    // Fetch package + category
    const { data: pkg, error: pkgErr } = await adminClient
      .from('service_packages')
      .select('*, category:service_categories(*)')
      .eq('id', package_id)
      .eq('is_active', true)
      .single()

    if (pkgErr || !pkg) return errorResponse('Invalid package', 'PACKAGE_NOT_FOUND')

    // Auto-assign a provider if requested
    let provider_id: string | null = null
    if (auto_assign) {
      const { data: providers } = await adminClient.rpc('get_available_providers', {
        p_category_id: pkg.category_id,
        p_scheduled_at: scheduled_at,
      })
      const first = (providers as Array<{ id: string }> | null)?.[0]
      provider_id = first?.id ?? null
    }

    // 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const otp_hash = await sha256(otp)

    // Commission: use provider's rate if assigned, else 15% default
    let commissionPct = 15
    if (provider_id) {
      const { data: provider } = await adminClient
        .from('providers')
        .select('commission_pct')
        .eq('id', provider_id)
        .single()
      commissionPct = Number(provider?.commission_pct ?? 15)
    }
    const commission = Math.round((Number(pkg.price) * commissionPct) / 100)

    // Insert booking
    const { data: booking, error: bookingErr } = await adminClient
      .from('service_bookings')
      .insert({
        customer_id: user.id,
        provider_id,
        category_id: pkg.category_id,
        package_id: pkg.id,
        status: 'pending',
        scheduled_at,
        address,
        notes: notes ?? null,
        price: pkg.price,
        commission,
        otp_hash,
      })
      .select()
      .single()

    if (bookingErr || !booking) {
      return errorResponse('Failed to create booking: ' + bookingErr?.message, 'BOOKING_CREATE_FAILED', 500)
    }

    // Audit trail
    await adminClient.from('service_booking_events').insert({
      booking_id: booking.id,
      from_status: null,
      to_status: 'pending',
      actor_id: user.id,
      note: 'Booking created',
    })

    // Notify customer
    await adminClient.from('notification_log').insert({
      user_id: user.id,
      channel: 'in_app',
      type: 'booking',
      title: 'Booking received',
      body: `Your ${pkg.category?.name_en ?? 'service'} booking ${booking.booking_number} is being assigned.`,
      meta: { booking_id: booking.id },
    })

    // Notify provider if auto-assigned
    if (provider_id) {
      const { data: provRow } = await adminClient
        .from('providers')
        .select('user_id')
        .eq('id', provider_id)
        .single()
      if (provRow?.user_id) {
        await adminClient.from('notification_log').insert({
          user_id: provRow.user_id,
          channel: 'in_app',
          type: 'booking',
          title: 'New booking',
          body: `You have a new booking ${booking.booking_number}.`,
          meta: { booking_id: booking.id },
        })
      }
    }

    // Return plaintext OTP ONCE. After this the DB only has the hash.
    return successResponse({ booking, otp })
  } catch (err) {
    return errorResponse(
      'Internal server error: ' + (err instanceof Error ? err.message : 'Unknown'),
      'INTERNAL_ERROR',
      500
    )
  }
})
