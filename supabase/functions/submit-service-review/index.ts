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
    const { booking_id, rating, comment } = body

    if (!booking_id || !rating) return errorResponse('Missing required fields', 'VALIDATION_ERROR')
    if (rating < 1 || rating > 5) return errorResponse('Rating must be 1-5', 'INVALID_RATING')

    // Fetch the booking and ensure it belongs to the user and is completed/paid
    const { data: booking, error: bookErr } = await adminClient
      .from('service_bookings')
      .select('id, customer_id, provider_id, status')
      .eq('id', booking_id)
      .single()

    if (bookErr || !booking) return errorResponse('Booking not found', 'BOOKING_NOT_FOUND', 404)
    if (booking.customer_id !== user.id) return errorResponse('Forbidden', 'FORBIDDEN', 403)
    if (!['completed', 'paid'].includes(booking.status)) {
      return errorResponse('Can only review completed bookings', 'INVALID_STATE')
    }
    if (!booking.provider_id) return errorResponse('No provider assigned', 'NO_PROVIDER')

    // Insert (unique per booking)
    const { data: review, error: revErr } = await adminClient
      .from('service_reviews')
      .insert({
        booking_id,
        customer_id: user.id,
        provider_id: booking.provider_id,
        rating,
        comment: comment ?? null,
      })
      .select()
      .single()

    if (revErr) {
      if ((revErr as { code?: string }).code === '23505') {
        return errorResponse('Already reviewed this booking', 'ALREADY_REVIEWED', 409)
      }
      return errorResponse('Failed to submit review: ' + revErr.message, 'REVIEW_FAILED', 500)
    }

    // Recompute provider's aggregate rating
    const { data: rows } = await adminClient
      .from('service_reviews')
      .select('rating')
      .eq('provider_id', booking.provider_id)

    if (rows && rows.length > 0) {
      const total = rows.reduce((s, r: { rating: number }) => s + r.rating, 0)
      const avg = total / rows.length
      await adminClient
        .from('providers')
        .update({ rating: Number(avg.toFixed(2)) })
        .eq('id', booking.provider_id)
    }

    return successResponse({ review })
  } catch (err) {
    return errorResponse(
      'Internal server error: ' + (err instanceof Error ? err.message : 'Unknown'),
      'INTERNAL_ERROR',
      500
    )
  }
})
