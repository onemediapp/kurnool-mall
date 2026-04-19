// Supabase Edge Function: Search Services
// Full-text search with filters and availability checking

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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET' && req.method !== 'POST') {
    return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const client = createClient(supabaseUrl, anonKey);

    // Parse query parameters
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('q') || '';
    const categoryId = url.searchParams.get('category_id') || '';
    const minRating = parseFloat(url.searchParams.get('min_rating') || '0') || 0;
    const verifiedOnly = url.searchParams.get('verified_only') === 'true';
    const sortBy = url.searchParams.get('sort_by') || 'rating'; // rating, name, newest
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0') || 0;

    // Build query
    let query = client
      .from('service_providers')
      .select(
        `
        id,
        name,
        category_id,
        service_type,
        description,
        phone,
        image_url,
        rating,
        total_reviews,
        verified,
        is_active,
        created_at,
        service_time_slots!inner(id, day_of_week, start_time, end_time, available)
      `,
        { count: 'exact' }
      )
      .eq('is_active', true);

    // Apply filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (minRating > 0) {
      query = query.gte('rating', minRating);
    }

    if (verifiedOnly) {
      query = query.eq('verified', true);
    }

    // Full-text search on name and service_type
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,service_type.ilike.%${searchQuery}%`);
    }

    // Sorting
    switch (sortBy) {
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'rating':
      default:
        query = query.order('rating', { ascending: false });
        break;
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: providers, error, count } = await query;

    if (error) {
      console.error('Search error:', error);
      return errorResponse('Search failed: ' + error.message, 'SEARCH_FAILED', 500);
    }

    // Filter results based on availability if needed
    const today = new Date();
    const dayOfWeek = today.getDay();

    const filteredProviders = (providers || [])
      .map((provider) => ({
        ...provider,
        has_availability_today: (provider.service_time_slots || []).some(
          (slot: { day_of_week: number; available: boolean }) =>
            slot.day_of_week === dayOfWeek && slot.available
        ),
      }))
      .sort((a, b) => {
        // Prioritize providers with availability
        if (a.has_availability_today && !b.has_availability_today) return -1;
        if (!a.has_availability_today && b.has_availability_today) return 1;
        return 0;
      });

    return successResponse({
      providers: filteredProviders,
      pagination: {
        total: count || 0,
        offset,
        limit,
        has_more: (offset + limit) < (count || 0),
      },
    });
  } catch (err) {
    console.error('Error searching services:', err);
    return errorResponse(
      'Internal server error: ' + (err instanceof Error ? err.message : 'Unknown'),
      'INTERNAL_ERROR',
      500
    );
  }
});
