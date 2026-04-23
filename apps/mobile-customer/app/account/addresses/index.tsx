import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { router } from 'expo-router'
import { ArrowLeft, MapPin, Plus } from 'lucide-react-native'
import type { Address } from '@kurnool-mall/shared-types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { Spinner } from '@/components/Spinner'

export default function Addresses() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
    setAddresses((data as Address[] | null) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  async function setDefault(id: string) {
    if (!user) return
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
    await supabase.from('addresses').update({ is_default: true }).eq('id', id)
    load()
  }

  if (loading) return <Spinner />

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900 flex-1">Saved addresses</Text>
        <Pressable onPress={() => router.push('/account/addresses/new')}>
          <Plus size={22} color="#1A56DB" />
        </Pressable>
      </View>
      {addresses.length === 0 ? (
        <EmptyState
          Icon={MapPin}
          title="No saved addresses"
          description="Add one so checkout goes fast."
          actionLabel="Add address"
          onAction={() => router.push('/account/addresses/new')}
        />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View className="bg-white rounded-2xl p-4 mb-2 shadow-sm">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-gray-900">{item.label}</Text>
                {item.is_default ? (
                  <View className="bg-brand-light px-2 py-0.5 rounded-full">
                    <Text className="text-[10px] font-semibold text-brand">Default</Text>
                  </View>
                ) : null}
              </View>
              <Text className="text-xs text-gray-600 mt-1">{item.address_line}</Text>
              <Text className="text-xs text-gray-600">
                {item.city} — {item.pincode}
              </Text>
              {!item.is_default ? (
                <View className="mt-3 self-start">
                  <Button size="sm" variant="outline" onPress={() => setDefault(item.id)}>
                    Set as default
                  </Button>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}
