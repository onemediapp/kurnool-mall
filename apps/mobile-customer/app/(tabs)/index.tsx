import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import type { Category, Product } from '@kurnool-mall/shared-types'
import { CATEGORY_EMOJIS } from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/hooks/useAppStore'
import { ProductCard } from '@/components/ProductCard'
import { Spinner } from '@/components/Spinner'

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Array<Product & { vendor_id: string }>>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const activeTab = useAppStore((s) => s.activeTab)
  const setActiveTab = useAppStore((s) => s.setActiveTab)

  const load = useCallback(async () => {
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
      supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(12),
    ])
    setCategories((cats as Category[] | null) ?? [])
    setProducts((prods as Array<Product & { vendor_id: string }> | null) ?? [])
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (loading) return <Spinner />

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View className="bg-white px-4 pt-3 pb-4 border-b border-gray-100">
          <Text className="text-xl font-bold text-brand">🛒 Kurnool Mall</Text>
          <Text className="text-xs text-gray-500 mt-0.5">📍 Kurnool</Text>
          <View className="flex-row mt-3 bg-gray-100 rounded-full p-1">
            <Pressable
              onPress={() => setActiveTab('shop')}
              className={`flex-1 py-2 rounded-full items-center ${activeTab === 'shop' ? 'bg-brand' : ''}`}
            >
              <Text className={activeTab === 'shop' ? 'text-white font-semibold' : 'text-gray-600'}>
                Shop
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setActiveTab('service')
                router.push('/services')
              }}
              className={`flex-1 py-2 rounded-full items-center ${activeTab === 'service' ? 'bg-accent' : ''}`}
            >
              <Text className={activeTab === 'service' ? 'text-white font-semibold' : 'text-gray-600'}>
                Services
              </Text>
            </Pressable>
          </View>
        </View>

        <Text className="px-4 mt-4 mb-2 text-sm font-semibold text-gray-900">Categories</Text>
        <FlatList
          data={categories}
          keyExtractor={(c) => c.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/categories/${item.slug}`)}
              className="mr-3 items-center w-20"
            >
              <View className="w-16 h-16 rounded-2xl bg-white items-center justify-center shadow-sm">
                <Text className="text-3xl">{CATEGORY_EMOJIS[item.slug] ?? '📦'}</Text>
              </View>
              <Text numberOfLines={2} className="mt-1 text-xs text-center text-gray-700">
                {item.name_en}
              </Text>
            </Pressable>
          )}
        />

        <Text className="px-4 mt-6 mb-2 text-sm font-semibold text-gray-900">Recently added</Text>
        <View className="flex-row flex-wrap px-3 pb-8">
          {products.map((p) => (
            <View key={p.id} className="w-1/2 p-1">
              <ProductCard product={p} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
