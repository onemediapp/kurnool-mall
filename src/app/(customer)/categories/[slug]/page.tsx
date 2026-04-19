import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/customer/product-card'
import { EmptyState } from '@/components/shared'
import { CATEGORY_EMOJIS } from '@/lib/utils'
import type { Product, Category } from '@/lib/types'
import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const supabase = createClient()
  const { data: category } = await supabase
    .from('categories')
    .select('name_en')
    .eq('slug', params.slug)
    .single()

  return {
    title: category ? `${category.name_en} — Kurnool Mall` : 'Category — Kurnool Mall',
  }
}

export default async function CategoryPage({ params }: Props) {
  const supabase = createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!category) notFound()

  const cat = category as Category

  const { data: productsData } = await supabase
    .from('products')
    .select('*, vendor:vendors(id, shop_name, address_line, rating), category:categories(id, name_en, name_te, slug)')
    .eq('category_id', cat.id)
    .eq('is_available', true)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  const products = (productsData ?? []) as unknown as Product[]

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 touch-target flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-2xl">
            {cat.icon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cat.icon_url} alt="" className="w-7 h-7 object-contain" />
            ) : (
              CATEGORY_EMOJIS[cat.slug] || '📦'
            )}
          </span>
          <div>
            <h1 className="text-base font-semibold text-gray-900">{cat.name_en}</h1>
            <p className="text-xs text-gray-500">{cat.name_te}</p>
          </div>
        </div>
        <span className="ml-auto text-xs text-gray-400">{products.length} products</span>
      </div>

      <div className="p-4">
        {products.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="h-12 w-12" />}
            title="No products yet"
            description="We're working on adding products in this category. Check back soon!"
            action={
              <Link href="/" className="text-sm text-brand font-medium hover:underline">
                Browse other categories
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
