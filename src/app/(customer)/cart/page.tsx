'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, Trash2, ShoppingBag, Tag } from 'lucide-react'
import { useCartStore } from '@/lib/hooks/use-cart'
import { Button, EmptyState, Divider, Spinner, ConfirmDialog, ProgressBar, AlertBanner } from '@/components/shared'
import { UpsellWidget } from '@/components/shared/upsell-widget'
import { formatPrice, calculateDeliveryFee } from '@/lib/utils'
import type { CouponValidation } from '@/lib/types'

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponResult, setCouponResult] = useState<CouponValidation | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Shopping mode colors - Blue theme
  const colors = {
    bg: 'bg-blue-50',
    bgLight: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    button: 'bg-blue-600 hover:bg-blue-700',
  }

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return <div className="bg-white min-h-screen flex items-center justify-center"><Spinner /></div>
  }

  if (items.length === 0) {
    return (
      <div className="bg-white min-h-screen">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 flex items-center h-14">
          <h1 className="text-base font-semibold text-gray-900">Your Cart</h1>
        </div>
        <EmptyState
          icon="🛍️"
          title="Your cart is empty"
          description="Add items from your favourite local vendors to get started."
          action={<Link href="/" className={`text-sm ${colors.text} font-medium hover:underline`}>Browse Products</Link>}
        />
      </div>
    )
  }

  const subtotal = totalPrice()
  const deliveryFee = calculateDeliveryFee(subtotal)
  const couponDiscount = couponResult?.valid ? couponResult.discount_amount : 0
  const grandTotal = subtotal + deliveryFee - couponDiscount
  const amountForFreeDelivery = Math.max(0, 499 - subtotal)
  const freeDeliveryPct = Math.min((subtotal / 499) * 100, 100)

  async function applyCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          order_total: subtotal,
          vendor_id: items[0]?.vendor_id ?? null,
        }),
      })
      const data = await res.json()
      setCouponResult(data)
    } catch {
      setCouponResult({ valid: false, discount_amount: 0, message: 'Failed to validate coupon. Try again.' })
    } finally {
      setCouponLoading(false)
    }
  }

  return (
    <div className={`${colors.bgLight} min-h-screen pb-36`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 flex items-center justify-between h-14">
        <h1 className="text-base font-semibold text-gray-900">My Cart ({items.length} items)</h1>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="text-xs text-red-500 font-medium hover:text-red-600 flex items-center gap-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear all
        </button>
      </div>

      {/* Free delivery nudge */}
      {amountForFreeDelivery > 0 && (
        <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-700 mb-1.5">
            🚚 Add <strong>{formatPrice(amountForFreeDelivery)}</strong> more for <strong>FREE delivery</strong>!
          </p>
          <ProgressBar value={freeDeliveryPct} color="bg-amber-500" />
        </div>
      )}
      {deliveryFee === 0 && (
        <div className="mx-4 mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
          <p className="text-xs text-green-700">🎉 You&apos;ve unlocked <strong>FREE delivery</strong>!</p>
        </div>
      )}

      {/* Cart items */}
      <div className="mx-4 mt-3 bg-white rounded-2xl overflow-hidden divide-y divide-gray-50 shadow-card">
        {items.map((item) => (
          <div key={item.product_id} className="flex items-center gap-3 p-3">
            <div className="relative w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
              {item.image ? (
                <Image src={item.image} alt={item.name_en} fill className="object-cover" sizes="64px" />
              ) : (
                <div className="flex items-center justify-center h-full text-2xl">📦</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.name_en}</p>
              <p className="text-xs text-gray-500">{item.unit}</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {formatPrice(item.price_selling * item.quantity)}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={() => removeItem(item.product_id)}
                className="text-gray-300 hover:text-red-400 transition-colors"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1 bg-blue-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                  className="flex items-center justify-center w-7 h-7 text-white hover:bg-blue-700 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-white text-xs font-bold min-w-[16px] text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  disabled={item.quantity >= item.max_qty}
                  className="flex items-center justify-center w-7 h-7 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon section */}
      <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Tag className={`h-4 w-4 ${colors.text}`} />
          <span className="text-sm font-semibold text-gray-900">Apply Coupon</span>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value.toUpperCase())
              if (couponResult) setCouponResult(null)
            }}
            placeholder="Enter coupon code"
            className="flex-1 bg-gray-100 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A56DB]/20 uppercase"
            aria-label="Coupon code"
          />
          <Button
            size="sm"
            onClick={applyCoupon}
            loading={couponLoading}
            disabled={!couponCode.trim() || couponLoading}
          >
            Apply
          </Button>
        </div>
        {couponResult && (
          <div className="mt-2">
            <AlertBanner
              type={couponResult.valid ? 'success' : 'error'}
              message={couponResult.message}
              dismissible
              onDismiss={() => { setCouponResult(null); setCouponCode('') }}
            />
          </div>
        )}
      </div>

      {/* Upsell: Frequently bought together */}
      {items.length > 0 && (
        <div className="mt-3 bg-white rounded-2xl mx-4 shadow-card overflow-hidden">
          <UpsellWidget
            trigger="cart_contains"
            triggerValue={items[0].product_id}
            title="Frequently bought together"
          />
        </div>
      )}

      {/* Bill summary */}
      <div className="mx-4 mt-3 bg-white rounded-2xl p-4 shadow-card">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Bill Summary</h2>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Items total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery fee</span>
            <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
              {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
            </span>
          </div>
          {couponDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600 font-medium">
              <span>Coupon ({couponCode})</span>
              <span>-{formatPrice(couponDiscount)}</span>
            </div>
          )}
          <Divider />
          <div className="flex justify-between text-base font-bold text-gray-900">
            <span>Grand Total</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Checkout CTA */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md px-4 py-3 bg-white border-t border-gray-100">
        <Link href={`/checkout${couponResult?.valid ? `?coupon=${couponCode}` : ''}`}>
          <Button size="lg" fullWidth className="justify-between">
            <span>Proceed to Checkout</span>
            <span className="font-bold">{formatPrice(grandTotal)}</span>
          </Button>
        </Link>
      </div>

      <ConfirmDialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => { clearCart(); setShowClearConfirm(false) }}
        title="Clear Cart"
        description="Remove all items from your cart? This cannot be undone."
        confirmLabel="Clear Cart"
        cancelLabel="Keep Items"
        variant="danger"
      />
    </div>
  )
}
