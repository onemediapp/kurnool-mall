'use client'

import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { useUIMode } from '@/lib/hooks/use-ui-mode'
import { cn } from '@/lib/utils'

interface FilterOption {
  id: string
  label: string
  count?: number
}

interface AdvancedFiltersProps {
  filters: {
    [key: string]: FilterOption[]
  }
  selectedFilters: {
    [key: string]: string[]
  }
  onFilterChange: (filterName: string, selected: string[]) => void
  onClear: () => void
  isOpen?: boolean
  onClose?: () => void
}

export function AdvancedFilters({
  filters,
  selectedFilters,
  onFilterChange,
  onClear,
  isOpen = true,
  onClose,
}: AdvancedFiltersProps) {
  const { mode } = useUIMode()
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({})

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const toggleFilter = (filterName: string, optionId: string) => {
    const current = selectedFilters[filterName] || []
    const updated = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId]
    onFilterChange(filterName, updated)
  }

  if (!isOpen) return null

  const activeFilterCount = Object.values(selectedFilters).flat().length

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-900">Filters</h2>
          {activeFilterCount > 0 && (
            <p className="text-xs text-[#7C3AED]">{activeFilterCount} active</p>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
        {Object.entries(filters).map(([filterName, options]) => (
          <div key={filterName} className="p-4">
            <button
              onClick={() => toggleSection(filterName)}
              className="flex items-center justify-between w-full mb-3"
            >
              <h3 className="text-sm font-semibold text-gray-900 capitalize">
                {filterName}
              </h3>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-gray-500 transition-transform',
                  expandedSections[filterName] && 'rotate-180'
                )}
              />
            </button>

            {expandedSections[filterName] && (
              <div className="space-y-2">
                {options.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={(selectedFilters[filterName] || []).includes(option.id)}
                      onChange={() => toggleFilter(filterName, option.id)}
                      className="w-4 h-4 accent-[#7C3AED] rounded cursor-pointer"
                    />
                    <span className="flex-1 text-sm text-gray-700">{option.label}</span>
                    {option.count !== undefined && (
                      <span className="text-xs text-gray-500">({option.count})</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        {activeFilterCount > 0 && (
          <div className="p-4">
            <button
              onClick={onClear}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-900 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
