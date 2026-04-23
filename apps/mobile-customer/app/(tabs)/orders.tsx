import { useEffect, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Package } from 'lucide-react-native'
import type { Order } from '@kurnool-mall/shared-types'
import { formatDate, formatPrice } from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { OrderStatusBadge } from '@/components/OrderStatusBadge'
import { Spinner } from '@/components/Spinner'

type OrderRow = Order & { vendor: { shop_name: string } | null }

export default function OrdersTab() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    supabase
      .from('orders')
      .select('*, vendor:vendors(shop_name)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as OrderRow[] | null) ?? [])
        setLoading(false)
      })
  }, [user, authLoading])

  if (authLoading || loading) return <Spinner />

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <EmptyState
          Icon={Package}
          title="Sign in to see your orders"
          actionLabel="Login"
          onAction={() => router.push('/(auth)/login')}
        />
      </SafeAreaView>
    )
  }

  if (orders.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <EmptyState
          Icon={Package}
          title="No orders yet"
          description="Your order history will appear here."
          actionLabel="Browse products"
          onAction={() => router.push('/(tabs)')}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <Text className="text-lg font-semibold text-gray-900">Orders</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/orders/${item.id}`)}
            className="bg-white rounded-2xl p-4 mb-2 shadow-sm"
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">{item.order_number}</Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {item.vendor?.shop_name ?? 'Unknown shop'}
                </Text>
                <Text className="text-xs text-gray-400 mt-1">{formatDate(item.created_at)}</Text>
              </View>
              <OrderStatusBadge status={item.status} />
            </View>
            <Text className="mt-2 text-sm font-semibold text-gray-900">
              {formatPrice(item.grand_total)}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  )
}
