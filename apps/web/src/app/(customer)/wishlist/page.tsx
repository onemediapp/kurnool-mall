'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useWishlistStore } from '@/lib/hooks/use-wishlist'
import { ProductCard } from '@/components/customer/product-card'
import { Spinner, EmptyState } from '@/components/shared'
import type { Product } from '@/lib/types'

export default function WishlistPage() {
  const { productIds, sync } = useWishlistStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sync()
  }, [sync])

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }
    const supabase = createClient()
    supabase
      .from('products')
      .select('*, vendor:vendors(id, shop_name, rating)')
      .in('id', productIds)
      .eq('is_available', true)
      .eq('is_deleted', false)
      .then(({ data }) => {
        setProducts((data ?? []) as unknown as Product[])
        setLoading(false)
      })
  }, [productIds])

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 flex items-center h-14 gap-3">
        <Link href="/account" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <h1 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
          My Wishlist
          {productIds.length > 0 && (
            <span className="text-xs text-gray-400 font-normal">({productIds.length})</span>
          )}
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : productIds.length === 0 ? (
        <EmptyState
          icon="💝"
          title="Your wishlist is empty"
          description="Save products you love by tapping the heart icon."
          action={<Link href="/" className="text-sm text-[#1A56DB] font-medium hover:underline">Browse Products</Link>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} showVendor />
          ))}
        </div>
      )}
    </div>
  )
}
