// Shared CORS + rate-limit helpers for Edge Functions.
//
// Set ALLOWED_ORIGINS env var (comma-separated) in production to override
// the defaults below.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any

const DEFAULT_ALLOWED = [
  'https://kurnoolmall.com',
  'https://www.kurnoolmall.com',
  'http://localhost:3000',
  'http://localhost:3001',
]

function allowedOrigins(): string[] {
  const env = Deno?.env?.get?.('ALLOWED_ORIGINS') as string | undefined
  if (env) return env.split(',').map((s) => s.trim()).filter(Boolean)
  return DEFAULT_ALLOWED
}

export function corsHeaders(req: Request): Record<string, string> {
  const list = allowedOrigins()
  const origin = req.headers.get('Origin') ?? ''
  const allowed = list.includes(origin) ? origin : list[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

export function preflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkRateLimit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: any,
  userId: string,
  fn: string,
  maxPerHour: number,
): Promise<boolean> {
  const windowStart = new Date(
    Math.floor(Date.now() / 3600000) * 3600000,
  ).toISOString()

  // Try increment-or-insert.
  const { data: existing } = await adminClient
    .from('edge_rate_limits')
    .select('count')
    .eq('user_id', userId)
    .eq('function_name', fn)
    .eq('window_start', windowStart)
    .maybeSingle()

  if (existing) {
    if (existing.count >= maxPerHour) return false
    await adminClient
      .from('edge_rate_limits')
      .update({ count: existing.count + 1 })
      .eq('user_id', userId)
      .eq('function_name', fn)
      .eq('window_start', windowStart)
    return true
  }

  await adminClient
    .from('edge_rate_limits')
    .insert({ user_id: userId, function_name: fn, window_start: windowStart, count: 1 })
  return true
}
