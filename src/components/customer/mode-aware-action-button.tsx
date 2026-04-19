'use client'

import { useState } from 'react'
import { ShoppingCart, Calendar, Check } from 'lucide-react'
import { useUIMode } from '@/lib/hooks/use-ui-mode'
import { cn } from '@/lib/utils'

interface ModeAwareActionButtonProps {
  itemId: string
  itemName: string
  onAddToCart?: (itemId: string) => void
  onBookService?: (itemId: string) => void
  className?: string
  quantity?: number
  onQuantityChange?: (quantity: number) => void
}

export function ModeAwareActionButton({
  itemId,
  itemName,
  onAddToCart,
  onBookService,
  className,
  quantity = 1,
  onQuantityChange,
}: ModeAwareActionButtonProps) {
  const { mode } = useUIMode()
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)

  const handleAction = async () => {
    setLoading(true)
    try {
      if (mode === 'shopping') {
        onAddToCart?.(itemId)
      } else {
        onBookService?.(itemId)
      }
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'shopping') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => onQuantityChange?.(Math.max(1, quantity - 1))}
            className="p-2 text-gray-600 hover:text-gray-900"
            disabled={quantity <= 1}
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-semibold text-gray-900">
            {quantity}
          </span>
          <button
            onClick={() => onQuantityChange?.(quantity + 1)}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            +
          </button>
        </div>
        <button
          onClick={handleAction}
          disabled={loading}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-white transition-all',
            added
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-[#7C3AED] hover:bg-[#6D28D9]',
            loading && 'opacity-75 cursor-not-allowed'
          )}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              {loading ? 'Adding...' : 'Add to Cart'}
            </>
          )}
        </button>
      </div>
    )
  }

  // Services mode
  return (
    <button
      onClick={handleAction}
      disabled={loading}
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-white transition-all w-full',
        added
          ? 'bg-green-500 hover:bg-green-600'
          : 'bg-[#7C3AED] hover:bg-[#6D28D9]',
        loading && 'opacity-75 cursor-not-allowed',
        className
      )}
    >
      {added ? (
        <>
          <Check className="h-4 w-4" />
          Service Booked
        </>
      ) : (
        <>
          <Calendar className="h-4 w-4" />
          {loading ? 'Booking...' : 'Book Service'}
        </>
      )}
    </button>
  )
}
