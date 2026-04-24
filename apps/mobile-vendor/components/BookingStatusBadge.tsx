import { Text, View } from 'react-native'
import type { BookingStatus } from '@kurnool-mall/shared-types'
import { BOOKING_STATUS_LABELS } from '@kurnool-mall/shared-utils'

const COLOR_MAP: Record<BookingStatus, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
  en_route: { bg: '#E0E7FF', text: '#3730A3' },
  in_progress: { bg: '#FFEDD5', text: '#9A3412' },
  completed: { bg: '#D1FAE5', text: '#065F46' },
  paid: { bg: '#D1FAE5', text: '#064E3B' },
  cancelled: { bg: '#F3F4F6', text: '#4B5563' },
  rejected: { bg: '#FEE2E2', text: '#991B1B' },
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const c = COLOR_MAP[status]
  return (
    <View style={{ backgroundColor: c.bg }} className="px-3 py-1 rounded-full self-start">
      <Text style={{ color: c.text }} className="text-xs font-semibold">
        {BOOKING_STATUS_LABELS[status]}
      </Text>
    </View>
  )
}
