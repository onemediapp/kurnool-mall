// Supabase Edge Function: Update Service Booking Status
// Updates booking status and sends notifications

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

function errorResponse(message: string, code: string, status = 400) {
  return new Response(
    JSON.stringify({ data: null, error: { message, code } }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function successResponse<T>(data: T) {
  return new Response(
    JSON.stringify({ data, error: null }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    const { booking_id, status, cancel_reason, admin_id } = body;

    // Validate required fields
    if (!booking_id || !status) {
      return errorResponse('Missing required fields: booking_id, status', 'VALIDATION_ERROR');
    }

    // Validate status value
    const validStatuses: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return errorResponse(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        'INVALID_STATUS'
      );
    }

    // Get current booking
    const { data: booking, error: bookingError } = await adminClient
      .from('service_bookings')
      .select('id, customer_id, provider_id, status, service_type, booking_date, booking_time')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      return errorResponse('Booking not found', 'BOOKING_NOT_FOUND', 404);
    }

    const previousStatus = booking.status;

    // Update booking status
    const { data: updatedBooking, error: updateError } = await adminClient
      .from('service_bookings')
      .update({
        status: status,
        ...(status === 'cancelled' && { cancel_reason: cancel_reason || null }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking_id)
      .select()
      .single();

    if (updateError || !updatedBooking) {
      return errorResponse(
        'Failed to update booking: ' + updateError?.message,
        'UPDATE_FAILED',
        500
      );
    }

    // Log the action in admin_audit
    await adminClient.from('admin_audit').insert({
      admin_id: admin_id || null,
      action: 'update_service_booking_status',
      entity_type: 'service_bookings',
      entity_id: booking_id,
      changes: {
        status_from: previousStatus,
        status_to: status,
        cancel_reason: cancel_reason || null,
      },
    });

    // Prepare notification message
    let notificationTitle = '';
    let notificationBody = '';

    switch (status) {
      case 'confirmed':
        notificationTitle = 'Booking Confirmed';
        notificationBody = `Your service booking for ${booking.booking_date} at ${booking.booking_time} has been confirmed.`;
        break;
      case 'completed':
        notificationTitle = 'Booking Completed';
        notificationBody = `Your service booking has been completed. Please rate your experience.`;
        break;
      case 'cancelled':
        notificationTitle = 'Booking Cancelled';
        notificationBody = cancel_reason || 'Your service booking has been cancelled.';
        break;
      default:
        notificationTitle = 'Booking Status Updated';
        notificationBody = `Your booking status has been updated to ${status}.`;
    }

    // Send notification to customer
    await adminClient.from('admin_audit').insert({
      admin_id: null,
      action: 'send_notification',
      entity_type: 'service_bookings',
      entity_id: booking_id,
      changes: {
        user_id: booking.customer_id,
        type: 'booking_update',
        title: notificationTitle,
        body: notificationBody,
      },
    });

    // Notify provider if status is confirmed or completed
    if (booking.provider_id && (status === 'confirmed' || status === 'completed')) {
      await adminClient.from('admin_audit').insert({
        admin_id: null,
        action: 'send_notification',
        entity_type: 'service_bookings',
        entity_id: booking_id,
        changes: {
          user_id: booking.provider_id,
          type: 'booking_update',
          title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          body: `Service booking has been ${status}.`,
        },
      });
    }

    return successResponse({
      booking_id: updatedBooking.id,
      status: updatedBooking.status,
      previous_status: previousStatus,
      updated_at: updatedBooking.updated_at,
    });
  } catch (err) {
    console.error('Error updating booking status:', err);
    return errorResponse(
      'Internal server error: ' + (err instanceof Error ? err.message : 'Unknown'),
      'INTERNAL_ERROR',
      500
    );
  }
});
