'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Minus, Plus, ShoppingCart, AlertCircle, Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/lib/hooks/use-cart'
import { useWishlistStore } from '@/lib/hooks/use-wishlist'
import { Button } from '@/components/shared'
import { formatPrice } from '@kurnool-mall/shared-utils'
import type { Product } from '@kurnool-mall/shared-types'

interface AddToCartSectionProps {
  product: Product
}

export function AddToCartSection({ product }: AddToCartSectionProps) {
  const { items, addItem, updateQuantity } = useCartStore()
  const { isWishlisted, toggle: toggleWishlist } = useWishlistStore()
  const [conflictMessage, setConflictMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const cartItem = mounted ? items.find((i) => i.product_id === product.id) : undefined
  const qty = cartItem?.quantity ?? 0
  const wishlisted = mounted ? isWishlisted(product.id) : false
  const imageUrl = product.images?.[0] || null

  if (!product.is_available) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 py-3 bg-white border-t border-gray-100">
        <div className="bg-gray-100 text-gray-500 text-sm font-medium text-center py-3 rounded-xl">
          Out of Stock
        </div>
      </div>
    )
  }

  function handleAdd() {
    setConflictMessage(null)
    const result = addItem({
      product_id: product.id,
      vendor_id: product.vendor_id,
      name_en: product.name_en,
      name_te: product.name_te,
      price_selling: product.price_selling,
      image: imageUrl,
      unit: product.unit,
      quantity: 1,
      max_qty: product.stock_qty,
    })

    if (!result.success && result.message) {
      setConflictMessage(result.message)
    }
  }

  return (
    <>
      {/* Conflict warning */}
      <AnimatePresence>
        {conflictMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-36 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50"
          >
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 shadow-lg">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-red-700">{conflictMessage}</p>
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => {
                      useCartStore.getState().clearCart()
                      setConflictMessage(null)
                      handleAdd()
                    }}
                    className="text-xs text-red-600 font-semibold hover:underline"
                  >
                    Clear cart &amp; add
                  </button>
                  <Link href="/cart" className="text-xs text-shop font-semibold hover:underline">
                    View cart
                  </Link>
                </div>
              </div>
              <button
                onClick={() => setConflictMessage(null)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 py-3 bg-white border-t border-gray-100 shadow-lg">
        <div className="flex items-center gap-2">
          {/* Wishlist button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => toggleWishlist(product.id)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border-2 transition-colors ${
              wishlisted ? 'border-pink-400 bg-pink-50' : 'border-gray-200 bg-white'
            }`}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                wishlisted ? 'text-pink-500 fill-pink-500' : 'text-gray-400'
              }`}
            />
          </motion.button>

          {/* Cart action */}
          <div className="flex-1">
            {qty === 0 ? (
              <Button size="lg" onClick={handleAdd} fullWidth className="gap-2">
                <ShoppingCart className="h-5 w-5" />
                Add — {formatPrice(product.price_selling)}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-shop rounded-xl overflow-hidden">
                  <button
                    onClick={() => updateQuantity(product.id, qty - 1)}
                    className="flex items-center justify-center w-11 h-11 text-white hover:bg-shop-dark transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-white font-bold text-base min-w-[20px] text-center">{qty}</span>
                  <button
                    onClick={() => updateQuantity(product.id, qty + 1)}
                    disabled={qty >= product.stock_qty}
                    className="flex items-center justify-center w-11 h-11 text-white hover:bg-shop-dark transition-colors disabled:opacity-50"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Link href="/cart" className="flex-1">
                  <Button size="lg" variant="outline" fullWidth>
                    Cart — {formatPrice(product.price_selling * qty)}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
