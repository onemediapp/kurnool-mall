const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function sanitizeText(input: string, maxLength = 1000): string {
  if (typeof input !== 'string') return ''
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .trim()
    .slice(0, maxLength)
}

export function isValidUUID(str: unknown): str is string {
  return typeof str === 'string' && UUID_RE.test(str)
}

export function safeInt(value: unknown, min: number, max: number): number {
  const n = parseInt(String(value), 10)
  if (isNaN(n)) throw new Error('Invalid number')
  return Math.min(Math.max(n, min), max)
}

export function safePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  if (digits.length === 13 && digits.startsWith('91')) return `+${digits.slice(0, 12)}`
  return null
}
