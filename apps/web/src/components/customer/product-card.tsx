'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Plus, Minus, Heart } from 'lucide-react'
import { motion } from 'framer-motion'
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
    <Link
      href={`/products/${product.id}`}
      className="block bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50">
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

        {/* Discount badge */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
            {discount}% OFF
          </span>
        )}

        {/* Wishlist button */}
        {mounted && (
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleWishlist}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 shadow flex items-center justify-center"
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={cn(
                'h-3.5 w-3.5 transition-colors',
                wishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400',
              )}
            />
          </motion.button>
        )}

        {/* Out of stock overlay */}
        {!product.is_available && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
            <span className="text-white text-xs font-semibold bg-black/60 px-3 py-1.5 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-xs text-gray-500 mb-0.5">{product.unit}</p>
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight mb-1">
          {name}
        </h3>

        {/* Rating */}
        {(product as Product & { rating?: number }).rating !== undefined && (
          <div className="mb-1">
            <RatingStars rating={(product as Product & { rating?: number }).rating ?? 0} size="sm" />
          </div>
        )}

        {showVendor && product.vendor && (
          <p className="text-xs text-gray-400 mb-1 truncate">{product.vendor.shop_name}</p>
        )}

        {/* Stock for low qty */}
        {product.stock_qty <= 5 && product.is_available && (
          <div className="mb-1.5">
            <StockBadge stock={product.stock_qty} />
          </div>
        )}

        <div className="flex items-center justify-between gap-1 mt-1.5">
          <div>
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(product.price_selling)}
            </span>
            {product.price_mrp > product.price_selling && (
              <span className="text-xs line-through text-gray-400 ml-1">
                {formatPrice(product.price_mrp)}
              </span>
            )}
          </div>

          {/* Add / Stepper (Zepto-style) */}
          {product.is_available && (
            <div onClick={(e) => e.preventDefault()}>
              {qty === 0 ? (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleAdd}
                  className="btn-add"
                  aria-label="Add to cart"
                >
                  ADD
                </motion.button>
              ) : (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="btn-stepper"
                >
                  <button onClick={handleDecrement} aria-label="Decrease quantity">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span>{qty}</span>
                  <button
                    onClick={handleIncrement}
                    className={cn(qty >= product.stock_qty && 'opacity-50 pointer-events-none')}
                    aria-label="Increase quantity"
                    disabled={qty >= product.stock_qty}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
