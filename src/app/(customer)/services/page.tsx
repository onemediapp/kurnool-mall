'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ServicesFilters } from '@/components/customer/services-filters'
import { ServicesToolbar } from '@/components/customer/services-toolbar'

type ViewMode = 'grid' | 'list'
type SortOption = 'relevance' | 'rating' | 'price_asc' | 'price_desc' | 'newest'

interface ServiceProvider {
  id: string
  name: string
  category: string
  rating: number
  reviews: number
  icon: string
  available: string
  price?: number
}

export default function ServicesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('rating')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000])
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Sample providers - will integrate with Supabase later
  const [providers, setProviders] = useState<ServiceProvider[]>([
    { id: '1', name: 'Sharma Electricals', category: 'Electrical', rating: 4.8, reviews: 342, icon: '⚡', available: 'today', price: 500 },
    { id: '2', name: 'Quick Plumbing', category: 'Plumbing', rating: 4.7, reviews: 258, icon: '💧', available: 'today', price: 600 },
    { id: '3', name: 'Shine Clean Services', category: 'Cleaning', rating: 4.9, reviews: 412, icon: '🧹', available: 'tomorrow', price: 300 },
    { id: '4', name: 'Expert Carpentry', category: 'Carpentry', rating: 4.6, reviews: 195, icon: '🪛', available: 'today', price: 800 },
    { id: '5', name: 'Premium Beauty Studio', category: 'Salon & Spa', rating: 4.7, reviews: 289, icon: '💅', available: 'today', price: 400 },
    { id: '6', name: 'AC Masters Service', category: 'AC & Appliances', rating: 4.8, reviews: 356, icon: '❄️', available: 'today', price: 1200 },
  ])

  const filteredProviders = providers
    .filter((p) => !selectedCategory || p.category === selectedCategory)
    .filter((p) => !p.price || (p.price >= priceRange[0] && p.price <= priceRange[1]))
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'price_asc':
          return (a.price || 0) - (b.price || 0)
        case 'price_desc':
          return (b.price || 0) - (a.price || 0)
        case 'newest':
          return b.id.localeCompare(a.id)
        default:
          return 0
      }
    })

  const serviceCategories = [
    { id: 'Electrical', name: 'Electrical', icon: '⚡', count: providers.filter(p => p.category === 'Electrical').length },
    { id: 'Plumbing', name: 'Plumbing', icon: '💧', count: providers.filter(p => p.category === 'Plumbing').length },
    { id: 'Cleaning', name: 'Cleaning', icon: '🧹', count: providers.filter(p => p.category === 'Cleaning').length },
    { id: 'Carpentry', name: 'Carpentry', icon: '🪛', count: providers.filter(p => p.category === 'Carpentry').length },
    { id: 'Salon & Spa', name: 'Salon & Spa', icon: '💅', count: providers.filter(p => p.category === 'Salon & Spa').length },
    { id: 'AC & Appliances', name: 'AC & Appliances', icon: '❄️', count: providers.filter(p => p.category === 'AC & Appliances').length },
  ]

  const handleClearFilters = () => {
    setSelectedCategory(null)
    setPriceRange([0, 50000])
    setSortBy('rating')
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
            <h1 className="text-lg font-bold text-gray-900">All Services</h1>
            <p className="text-xs text-gray-500">{loading ? '...' : `${filteredProviders.length} providers`}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <ServicesToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        onSortChange={setSortBy}
        providerCount={filteredProviders.length}
        onFilterClick={() => setShowFilters(!showFilters)}
      />

      {/* Filters */}
      <ServicesFilters
        categories={serviceCategories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        priceRange={priceRange}
        onPriceChange={setPriceRange}
        onClear={handleClearFilters}
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />

      {/* Providers Grid/List */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-600">Loading services...</p>
            </div>
          </div>
        ) : filteredProviders.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-3">
              {filteredProviders.map((provider) => (
                <Link
                  key={provider.id}
                  href={`/services/provider/${provider.id}`}
                  className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow border border-gray-100"
                >
                  <div className="flex gap-4 p-4">
                    <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center text-3xl flex-shrink-0">
                      {provider.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{provider.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">{provider.category}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">⭐ {provider.rating}</span>
                        <span className="text-xs text-green-600">✓ Available {provider.available}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProviders.map((provider) => (
                <Link
                  key={provider.id}
                  href={`/services/provider/${provider.id}`}
                  className="flex gap-4 bg-white rounded-lg p-4 border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center text-3xl flex-shrink-0">
                    {provider.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{provider.category}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold">⭐ {provider.rating}</span>
                        <span className="text-xs text-gray-500">({provider.reviews} reviews)</span>
                      </div>
                      <span className="text-xs text-green-600">✓ Available {provider.available}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm text-gray-600">No services found</p>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
