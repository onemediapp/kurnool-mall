'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, Plus, Home, Briefcase, Banknote, Smartphone, CreditCard, Zap, Calendar, Clock, ChevronLeft, Check, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/hooks/use-cart'
import { Button, Spinner, AlertBanner } from '@/components/shared'
import { formatPrice, calculateDeliveryFee, cn } from '@/lib/utils'
import { toast } from '@/components/shared/toast'
import type { Address, PaymentMethod } from '@/lib/types'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: () => void) => void
    }
  }
}

type DeliverySlot = 'express' | 'morning' | 'afternoon' | 'evening'
type CheckoutStep = 'address' | 'delivery' | 'payment'

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Spinner /></div>}>
      <CheckoutContent />
    </Suspense>
  )
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const couponCode = searchParams.get('coupon') ?? ''

  const { items, vendor_id, totalPrice, clearCart } = useCartStore()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [deliverySlot, setDeliverySlot] = useState<DeliverySlot>('morning')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [mounted, setMounted] = useState(false)

  const subtotal = mounted ? totalPrice() : 0
  const deliveryFee = calculateDeliveryFee(subtotal)
  const expressSurcharge = deliverySlot === 'express' ? 30 : 0
  const grandTotal = subtotal + deliveryFee + expressSurcharge

  // Progress stepper computation
  const currentStep: CheckoutStep =
    !selectedAddressId ? 'address' :
    !deliverySlot ? 'delivery' :
    'payment'

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

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            vendor_id,
            items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
            delivery_address_id: selectedAddressId,
            payment_method: 'cod',
            notes: '',
            coupon_code: couponCode || undefined,
          }),
        },
      )

      const result = await res.json()
      if (!res.ok || result.error) {
        toast.error(result.error?.message ?? 'Failed to place order. Please try again.')
        return
      }

      clearCart()
      router.push(`/orders/${result.data.order.id}?success=true`)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  const deliverySlots = [
    { id: 'express' as DeliverySlot, icon: Zap, label: 'Express', sublabel: '1–2 hours', extra: '+₹30', tone: 'amber', available: new Date().getHours() < 18 },
    { id: 'morning' as DeliverySlot, icon: Clock, label: 'Morning', sublabel: '9 AM – 12 PM', tone: 'brand' },
    { id: 'afternoon' as DeliverySlot, icon: Calendar, label: 'Afternoon', sublabel: '12 PM – 4 PM', tone: 'brand' },
    { id: 'evening' as DeliverySlot, icon: Calendar, label: 'Evening', sublabel: '4 PM – 8 PM', tone: 'brand' },
  ]

  const paymentOptions = [
    { id: 'cod' as PaymentMethod, icon: Banknote, label: 'Cash on Delivery', sublabel: 'Pay when delivered', emoji: '💵' },
    { id: 'upi' as PaymentMethod, icon: Smartphone, label: 'UPI', sublabel: 'GPay, PhonePe, Paytm', emoji: '📱' },
    { id: 'card' as PaymentMethod, icon: CreditCard, label: 'Card', sublabel: 'Credit / Debit', emoji: '💳' },
  ]

  return (
    <div className="bg-gray-50 min-h-screen pb-40">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 glass-strong border-b border-gray-100/80 px-4 flex items-center h-14 gap-3">
        <Link href="/cart" className="p-1 -ml-1 rounded-full hover:bg-gray-100 active:scale-90 transition-transform">
          <ChevronLeft className="h-5 w-5 text-gray-700" strokeWidth={2.5} />
        </Link>
        <h1 className="text-base font-extrabold text-gray-900 tracking-tight">Checkout</h1>
        <div className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
          <ShieldCheck className="h-3 w-3" />
          Secure
        </div>
      </div>

      {/* ── Progress Stepper ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <Step label="Address" active={currentStep === 'address'} complete={!!selectedAddressId} step={1} />
          <StepConnector complete={!!selectedAddressId} />
          <Step label="Delivery" active={currentStep === 'delivery'} complete={!!selectedAddressId && !!deliverySlot} step={2} />
          <StepConnector complete={!!selectedAddressId && !!deliverySlot} />
          <Step label="Payment" active={currentStep === 'payment'} complete={currentStep === 'payment' && !!paymentMethod} step={3} />
        </div>
      </div>

      {/* ── Section 1: Delivery Address ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mx-4 mt-4">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-500" strokeWidth={2.5} /> Delivery Address
          </h2>
          <Link href="/account/addresses/new" className="text-xs text-brand-600 font-bold flex items-center gap-1 bg-brand-50 px-2 py-1 rounded-full active:scale-95 transition-transform">
            <Plus className="h-3 w-3" strokeWidth={2.5} /> Add New
          </Link>
        </div>
        {addresses.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 shadow-soft text-center border border-gray-100">
            <p className="text-sm text-gray-500 mb-3">No saved addresses</p>
            <Link href="/account/addresses/new">
              <Button size="sm" variant="outline">Add Delivery Address</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr) => {
              const selected = selectedAddressId === addr.id
              const icon = addr.label === 'Work' ? <Briefcase className="h-4 w-4" strokeWidth={2.5} /> : <Home className="h-4 w-4" strokeWidth={2.5} />
              return (
                <motion.div
                  key={addr.id}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={cn(
                    'bg-white rounded-2xl p-3.5 cursor-pointer transition-all border-2',
                    selected
                      ? 'border-brand-500 shadow-[0_4px_16px_rgba(79,70,229,0.12)]'
                      : 'border-transparent shadow-soft hover:border-gray-200',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                      selected ? 'bg-gradient-brand text-white shadow-[0_4px_10px_rgba(79,70,229,0.3)]' : 'bg-gray-100 text-gray-500',
                    )}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-900">{addr.label}</p>
                        {addr.is_default && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full font-bold">Default</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{addr.address_line}</p>
                      <p className="text-[11px] text-gray-500 font-medium">{addr.city} – {addr.pincode}</p>
                    </div>
                    {selected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="flex-shrink-0 h-5 w-5 rounded-full bg-brand-500 text-white flex items-center justify-center"
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* ── Section 2: Delivery Time ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }} className="mx-4 mt-5">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2.5">
          <Clock className="h-4 w-4 text-brand-500" strokeWidth={2.5} /> Delivery Time
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {deliverySlots.map((slot) => {
            const selected = deliverySlot === slot.id
            const disabled = slot.available === false
            return (
              <motion.div
                key={slot.id}
                whileTap={disabled ? {} : { scale: 0.97 }}
                onClick={() => !disabled && setDeliverySlot(slot.id)}
                className={cn(
                  'bg-white rounded-2xl p-3 cursor-pointer border-2 transition-all relative',
                  selected
                    ? 'border-brand-500 shadow-[0_4px_14px_rgba(79,70,229,0.12)]'
                    : 'border-transparent shadow-soft',
                  disabled && 'opacity-40 pointer-events-none',
                )}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <slot.icon className={cn('h-4 w-4', selected ? 'text-brand-600' : 'text-gray-500')} strokeWidth={2.5} />
                  <p className="text-sm font-bold text-gray-900">{slot.label}</p>
                  {slot.extra && <span className="ml-auto text-[10px] bg-amber-50 text-amber-700 px-1.5 rounded font-bold">{slot.extra}</span>}
                </div>
                <p className="text-[11px] text-gray-500 font-medium">{slot.sublabel}</p>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ── Section 3: Payment Method ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="mx-4 mt-5">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2.5">
          <Banknote className="h-4 w-4 text-brand-500" strokeWidth={2.5} /> Payment Method
        </h2>
        <div className="space-y-2">
          {paymentOptions.map((option) => {
            const selected = paymentMethod === option.id
            return (
              <motion.div
                key={option.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => setPaymentMethod(option.id)}
                className={cn(
                  'bg-white rounded-2xl p-3.5 cursor-pointer border-2 transition-all',
                  selected
                    ? 'border-brand-500 shadow-[0_4px_14px_rgba(79,70,229,0.12)]'
                    : 'border-transparent shadow-soft',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg transition-colors',
                    selected ? 'bg-gradient-brand' : 'bg-gray-100',
                  )}>
                    <span>{option.emoji}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{option.label}</p>
                    <p className="text-[11px] text-gray-500 font-medium">{option.sublabel}</p>
                  </div>
                  <div className={cn(
                    'h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                    selected ? 'border-brand-500 bg-brand-500' : 'border-gray-300',
                  )}>
                    {selected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
        {(paymentMethod === 'upi' || paymentMethod === 'card') && (
          <div className="mt-2">
            <AlertBanner
              type="info"
              message="Payment integration coming soon. Please select Cash on Delivery for now."
            />
          </div>
        )}
      </motion.div>

      {/* ── Bill Details (redesigned Order Summary) ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }} className="mx-4 mt-5 bg-white rounded-2xl p-4 shadow-soft border border-gray-100">
        <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span>📋</span> Bill Details
        </h2>
        <div className="space-y-2.5">
          <BillRow label={`Item total (${items.length} item${items.length > 1 ? 's' : ''})`} value={formatPrice(subtotal)} />
          <BillRow
            label="Delivery fee"
            value={deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
            valueClass={deliveryFee === 0 ? 'text-emerald-600 font-bold' : ''}
          />
          {expressSurcharge > 0 && (
            <BillRow label="⚡ Express surcharge" value={`+₹${expressSurcharge}`} valueClass="text-amber-600" />
          )}
          {deliveryFee === 0 && (
            <div className="flex items-center justify-between bg-emerald-50 -mx-4 px-4 py-2 border-y border-emerald-100 my-1">
              <span className="text-xs font-bold text-emerald-700">🎉 Free delivery unlocked</span>
              <span className="text-xs font-extrabold text-emerald-700">₹0</span>
            </div>
          )}
          <div className="h-px bg-gray-100 my-1" />
          <div className="flex items-center justify-between">
            <span className="text-base font-extrabold text-gray-900">To Pay</span>
            <span className="text-lg font-extrabold text-gray-900">{formatPrice(grandTotal)}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Place order CTA ── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pt-3 pb-safe-plus-4 glass-strong border-t border-gray-100/80">
        <Button
          size="lg"
          fullWidth
          onClick={placeOrder}
          loading={placing}
          disabled={!selectedAddressId || placing || paymentMethod !== 'cod'}
          className="justify-between h-14 text-base rounded-2xl"
        >
          <span className="flex items-center gap-2">
            <span className="text-lg">{paymentMethod === 'cod' ? '💵' : '💳'}</span>
            <span>{paymentMethod === 'cod' ? 'Place Order' : `Pay with ${paymentMethod.toUpperCase()}`}</span>
          </span>
          <span className="font-extrabold">
            {formatPrice(grandTotal)}
          </span>
        </Button>
      </div>
    </div>
  )
}

/* ── Progress Stepper Pieces ── */
function Step({ label, active, complete, step }: { label: string; active: boolean; complete: boolean; step: number }) {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        animate={complete ? { scale: [1, 1.15, 1] } : { scale: 1 }}
        transition={{ duration: 0.4 }}
        className={cn(
          'h-7 w-7 rounded-full flex items-center justify-center text-xs font-extrabold transition-colors',
          complete
            ? 'bg-gradient-brand text-white shadow-[0_2px_8px_rgba(79,70,229,0.3)]'
            : active
            ? 'bg-brand-50 text-brand-600 ring-2 ring-brand-500'
            : 'bg-gray-100 text-gray-400',
        )}
      >
        {complete ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step}
      </motion.div>
      <span className={cn('text-[11px] font-bold', active || complete ? 'text-gray-900' : 'text-gray-400')}>{label}</span>
    </div>
  )
}

function StepConnector({ complete }: { complete: boolean }) {
  return (
    <div className="flex-1 h-0.5 rounded-full bg-gray-100 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: complete ? '100%' : '0%' }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="h-full bg-gradient-brand"
      />
    </div>
  )
}

function BillRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-600 font-medium">{label}</span>
      <span className={cn('text-xs text-gray-900 font-semibold', valueClass)}>{value}</span>
    </div>
  )
}
