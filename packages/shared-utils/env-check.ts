const PUBLIC_REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const

const SERVER_REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

const PAYMENT_REQUIRED = [
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'NEXT_PUBLIC_RAZORPAY_KEY_ID',
] as const

function missing(keys: readonly string[]): string[] {
  return keys.filter((k) => !process.env[k])
}

export function validatePublicEnv(): void {
  const m = missing(PUBLIC_REQUIRED)
  if (m.length > 0) {
    throw new Error(`Missing required public env vars: ${m.join(', ')}`)
  }
}

export function validateServerEnv(): void {
  const m = missing(SERVER_REQUIRED)
  if (m.length > 0) {
    throw new Error(`Missing required server env vars: ${m.join(', ')}`)
  }
}

export function validatePaymentEnv(): void {
  const m = missing(PAYMENT_REQUIRED)
  if (m.length > 0) {
    throw new Error(`Missing required payment env vars: ${m.join(', ')}`)
  }
}

export function envStatus(): { ok: boolean; missing: string[] } {
  const all = [...new Set([...SERVER_REQUIRED, ...PAYMENT_REQUIRED])]
  const m = missing(all)
  return { ok: m.length === 0, missing: m }
}
