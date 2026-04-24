import { useEffect, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import type { ServiceCategory } from '@kurnool-mall/shared-types'
import { SERVICE_CATEGORY_META } from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/Spinner'

export default function ServicesIndex() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('service_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        setCategories((data as ServiceCategory[] | null) ?? [])
        setLoading(false)
      })
  }, [])

  if (loading) return <Spinner />

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">Services</Text>
      </View>
      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        numColumns={2}
        contentContainerStyle={{ padding: 8 }}
        renderItem={({ item }) => {
          const meta = SERVICE_CATEGORY_META[item.slug]
          const emoji = item.emoji || meta?.emoji || '🛠️'
          return (
            <Pressable
              onPress={() => router.push(`/services/${item.slug}`)}
              className="flex-1 m-1 bg-white rounded-2xl p-4 items-center shadow-sm"
            >
              <View
                className="w-16 h-16 rounded-2xl items-center justify-center"
                style={{ backgroundColor: (meta?.color ?? '#F59E0B') + '22' }}
              >
                <Text className="text-3xl">{emoji}</Text>
              </View>
              <Text className="mt-2 text-sm font-semibold text-gray-900 text-center">
                {item.name_en}
              </Text>
              <Text className="text-xs text-gray-500 text-center">
                from ₹{item.base_price}
              </Text>
            </Pressable>
          )
        }}
      />
    </SafeAreaView>
  )
}
