'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Plus, Home, Briefcase, Banknote, Smartphone, CreditCard, Zap, Calendar, Clock } from 'lucide-react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import { createApiClient } from '@kurnool-mall/api-client'
import { useCartStore } from '@/lib/hooks/use-cart'
import { Button, Spinner, Divider, AlertBanner } from '@/components/shared'
import { formatPrice, calculateDeliveryFee } from '@kurnool-mall/shared-utils'
import { toast } from '@/components/shared/toast'
import type { Address, PaymentMethod } from '@kurnool-mall/shared-types'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: () => void) => void
    }
  }
}

type DeliverySlot = 'express' | 'morning' | 'afternoon' | 'evening'

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><div className="h-6 w-6 border-2 border-[#1A56DB] border-t-transparent rounded-full animate-spin" /></div>}>
      <CheckoutContent />
    </Suspense>
  )
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const couponCode = searchParams.get('coupon') ?? ''

  const { items, vendor_id, totalPrice, clearCart } = useCartStore()

  // Shopping mode colors - Blue theme
  const colors = {
    bg: 'bg-blue-50',
    bgLight: 'bg-blue-50',
    bgDark: 'bg-blue-600',
    border: 'border-blue-200',
    text: 'text-blue-600',
    textDark: 'text-blue-700',
    accent: 'bg-blue-100',
    accentText: 'text-blue-800',
    header: 'text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700',
    buttonHover: 'hover:bg-blue-700',
    ring: 'ring-blue-600/20',
    focus: 'focus:ring-blue-600/20',
  }

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlot>('morning')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [mounted, setMounted] = useState(false)

  const subtotal = mounted ? totalPrice() : 0
  const deliveryFee = calculateDeliveryFee(subtotal)
  const grandTotal = subtotal + deliveryFee

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login?redirect=/checkout'); return }
      supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .then(({ data }) => {
          const addrs = (data ?? []) as Address[]
          setAddresses(addrs)
          const def = addrs.find((a) => a.is_default) ?? addrs[0]
          if (def) setSelectedAddressId(def.id)
          setLoading(false)
        })
    })
  }, [router])

  if (!mounted || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>
  }

  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  async function placeOrder() {
    if (!selectedAddressId || !vendor_id) return
    if (paymentMethod !== 'cod') {
      toast.info('Payment integration coming soon. Please use Cash on Delivery for now.')
      return
    }
    setPlacing(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const api = createApiClient({
        supabase,
        apiUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`,
      })
      const { data, error } = await api.createOrder({
        vendor_id,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        delivery_address_id: selectedAddressId,
        payment_method: 'cod',
        notes: '',
        coupon_code: couponCode || undefined,
      })
      if (error || !data) {
        toast.error(error?.message ?? 'Failed to place order. Please try again.')
        return
      }

      clearCart()
      router.push(`/orders/${data.order.id}?success=true`)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  const deliverySlots = [
    { id: 'express' as DeliverySlot, icon: Zap, label: '⚡ Express', sublabel: '1–2 hours (+₹30)', available: new Date().getHours() < 18 },
    { id: 'morning' as DeliverySlot, icon: Clock, label: '🌅 Morning', sublabel: '9 AM – 12 PM' },
    { id: 'afternoon' as DeliverySlot, icon: Calendar, label: '☀️ Afternoon', sublabel: '12 PM – 4 PM' },
    { id: 'evening' as DeliverySlot, icon: Calendar, label: '🌆 Evening', sublabel: '4 PM – 8 PM' },
  ]

  const paymentOptions = [
    { id: 'cod' as PaymentMethod, icon: Banknote, label: '💵 Cash on Delivery', sublabel: 'Pay when delivered' },
    { id: 'upi' as PaymentMethod, icon: Smartphone, label: '📱 UPI', sublabel: 'GPay, PhonePe, Paytm' },
    { id: 'card' as PaymentMethod, icon: CreditCard, label: '💳 Card', sublabel: 'Credit / Debit' },
  ]

  return (
    <div className={`${colors.bgLight} min-h-screen pb-36`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 bg-white border-b ${colors.border} px-4 flex items-center h-14 gap-3`}>
        <Link href="/cart" className={`p-1 -ml-1 rounded-full hover:bg-blue-50`}>
          <MapPin className={`h-5 w-5 ${colors.text}`} />
        </Link>
        <h1 className={`text-base font-semibold ${colors.textDark}`}>Checkout</h1>
      </div>

      {/* Section 1: Delivery Address */}
      <div className="mx-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-sm font-semibold text-gray-900 flex items-center gap-2`}>
            <MapPin className={`h-4 w-4 ${colors.text}`} /> Delivery Address
          </h2>
          <Link href="/account/addresses/new" className={`text-xs ${colors.text} font-medium flex items-center gap-1`}>
            <Plus className="h-3.5 w-3.5" /> Add New
          </Link>
        </div>
        {addresses.length === 0 ? (
          <div className="bg-white rounded-2xl p-4 shadow-card text-center">
            <p className="text-sm text-gray-500 mb-3">No saved addresses</p>
            <Link href="/account/addresses/new">
              <Button size="sm" variant="outline">Add Delivery Address</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr) => {
              const icon = addr.label === 'Work' ? <Briefcase className="h-4 w-4" /> : <Home className="h-4 w-4" />
              return (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`bg-white rounded-2xl p-4 shadow-card cursor-pointer transition-all border-2 ${
                    selectedAddressId === addr.id ? `border-blue-600` : 'border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      selectedAddressId === addr.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{addr.label}</p>
                        {addr.is_default && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Default</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{addr.address_line}</p>
                      <p className="text-xs text-gray-500">{addr.city} – {addr.pincode}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Section 2: Delivery Time */}
      <div className="mx-4 mt-4">
        <h2 className={`text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3`}>
          <Clock className={`h-4 w-4 ${colors.text}`} /> Delivery Time
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {deliverySlots.map((slot) => (
            <div
              key={slot.id}
              onClick={() => slot.available !== false && setDeliverySlot(slot.id)}
              className={`bg-white rounded-2xl p-3 shadow-card cursor-pointer border-2 transition-all ${
                deliverySlot === slot.id ? `border-blue-600` : 'border-transparent'
              } ${slot.available === false ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <p className="text-sm font-medium text-gray-900">{slot.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{slot.sublabel}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Payment Method */}
      <div className="mx-4 mt-4">
        <h2 className={`text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3`}>
          <Banknote className={`h-4 w-4 ${colors.text}`} /> Payment Method
        </h2>
        <div className="space-y-2">
          {paymentOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => setPaymentMethod(option.id)}
              className={`bg-white rounded-2xl p-4 shadow-card cursor-pointer border-2 transition-all ${
                paymentMethod === option.id ? `border-blue-600` : 'border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  paymentMethod === option.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  <option.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.sublabel}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {(paymentMethod === 'upi' || paymentMethod === 'card') && (
          <div className="mt-2">
            <AlertBanner
              type="info"
              message="Payment integration coming soon. Please select Cash on Delivery for now."
            />
          </div>
        )}
      </div>

      {/* Order summary */}
      <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-card">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Order Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{items.length} item{items.length > 1 ? 's' : ''}</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery</span>
            <span className={deliveryFee === 0 ? 'text-green-600' : ''}>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span>
          </div>
          {deliverySlot === 'express' && (
            <div className="flex justify-between text-sm text-amber-600">
              <span>Express surcharge</span>
              <span>+₹30</span>
            </div>
          )}
          <Divider />
          <div className="flex justify-between text-base font-bold text-gray-900">
            <span>Total</span>
            <span>{formatPrice(grandTotal + (deliverySlot === 'express' ? 30 : 0))}</span>
          </div>
        </div>
      </div>

      {/* Place order CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 py-3 bg-white border-t border-gray-100">
        <Button
          size="lg"
          fullWidth
          onClick={placeOrder}
          loading={placing}
          disabled={!selectedAddressId || placing || paymentMethod !== 'cod'}
          className="justify-between"
        >
          <span>
            {paymentMethod === 'cod' ? 'Place Order (COD)' : 'Pay with ' + paymentMethod.toUpperCase()}
          </span>
          <span className="font-bold">
            {formatPrice(grandTotal + (deliverySlot === 'express' ? 30 : 0))}
          </span>
        </Button>
      </div>
    </div>
  )
}
