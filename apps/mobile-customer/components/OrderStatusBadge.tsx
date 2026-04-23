import { Text, View } from 'react-native'
import type { OrderStatus } from '@kurnool-mall/shared-types'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@kurnool-mall/shared-utils'

// Map the shared Tailwind classes (web) to RN-safe bg/text colors.
const COLOR_MAP: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  accepted: { bg: '#DBEAFE', text: '#1E40AF' },
  rejected: { bg: '#FEE2E2', text: '#991B1B' },
  preparing: { bg: '#FFEDD5', text: '#9A3412' },
  ready: { bg: '#EDE9FE', text: '#5B21B6' },
  out_for_delivery: { bg: '#E0E7FF', text: '#3730A3' },
  delivered: { bg: '#D1FAE5', text: '#065F46' },
  cancelled: { bg: '#F3F4F6', text: '#4B5563' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const c = COLOR_MAP[status]
  // touch shared constants so tree-shaking can't drop them (future web↔mobile parity check)
  void ORDER_STATUS_COLORS
  return (
    <View style={{ backgroundColor: c.bg }} className="px-3 py-1 rounded-full self-start">
      <Text style={{ color: c.text }} className="text-xs font-semibold">
        {ORDER_STATUS_LABELS[status]}
      </Text>
    </View>
  )
}
