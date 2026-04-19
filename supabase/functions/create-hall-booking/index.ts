// Supabase Edge Function: Create Hall Booking
// Validates hall availability and creates a new hall booking

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function errorResponse(message: string, code: string, status = 400) {
  return new Response(
    JSON.stringify({ data: null, error: { message, code } }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function successResponse<T>(data: T) {
  return new Response(
    JSON.stringify({ data, error: null }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('Missing authorization', 'UNAUTHORIZED', 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Parse request body
    const body = await req.json();
    const { hall_id, customer_id, booking_date, start_time, end_time, num_guests, customer_name, customer_phone, customer_email, event_type, special_requirements } = body;

    // Validate required fields
    if (!hall_id || !customer_id || !booking_date || !start_time || !end_time || !num_guests || !customer_name || !customer_phone) {
      return errorResponse(
        'Missing required fields: hall_id, customer_id, booking_date, start_time, end_time, num_guests, customer_name, customer_phone',
        'VALIDATION_ERROR'
      );
    }

    // Verify hall exists and is active
    const { data: hall, error: hallError } = await adminClient
      .from('function_halls')
      .select('id, name, capacity, price_per_hour, is_active')
      .eq('id', hall_id)
      .eq('is_active', true)
      .single();

    if (hallError || !hall) {
      return errorResponse('Hall not found or inactive', 'HALL_NOT_FOUND', 404);
    }

    // Check capacity
    if (num_guests > hall.capacity) {
      return errorResponse(
        `Guest count (${num_guests}) exceeds hall capacity (${hall.capacity})`,
        'CAPACITY_EXCEEDED'
      );
    }

    // Check for booking conflicts
    const { data: conflictingBookings, error: conflictError } = await adminClient
      .from('hall_bookings')
      .select('id')
      .eq('hall_id', hall_id)
      .eq('booking_date', booking_date)
      .neq('status', 'cancelled')
      .or(`and(start_time.lt.${end_time},end_time.gt.${start_time})`);

    if (!conflictError && conflictingBookings && conflictingBookings.length > 0) {
      return errorResponse(
        'Hall is already booked for the selected time period',
        'TIME_CONFLICT'
      );
    }

    // Calculate total price
    const startTime = new Date(`2000-01-01T${start_time}`);
    const endTime = new Date(`2000-01-01T${end_time}`);
    const hoursBooked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const totalPrice = hoursBooked * hall.price_per_hour;

    // Create the booking
    const { data: booking, error: bookingError } = await adminClient
      .from('hall_bookings')
      .insert({
        hall_id: hall_id,
        customer_id: customer_id,
        booking_date: booking_date,
        start_time: start_time,
        end_time: end_time,
        num_guests: num_guests,
        status: 'pending',
        total_price: totalPrice,
        customer_name: customer_name,
        customer_phone: customer_phone,
        customer_email: customer_email || null,
        event_type: event_type || null,
        special_requirements: special_requirements || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (bookingError || !booking) {
      return errorResponse(
        'Failed to create hall booking: ' + bookingError?.message,
        'BOOKING_CREATE_FAILED',
        500
      );
    }

    // Log the action in admin_audit
    await adminClient.from('admin_audit').insert({
      admin_id: null,
      action: 'create_hall_booking',
      entity_type: 'hall_bookings',
      entity_id: booking.id,
      changes: {
        hall_id,
        customer_id,
        booking_date,
        start_time,
        end_time,
        num_guests,
        total_price: totalPrice,
      },
    });

    return successResponse({
      booking_id: booking.id,
      booking_date: booking.booking_date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      total_price: booking.total_price,
      status: booking.status,
    });
  } catch (err) {
    console.error('Error creating hall booking:', err);
    return errorResponse(
      'Internal server error: ' + (err instanceof Error ? err.message : 'Unknown'),
      'INTERNAL_ERROR',
      500
    );
  }
});
