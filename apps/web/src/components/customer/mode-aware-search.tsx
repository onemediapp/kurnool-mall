'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { useUIMode } from '@/lib/hooks/use-ui-mode'
import { cn } from '@kurnool-mall/shared-utils'

interface ModeAwareSearchProps {
  onSearch?: (query: string) => void
  placeholder?: string
  className?: string
}

export function ModeAwareSearch({
  onSearch,
  placeholder,
  className,
}: ModeAwareSearchProps) {
  const { mode } = useUIMode()
  const [query, setQuery] = useState('')

  const defaultPlaceholder =
    mode === 'shopping'
      ? 'Search products, brands...'
      : 'Search services, providers...'

  const handleChange = (value: string) => {
    setQuery(value)
    onSearch?.(value)
  }

  const handleClear = () => {
    setQuery('')
    onSearch?.('')
  }

  return (
    <div className={cn('relative w-full', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder || defaultPlaceholder}
        className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-lg text-sm font-medium placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:bg-white transition-all"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
