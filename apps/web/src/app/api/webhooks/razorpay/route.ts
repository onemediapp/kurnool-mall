import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@kurnool-mall/supabase-client/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  // Verify webhook signature
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: 'Missing webhook secret or signature' }, { status: 400 })
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = payload.event as string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entity = (payload as any)?.payload?.payment?.entity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const idempotencyKey = ((payload as any)?.id as string) ?? entity?.id ?? signature

  const supabase = createAdminClient()

  // Idempotency: insert webhook log; UNIQUE constraint on idempotency_key
  // makes a duplicate event a no-op.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase.from('webhook_logs') as any)
    .insert({
      source: 'razorpay',
      event_type: event,
      payload,
      processed: false,
      idempotency_key: idempotencyKey,
    })

  if (insertError) {
    // Postgres unique violation = already processed; treat as success.
    if ((insertError as { code?: string }).code === '23505') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    // Other DB error — log silently, return 200 to avoid Razorpay retry storm.
    console.error('[razorpay webhook] log insert failed', insertError)
  }

  try {
    if (event === 'payment.captured') {
      const razorpayOrderId = entity?.order_id as string
      if (razorpayOrderId) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            razorpay_payment_id: entity?.id,
          })
          .eq('razorpay_order_id', razorpayOrderId)
      }
    } else if (event === 'payment.failed') {
      const razorpayOrderId = entity?.order_id as string
      if (razorpayOrderId) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            status: 'cancelled',
          })
          .eq('razorpay_order_id', razorpayOrderId)
      }
    } else if (event === 'refund.processed') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const refundEntity = (payload as any)?.payload?.refund?.entity
      const paymentId = refundEntity?.payment_id as string
      if (paymentId) {
        await supabase
          .from('orders')
          .update({ payment_status: 'refunded' })
          .eq('razorpay_payment_id', paymentId)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('webhook_logs') as any)
      .update({ processed: true })
      .eq('idempotency_key', idempotencyKey)
  } catch (err) {
    console.error('[razorpay webhook] processing error', err)
  }

  return NextResponse.json({ received: true })
}
