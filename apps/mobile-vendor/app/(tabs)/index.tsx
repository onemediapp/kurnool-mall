import { useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Redirect, router } from 'expo-router'
import { ClipboardList, Clock, Package, Star } from 'lucide-react-native'
import type { Order } from '@kurnool-mall/shared-types'
import { formatDate, formatPrice } from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { useVendor } from '@/hooks/useVendor'
import { Spinner } from '@/components/Spinner'
import { StatCard } from '@/components/StatCard'
import { OrderStatusBadge } from '@/components/OrderStatusBadge'

interface Stats {
  totalOrders: number
  pendingOrders: number
  productsListed: number
}

export default function VendorDashboard() {
  const { vendor, loading } = useVendor()
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, pendingOrders: 0, productsListed: 0 })
  const [recent, setRecent] = useState<Order[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!vendor) return
    const [{ count: total }, { count: pending }, { count: prods }, { data: last5 }] = await Promise.all([
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('vendor_id', vendor.id),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('vendor_id', vendor.id).eq('status', 'pending'),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('vendor_id', vendor.id).eq('is_deleted', false),
      supabase.from('orders').select('*').eq('vendor_id', vendor.id).order('created_at', { ascending: false }).limit(5),
    ])
    setStats({
      totalOrders: total ?? 0,
      pendingOrders: pending ?? 0,
      productsListed: prods ?? 0,
    })
    setRecent((last5 as Order[] | null) ?? [])
  }, [vendor])

  useEffect(() => {
    if (vendor) load()
  }, [vendor, load])

  if (loading) return <Spinner />
  if (!vendor) return <Redirect href="/register" />

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View className="bg-white px-4 pt-3 pb-4 border-b border-gray-100">
          <Text className="text-xs text-gray-500">Welcome back</Text>
          <Text className="text-xl font-bold text-gray-900">{vendor.shop_name}</Text>
        </View>

        <View className="flex-row px-3 mt-3">
          <StatCard Icon={ClipboardList} label="Total orders" value={String(stats.totalOrders)} />
          <StatCard Icon={Clock} label="Pending" value={String(stats.pendingOrders)} tint="#F59E0B" />
        </View>
        <View className="flex-row px-3">
          <StatCard Icon={Package} label="Products" value={String(stats.productsListed)} tint="#059669" />
          <StatCard Icon={Star} label="Rating" value={vendor.rating.toFixed(1)} tint="#EC4899" />
        </View>

        <View className="flex-row items-center justify-between px-4 mt-5 mb-2">
          <Text className="text-sm font-semibold text-gray-900">Recent orders</Text>
          <Pressable onPress={() => router.push('/(tabs)/orders')}>
            <Text className="text-xs text-brand font-medium">View all</Text>
          </Pressable>
        </View>
        <View className="px-3 pb-8">
          {recent.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center shadow-sm">
              <Text className="text-sm text-gray-500">No orders yet.</Text>
            </View>
          ) : (
            recent.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => router.push(`/orders/${o.id}`)}
                className="bg-white rounded-2xl p-4 mb-2 shadow-sm"
              >
                <View className="flex-row justify-between items-start">
                  <View>
                    <Text className="text-sm font-semibold text-gray-900">{o.order_number}</Text>
                    <Text className="text-xs text-gray-500 mt-0.5">{formatDate(o.created_at)}</Text>
                  </View>
                  <OrderStatusBadge status={o.status} />
                </View>
                <Text className="mt-2 text-sm font-semibold text-gray-900">
                  {formatPrice(o.grand_total)}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
