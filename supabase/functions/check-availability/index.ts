// Supabase Edge Function: Check Availability
// Check provider time slots and hall booking conflicts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

interface ProviderAvailability {
  day_of_week: number;
  day_name: string;
  slots: Array<{
    start_time: string;
    end_time: string;
    is_available: boolean;
  }>;
}

interface HallAvailability {
  hall_id: string;
  date: string;
  available_slots: Array<{
    start_time: string;
    end_time: string;
    available: boolean;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET' && req.method !== 'POST') {
    return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const client = createClient(supabaseUrl, anonKey);

    const url = new URL(req.url);
    const type = url.searchParams.get('type'); // 'provider' or 'hall'
    const entityId = url.searchParams.get('entity_id');
    const date = url.searchParams.get('date'); // YYYY-MM-DD

    if (!type || !entityId) {
      return errorResponse(
        'Missing required parameters: type, entity_id',
        'VALIDATION_ERROR'
      );
    }

    if (type === 'provider') {
      // Check provider availability
      if (!date) {
        return errorResponse(
          'Missing required parameter: date',
          'VALIDATION_ERROR'
        );
      }

      const checkDate = new Date(date);
      const dayOfWeek = checkDate.getDay();

      // Get provider's time slots for the day
      const { data: slots, error: slotsError } = await client
        .from('service_time_slots')
        .select('id, day_of_week, start_time, end_time, available')
        .eq('provider_id', entityId)
        .eq('day_of_week', dayOfWeek);

      if (slotsError) {
        return errorResponse('Failed to fetch availability', 'FETCH_ERROR', 500);
      }

      // Get booked times for this date
      const { data: bookings, error: bookingsError } = await client
        .from('service_bookings')
        .select('booking_time')
        .eq('provider_id', entityId)
        .eq('booking_date', date)
        .neq('status', 'cancelled');

      if (bookingsError) {
        return errorResponse('Failed to fetch bookings', 'FETCH_ERROR', 500);
      }

      const bookedTimes = (bookings || []).map((b) => b.booking_time);

      // Format availability
      const availability: ProviderAvailability[] = [];
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      if (slots && slots.length > 0) {
        const slotsByDay = slots.reduce((acc: Record<number, any[]>, slot) => {
          if (!acc[slot.day_of_week]) acc[slot.day_of_week] = [];
          acc[slot.day_of_week].push(slot);
          return acc;
        }, {});

        for (const dayNum in slotsByDay) {
          const daySlots = slotsByDay[dayNum];
          const dayAvailability: ProviderAvailability = {
            day_of_week: parseInt(dayNum),
            day_name: dayNames[parseInt(dayNum)],
            slots: daySlots.map((slot) => ({
              start_time: slot.start_time,
              end_time: slot.end_time,
              is_available: slot.available && !bookedTimes.includes(slot.start_time),
            })),
          };
          availability.push(dayAvailability);
        }
      }

      return successResponse({
        provider_id: entityId,
        date,
        availability,
        booked_times: bookedTimes,
      });
    } else if (type === 'hall') {
      // Check hall availability
      if (!date) {
        return errorResponse(
          'Missing required parameter: date',
          'VALIDATION_ERROR'
        );
      }

      // Get all bookings for this hall on the date
      const { data: bookings, error: bookingsError } = await client
        .from('hall_bookings')
        .select('start_time, end_time')
        .eq('hall_id', entityId)
        .eq('booking_date', date)
        .neq('status', 'cancelled');

      if (bookingsError) {
        return errorResponse('Failed to fetch bookings', 'FETCH_ERROR', 500);
      }

      // Generate hourly slots
      const slots = [];
      for (let hour = 9; hour < 23; hour++) {
        const startTime = `${String(hour).padStart(2, '0')}:00`;
        const endTime = `${String(hour + 1).padStart(2, '0')}:00`;

        // Check if this slot conflicts with any booking
        const isBooked = (bookings || []).some((booking) => {
          const bookingStart = booking.start_time;
          const bookingEnd = booking.end_time;

          // Check for overlap
          return startTime < bookingEnd && endTime > bookingStart;
        });

        slots.push({
          start_time: startTime,
          end_time: endTime,
          available: !isBooked,
        });
      }

      const availability: HallAvailability = {
        hall_id: entityId,
        date,
        available_slots: slots,
      };

      return successResponse(availability);
    } else {
      return errorResponse(
        'Invalid type. Must be "provider" or "hall"',
        'INVALID_TYPE'
      );
    }
  } catch (err) {
    console.error('Error checking availability:', err);
    return errorResponse(
      'Internal server error: ' + (err instanceof Error ? err.message : 'Unknown'),
      'INTERNAL_ERROR',
      500
    );
  }
});
