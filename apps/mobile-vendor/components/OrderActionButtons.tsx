import { useState } from 'react'
import { Alert, Text, TextInput, View } from 'react-native'
import type { Order, OrderStatus } from '@kurnool-mall/shared-types'
import { allowedNextOrderStatuses, ORDER_STATUS_LABELS } from '@kurnool-mall/shared-utils'
import { api } from '@/lib/api'
import { Button } from './Button'

interface Props {
  order: Order
  onUpdated?: (next: OrderStatus) => void
}

// Maps the current order status to whichever next actions the FSM allows,
// using the shared allowedNextOrderStatuses helper in @kurnool-mall/shared-utils.
export function OrderActionButtons({ order, onUpdated }: Props) {
  const [pending, setPending] = useState<OrderStatus | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectPrompt, setShowRejectPrompt] = useState(false)

  const next = allowedNextOrderStatuses(order.status).filter((s) => s !== 'cancelled')

  async function applyStatus(status: OrderStatus, reason?: string) {
    setPending(status)
    const { data, error } = await api.updateOrderStatus({
      order_id: order.id,
      status,
      ...(reason ? { rejection_reason: reason } : {}),
    })
    setPending(null)
    if (error || !data) {
      Alert.alert('Could not update order', error?.message ?? 'Please try again.')
      return
    }
    onUpdated?.(status)
  }

  if (showRejectPrompt) {
    return (
      <View className="mt-3">
        <Text className="text-xs text-gray-600 mb-1">Reason for rejection</Text>
        <TextInput
          value={rejectReason}
          onChangeText={setRejectReason}
          placeholder="Out of stock, etc."
          className="border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900"
        />
        <View className="flex-row mt-2 gap-2">
          <View className="flex-1">
            <Button variant="outline" size="sm" onPress={() => setShowRejectPrompt(false)}>
              Back
            </Button>
          </View>
          <View className="flex-1">
            <Button
              variant="danger"
              size="sm"
              loading={pending === 'rejected'}
              onPress={() => {
                if (!rejectReason.trim()) {
                  Alert.alert('Add a reason', 'Customers need to see why.')
                  return
                }
                applyStatus('rejected', rejectReason.trim())
              }}
            >
              Confirm reject
            </Button>
          </View>
        </View>
      </View>
    )
  }

  if (next.length === 0) {
    return (
      <Text className="mt-2 text-xs text-gray-500">Waiting on rider assignment.</Text>
    )
  }

  return (
    <View className="mt-3 flex-row gap-2">
      {order.status === 'pending' ? (
        <>
          <View className="flex-1">
            <Button
              variant="outline"
              size="sm"
              onPress={() => setShowRejectPrompt(true)}
              disabled={pending !== null}
            >
              Reject
            </Button>
          </View>
          <View className="flex-1">
            <Button
              size="sm"
              loading={pending === 'accepted'}
              onPress={() => applyStatus('accepted')}
            >
              Accept
            </Button>
          </View>
        </>
      ) : (
        next.map((status) => (
          <View key={status} className="flex-1">
            <Button
              size="sm"
              loading={pending === status}
              onPress={() => applyStatus(status)}
            >
              {`Mark ${ORDER_STATUS_LABELS[status]}`}
            </Button>
          </View>
        ))
      )}
    </View>
  )
}
