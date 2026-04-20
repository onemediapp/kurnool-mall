'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Plus, Minus, Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatPrice, discountPercent } from '@/lib/utils'
import { useCartStore } from '@/lib/hooks/use-cart'
import { useWishlistStore } from '@/lib/hooks/use-wishlist'
import { StockBadge, RatingStars } from '@/components/shared'
import type { Product } from '@/lib/types'

interface ProductCardProps {
  product: Product
  language?: 'en' | 'te'
  onVendorConflict?: (message: string) => void
  showVendor?: boolean
}

export function ProductCard({ product, language = 'en', onVendorConflict, showVendor }: ProductCardProps) {
  const { items, addItem, updateQuantity } = useCartStore()
  const { isWishlisted, toggle: toggleWishlist } = useWishlistStore()
  const [imageError, setImageError] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const cartItem = mounted ? items.find((i) => i.product_id === product.id) : undefined
  const qty = cartItem?.quantity ?? 0
  const discount = discountPercent(product.price_mrp, product.price_selling)
  const savings = product.price_mrp - product.price_selling
  const name = language === 'te' && product.name_te ? product.name_te : product.name_en
  const imageUrl = product.images?.[0] || null
  const wishlisted = mounted ? isWishlisted(product.id) : false

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
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
    if (!result.success && result.message) onVendorConflict?.(result.message)
  }

  function handleIncrement(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    updateQuantity(product.id, qty + 1)
  }

  function handleDecrement(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    updateQuantity(product.id, qty - 1)
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product.id)
  }

  return (
    <motion.div
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <Link
        href={`/products/${product.id}`}
        className="block bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-card-hover transition-shadow border border-gray-100 card-interactive"
      >
        {/* Image */}
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 50vw, 200px"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-4xl">📦</div>
          )}

          {/* Discount badge (top-left) */}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-[0_2px_6px_rgba(16,185,129,0.3)]">
              {discount}% OFF
            </span>
          )}

          {/* Wishlist button */}
          {mounted && (
            <motion.button
              whileTap={{ scale: 0.8 }}
              animate={wishlisted ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              onClick={handleWishlist}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/95 backdrop-blur-sm shadow-soft flex items-center justify-center active:scale-90"
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-colors',
                  wishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-400',
                )}
                strokeWidth={wishlisted ? 0 : 2.2}
              />
            </motion.button>
          )}

          {/* Savings banner (bottom) */}
          {savings > 0 && discount > 0 && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent pt-4 pb-1.5 px-2">
              <p className="text-[10px] font-bold text-white drop-shadow">
                Save ₹{savings}
              </p>
            </div>
          )}

          {/* Out of stock overlay */}
          {!product.is_available && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
              <span className="text-white text-xs font-bold bg-black/70 px-3 py-1.5 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-[11px] text-gray-500 font-medium mb-0.5">{product.unit}</p>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-1 min-h-[2.25rem]">
            {name}
          </h3>

          {/* Rating */}
          {(product as Product & { rating?: number }).rating !== undefined && (
            <div className="mb-1">
              <RatingStars rating={(product as Product & { rating?: number }).rating ?? 0} size="sm" />
            </div>
          )}

          {showVendor && product.vendor && (
            <p className="text-[11px] text-gray-400 mb-1 truncate font-medium">{product.vendor.shop_name}</p>
          )}

          {/* Stock for low qty */}
          {product.stock_qty <= 5 && product.is_available && (
            <div className="mb-1.5">
              <StockBadge stock={product.stock_qty} />
            </div>
          )}

          <div className="flex items-end justify-between gap-1 mt-2">
            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-base font-extrabold text-gray-900 leading-none">
                  {formatPrice(product.price_selling)}
                </span>
              </div>
              {product.price_mrp > product.price_selling && (
                <span className="text-[11px] line-through text-gray-400 font-medium">
                  {formatPrice(product.price_mrp)}
                </span>
              )}
            </div>

            {/* Add / Stepper (smooth transform) */}
            {product.is_available && (
              <div onClick={(e) => e.preventDefault()} className="flex-shrink-0">
                <AnimatePresence mode="wait" initial={false}>
                  {qty === 0 ? (
                    <motion.button
                      key="add"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
                      whileTap={{ scale: 0.88 }}
                      onClick={handleAdd}
                      className="flex items-center justify-center h-9 px-3.5 bg-white border-2 border-brand-500 text-brand-600 rounded-xl font-bold text-sm hover:bg-brand-50 active:bg-brand-50 transition-colors"
                      aria-label="Add to cart"
                    >
                      ADD
                    </motion.button>
                  ) : (
                    <motion.div
                      key="stepper"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
                      className="flex items-center gap-0.5 bg-brand-500 rounded-xl overflow-hidden h-9 shadow-[0_4px_10px_rgba(79,70,229,0.25)]"
                    >
                      <button
                        onClick={handleDecrement}
                        className="flex items-center justify-center w-8 h-9 text-white hover:bg-brand-600 active:scale-90 transition-all"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" strokeWidth={3} />
                      </button>
                      <span className="text-white text-sm font-extrabold min-w-[20px] text-center">
                        {qty}
                      </span>
                      <button
                        onClick={handleIncrement}
                        className={cn(
                          'flex items-center justify-center w-8 h-9 text-white hover:bg-brand-600 active:scale-90 transition-all',
                          qty >= product.stock_qty && 'opacity-50 pointer-events-none',
                        )}
                        aria-label="Increase quantity"
                        disabled={qty >= product.stock_qty}
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
