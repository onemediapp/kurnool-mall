'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ProductCard } from './product-card'
import { SectionHeader } from '@/components/shared'
import type { Product } from '@/lib/types'

const RECENT_VIEWED_KEY = 'km-recently-viewed-products'
const MAX_RECENT = 10

export function RecentlyViewedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRecentlyViewed = async () => {
      try {
        const stored = localStorage.getItem(RECENT_VIEWED_KEY)
        if (!stored) {
          setProducts([])
          setLoading(false)
          return
        }

        const productIds: string[] = JSON.parse(stored)
        if (productIds.length === 0) {
          setProducts([])
          setLoading(false)
          return
        }

        // In a real app, you'd fetch these from Supabase
        // For now, this component is a placeholder
        setProducts([])
      } catch (error) {
        console.error('Failed to load recently viewed:', error)
      } finally {
        setLoading(false)
      }
    }

    loadRecentlyViewed()
  }, [])

  if (loading || products.length === 0) return null

  return (
    <div className="mt-5">
      <SectionHeader title="Recently Viewed" />
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

export function trackProductView(productId: string) {
  if (typeof window === 'undefined') return

  try {
    const stored = localStorage.getItem(RECENT_VIEWED_KEY)
    const productIds: string[] = stored ? JSON.parse(stored) : []

    // Remove if already exists and add to front
    const updated = [productId, ...productIds.filter((id) => id !== productId)].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to track product view:', error)
  }
}
