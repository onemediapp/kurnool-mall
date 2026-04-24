import { useEffect, useState } from 'react'
import { AppState, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, CheckCircle, Phone } from 'lucide-react-native'
import type { Order, OrderItem, Vendor, Address } from '@kurnool-mall/shared-types'
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_PROGRESS_STEPS } from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/Spinner'
import { OrderStatusBadge } from '@/components/OrderStatusBadge'

type Row = Order & {
  items: OrderItem[]
  vendor: Vendor | null
  address: Address | null
}

export default function OrderDetail() {
  const { id, success } = useLocalSearchParams<{ id: string; success?: string }>()
  const [order, setOrder] = useState<Row | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      const { data } = await supabase
        .from('orders')
        .select('*, items:order_items(*), vendor:vendors(*), address:addresses(*)')
        .eq('id', id)
        .single()
      if (!cancelled) {
        setOrder((data as Row | null) ?? null)
        setLoading(false)
      }
    }
    load()

    const channel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes' as never,
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload: { new: Order }) => {
          setOrder((prev) => (prev ? { ...prev, ...payload.new } : prev))
        }
      )
      .subscribe()

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load()
    })

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
      appStateSub.remove()
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

  const currentStep = ORDER_PROGRESS_STEPS.indexOf(order.status as typeof ORDER_PROGRESS_STEPS[number])

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
        <Pressable onPress={() => router.replace('/(tabs)/orders')} className="mr-3">
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">Order {order.order_number}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
        {success === 'true' ? (
          <View className="bg-green-50 border border-green-200 rounded-2xl p-4 flex-row items-center mb-3">
            <CheckCircle size={24} color="#059669" />
            <View className="ml-3 flex-1">
              <Text className="text-sm font-semibold text-green-900">Order placed</Text>
              <Text className="text-xs text-green-700">We&apos;ll notify you when it&apos;s on the way.</Text>
            </View>
          </View>
        ) : null}

        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-gray-500">{formatDate(order.created_at)}</Text>
            <OrderStatusBadge status={order.status} />
          </View>
          <View className="mt-4">
            {ORDER_PROGRESS_STEPS.map((step, idx) => {
              const done = idx <= currentStep
              const isLast = idx === ORDER_PROGRESS_STEPS.length - 1
              return (
                <View key={step} className="flex-row">
                  <View className="items-center w-8">
                    <View className={`w-3 h-3 rounded-full ${done ? 'bg-brand' : 'bg-gray-300'}`} />
                    {!isLast ? (
                      <View className={`w-0.5 flex-1 ${done ? 'bg-brand' : 'bg-gray-300'}`} />
                    ) : null}
                  </View>
                  <Text className={`flex-1 pb-4 text-sm ${done ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {ORDER_STATUS_LABELS[step]}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>

        {order.rider_name ? (
          <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
            <Text className="text-sm font-semibold text-gray-900">Rider</Text>
            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-sm text-gray-700">{order.rider_name}</Text>
              {order.rider_phone ? (
                <Pressable
                  onPress={() => Linking.openURL(`tel:${order.rider_phone}`)}
                  className="flex-row items-center bg-brand-light px-3 py-2 rounded-full"
                >
                  <Phone size={14} color="#1A56DB" />
                  <Text className="ml-1 text-xs text-brand font-medium">Call</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        {order.vendor ? (
          <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
            <Text className="text-sm font-semibold text-gray-900">{order.vendor.shop_name}</Text>
            <Text className="text-xs text-gray-500 mt-0.5">{order.vendor.address_line}</Text>
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
          <View className="flex-row justify-between py-0.5">
            <Text className="text-sm font-semibold text-gray-900">Grand total</Text>
            <Text className="text-sm font-semibold text-gray-900">{formatPrice(order.grand_total)}</Text>
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

        <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
          <Text className="text-sm font-semibold text-gray-900">Payment</Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            {order.payment_method.toUpperCase()} · {order.payment_status}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
