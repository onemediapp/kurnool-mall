'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ProductCard } from '@/components/customer/product-card'
import { Spinner, SearchInput } from '@/components/shared'
import type { Product, Category } from '@/lib/types'

const RECENT_KEY = 'km-recent-searches'
const MAX_RECENT = 8

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveRecentSearch(q: string) {
  const recent = getRecentSearches().filter((s) => s !== q)
  const updated = [q, ...recent].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

function removeRecentSearch(q: string) {
  const updated = getRecentSearches().filter((s) => s !== q)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'rating'>('relevance')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showRecent, setShowRecent] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setRecentSearches(getRecentSearches())
    // Fetch categories for filter chips
    const supabase = createClient()
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order').limit(8)
      .then(({ data }) => { if (data) setCategories(data as Category[]) })
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!query.trim()) {
      setResults([])
      setSearched(false)
      setShowRecent(true)
      return
    }

    setShowRecent(false)
    debounceRef.current = setTimeout(() => {
      performSearch(query.trim())
    }, 350)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, selectedCategory, sortBy])

  async function performSearch(q: string) {
    setLoading(true)
    try {
      const supabase = createClient()
      let qb = supabase
        .from('products')
        .select('*, vendor:vendors(id, shop_name, rating), category:categories(id, name_en, name_te, slug)')
        .eq('is_available', true)
        .eq('is_deleted', false)

      // Try full-text search, fall back to ilike
      try {
        qb = qb.textSearch('search_vector', q, { type: 'websearch' })
      } catch {
        qb = qb.ilike('name_en', `%${q}%`)
      }

      if (selectedCategory) qb = qb.eq('category_id', selectedCategory)

      if (sortBy === 'price_asc') qb = qb.order('price_selling', { ascending: true })
      else if (sortBy === 'price_desc') qb = qb.order('price_selling', { ascending: false })
      else qb = qb.order('created_at', { ascending: false })

      const { data, error } = await qb.limit(40)

      if (!error) {
        setResults((data ?? []) as unknown as Product[])
        saveRecentSearch(q)
        setRecentSearches(getRecentSearches())
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  function handleRemoveRecent(term: string, e: React.MouseEvent) {
    e.stopPropagation()
    removeRecentSearch(term)
    setRecentSearches(getRecentSearches())
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Search bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          onClear={() => { setResults([]); setSearched(false); setShowRecent(true) }}
          placeholder="Search products, shops..."
          autoFocus
        />
      </div>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide border-b border-gray-50">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !selectedCategory ? 'bg-[#1A56DB] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat.id ? 'bg-[#1A56DB] text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {cat.name_en}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-4">
        {/* Sort selector */}
        {searched && results.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-gray-500">{results.length} results</span>
            <div className="ml-auto flex gap-1">
              {(['relevance', 'price_asc', 'price_desc'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    sortBy === s ? 'bg-[#1A56DB] text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {s === 'relevance' ? 'Best' : s === 'price_asc' ? 'Low ↑' : 'High ↓'}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && <div className="flex justify-center py-12"><Spinner /></div>}

        {/* Recent searches */}
        {!loading && showRecent && recentSearches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">Recent Searches</p>
              <button
                onClick={() => { localStorage.removeItem(RECENT_KEY); setRecentSearches([]) }}
                className="text-xs text-[#1A56DB]"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term) => (
                <div
                  key={term}
                  className="flex items-center gap-1 bg-gray-100 rounded-full pl-3 pr-2 py-1.5 cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => setQuery(term)}
                >
                  <span className="text-sm text-gray-700">{term}</span>
                  <button
                    onClick={(e) => handleRemoveRecent(term, e)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label={`Remove ${term}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && showRecent && recentSearches.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center text-gray-400">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-medium text-gray-600">Search for products</p>
            <p className="text-sm mt-1">Try &quot;rice&quot;, &quot;fan&quot;, &quot;cement&quot; or any product name</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} showVendor />
            ))}
          </div>
        )}

        {!loading && searched && results.length === 0 && query && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-medium text-gray-700 mb-1">No results for &quot;{query}&quot;</p>
            <p className="text-sm text-gray-500">Try a different term or browse categories below</p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {categories.slice(0, 4).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="px-3 py-1.5 bg-blue-50 text-[#1A56DB] text-xs font-medium rounded-full"
                >
                  {cat.name_en}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
