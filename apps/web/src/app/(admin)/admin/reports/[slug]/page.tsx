'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import { Spinner, Button, DataTable, type DataTableColumn } from '@/components/shared'
import { DateRangePicker } from '@/components/shared/date-range-picker'
import { exportToCSV, exportToPDF } from '@/lib/utils/export'
import { formatPrice, formatDate, CHART_COLORS, formatCompact } from '@kurnool-mall/shared-utils'
import type { DateRange } from 'react-day-picker'

const REPORT_TITLES: Record<string, string> = {
  sales: 'Sales Report',
  services: 'Services Report',
  providers: 'Providers Report',
  customers: 'Customers Report',
  inventory: 'Inventory Report',
  loyalty: 'Loyalty Report',
}

interface ReportRow {
  id: string
  label: string
  value: number
  extra?: string
}

export default function ReportPage({ params }: { params: { slug: string } }) {
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 30)
    return { from, to }
  })
  const [rows, setRows] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  const title = REPORT_TITLES[params.slug] ?? 'Report'

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    const from = range?.from?.toISOString() ?? ''
    const to = range?.to ? new Date(range.to.getTime() + 86400000).toISOString() : ''

    let query: Promise<{ data: Record<string, unknown>[] | null }>

    switch (params.slug) {
      case 'sales':
        query = supabase
          .from('orders')
          .select('id, order_number, total, status, created_at')
          .gte('created_at', from)
          .lte('created_at', to)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(200) as unknown as Promise<{ data: Record<string, unknown>[] | null }>
        break
      case 'services':
        query = supabase
          .from('service_bookings')
          .select('id, booking_number, price, commission, status, created_at')
          .gte('created_at', from)
          .lte('created_at', to)
          .order('created_at', { ascending: false })
          .limit(200) as unknown as Promise<{ data: Record<string, unknown>[] | null }>
        break
      case 'providers':
        query = supabase
          .from('providers')
          .select('id, business_name, rating, total_jobs, commission_pct')
          .order('total_jobs', { ascending: false })
          .limit(100) as unknown as Promise<{ data: Record<string, unknown>[] | null }>
        break
      case 'customers':
        query = supabase
          .from('users')
          .select('id, name, created_at, loyalty_points')
          .eq('role', 'customer')
          .eq('is_deleted', false)
          .gte('created_at', from)
          .lte('created_at', to)
          .order('created_at', { ascending: false })
          .limit(200) as unknown as Promise<{ data: Record<string, unknown>[] | null }>
        break
      case 'inventory':
        query = supabase
          .from('products')
          .select('id, name_en, stock_qty, price, is_available')
          .eq('is_deleted', false)
          .order('stock_qty', { ascending: true })
          .limit(200) as unknown as Promise<{ data: Record<string, unknown>[] | null }>
        break
      case 'loyalty':
        query = supabase
          .from('users')
          .select('id, name, loyalty_points, loyalty_tier')
          .eq('role', 'customer')
          .eq('is_deleted', false)
          .order('loyalty_points', { ascending: false })
          .limit(200) as unknown as Promise<{ data: Record<string, unknown>[] | null }>
        break
      default:
        query = Promise.resolve({ data: [] })
    }

    query.then(({ data }) => {
      const mapped = (data ?? []).map((r: Record<string, unknown>) => ({
        id: String(r.id ?? ''),
        label:
          String(r.order_number ?? r.booking_number ?? r.business_name ?? r.name_en ?? r.name ?? r.id ?? ''),
        value: Number(r.total ?? r.price ?? r.rating ?? r.stock_qty ?? r.loyalty_points ?? 0),
        extra: String(r.status ?? r.loyalty_tier ?? r.is_available ?? ''),
      }))
      setRows(mapped)
      setLoading(false)
    })
  }, [params.slug, range])

  const chartData = useMemo(() => rows.slice(0, 20).map((r) => ({ name: r.label.slice(0, 12), value: r.value })), [rows])

  const columns: DataTableColumn<ReportRow>[] = [
    { key: 'label', header: 'Name', sortable: true, sortValue: (r) => r.label, render: (r) => <span className="text-sm font-medium text-gray-900">{r.label}</span> },
    { key: 'value', header: 'Value', sortable: true, sortValue: (r) => r.value, render: (r) => <span className="text-sm">{formatCompact(r.value)}</span> },
    { key: 'extra', header: 'Status', render: (r) => <span className="text-xs text-gray-600">{r.extra}</span> },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto" ref={ref}>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/reports" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={range} onChange={setRange} />
          <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={() => exportToCSV(`${params.slug}-report.csv`, rows, [{ key: 'label', label: 'Name' }, { key: 'value', label: 'Value' }, { key: 'extra', label: 'Status' }])}>CSV</Button>
          <Button variant="outline" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={() => exportToPDF(ref.current, `${params.slug}-report.pdf`, { title })}>PDF</Button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill={CHART_COLORS[0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} pageSize={20} emptyTitle="No data" />
        </>
      )}
    </div>
  )
}
