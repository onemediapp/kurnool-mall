'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Phone, MapPin, Package, Loader2, Bike } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { OrderStatusBadge, Divider } from '@/components/shared'
import { UpsellWidget } from '@/components/shared/upsell-widget'
import { formatDate, formatPrice, formatTime, ORDER_STATUS_LABELS } from '@/lib/utils'
import type { Order, OrderStatus } from '@/lib/types'

const PROGRESS_STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'pending', label: 'Order Placed', icon: '📋' },
  { status: 'accepted', label: 'Order Accepted', icon: '✅' },
  { status: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
  { status: 'ready', label: 'Ready for Pickup', icon: '📦' },
  { status: 'out_for_delivery', label: 'Out for Delivery', icon: '🚴' },
  { status: 'delivered', label: 'Delivered', icon: '🎉' },
]

function getStepIndex(status: OrderStatus): number {
  return PROGRESS_STEPS.findIndex((s) => s.status === status)
}

export default function OrderDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params.id as string
  const isSuccess = searchParams.get('success') === 'true'

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadOrder()

    const supabase = createClient()
    const channel = supabase
      .channel(`order-${orderId}`)
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

    return () => { supabase.removeChannel(channel) }
  }, [orderId])

  async function loadOrder() {
    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*, order_items(*), vendor:vendors(shop_name, address_line)')
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

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A56DB]" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="bg-white min-h-screen">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 flex items-center h-14">
          <Link href="/orders" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Link>
        </div>
        <div className="flex flex-col items-center py-16 text-gray-400">
          <Package className="h-12 w-12 mb-3" />
          <p className="text-gray-600 font-medium">{error || 'Order not found'}</p>
          <Link href="/orders" className="text-sm text-[#1A56DB] mt-2 hover:underline">Back to orders</Link>
        </div>
      </div>
    )
  }

  const currentStepIndex = getStepIndex(order.status)
  const isTerminal = ['rejected', 'cancelled'].includes(order.status)
  const isOutForDelivery = order.status === 'out_for_delivery'

  return (
    <div className="bg-gray-50 min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 flex items-center h-14">
        <Link href="/orders" className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <div className="ml-2">
          <h1 className="text-sm font-semibold text-gray-900">{order.order_number}</h1>
          <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
        </div>
        <div className="ml-auto">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Success banner */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3"
          >
            <CheckCircle2 className="h-7 w-7 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Order Placed Successfully!</p>
              <p className="text-xs text-green-600 mt-0.5">
                {order.payment_method === 'cod'
                  ? 'Pay ₹' + formatPrice(order.grand_total).replace('₹', '') + ' when your order arrives.'
                  : 'Payment received. Your order is confirmed.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rider card — shown when out for delivery */}
      <AnimatePresence>
        {(isOutForDelivery || order.rider_name) && order.rider_name && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-4 mt-4 bg-[#1A56DB] rounded-2xl p-4 text-white"
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Bike className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide opacity-80">Your Delivery Partner</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-base">
                  {order.rider_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{order.rider_name}</p>
                  <p className="text-xs opacity-70">On the way to you</p>
                </div>
              </div>
              {order.rider_phone && (
                <a
                  href={`tel:${order.rider_phone}`}
                  className="flex items-center gap-1.5 bg-white text-[#1A56DB] text-xs font-semibold px-3 py-2 rounded-xl"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress tracker */}
      {!isTerminal && (
        <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-card">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Order Progress</h2>
          <div className="space-y-0">
            {PROGRESS_STEPS.map((step, idx) => {
              const isDone = idx < currentStepIndex
              const isCurrent = idx === currentStepIndex
              const isFuture = idx > currentStepIndex
              const isLast = idx === PROGRESS_STEPS.length - 1

              return (
                <div key={step.status} className="flex items-start gap-3">
                  {/* Timeline column */}
                  <div className="flex flex-col items-center w-6 shrink-0">
                    {/* Circle */}
                    <div
                      className={`relative w-6 h-6 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 transition-all duration-500 ${
                        isDone
                          ? 'bg-[#1A56DB]'
                          : isCurrent
                          ? 'bg-[#1A56DB] ring-4 ring-[#1A56DB]/20'
                          : 'bg-gray-200'
                      }`}
                    >
                      {isDone ? (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isCurrent ? (
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ repeat: Infinity, duration: 1.4 }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                      ) : (
                        <div className="w-2 h-2 bg-gray-400 rounded-full opacity-50" />
                      )}
                    </div>

                    {/* Connector line */}
                    {!isLast && (
                      <div
                        className={`w-0.5 h-8 mt-0.5 rounded-full transition-colors duration-500 ${
                          isDone ? 'bg-[#1A56DB]' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>

                  {/* Label column */}
                  <div className={`pb-6 flex-1 ${isLast ? 'pb-0' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base leading-none">{step.icon}</span>
                      <p className={`text-sm font-medium ${
                        isDone || isCurrent ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                    {isCurrent && (
                      <p className="text-xs text-[#1A56DB] mt-1 ml-6">
                        {step.status === 'pending' ? 'Waiting for vendor to accept...' :
                         step.status === 'accepted' ? 'Your order has been accepted!' :
                         step.status === 'preparing' ? 'Being prepared now...' :
                         step.status === 'ready' ? 'Waiting for rider pickup...' :
                         step.status === 'out_for_delivery' ? 'Heading to you!' :
                         'Enjoy your order!'}
                      </p>
                    )}
                    {isDone && idx === 0 && (
                      <p className="text-xs text-gray-400 mt-0.5 ml-6">{formatTime(order.created_at)}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Rejected/Cancelled state */}
      {isTerminal && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-red-800">
            Order {order.status === 'rejected' ? 'Rejected' : 'Cancelled'}
          </p>
          {order.rejection_reason && (
            <p className="text-xs text-red-600 mt-1">{order.rejection_reason}</p>
          )}
          <Link href="/" className="inline-block mt-3 text-xs text-[#1A56DB] font-medium">
            Browse more products →
          </Link>
        </div>
      )}

      {/* Vendor info */}
      {order.vendor && (
        <div className="mx-4 mt-3 bg-white rounded-2xl p-3 shadow-card flex items-center gap-2">
          <Package className="h-4 w-4 text-[#1A56DB] shrink-0" />
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Sold by</p>
            <p className="text-sm font-medium text-gray-900">
              {(order.vendor as unknown as { shop_name: string }).shop_name}
            </p>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-card">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Items Ordered</h2>
        <div className="space-y-3">
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-800">{item.product_name}</p>
                <p className="text-xs text-gray-400">× {item.quantity}</p>
              </div>
              <span className="text-sm font-medium text-gray-900">{formatPrice(item.total_price)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bill summary */}
      <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-card">
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
              <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
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
      </div>

      {/* Upsell: You might also like */}
      {isSuccess && (
        <div className="mx-4 mt-3 bg-white rounded-2xl shadow-card overflow-hidden">
          <UpsellWidget trigger="order_completed" triggerValue={orderId} title="Recommended for you" />
        </div>
      )}

      {/* Delivery address */}
      {order.delivery_address_snapshot && (
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-card">
          <h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-[#1A56DB]" /> Delivery Address
          </h2>
          <p className="text-sm text-gray-700">{order.delivery_address_snapshot.address_line}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {order.delivery_address_snapshot.city} — {order.delivery_address_snapshot.pincode}
          </p>
        </div>
      )}

      {/* Need help? */}
      <div className="mx-4 mt-3 text-center">
        <p className="text-xs text-gray-400">Need help with your order?</p>
        <a href="tel:+919999999999" className="text-xs text-[#1A56DB] font-medium">Contact Support</a>
      </div>
    </div>
  )
}
