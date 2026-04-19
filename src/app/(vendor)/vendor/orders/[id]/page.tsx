'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, MapPin, Package, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { OrderStatusBadge, Spinner, Divider } from '@/components/shared'
import { formatDate, formatPrice } from '@/lib/utils'
import type { Order } from '@/lib/types'

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
        <p className="text-sm text-gray-500 mb-3">Please provide a reason for rejection (optional)</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Item out of stock, unable to fulfill..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 bg-red-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Rejecting...' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VendorOrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  useEffect(() => {
    loadOrder()

    const supabase = createClient()
    const channel = supabase
      .channel(`vendor-order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setOrder((prev) => prev ? { ...prev, ...(payload.new as Partial<Order>) } : prev)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  async function loadOrder() {
    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*, order_items(*), customer:users!orders_customer_id_fkey(name, phone)')
        .eq('id', orderId)
        .single()

      if (fetchError || !data) {
        setError('Order not found')
      } else {
        setOrder(data as unknown as Order)
      }
    } catch {
      setError('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(status: string, opts?: { rejection_reason?: string }) {
    setActionLoading(true)
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
        setOrder((prev) => prev ? { ...prev, ...(json.data as Partial<Order>) } : prev)
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false)
      setShowRejectModal(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center py-16 text-gray-400">
          <Package className="h-12 w-12 mb-3" />
          <p className="text-gray-600 font-medium">{error || 'Order not found'}</p>
          <Link href="/vendor/orders" className="text-sm text-brand mt-2 hover:underline">
            Back to orders
          </Link>
        </div>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customer = (order as any).customer as { name: string | null; phone: string } | undefined
  const address = order.delivery_address_snapshot

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/vendor/orders"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
          aria-label="Back to orders"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{order.order_number}</h1>
          <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Customer card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-3">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Customer</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">{customer?.name || 'Customer'}</p>
            <p className="text-xs text-gray-500">{customer?.phone}</p>
          </div>
          {customer?.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
          )}
        </div>
      </div>

      {/* Delivery address */}
      {address && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-brand" /> Delivery Address
          </h2>
          <p className="text-sm text-gray-700">{address.address_line}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {address.city} — {address.pincode}
          </p>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-3">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Items Ordered</h2>
        <div className="space-y-2">
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div className="flex-1">
                <span className="text-gray-800">{item.product_name}</span>{' '}
                <span className="text-gray-400">× {item.quantity}</span>
              </div>
              <span className="font-medium text-gray-900">{formatPrice(item.total_price)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bill summary */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-3">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Bill Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Items total</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery fee</span>
            <span className={order.delivery_fee === 0 ? 'text-green-600' : ''}>
              {order.delivery_fee === 0 ? 'FREE' : formatPrice(order.delivery_fee)}
            </span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>−{formatPrice(order.discount)}</span>
            </div>
          )}
          <Divider />
          <div className="flex justify-between font-bold text-gray-900">
            <span>Grand Total</span>
            <span>{formatPrice(order.grand_total)}</span>
          </div>
        </div>
        <Divider />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Payment: {order.payment_method.toUpperCase()}</span>
          <span className={order.payment_status === 'paid' ? 'text-green-600 font-medium' : 'text-orange-500 font-medium'}>
            {order.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
          </span>
        </div>
        {order.notes && (
          <>
            <Divider />
            <p className="text-xs text-gray-500">
              Note: <span className="text-gray-700">{order.notes}</span>
            </p>
          </>
        )}
      </div>

      {/* Rejection reason (if rejected) */}
      {order.status === 'rejected' && order.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
          <p className="text-sm font-semibold text-red-800">Order Rejected</p>
          <p className="text-xs text-red-600 mt-1">{order.rejection_reason}</p>
        </div>
      )}

      {/* Rider card (if assigned) */}
      {order.rider_name && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Delivery Rider</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{order.rider_name}</p>
              <p className="text-xs text-gray-500">{order.rider_phone}</p>
            </div>
            {order.rider_phone && (
              <a
                href={`tel:${order.rider_phone}`}
                className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                Call
              </a>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mt-5">
        {order.status === 'pending' && (
          <>
            <button
              onClick={() => updateStatus('accepted')}
              disabled={actionLoading}
              className="flex-1 bg-green-500 text-white text-sm font-semibold py-3 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? '...' : '✓ Accept Order'}
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              className="flex-1 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold py-3 px-4 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              ✕ Reject Order
            </button>
          </>
        )}
        {order.status === 'accepted' && (
          <button
            onClick={() => updateStatus('preparing')}
            disabled={actionLoading}
            className="flex-1 bg-orange-500 text-white text-sm font-semibold py-3 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {actionLoading ? '...' : '🍳 Mark Preparing'}
          </button>
        )}
        {order.status === 'preparing' && (
          <button
            onClick={() => updateStatus('ready')}
            disabled={actionLoading}
            className="flex-1 bg-purple-500 text-white text-sm font-semibold py-3 px-4 rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
          >
            {actionLoading ? '...' : '📦 Mark Ready for Pickup'}
          </button>
        )}
        {order.status === 'ready' && (
          <div className="flex-1 bg-brand-light text-brand text-xs font-medium py-3 px-4 rounded-lg text-center border border-brand-light">
            ⏳ Waiting for rider assignment by admin
          </div>
        )}
      </div>

      {showRejectModal && (
        <RejectModal
          loading={actionLoading}
          onConfirm={(reason) => updateStatus('rejected', { rejection_reason: reason })}
          onCancel={() => setShowRejectModal(false)}
        />
      )}
    </div>
  )
}
