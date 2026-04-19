import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

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

  const supabase = createAdminClient()

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
  } catch {
    // Log but return 200 to prevent Razorpay retries for internal errors
  }

  // Always return 200 for valid webhook calls
  return NextResponse.json({ received: true })
}
