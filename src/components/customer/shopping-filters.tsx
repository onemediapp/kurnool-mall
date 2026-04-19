'use client'

import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import type { Category } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ShoppingFiltersProps {
  categories: Category[]
  selectedCategory: string | null
  onCategoryChange: (id: string | null) => void
  priceRange: [number, number]
  onPriceChange: (range: [number, number]) => void
  onClear: () => void
  isOpen?: boolean
  onClose?: () => void
}

export function ShoppingFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceChange,
  onClear,
  isOpen = true,
  onClose,
}: ShoppingFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  if (!isOpen) return null

  return (
    <div className="bg-white border-b border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Filters</h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filters Content */}
      <div className="divide-y divide-gray-100">
        {/* Category Filter */}
        <div className="p-4">
          <button
            onClick={() => toggleSection('category')}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="text-sm font-semibold text-gray-900">Category</h3>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-gray-500 transition-transform',
                expandedSections.category && 'rotate-180'
              )}
            />
          </button>

          {expandedSections.category && (
            <div className="space-y-2">
              <button
                onClick={() => onCategoryChange(null)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors',
                  !selectedCategory
                    ? 'bg-[#1A56DB] text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                )}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors',
                    selectedCategory === cat.id
                      ? 'bg-[#1A56DB] text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {cat.name_en}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price Filter */}
        <div className="p-4">
          <button
            onClick={() => toggleSection('price')}
            className="flex items-center justify-between w-full mb-3"
          >
            <h3 className="text-sm font-semibold text-gray-900">Price Range</h3>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-gray-500 transition-transform',
                expandedSections.price && 'rotate-180'
              )}
            />
          </button>

          {expandedSections.price && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Min: ₹{priceRange[0].toLocaleString()}</label>
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="500"
                  value={priceRange[0]}
                  onChange={(e) => onPriceChange([Number(e.target.value), priceRange[1]])}
                  className="w-full cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Max: ₹{priceRange[1].toLocaleString()}</label>
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="500"
                  value={priceRange[1]}
                  onChange={(e) => onPriceChange([priceRange[0], Number(e.target.value)])}
                  className="w-full cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <span className="text-xs font-semibold text-[#1A56DB]">
                  ₹{priceRange[0].toLocaleString()} - ₹{priceRange[1].toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Clear Button */}
        <div className="p-4">
          <button
            onClick={onClear}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-900 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  )
}
