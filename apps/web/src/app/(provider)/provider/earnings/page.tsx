'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Spinner, KPICard, DataTable, Button, type DataTableColumn } from '@/components/shared'
import { exportToCSV } from '@/lib/utils/export'
import { formatPrice, formatDate, CHART_COLORS } from '@/lib/utils'
import type { ServiceBooking } from '@/lib/types'

interface EarningRow extends ServiceBooking {
  earned: number
}

export default function ProviderEarningsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<EarningRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: prov } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (!prov) { setLoading(false); return }
      const { data } = await supabase
        .from('service_bookings')
        .select('*, package:service_packages(*)')
        .eq('provider_id', prov.id)
        .in('status', ['completed', 'paid'])
        .order('completed_at', { ascending: false })
        .limit(200)
      if (cancelled) return
      setBookings(
        (data ?? []).map((b: ServiceBooking) => ({
          ...b,
          earned: b.price - b.commission,
        })),
      )
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [router])

  const total = useMemo(() => bookings.reduce((s, b) => s + b.earned, 0), [bookings])
  const jobsCount = bookings.length
  const avg = jobsCount > 0 ? total / jobsCount : 0

  const chartData = useMemo(() => {
    const byDate = new Map<string, number>()
    bookings.forEach((b) => {
      const d = b.completed_at?.slice(0, 10) ?? b.created_at.slice(0, 10)
      byDate.set(d, (byDate.get(d) ?? 0) + b.earned)
    })
    return Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, earned]) => ({ date: date.slice(5), earned }))
  }, [bookings])

  const columns: DataTableColumn<EarningRow>[] = [
    {
      key: 'booking_number',
      header: 'Booking',
      sortable: true,
      sortValue: (r) => r.booking_number,
      render: (r) => <span className="font-mono text-xs">#{r.booking_number}</span>,
    },
    {
      key: 'package',
      header: 'Service',
      render: (r) => <span className="text-sm">{r.package?.name_en ?? '—'}</span>,
    },
    {
      key: 'completed_at',
      header: 'Completed',
      sortable: true,
      sortValue: (r) => r.completed_at ?? '',
      render: (r) => (
        <span className="text-xs text-gray-500">
          {r.completed_at ? formatDate(r.completed_at) : '—'}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      sortValue: (r) => r.price,
      render: (r) => <span className="text-sm">{formatPrice(r.price)}</span>,
    },
    {
      key: 'earned',
      header: 'Earned',
      sortable: true,
      sortValue: (r) => r.earned,
      render: (r) => <span className="text-sm font-semibold text-green-700">{formatPrice(r.earned)}</span>,
    },
  ]

  function handleExport() {
    exportToCSV<EarningRow>(`earnings-${new Date().toISOString().slice(0, 10)}.csv`, bookings, [
      { key: 'booking_number', label: 'Booking #' },
      { key: 'completed_at', label: 'Completed', format: (r) => (r.completed_at ? formatDate(r.completed_at) : '') },
      { key: 'price', label: 'Price' },
      { key: 'commission', label: 'Commission' },
      { key: 'earned', label: 'Earned' },
    ])
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="text-sm text-gray-500 mt-1">Your completed jobs and payouts.</p>
        </div>
        <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <KPICard label="Total earned" value={formatPrice(total)} icon={<span>💰</span>} />
        <KPICard label="Jobs completed" value={String(jobsCount)} icon={<span>✅</span>} />
        <KPICard label="Average per job" value={formatPrice(avg)} icon={<span>📊</span>} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Last 14 days</p>
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatPrice(v)} />
              <Line type="monotone" dataKey="earned" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={bookings}
        rowKey={(r) => r.id}
        pageSize={10}
        emptyTitle="No earnings yet"
      />
    </div>
  )
}
