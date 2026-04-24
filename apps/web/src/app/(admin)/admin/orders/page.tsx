'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import { OrderStatusBadge, Spinner } from '@/components/shared'
import { formatDate, formatPrice } from '@kurnool-mall/shared-utils'
import type { Order, OrderStatus } from '@kurnool-mall/shared-types'

const STATUS_TABS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Ready', value: 'ready' },
  { label: 'Out for Delivery', value: 'out_for_delivery' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Rejected', value: 'rejected' },
]

const ORDER_STEPS: { status: string; label: string }[] = [
  { status: 'pending', label: 'Order Placed' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'preparing', label: 'Preparing' },
  { status: 'ready', label: 'Ready' },
  { status: 'out_for_delivery', label: 'Out for Delivery' },
  { status: 'delivered', label: 'Delivered' },
]

function AssignRiderModal({
  orderId,
  onAssigned,
  onCancel,
}: {
  orderId: string
  onAssigned: () => void
  onCancel: () => void
}) {
  const [riderName, setRiderName] = useState('')
  const [riderPhone, setRiderPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAssign() {
    if (!riderName.trim() || !riderPhone.trim()) {
      setError('Both rider name and phone are required')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-order-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            order_id: orderId,
            status: 'out_for_delivery',
            rider_name: riderName.trim(),
            rider_phone: riderPhone.trim(),
          }),
        }
      )
      const json = await res.json()
      if (json.error) {
        setError(json.error.message)
      } else {
        onAssigned()
      }
    } catch {
      setError('Failed to assign rider')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Assign Delivery Rider</h3>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rider Name</label>
            <input
              type="text"
              value={riderName}
              onChange={(e) => { setRiderName(e.target.value); setError('') }}
              placeholder="e.g. Ramu Kumar"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Rider Phone</label>
            <input
              type="tel"
              value={riderPhone}
              onChange={(e) => { setRiderPhone(e.target.value); setError('') }}
              placeholder="e.g. 9876543210"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading}
            className="flex-1 bg-brand text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Assign & Dispatch'}
          </button>
        </div>
      </div>
    </div>
  )
}

function OrderDetailPanel({
  order,
  onClose,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order: any
  onClose: () => void
}) {
  const stepIndex = ORDER_STEPS.findIndex((s) => s.status === order.status)
  const isTerminal = order.status === 'rejected' || order.status === 'cancelled'

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <p className="text-xs text-gray-400 font-mono">{order.order_number}</p>
            <h2 className="text-base font-bold text-gray-900 mt-0.5">Order Details</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status timeline */}
          {!isTerminal ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Timeline</p>
              <div className="relative">
                {ORDER_STEPS.map((step, i) => {
                  const isDone = i <= stepIndex
                  const isCurrent = i === stepIndex
                  return (
                    <div key={step.status} className="flex items-start gap-3 pb-4 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-0.5 ${isDone ? (isCurrent ? 'bg-brand ring-2 ring-brand/30' : 'bg-green-500') : 'bg-gray-200'}`} />
                        {i < ORDER_STEPS.length - 1 && (
                          <div className={`w-0.5 h-5 mt-1 ${isDone && i < stepIndex ? 'bg-green-400' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      <p className={`text-sm ${isDone ? (isCurrent ? 'font-semibold text-brand' : 'text-gray-700') : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-red-700 capitalize">{order.status}</p>
              {order.rejection_reason && (
                <p className="text-xs text-red-500 mt-0.5">{order.rejection_reason}</p>
              )}
            </div>
          )}

          {/* Customer & Vendor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-medium mb-1">Customer</p>
              <p className="text-sm font-semibold text-gray-900">{order.customer?.name || '—'}</p>
              <p className="text-xs text-gray-500">{order.customer?.phone}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-medium mb-1">Vendor</p>
              <p className="text-sm font-semibold text-gray-900">{order.vendor?.shop_name || '—'}</p>
            </div>
          </div>

          {/* Order items */}
          {order.order_items?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Items</p>
              <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                {order.order_items.map((item: { id: string; product_name: string; product_image?: string; quantity: number; unit_price: number; total_price: number }) => (
                  <div key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                    {item.product_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product_image} alt={item.product_name} className="w-8 h-8 rounded-lg object-cover bg-white" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-sm">📦</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                      <p className="text-xs text-gray-500">{formatPrice(item.unit_price)} × {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatPrice(item.total_price)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bill summary */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill Summary</p>
            <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery Fee</span>
                <span>{order.delivery_fee === 0 ? <span className="text-green-600">Free</span> : formatPrice(order.delivery_fee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                  <span>−{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-1.5 mt-1.5">
                <span>Total</span>
                <span>{formatPrice(order.grand_total)}</span>
              </div>
            </div>
          </div>

          {/* Payment + delivery info */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment</span>
              <span className="font-medium">{order.payment_method?.toUpperCase()} / <span className={order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-500'}>{order.payment_status}</span></span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">{formatDate(order.created_at)}</span>
            </div>
            {order.notes && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Notes</span>
                <span className="font-medium text-right max-w-[60%]">{order.notes}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all')
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [vendors, setVendors] = useState<{ id: string; shop_name: string }[]>([])
  const [selectedVendorId, setSelectedVendorId] = useState('')

  useEffect(() => {
    loadVendors()
    loadOrders()
  }, [])

  async function loadVendors() {
    const supabase = createClient()
    const { data } = await supabase
      .from('vendors')
      .select('id, shop_name')
      .eq('is_deleted', false)
      .order('shop_name')
    setVendors((data ?? []) as { id: string; shop_name: string }[])
  }

  async function loadOrders() {
    setLoading(true)
    try {
      const supabase = createClient()
      let query = supabase
        .from('orders')
        .select('*, customer:users!orders_customer_id_fkey(name, phone), vendor:vendors(shop_name), order_items(*)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')
      if (selectedVendorId) query = query.eq('vendor_id', selectedVendorId)

      const { data } = await query
      setOrders((data ?? []) as unknown as Order[])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    loadOrders()
  }

  function clearFilters() {
    setDateFrom('')
    setDateTo('')
    setSelectedVendorId('')
    // Reload without filters
    const supabase = createClient()
    setLoading(true)
    supabase
      .from('orders')
      .select('*, customer:users!orders_customer_id_fkey(name, phone), vendor:vendors(shop_name), order_items(*)')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data ?? []) as unknown as Order[])
        setLoading(false)
      })
  }

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter((o) => o.status === activeTab)

  async function markDelivered(orderId: string) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-order-status`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ order_id: orderId, status: 'delivered' }),
      }
    )
    loadOrders()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  const hasFilters = dateFrom || dateTo || selectedVendorId

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
        <p className="text-sm text-gray-500 mt-1">{orders.length} orders{hasFilters ? ' (filtered)' : ''}</p>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-3 mb-5 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Vendor</label>
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand bg-white min-w-[160px]"
          >
            <option value="">All Vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.shop_name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={applyFilters}
          className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
        >
          Apply
        </button>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5 pb-2">
        {STATUS_TABS.map(({ label, value }) => {
          const count = value === 'all' ? orders.length : orders.filter((o) => o.status === value).length
          return (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeTab === value
                  ? 'bg-brand text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-brand hover:text-brand'
              }`}
            >
              {label} ({count})
            </button>
          )
        })}
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50">
              <tr>
                {['Order #', 'Customer', 'Vendor', 'Amount', 'Payment', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">No orders found</td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const customer = (order as any).customer as { name: string | null; phone: string } | undefined
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const vendor = (order as any).vendor as { shop_name: string } | undefined

                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700 whitespace-nowrap">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{customer?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{customer?.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{vendor?.shop_name || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{formatPrice(order.grand_total)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                          {order.payment_method.toUpperCase()} / {order.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-xs text-brand font-medium hover:underline flex items-center gap-0.5"
                          >
                            Details <ChevronRight className="h-3 w-3" />
                          </button>
                          {order.status === 'ready' && (
                            <button
                              onClick={() => setAssigningOrderId(order.id)}
                              className="bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors"
                            >
                              🚴 Assign Rider
                            </button>
                          )}
                          {order.status === 'out_for_delivery' && (
                            <button
                              onClick={() => markDelivered(order.id)}
                              className="bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors"
                            >
                              ✓ Mark Delivered
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {assigningOrderId && (
        <AssignRiderModal
          orderId={assigningOrderId}
          onAssigned={() => { setAssigningOrderId(null); loadOrders() }}
          onCancel={() => setAssigningOrderId(null)}
        />
      )}

      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  )
}
