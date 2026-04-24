'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@kurnool-mall/supabase-client/browser'
import { formatPrice, cn } from '@kurnool-mall/shared-utils'
import type { Product, UpsellTrigger, UpsellRule } from '@kurnool-mall/shared-types'

interface UpsellWidgetProps {
  trigger: UpsellTrigger
  triggerValue: string
  title?: string
  className?: string
  maxItems?: number
}

export function UpsellWidget({
  trigger,
  triggerValue,
  title = 'You might also like',
  className,
  maxItems = 8,
}: UpsellWidgetProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data: rules } = await supabase
        .from('upsell_rules')
        .select('*')
        .eq('trigger', trigger)
        .eq('trigger_value', triggerValue)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .limit(1)

      const rule = (rules ?? [])[0] as UpsellRule | undefined
      if (!rule || !rule.recommended_product_ids?.length) {
        if (!cancelled) setLoading(false)
        return
      }

      const { data: prods } = await supabase
        .from('products')
        .select('id, name_en, name_te, price_mrp, price_selling, unit, images, stock_qty, is_available')
        .in('id', rule.recommended_product_ids.slice(0, maxItems))
        .eq('is_deleted', false)
        .eq('is_available', true)

      if (cancelled) return
      setProducts((prods ?? []) as unknown as Product[])
      setLoading(false)
    }
    void load()
    return () => { cancelled = true }
  }, [trigger, triggerValue, maxItems])

  if (loading) return null
  if (products.length === 0) return null

  return (
    <div className={cn('py-4', className)}>
      <h3 className="text-sm font-semibold text-gray-900 mb-3 px-4">{title}</h3>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="flex-shrink-0 w-32 bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-square bg-gray-50">
              {p.images?.[0] ? (
                <Image src={p.images[0]} alt={p.name_en} fill sizes="128px" className="object-contain p-2" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">📦</div>
              )}
            </div>
            <div className="p-2">
              <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight">{p.name_en}</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{formatPrice(p.price_selling)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
