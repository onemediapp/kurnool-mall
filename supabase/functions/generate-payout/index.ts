import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const COMMISSION_RATE = 0.08
const GST_ON_COMMISSION = 0.18

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

    // Admin role check
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const { data: userRecord } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userRecord || userRecord.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: corsHeaders })
    }

    const { vendor_id, period_start, period_end } = await req.json()

    if (!vendor_id || !period_start || !period_end) {
      return new Response(JSON.stringify({ error: 'vendor_id, period_start, period_end required' }), { status: 400, headers: corsHeaders })
    }

    // Calculate GMV for the period
    const { data: orders } = await adminClient
      .from('orders')
      .select('grand_total')
      .eq('vendor_id', vendor_id)
      .eq('status', 'delivered')
      .gte('created_at', period_start)
      .lte('created_at', period_end)

    const gmv = (orders ?? []).reduce((s: number, o: { grand_total: number }) => s + o.grand_total, 0)
    const commission = gmv * COMMISSION_RATE
    const gst = commission * GST_ON_COMMISSION
    const net_amount = gmv - commission - gst

    const { data: payout, error } = await adminClient.from('vendor_payouts').insert({
      vendor_id,
      period_start,
      period_end,
      total_gmv: gmv,
      total_commission: commission,
      gst_on_commission: gst,
      tcs_deducted: 0,
      refunds_deducted: 0,
      net_payout: net_amount,
      status: 'pending',
    }).select().single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
    }

    return new Response(
      JSON.stringify({ payout }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})
