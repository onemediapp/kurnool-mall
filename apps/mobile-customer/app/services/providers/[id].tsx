import { useEffect, useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Phone, Star } from 'lucide-react-native'
import type { ServiceProvider, ServicePackage, Address } from '@kurnool-mall/shared-types'
import { formatPrice } from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/Button'
import { Spinner } from '@/components/Spinner'

export default function ProviderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const [provider, setProvider] = useState<ServiceProvider | null>(null)
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddr, setSelectedAddr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      const { data: p } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', id)
        .single()
      setProvider((p as ServiceProvider | null) ?? null)
      if (p) {
        const { data: pkgs } = await supabase
          .from('service_packages')
          .select('*')
          .eq('category_id', (p as ServiceProvider).category_id)
          .eq('is_active', true)
        setPackages((pkgs as ServicePackage[] | null) ?? [])
      }
      if (user) {
        const { data: addrs } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
        const list = (addrs as Address[] | null) ?? []
        setAddresses(list)
        if (list[0]) setSelectedAddr(list[0].id)
      }
      setLoading(false)
    }
    load()
  }, [id, user])

  if (loading) return <Spinner />
  if (!provider) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text>Provider not found</Text>
      </SafeAreaView>
    )
  }

  async function book() {
    if (!user) {
      router.push('/(auth)/login')
      return
    }
    if (!selectedPkg || !selectedAddr) {
      Alert.alert('Pick a package and address')
      return
    }
    setBooking(true)
    // Default to the next available hour slot for MVP; real flow would use
    // expo-datetime-picker or similar.
    const slotStart = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    const { data, error } = await api.createServiceBooking({
      package_id: selectedPkg,
      address_id: selectedAddr,
      slot_start: slotStart,
      notes: '',
    })
    setBooking(false)
    if (error || !data) {
      Alert.alert('Booking failed', error?.message ?? 'Please try again.')
      return
    }
    router.replace(`/services/bookings/${data.id}`)
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900 flex-1" numberOfLines={1}>
          {provider.name}
        </Text>
        {provider.phone ? (
          <Pressable onPress={() => Linking.openURL(`tel:${provider.phone}`)}>
            <Phone size={20} color="#1A56DB" />
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 140 }}>
        <View className="bg-white rounded-2xl p-4 shadow-sm flex-row">
          <View className="w-20 h-20 rounded-xl bg-gray-100 items-center justify-center overflow-hidden">
            {provider.image_url ? (
              <Image source={{ uri: provider.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <Text className="text-3xl">🛠️</Text>
            )}
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-base font-semibold text-gray-900">{provider.name}</Text>
            <Text className="text-xs text-gray-500">{provider.service_type}</Text>
            <View className="flex-row items-center mt-1">
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text className="ml-1 text-xs text-gray-700">
                {provider.rating.toFixed(1)} · {provider.total_reviews} reviews
              </Text>
            </View>
            {provider.description ? (
              <Text className="text-xs text-gray-600 mt-2" numberOfLines={3}>
                {provider.description}
              </Text>
            ) : null}
          </View>
        </View>

        <Text className="px-2 mt-5 mb-2 text-sm font-semibold text-gray-900">Pick a package</Text>
        {packages.length === 0 ? (
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-sm text-gray-600">No packages listed yet.</Text>
          </View>
        ) : (
          packages.map((pkg) => {
            const selected = pkg.id === selectedPkg
            return (
              <Pressable
                key={pkg.id}
                onPress={() => setSelectedPkg(pkg.id)}
                className={`bg-white rounded-2xl p-4 mb-2 shadow-sm border ${selected ? 'border-brand' : 'border-transparent'}`}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">{pkg.name_en}</Text>
                    {pkg.description_en ? (
                      <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={2}>
                        {pkg.description_en}
                      </Text>
                    ) : null}
                    <Text className="text-xs text-gray-400 mt-1">~{pkg.duration_mins} mins</Text>
                  </View>
                  <Text className="text-sm font-semibold text-brand">{formatPrice(pkg.price)}</Text>
                </View>
              </Pressable>
            )
          })
        )}

        {user && addresses.length > 0 ? (
          <>
            <Text className="px-2 mt-5 mb-2 text-sm font-semibold text-gray-900">Service address</Text>
            {addresses.map((a) => {
              const selected = a.id === selectedAddr
              return (
                <Pressable
                  key={a.id}
                  onPress={() => setSelectedAddr(a.id)}
                  className={`bg-white rounded-2xl p-3 mb-2 shadow-sm border ${selected ? 'border-brand' : 'border-transparent'}`}
                >
                  <Text className="text-sm font-semibold text-gray-900">{a.label}</Text>
                  <Text className="text-xs text-gray-600">{a.address_line}</Text>
                </Pressable>
              )
            })}
          </>
        ) : null}
      </ScrollView>

      <View className="absolute left-0 right-0 bottom-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6">
        <Button size="lg" loading={booking} onPress={book} disabled={!selectedPkg || !selectedAddr}>
          Book service
        </Button>
      </View>
    </SafeAreaView>
  )
}
