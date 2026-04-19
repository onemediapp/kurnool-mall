import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const adminClient = createClient(supabaseUrl, serviceKey)

    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const { order_id, rating, comment } = await req.json()

    if (!order_id || !rating || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: 'order_id and rating (1-5) are required' }), { status: 400, headers: corsHeaders })
    }

    // Validate: order must be delivered and belong to this user
    const { data: order } = await adminClient
      .from('orders')
      .select('id, vendor_id, product_id, customer_id, status')
      .eq('id', order_id)
      .eq('customer_id', user.id)
      .eq('status', 'delivered')
      .single()

    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found or not eligible for review' }), { status: 400, headers: corsHeaders })
    }

    // Get product from order items
    const { data: orderItem } = await adminClient
      .from('order_items')
      .select('product_id')
      .eq('order_id', order_id)
      .limit(1)
      .single()

    const product_id = orderItem?.product_id ?? null

    // Insert review
    const { error: reviewError } = await adminClient.from('reviews').insert({
      order_id,
      customer_id: user.id,
      vendor_id: order.vendor_id,
      product_id,
      rating,
      comment: comment?.trim() || null,
    })

    if (reviewError) {
      if (reviewError.code === '23505') {
        return new Response(JSON.stringify({ error: 'You have already reviewed this order' }), { status: 409, headers: corsHeaders })
      }
      return new Response(JSON.stringify({ error: reviewError.message }), { status: 500, headers: corsHeaders })
    }

    // Update vendor's average rating
    const { data: allReviews } = await adminClient
      .from('reviews')
      .select('rating')
      .eq('vendor_id', order.vendor_id)

    if (allReviews && allReviews.length > 0) {
      const avgRating = allReviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / allReviews.length
      await adminClient.from('vendors').update({ rating: Number(avgRating.toFixed(1)) }).eq('id', order.vendor_id)
    }

    // Award 50 bonus loyalty points for reviewing
    const bonusPoints = 50
    const { data: acc } = await adminClient
      .from('loyalty_accounts')
      .select('points_balance, points_lifetime')
      .eq('user_id', user.id)
      .maybeSingle()

    if (acc) {
      await adminClient.from('loyalty_accounts').update({
        points_balance: acc.points_balance + bonusPoints,
        points_lifetime: acc.points_lifetime + bonusPoints,
      }).eq('user_id', user.id)
    } else {
      await adminClient.from('loyalty_accounts').insert({
        user_id: user.id,
        points_balance: bonusPoints,
        points_lifetime: bonusPoints,
      })
    }

    await adminClient.from('loyalty_transactions').insert({
      user_id: user.id,
      order_id,
      points: bonusPoints,
      balance_after: (acc?.points_balance ?? 0) + bonusPoints,
      type: 'bonus',
      description: 'Review submitted',
    })

    return new Response(
      JSON.stringify({ success: true, bonus_points: bonusPoints }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})
