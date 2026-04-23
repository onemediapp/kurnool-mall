import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userRecord } = await (supabase as any)
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userRecord || userRecord.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const vendorId = searchParams.get('vendor_id')
    const status = searchParams.get('status')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('orders')
      .select('order_number, created_at, status, grand_total, payment_method, payment_status, vendor:vendors(shop_name)')
      .order('created_at', { ascending: false })

    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to)
    if (vendorId) query = query.eq('vendor_id', vendorId)
    if (status) query = query.eq('status', status)

    const { data: orders, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Generate CSV
    const headers = ['Order #', 'Date', 'Vendor', 'Status', 'Amount', 'Payment Method', 'Payment Status']
    const rows = (orders ?? []).map((o: Record<string, unknown>) => [
      o.order_number,
      new Date(o.created_at as string).toLocaleDateString('en-IN'),
      (o.vendor as { shop_name: string })?.shop_name ?? '',
      o.status,
      o.grand_total,
      o.payment_method,
      o.payment_status,
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell: unknown) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')

    const fileName = `orders-${new Date().toISOString().split('T')[0]}.csv`

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
