import { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Redirect, router } from 'expo-router'
import { ClipboardList } from 'lucide-react-native'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Audio: any = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Audio = require('expo-av').Audio
} catch {
  Audio = null
}
import type { Order } from '@kurnool-mall/shared-types'
import { formatDate, formatPrice } from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { useVendor } from '@/hooks/useVendor'
import { Spinner } from '@/components/Spinner'
import { EmptyState } from '@/components/EmptyState'
import { OrderStatusBadge } from '@/components/OrderStatusBadge'
import { OrderActionButtons } from '@/components/OrderActionButtons'

export default function OrdersTab() {
  const { vendor, loading } = useVendor()
  const [orders, setOrders] = useState<Order[]>([])
  const [fetching, setFetching] = useState(true)
  const soundRef = useRef<{ unloadAsync: () => Promise<void> } | null>(null)

  const load = useCallback(async () => {
    if (!vendor) return
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setOrders((data as Order[] | null) ?? [])
    setFetching(false)
  }, [vendor])

  useEffect(() => {
    if (vendor) load()
  }, [vendor, load])

  useEffect(() => {
    if (!vendor) return
    const channel = supabase
      .channel(`vendor-orders-${vendor.id}`)
      .on(
        'postgres_changes' as never,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${vendor.id}`,
        },
        async () => {
          // Audio asset isn't bundled; tolerate missing file gracefully.
          try {
            if (Audio) {
              const { sound } = await Audio.Sound.createAsync(
                require('../../assets/new-order.mp3')
              )
              soundRef.current = sound
              await sound.playAsync()
            }
          } catch {
            // no-op — alert sound is nice-to-have
          }
          load()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      soundRef.current?.unloadAsync().catch(() => {})
    }
  }, [vendor, load])

  if (loading) return <Spinner />
  if (!vendor) return <Redirect href="/register" />

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <Text className="text-lg font-semibold text-gray-900">Orders</Text>
      </View>
      {fetching ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <EmptyState Icon={ClipboardList} title="No orders yet" description="You'll hear a chime when a new one comes in." />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl p-4 mb-2 shadow-sm">
              <Pressable onPress={() => router.push(`/orders/${item.id}`)}>
                <View className="flex-row justify-between items-start">
                  <View>
                    <Text className="text-sm font-semibold text-gray-900">{item.order_number}</Text>
                    <Text className="text-xs text-gray-500 mt-0.5">{formatDate(item.created_at)}</Text>
                  </View>
                  <OrderStatusBadge status={item.status} />
                </View>
                <Text className="mt-2 text-sm font-semibold text-gray-900">
                  {formatPrice(item.grand_total)}
                </Text>
              </Pressable>
              <OrderActionButtons
                order={item}
                onUpdated={() => load()}
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}
