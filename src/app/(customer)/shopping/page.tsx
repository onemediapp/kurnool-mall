'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ProductCard } from '@/components/customer/product-card'
import { ShoppingFilters } from '@/components/customer/shopping-filters'
import { ShoppingToolbar } from '@/components/customer/shopping-toolbar'
import type { Product, Category } from '@/lib/types'

type ViewMode = 'grid' | 'list'
type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating'

export default function ShoppingPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const supabase = createClient()

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order')

        if (data) setCategories(data as Category[])
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }

    fetchCategories()
  }, [supabase])

  // Fetch products with filters
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        let query = supabase
          .from('products')
          .select('*, vendor:vendors(id, shop_name, rating), category:categories(id, name_en, slug)')
          .eq('is_available', true)
          .eq('is_deleted', false)

        if (selectedCategory) {
          query = query.eq('category_id', selectedCategory)
        }

        query = query
          .gte('price', priceRange[0])
          .lte('price', priceRange[1])

        if (sortBy === 'price_asc') {
          query = query.order('price', { ascending: true })
        } else if (sortBy === 'price_desc') {
          query = query.order('price', { ascending: false })
        } else {
          query = query.order('created_at', { ascending: false })
        }

        const { data } = await query.limit(50)
        setProducts((data as Product[]) || [])
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [selectedCategory, priceRange, sortBy, supabase])

  const handleClearFilters = () => {
    setSelectedCategory(null)
    setPriceRange([0, 100000])
    setSortBy('relevance')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/" className="flex-shrink-0 -m-2 p-2">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Shop All Products</h1>
            <p className="text-xs text-gray-500">{loading ? '...' : `${products.length} items`}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <ShoppingToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        onSortChange={setSortBy}
        productCount={products.length}
        onFilterClick={() => setShowFilters(!showFilters)}
        showFiltersButton={categories.length > 0}
      />

      {/* Filters Sidebar */}
      <ShoppingFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        priceRange={priceRange}
        onPriceChange={setPriceRange}
        onClear={handleClearFilters}
        isOpen={showFilters}
      />

      {/* Products Grid/List */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 rounded-full border-2 border-[#1A56DB] border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-600">Loading products...</p>
            </div>
          </div>
        ) : products.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} showVendor />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="flex gap-3 bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-20 w-20 flex-shrink-0 bg-gray-100 rounded-lg" />
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                        {product.name_en}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {typeof product.vendor === 'object' && product.vendor?.shop_name}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">₹{product.price_selling}</span>
                      {product.price_mrp && product.price_mrp > product.price_selling && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{product.price_mrp}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm text-gray-600">No products found</p>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
