// Sends an Expo Push payload to every device registered under a user_id.
//
// Called from other Edge Functions (server-to-server, service_role bearer)
// — NOT exposed to the client directly. No rate limiting because callers
// are already authenticated server processes.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders, preflight } from '../_shared/cors.ts'

interface PushPayload {
  user_id: string
  title: string
  body: string
  data?: Record<string, unknown>
  /** Optional: filter by app so the customer app doesn't get vendor
   *  new-order pings and vice versa. */
  app?: 'customer' | 'vendor'
}

Deno.serve(async (req: Request) => {
  const pre = preflight(req)
  if (pre) return pre

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: { message: 'Method not allowed' } }), {
      status: 405,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  let payload: PushPayload
  try {
    payload = (await req.json()) as PushPayload
  } catch {
    return new Response(JSON.stringify({ error: { message: 'Invalid JSON' } }), {
      status: 400,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  const { user_id, title, body, data, app } = payload
  if (!user_id || !title || !body) {
    return new Response(JSON.stringify({ error: { message: 'Missing required fields' } }), {
      status: 400,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  let query = admin.from('user_devices').select('push_token').eq('user_id', user_id)
  if (app) query = query.eq('app', app)
  const { data: devices } = await query

  if (!devices?.length) {
    return new Response(JSON.stringify({ data: { sent: 0 }, error: null }), {
      status: 200,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  // Expo Push accepts a batch in one POST. Only ExponentPushToken[...] tokens
  // are valid; filter anything else that might have been stored.
  const messages = (devices as Array<{ push_token: string }>)
    .filter((d) => d.push_token.startsWith('ExponentPushToken['))
    .map((d) => ({
      to: d.push_token,
      sound: 'default',
      title,
      body,
      data: data ?? {},
    }))

  if (messages.length === 0) {
    return new Response(JSON.stringify({ data: { sent: 0 }, error: null }), {
      status: 200,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(messages),
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ data: null, error: { message: (e as Error).message, code: 'EXPO_PUSH' } }),
      { status: 502, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }

  return new Response(JSON.stringify({ data: { sent: messages.length }, error: null }), {
    status: 200,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
})
