import { notFound } from 'next/navigation'
import { createClient } from '@kurnool-mall/supabase-client/server'
import { ProductCard } from '@/components/customer/product-card'
import { EmptyState } from '@/components/shared'
import { CATEGORY_EMOJIS } from '@kurnool-mall/shared-utils'
import type { Product, Category } from '@kurnool-mall/shared-types'
import { ShoppingBag, ChevronRight } from 'lucide-react'
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

  // Fetch current category
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!category) notFound()

  const cat = category as Category

  // Fetch parent category if exists
  let parentCategory: Category | null = null
  if (cat.parent_id) {
    const { data: parentData } = await supabase
      .from('categories')
      .select('*')
      .eq('id', cat.parent_id)
      .eq('is_active', true)
      .single()
    parentCategory = parentData as Category
  }

  // Fetch subcategories
  const { data: subCategoriesData } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', cat.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  const subCategories = (subCategoriesData ?? []) as Category[]

  // Fetch products
  const { data: productsData } = await supabase
    .from('products')
    .select('*, vendor:vendors(id, shop_name, address_line, rating), category:categories(id, name_en, name_te, slug)')
    .eq('category_id', cat.id)
    .eq('is_available', true)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  const products = (productsData ?? []) as unknown as Product[]

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Breadcrumb Navigation */}
      {parentCategory && (
        <div className="bg-white border-b border-gray-100 px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Link href="/" className="hover:text-gray-900">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-gray-400" />
            <Link href={`/categories/${parentCategory.slug}`} className="hover:text-gray-900">
              {parentCategory.name_en}
            </Link>
            <ChevronRight className="h-3 w-3 text-gray-400" />
            <span className="text-gray-900 font-medium">{cat.name_en}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link
          href={parentCategory ? `/categories/${parentCategory.slug}` : '/'}
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
        <span className="ml-auto text-xs text-gray-400">{products.length}</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Subcategories Section */}
        {subCategories.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Subcategories</h2>
            <div className="grid grid-cols-2 gap-2">
              {subCategories.map((subCat) => (
                <Link
                  key={subCat.id}
                  href={`/categories/${subCat.slug}`}
                  className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all"
                >
                  <div className="text-center">
                    <span className="text-lg block mb-1">
                      {subCat.icon_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={subCat.icon_url} alt="" className="w-6 h-6 object-contain mx-auto" />
                      ) : (
                        CATEGORY_EMOJIS[subCat.slug] || '📦'
                      )}
                    </span>
                    <p className="text-xs font-medium text-gray-900 line-clamp-2">{subCat.name_en}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        {products.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="h-12 w-12" />}
            title="No products yet"
            description="We're working on adding products in this category. Check back soon!"
            action={
              <Link href="/" className="text-sm text-shop font-medium hover:underline">
                Browse other categories
              </Link>
            }
          />
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Products ({products.length})
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
