// Best-effort wrapper around the send-push Edge Function. Callers invoke
// this as a "fire and forget" side effect — failures must not break the
// primary business operation (order update, booking state change, etc.).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any

export interface SendPushArgs {
  user_id: string
  title: string
  body: string
  data?: Record<string, unknown>
  app?: 'customer' | 'vendor'
}

export async function sendPush(args: SendPushArgs): Promise<void> {
  try {
    const url = Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !key) return
    await fetch(`${url}/functions/v1/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(args),
    })
  } catch {
    // swallow — push is nice-to-have; primary op already succeeded.
  }
}
