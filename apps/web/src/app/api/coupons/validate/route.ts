import { NextResponse } from 'next/server'
import { createClient } from '@kurnool-mall/supabase-client/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ valid: false, discount_amount: 0, message: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { code, order_total, vendor_id } = body

    if (!code || !order_total) {
      return NextResponse.json({ valid: false, discount_amount: 0, message: 'Code and order total required' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('validate_coupon', {
      p_code: code.toUpperCase(),
      p_user_id: user.id,
      p_order_total: order_total,
      p_vendor_id: vendor_id ?? null,
    }).single()

    if (error) {
      return NextResponse.json({ valid: false, discount_amount: 0, message: 'Failed to validate coupon' })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ valid: false, discount_amount: 0, message: 'Something went wrong' }, { status: 500 })
  }
}
