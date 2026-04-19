'use client'

import { useCartStore } from './use-cart'
import { useState, useEffect } from 'react'

export type CheckoutMode = 'shopping' | 'services' | 'none'

/**
 * Hook to detect the current checkout mode based on context
 * - 'shopping': User is checking out products
 * - 'services': User is booking a service
 * - 'none': No active checkout context
 */
export function useCheckoutMode() {
  const { items } = useCartStore()
  const [mode, setMode] = useState<CheckoutMode>('none')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Detect mode based on cart items
    if (items && items.length > 0) {
      setMode('shopping')
    } else {
      setMode('none')
    }
  }, [items])

  return { mode, mounted }
}

/**
 * Get checkout title based on mode
 */
export function getCheckoutTitle(mode: CheckoutMode): string {
  switch (mode) {
    case 'shopping':
      return 'Order Summary'
    case 'services':
      return 'Booking Confirmation'
    default:
      return 'Checkout'
  }
}

/**
 * Get checkout color scheme based on mode
 */
export function getCheckoutColors(mode: CheckoutMode) {
  switch (mode) {
    case 'shopping':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700',
      }
    case 'services':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-600',
        button: 'bg-orange-600 hover:bg-orange-700',
      }
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-600',
        button: 'bg-gray-600 hover:bg-gray-700',
      }
  }
}
