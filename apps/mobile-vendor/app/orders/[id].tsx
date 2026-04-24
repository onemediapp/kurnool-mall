import { useEffect, useState } from 'react'
import { AppState, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Phone } from 'lucide-react-native'
import type { Order, OrderItem, Address, User } from '@kurnool-mall/shared-types'
import { formatDate, formatPrice } from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/Spinner'
import { OrderStatusBadge } from '@/components/OrderStatusBadge'
import { OrderActionButtons } from '@/components/OrderActionButtons'

type Row = Order & {
  items: OrderItem[]
  customer: Pick<User, 'id' | 'name' | 'phone'> | null
  address: Address | null
}

export default function VendorOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [order, setOrder] = useState<Row | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      const { data } = await supabase
        .from('orders')
        .select('*, items:order_items(*), customer:users(id,name,phone), address:addresses(*)')
        .eq('id', id)
        .single()
      if (!cancelled) {
        setOrder((data as Row | null) ?? null)
        setLoading(false)
      }
    }
    load()

    const channel = supabase
      .channel(`v-order-${id}`)
      .on(
        'postgres_changes' as never,
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload: { new: Order }) => {
          setOrder((prev) => (prev ? { ...prev, ...payload.new } : prev))
        }
      )
      .subscribe()

    const appSub = AppState.addEventListener('change', (s) => {
      if (s === 'active') load()
    })

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
      appSub.remove()
    }
  }, [id])

  if (loading) return <Spinner />
  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text>Order not found</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">Order {order.order_number}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-gray-500">{formatDate(order.created_at)}</Text>
            <OrderStatusBadge status={order.status} />
          </View>
          <Text className="mt-2 text-lg font-semibold text-gray-900">
            {formatPrice(order.grand_total)}
          </Text>
          <OrderActionButtons order={order} onUpdated={() => {}} />
        </View>

        {order.customer ? (
          <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
            <Text className="text-sm font-semibold text-gray-900">Customer</Text>
            <View className="flex-row items-center justify-between mt-1">
              <View>
                <Text className="text-sm text-gray-700">{order.customer.name ?? 'Customer'}</Text>
                <Text className="text-xs text-gray-500">{order.customer.phone}</Text>
              </View>
              <Pressable
                onPress={() => Linking.openURL(`tel:${order.customer?.phone}`)}
                className="flex-row items-center bg-brand-light px-3 py-2 rounded-full"
              >
                <Phone size={14} color="#1A56DB" />
                <Text className="ml-1 text-xs text-brand font-medium">Call</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
          <Text className="text-sm font-semibold text-gray-900 mb-2">Items</Text>
          {order.items?.map((item) => (
            <View key={item.id} className="flex-row justify-between py-1">
              <Text className="flex-1 text-sm text-gray-700" numberOfLines={1}>
                {item.product_name} × {item.quantity}
              </Text>
              <Text className="text-sm text-gray-900">{formatPrice(item.total_price)}</Text>
            </View>
          ))}
          <View className="h-px bg-gray-200 my-2" />
          <View className="flex-row justify-between py-0.5">
            <Text className="text-sm text-gray-600">Subtotal</Text>
            <Text className="text-sm text-gray-900">{formatPrice(order.subtotal)}</Text>
          </View>
          <View className="flex-row justify-between py-0.5">
            <Text className="text-sm text-gray-600">Delivery</Text>
            <Text className="text-sm text-gray-900">
              {order.delivery_fee === 0 ? 'FREE' : formatPrice(order.delivery_fee)}
            </Text>
          </View>
        </View>

        {order.address ? (
          <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
            <Text className="text-sm font-semibold text-gray-900 mb-1">Delivery address</Text>
            <Text className="text-sm text-gray-700">{order.address.label}</Text>
            <Text className="text-xs text-gray-500">{order.address.address_line}</Text>
            <Text className="text-xs text-gray-500">
              {order.address.city} — {order.address.pincode}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}
