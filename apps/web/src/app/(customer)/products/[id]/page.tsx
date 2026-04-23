import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Star, MapPin, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AddToCartSection } from './add-to-cart-section'
import { PriceDisplay, Divider, RatingStars, StockBadge } from '@/components/shared'
import { ProductCard } from '@/components/customer/product-card'
import { UpsellWidget } from '@/components/shared/upsell-widget'
import { CATEGORY_EMOJIS, formatDate } from '@/lib/utils'
import type { Product, Review } from '@/lib/types'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props) {
  const supabase = createClient()
  const { data: product } = await supabase
    .from('products')
    .select('name_en')
    .eq('id', params.id)
    .single()

  return {
    title: product ? `${product.name_en} — Kurnool Mall` : 'Product — Kurnool Mall',
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const supabase = createClient()

  const [{ data: productData }, { data: reviewsData }] = await Promise.all([
    supabase
      .from('products')
      .select('*, vendor:vendors(*), category:categories(*)')
      .eq('id', params.id)
      .eq('is_deleted', false)
      .single(),
    supabase
      .from('reviews')
      .select('*')
      .eq('product_id', params.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (!productData) notFound()

  const product = productData as unknown as Product
  const reviews = (reviewsData ?? []) as Review[]

  // Similar products: same category, exclude current
  const { data: similarData } = product.category_id
    ? await supabase
        .from('products')
        .select('*, vendor:vendors(id, shop_name, rating), category:categories(id, slug, name_en)')
        .eq('category_id', product.category_id)
        .eq('is_deleted', false)
        .eq('is_available', true)
        .neq('id', params.id)
        .limit(8)
    : { data: [] }
  const similarProducts = (similarData ?? []) as unknown as Product[]
  const vendor = product.vendor
  const category = product.category
  const imageUrl = product.images?.[0] || null

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const discountPct = product.price_mrp > product.price_selling
    ? Math.round(((product.price_mrp - product.price_selling) / product.price_mrp) * 100)
    : 0

  return (
    <div className="bg-white min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 flex items-center h-14">
        <Link
          href={category ? `/categories/${category.slug}` : '/'}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <div className="ml-2 flex items-center gap-1.5 text-xs text-gray-400">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          {category && (
            <>
              <Link href={`/categories/${category.slug}`} className="hover:text-gray-600">
                {category.name_en}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-600 truncate max-w-[100px]">{product.name_en}</span>
        </div>
      </div>

      {/* Product Image */}
      <div className="relative aspect-square bg-gray-50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name_en}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, 448px"
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full text-8xl">📦</div>
        )}

        {/* Discount badge */}
        {discountPct > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
            -{discountPct}%
          </div>
        )}

        {!product.is_available && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-black/70 text-white font-semibold px-4 py-2 rounded-lg">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        {/* Category chip */}
        {category && (
          <Link
            href={`/categories/${category.slug}`}
            className="inline-flex items-center gap-1 text-xs text-[#1A56DB] font-medium bg-[#DBEAFE] rounded-full px-2.5 py-1 mb-2"
          >
            <span>{CATEGORY_EMOJIS[category.slug] || '📦'}</span>
            {category.name_en}
          </Link>
        )}

        {/* Name */}
        <h1 className="text-xl font-bold text-gray-900 mt-1 mb-0.5">{product.name_en}</h1>
        {product.name_te && (
          <p className="text-sm text-gray-500 font-telugu mb-2">{product.name_te}</p>
        )}
        <p className="text-sm text-gray-500 mb-3">{product.unit}</p>

        {/* Price + rating row */}
        <div className="flex items-center justify-between mb-3">
          <PriceDisplay
            selling={product.price_selling}
            mrp={product.price_mrp}
            size="lg"
          />
          {reviews.length > 0 && (
            <RatingStars rating={avgRating} count={reviews.length} />
          )}
        </div>

        {/* Stock badge */}
        <StockBadge stock={product.stock_qty} />

        {/* Delivery ETA chip */}
        <div className="flex items-center gap-1.5 text-xs text-[#1A56DB] font-medium mb-4">
          <Zap className="h-3.5 w-3.5 fill-[#1A56DB]" />
          Express delivery in 1–2 hrs
        </div>

        <Divider />

        {/* Vendor card */}
        {vendor && (
          <Link href={`/vendors/${vendor.id}`} className="block bg-gray-50 rounded-2xl p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1 font-medium">Sold by</p>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{vendor.shop_name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-gray-600">{vendor.rating.toFixed(1)}</span>
                </div>
                {vendor.address_line && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                    <p className="text-xs text-gray-500">{vendor.address_line}</p>
                  </div>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Description */}
        {(product.description_en || product.description_te) && (
          <>
            <Divider />
            <h2 className="text-base font-semibold text-gray-900 mb-2">Product Details</h2>
            {product.description_en && (
              <p className="text-sm text-gray-600 leading-relaxed">{product.description_en}</p>
            )}
            {product.description_te && (
              <p className="text-sm text-gray-500 font-telugu mt-2 leading-relaxed">
                {product.description_te}
              </p>
            )}
          </>
        )}

        {/* Upsell: You might also like */}
        <UpsellWidget trigger="product_view" triggerValue={params.id} className="mt-2 -mx-4" />

        {/* Reviews section */}
        <Divider />
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">
              Reviews {reviews.length > 0 && `(${reviews.length})`}
            </h2>
            {avgRating > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-2xl">
              <div className="text-3xl mb-2">⭐</div>
              <p className="text-sm text-gray-500">No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-gray-50 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400">{formatDate(review.created_at)}</span>
                  </div>
                  {review.comment && (
                    <p className="text-xs text-gray-600 leading-snug">{review.comment}</p>
                  )}
                  {review.vendor_reply && (
                    <div className="mt-2 pl-2 border-l-2 border-[#1A56DB]">
                      <p className="text-[10px] text-[#1A56DB] font-semibold mb-0.5">Vendor reply</p>
                      <p className="text-xs text-gray-500">{review.vendor_reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Similar products */}
      {similarProducts.length > 0 && (
        <div className="px-4 pb-4">
          <Divider />
          <h2 className="text-base font-semibold text-gray-900 mb-3">Similar Products</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {similarProducts.map((p) => (
              <div key={p.id} className="flex-shrink-0 w-40">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky bottom add to cart */}
      <AddToCartSection product={product} />
    </div>
  )
}
