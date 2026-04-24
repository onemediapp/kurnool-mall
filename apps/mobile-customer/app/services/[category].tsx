import { useEffect, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
import { ArrowLeft, Star } from 'lucide-react-native'
import type { ServiceCategory, ServiceProvider } from '@kurnool-mall/shared-types'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/Spinner'
import { EmptyState } from '@/components/EmptyState'
import { Users } from 'lucide-react-native'

export default function ServiceCategoryPage() {
  const { category } = useLocalSearchParams<{ category: string }>()
  const [cat, setCat] = useState<ServiceCategory | null>(null)
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!category) return
    async function load() {
      const { data: c } = await supabase
        .from('service_categories')
        .select('*')
        .eq('slug', category)
        .single()
      setCat((c as ServiceCategory | null) ?? null)
      if (c) {
        const { data: provs } = await supabase
          .from('service_providers')
          .select('*')
          .eq('category_id', (c as ServiceCategory).id)
          .eq('is_active', true)
          .order('rating', { ascending: false })
        setProviders((provs as ServiceProvider[] | null) ?? [])
      }
      setLoading(false)
    }
    load()
  }, [category])

  if (loading) return <Spinner />

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">{cat?.name_en ?? 'Providers'}</Text>
      </View>
      {providers.length === 0 ? (
        <EmptyState Icon={Users} title="No providers yet" description="Check back soon." />
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/services/providers/${item.id}`)}
              className="bg-white rounded-2xl p-4 mb-2 flex-row shadow-sm"
            >
              <View className="w-16 h-16 rounded-xl bg-gray-100 items-center justify-center overflow-hidden">
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <Text className="text-3xl">🛠️</Text>
                )}
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm font-semibold text-gray-900">{item.name}</Text>
                <Text className="text-xs text-gray-500">{item.service_type}</Text>
                <View className="flex-row items-center mt-1">
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <Text className="ml-1 text-xs text-gray-700">
                    {item.rating.toFixed(1)} ({item.total_reviews})
                  </Text>
                  {item.verified ? (
                    <View className="ml-2 bg-brand-light px-2 py-0.5 rounded-full">
                      <Text className="text-[10px] text-brand font-semibold">Verified</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  )
}
