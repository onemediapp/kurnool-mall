import { useEffect, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { ArrowLeft, Users, Star } from 'lucide-react-native'
import type { FunctionHall } from '@kurnool-mall/shared-types'
import { formatPrice } from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/Spinner'
import { EmptyState } from '@/components/EmptyState'

export default function HallsIndex() {
  const [halls, setHalls] = useState<FunctionHall[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('function_halls')
      .select('*')
      .eq('is_active', true)
      .order('price_per_day')
      .then(({ data }) => {
        setHalls((data as FunctionHall[] | null) ?? [])
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
        <Text className="text-lg font-semibold text-gray-900">Function halls</Text>
      </View>
      {halls.length === 0 ? (
        <EmptyState Icon={Users} title="No halls listed" description="Check back soon." />
      ) : (
        <FlatList
          data={halls}
          keyExtractor={(h) => h.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/halls/${item.id}`)}
              className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm"
            >
              {item.images[0] ? (
                <Image source={{ uri: item.images[0] }} style={{ width: '100%', height: 160 }} contentFit="cover" />
              ) : (
                <View className="h-40 bg-gray-100 items-center justify-center">
                  <Text className="text-4xl">🎉</Text>
                </View>
              )}
              <View className="p-3">
                <Text className="text-base font-semibold text-gray-900">{item.name}</Text>
                <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                  {item.address_line}
                </Text>
                <View className="flex-row items-center justify-between mt-2">
                  <View className="flex-row items-center">
                    <Users size={14} color="#6B7280" />
                    <Text className="ml-1 text-xs text-gray-700">up to {item.capacity}</Text>
                  </View>
                  <Text className="text-sm font-semibold text-brand">
                    {formatPrice(item.price_per_day)}/day
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  )
}
