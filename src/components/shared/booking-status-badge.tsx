'use client'

import { cn, BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '@/lib/utils'
import type { BookingStatus } from '@/lib/types'

export function BookingStatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        BOOKING_STATUS_COLORS[status],
        className,
      )}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  )
}
