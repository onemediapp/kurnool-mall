'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { X, Download, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  Spinner, BookingStatusBadge, DataTable, Button,
  type DataTableColumn,
} from '@/components/shared'
import { exportToCSV } from '@/lib/utils/export'
import { formatDate, formatPrice, BOOKING_STATUS_LABELS } from '@/lib/utils'
import type { ServiceBooking, BookingStatus } from '@/lib/types'

const STATUS_TABS: { label: string; value: BookingStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'En Route', value: 'en_route' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

export default function AdminServiceBookingsPage() {
  const [bookings, setBookings] = useState<ServiceBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selected, setSelected] = useState<ServiceBooking | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase
      .from('service_bookings')
      .select(`
        *,
        category:service_categories(*),
        package:service_packages(*),
        provider:providers(id, business_name),
        customer:users!service_bookings_customer_id_fkey(id, name, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(500)

    if (filter !== 'all') q = q.eq('status', filter)
    if (from) q = q.gte('created_at', new Date(from).toISOString())
    if (to) {
      const t = new Date(to)
      t.setHours(23, 59, 59, 999)
      q = q.lte('created_at', t.toISOString())
    }

    const { data } = await q
    setBookings((data ?? []) as ServiceBooking[])
    setLoading(false)
  }, [filter, from, to])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    if (!search) return bookings
    const s = search.toLowerCase()
    return bookings.filter(
      (b) =>
        b.booking_number?.toLowerCase().includes(s) ||
        b.customer?.name?.toLowerCase().includes(s) ||
        b.provider?.business_name?.toLowerCase().includes(s),
    )
  }, [bookings, search])

  const columns: DataTableColumn<ServiceBooking>[] = [
    {
      key: 'booking_number',
      header: 'Booking',
      sortable: true,
      sortValue: (r) => r.booking_number,
      render: (r) => <span className="font-mono text-xs text-gray-700">#{r.booking_number}</span>,
    },
    {
      key: 'service',
      header: 'Service',
      render: (r) => (
        <div>
          <p className="text-sm font-medium text-gray-900">{r.package?.name_en ?? r.category?.name_en}</p>
          <p className="text-[10px] text-gray-500">{r.category?.name_en}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (r) => <span className="text-sm">{r.customer?.name ?? '—'}</span>,
    },
    {
      key: 'provider',
      header: 'Provider',
      render: (r) => <span className="text-sm">{r.provider?.business_name ?? <span className="text-gray-400">Unassigned</span>}</span>,
    },
    {
      key: 'scheduled',
      header: 'Scheduled',
      sortable: true,
      sortValue: (r) => r.scheduled_at,
      render: (r) => <span className="text-xs text-gray-600">{formatDate(r.scheduled_at)}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      sortValue: (r) => r.price,
      render: (r) => <span className="text-sm font-semibold">{formatPrice(r.price)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <BookingStatusBadge status={r.status} />,
    },
  ]

  function handleExport() {
    exportToCSV<ServiceBooking>(`bookings-${new Date().toISOString().slice(0, 10)}.csv`, filtered, [
      { key: 'booking_number', label: 'Booking #' },
      { key: 'category', label: 'Category', format: (r) => r.category?.name_en ?? '' },
      { key: 'package', label: 'Package', format: (r) => r.package?.name_en ?? '' },
      { key: 'customer', label: 'Customer', format: (r) => r.customer?.name ?? '' },
      { key: 'provider', label: 'Provider', format: (r) => r.provider?.business_name ?? '' },
      { key: 'scheduled_at', label: 'Scheduled', format: (r) => formatDate(r.scheduled_at) },
      { key: 'status', label: 'Status' },
      { key: 'price', label: 'Price' },
      { key: 'commission', label: 'Commission' },
    ])
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all service bookings across providers.</p>
        </div>
        <Button variant="outline" icon={<Download className="h-4 w-4" />} onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setFilter(t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === t.value
                  ? 'bg-[#1A56DB] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search booking #, customer, provider…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Spinner /></div>
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          pageSize={20}
          onRowClick={(r) => setSelected(r)}
          emptyTitle="No bookings"
          emptyDescription="No bookings match the filters."
        />
      )}

      {/* Side panel */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelected(null)} />
          <aside className="fixed right-0 top-0 bottom-0 w-96 max-w-md bg-white z-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Booking detail</h2>
                <p className="text-[11px] text-gray-500">#{selected.booking_number}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <BookingStatusBadge status={selected.status} />
              <div><span className="text-gray-500">Service:</span> <strong>{selected.package?.name_en}</strong></div>
              <div><span className="text-gray-500">Category:</span> {selected.category?.name_en}</div>
              <div><span className="text-gray-500">Customer:</span> {selected.customer?.name} ({selected.customer?.phone})</div>
              <div><span className="text-gray-500">Provider:</span> {selected.provider?.business_name ?? 'Unassigned'}</div>
              <div><span className="text-gray-500">Scheduled:</span> {formatDate(selected.scheduled_at)}</div>
              <div>
                <span className="text-gray-500">Address:</span><br />
                <span className="text-xs">{selected.address?.address_line}, {selected.address?.city} - {selected.address?.pincode}</span>
              </div>
              {selected.notes && (
                <div><span className="text-gray-500">Notes:</span> <span className="text-xs">{selected.notes}</span></div>
              )}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between"><span className="text-gray-500">Price</span><span>{formatPrice(selected.price)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Commission</span><span className="text-green-700">{formatPrice(selected.commission)}</span></div>
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  )
}
