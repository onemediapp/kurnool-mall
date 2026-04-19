'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, X, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { OrderStatusBadge, Spinner, EmptyState } from '@/components/shared'
import { toast } from '@/components/shared/toast'
import { formatDate, formatPrice } from '@/lib/utils'
import type { Order, Vendor, OrderStatus } from '@/lib/types'

const STATUS_TABS: { label: string; statuses: OrderStatus[] | null }[] = [
  { label: 'All', statuses: null },
  { label: 'New', statuses: ['pending'] },
  { label: 'Accepted', statuses: ['accepted'] },
  { label: 'Preparing', statuses: ['preparing'] },
  { label: 'Ready', statuses: ['ready'] },
  { label: 'Delivered', statuses: ['delivered'] },
  { label: 'Cancelled', statuses: ['cancelled', 'rejected'] },
]

const PRESET_REASONS = [
  'Item out of stock',
  'Shop is closed',
  'Delivery area not serviceable',
  'Customer not reachable',
  'Other',
]

function RejectModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: (reason: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Reject Order</h3>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESET_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${reason === r ? 'bg-red-100 border-red-400 text-red-700' : 'bg-gray-100 border-gray-200 text-gray-600'}`}
            >
              {r}
            </button>
          ))}
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Or write a custom reason..."
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onCancel} className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Rejecting...' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VendorOrdersPage() {
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null)

  function playOrderAlert() {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(); osc.stop(ctx.currentTime + 0.5)
  }

  const loadOrders = useCallback(async (vendorId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*), customer:users!orders_customer_id_fkey(name, phone)')
      .eq('vendor_id', vendorId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
    setOrders((data ?? []) as unknown as Order[])
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('vendors').select('*').eq('user_id', user.id).single()
        .then(async ({ data: vendorData }) => {
          if (!vendorData) { setLoading(false); return }
          setVendor(vendorData as Vendor)
          await loadOrders(vendorData.id)
          setLoading(false)

          // Realtime
          const channel = supabase
            .channel(`vendor-orders-page-${vendorData.id}`)
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'orders',
              filter: `vendor_id=eq.${vendorData.id}`,
            }, (payload) => {
              playOrderAlert()
              toast.info('🛎️ New order received!')
              setOrders((prev) => [payload.new as Order, ...prev])
            })
            .on('postgres_changes', {
              event: 'UPDATE',
              schema: 'public',
              table: 'orders',
              filter: `vendor_id=eq.${vendorData.id}`,
            }, (payload) => {
              setOrders((prev) => prev.map((o) => o.id === (payload.new as Order).id ? { ...o, ...(payload.new as Partial<Order>) } : o))
            })
            .subscribe()

          return () => { supabase.removeChannel(channel) }
        })
    })
  }, [loadOrders])

  function toggleExpand(orderId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  async function updateStatus(orderId: string, status: string, opts?: { rejection_reason?: string }) {
    setActionLoading(orderId)
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
          body: JSON.stringify({ order_id: orderId, status, ...opts }),
        }
      )
      const json = await res.json()
      if (!json.error) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, ...(json.data as Partial<Order>) } : o))
        toast.success(`Order marked as ${status}`)
      } else {
        toast.error(json.error?.message ?? 'Failed to update status')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setActionLoading(null)
      setRejectingOrderId(null)
    }
  }

  const tabStatuses = STATUS_TABS[activeTab].statuses
  const filtered = tabStatuses ? orders.filter((o) => tabStatuses.includes(o.status)) : orders

  const tabCounts = STATUS_TABS.map((tab) =>
    tab.statuses ? orders.filter((o) => tab.statuses!.includes(o.status)).length : orders.length
  )

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        {tabCounts[1] > 0 && (
          <div className="flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full animate-pulse">
            <Bell className="h-3.5 w-3.5" />
            {tabCounts[1]} new
          </div>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-4 pb-1">
        {STATUS_TABS.map((tab, idx) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(idx)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === idx ? 'bg-[#1A56DB] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            {tabCounts[idx] > 0 && (
              <span className={`text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 ${
                activeTab === idx ? 'bg-white/30' : 'bg-gray-300 text-gray-600'
              }`}>
                {tabCounts[idx]}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title={`No ${STATUS_TABS[activeTab].label.toLowerCase()} orders`}
          description="Orders will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const isExpanded = expandedIds.has(order.id)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const customer = (order as any).customer as { name: string | null; phone: string } | undefined

            return (
              <div key={order.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${order.status === 'pending' ? 'border-amber-300' : 'border-gray-100'}`}>
                <button
                  onClick={() => toggleExpand(order.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-gray-700">{order.order_number}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">
                      {customer?.name || 'Customer'} · {customer?.phone}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">{formatPrice(order.grand_total)}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                    <div className="space-y-1.5 mb-3">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.product_name} <span className="text-gray-400">×{item.quantity}</span></span>
                          <span className="font-medium">{formatPrice(item.total_price)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-gray-500 mb-3 space-y-0.5">
                      <p>Payment: <span className="font-medium">{order.payment_method.toUpperCase()}</span> — <span className={order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-500'}>{order.payment_status}</span></p>
                      {order.notes && <p>Note: <span className="text-gray-700">{order.notes}</span></p>}
                    </div>

                    <Link href={`/vendor/orders/${order.id}`} className="inline-block text-xs text-[#1A56DB] font-medium hover:underline mb-3">
                      View full details →
                    </Link>

                    <div className="flex flex-wrap gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(order.id, 'accepted')}
                            disabled={actionLoading === order.id}
                            className="flex-1 bg-green-500 text-white text-sm font-semibold py-2 px-3 rounded-xl hover:bg-green-600 disabled:opacity-50"
                          >
                            {actionLoading === order.id ? '...' : '✓ Accept'}
                          </button>
                          <button
                            onClick={() => setRejectingOrderId(order.id)}
                            className="flex-1 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold py-2 px-3 rounded-xl hover:bg-red-100"
                          >
                            ✕ Reject
                          </button>
                        </>
                      )}
                      {order.status === 'accepted' && (
                        <button
                          onClick={() => updateStatus(order.id, 'preparing')}
                          disabled={actionLoading === order.id}
                          className="flex-1 bg-orange-500 text-white text-sm font-semibold py-2 px-3 rounded-xl hover:bg-orange-600 disabled:opacity-50"
                        >
                          {actionLoading === order.id ? '...' : '🍳 Mark Preparing'}
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateStatus(order.id, 'ready')}
                          disabled={actionLoading === order.id}
                          className="flex-1 bg-purple-500 text-white text-sm font-semibold py-2 px-3 rounded-xl hover:bg-purple-600 disabled:opacity-50"
                        >
                          {actionLoading === order.id ? '...' : '📦 Mark Ready'}
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <div className="flex-1 bg-blue-50 text-[#1A56DB] text-xs font-medium py-2 px-3 rounded-xl text-center border border-blue-100">
                          ⏳ Waiting for rider assignment
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {rejectingOrderId && (
        <RejectModal
          loading={actionLoading === rejectingOrderId}
          onConfirm={(reason) => updateStatus(rejectingOrderId, 'rejected', { rejection_reason: reason })}
          onCancel={() => setRejectingOrderId(null)}
        />
      )}
    </div>
  )
}
