'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Flame } from 'lucide-react'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import { ProductCard } from './product-card'
import type { Product } from '@kurnool-mall/shared-types'

export function TrendingProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true)
        const { data } = await supabase
          .from('products')
          .select('*, vendor:vendors(id, shop_name, rating)')
          .eq('is_available', true)
          .eq('is_deleted', false)
          .order('view_count', { ascending: false })
          .limit(8)

        setProducts((data as Product[]) || [])
      } catch (error) {
        console.error('Failed to fetch trending products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
  }, [supabase])

  if (loading || products.length === 0) return null

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 px-4 mb-3">
        <Flame className="h-5 w-5 text-red-500 fill-red-500" />
        <h2 className="text-base font-semibold text-gray-900">Trending Now</h2>
      </div>
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
        {products.slice(0, 6).map((product) => (
          <div key={product.id} className="flex-shrink-0 w-40">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  )
}
