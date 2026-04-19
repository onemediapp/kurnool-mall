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

interface Rule {
  field: string
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in'
  value: string | number | string[]
}

interface Segment {
  match: 'all' | 'any'
  rules: Rule[]
}

// Very small predicate matcher (runs on already-loaded users).
function matches(user: Record<string, unknown>, segment: Segment): boolean {
  if (segment.rules.length === 0) return true
  const fn = segment.match === 'all' ? 'every' : 'some'
  return segment.rules[fn]((r) => {
    const v = user[r.field]
    switch (r.op) {
      case 'eq':  return v === r.value
      case 'neq': return v !== r.value
      case 'gt':  return typeof v === 'number' && v > Number(r.value)
      case 'gte': return typeof v === 'number' && v >= Number(r.value)
      case 'lt':  return typeof v === 'number' && v < Number(r.value)
      case 'lte': return typeof v === 'number' && v <= Number(r.value)
      case 'in':  return Array.isArray(r.value) && r.value.includes(String(v))
      default: return false
    }
  })
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

    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') return errorResponse('Forbidden', 'FORBIDDEN', 403)

    const body = await req.json()
    const { campaign_id } = body
    if (!campaign_id) return errorResponse('Missing campaign_id', 'VALIDATION_ERROR')

    const { data: campaign, error: cErr } = await adminClient
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (cErr || !campaign) return errorResponse('Campaign not found', 'CAMPAIGN_NOT_FOUND', 404)

    if (campaign.status === 'sent' || campaign.status === 'sending') {
      return errorResponse('Campaign already sent', 'ALREADY_SENT')
    }

    // Mark sending
    await adminClient
      .from('campaigns')
      .update({ status: 'sending', updated_at: new Date().toISOString() })
      .eq('id', campaign_id)

    // Resolve audience — fetch customers + apply segment rules in memory
    const { data: allUsers } = await adminClient
      .from('users')
      .select('id, role, language_pref, created_at')
      .eq('is_deleted', false)

    const segment = (campaign.audience_segment ?? { match: 'all', rules: [] }) as Segment
    const audience = (allUsers ?? []).filter((u) => matches(u as Record<string, unknown>, segment))

    const content = campaign.content as Record<string, string>
    const title = content.title_en || campaign.name
    const bodyTxt = content.body_en || ''

    // In-app banners: just flip a flag + log ONE entry per user.
    // All other channels: stub send (log only; real delivery is not in v3 scope).
    const notifRows = audience.map((u) => ({
      user_id: u.id,
      channel:
        campaign.type === 'push' ? 'push' :
        campaign.type === 'whatsapp' ? 'whatsapp' :
        campaign.type === 'email' ? 'email' :
        'in_app',
      type: 'promo',
      title,
      body: bodyTxt,
      meta: { campaign_id },
    }))

    // Batch insert
    const BATCH = 500
    let sent = 0
    for (let i = 0; i < notifRows.length; i += BATCH) {
      const chunk = notifRows.slice(i, i + BATCH)
      const { error } = await adminClient.from('notification_log').insert(chunk)
      if (!error) sent += chunk.length
    }

    // Mark sent + record stats
    await adminClient
      .from('campaigns')
      .update({
        status: 'sent',
        stats: { sent, delivered: sent, opened: 0, clicked: 0 },
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaign_id)

    return successResponse({ sent, audience_size: audience.length })
  } catch (err) {
    return errorResponse(
      'Internal server error: ' + (err instanceof Error ? err.message : 'Unknown'),
      'INTERNAL_ERROR',
      500
    )
  }
})
