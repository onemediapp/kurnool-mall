'use client'

import { Grid3x3, List, Filter, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type ViewMode = 'grid' | 'list'
type SortOption = 'relevance' | 'rating' | 'price_asc' | 'price_desc' | 'newest'

interface ServicesToolbarProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  providerCount: number
  onFilterClick: () => void
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
]

export function ServicesToolbar({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  providerCount,
  onFilterClick,
}: ServicesToolbarProps) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <button
          onClick={onFilterClick}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
        >
          <Filter className="h-4 w-4 text-gray-700" />
          <span className="text-xs font-semibold text-gray-700">Filter</span>
        </button>

        <div className="relative flex-1">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="w-full appearance-none pl-3 pr-8 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium border-0 cursor-pointer transition-colors"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 pointer-events-none" />
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 flex-shrink-0">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'p-1.5 rounded transition-colors',
              viewMode === 'grid'
                ? 'bg-white text-[#7C3AED] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              'p-1.5 rounded transition-colors',
              viewMode === 'list'
                ? 'bg-white text-[#7C3AED] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100">
        Showing {providerCount} {providerCount === 1 ? 'provider' : 'providers'}
      </div>
    </div>
  )
}
