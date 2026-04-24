import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Users } from 'lucide-react-native'
import type { FunctionHall } from '@kurnool-mall/shared-types'
import { formatPrice } from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/Button'
import { Spinner } from '@/components/Spinner'

export default function HallDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const [hall, setHall] = useState<FunctionHall | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [guests, setGuests] = useState('')
  const [eventDate, setEventDate] = useState('')

  useEffect(() => {
    if (!id) return
    supabase
      .from('function_halls')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setHall((data as FunctionHall | null) ?? null)
        setLoading(false)
      })
  }, [id])

  if (loading) return <Spinner />
  if (!hall) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text>Hall not found</Text>
      </SafeAreaView>
    )
  }

  async function book() {
    if (!user) {
      router.push('/(auth)/login')
      return
    }
    const guestCount = parseInt(guests, 10)
    if (!hall) return
    if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD format for the event date.')
      return
    }
    if (!guestCount || guestCount <= 0 || guestCount > hall.capacity) {
      Alert.alert('Invalid guest count', `Enter a number between 1 and ${hall.capacity}.`)
      return
    }
    setBooking(true)
    // Check availability first — fail closed if the Edge Function says busy.
    const avail = await api.checkAvailability({
      resource_type: 'hall',
      resource_id: hall.id,
      date: eventDate,
    })
    if (avail.error || !avail.data?.available) {
      setBooking(false)
      Alert.alert('Not available', 'That date is booked. Pick another.')
      return
    }
    const { data, error } = await api.createHallBooking({
      hall_id: hall.id,
      event_date: eventDate,
      start_time: '10:00',
      end_time: '22:00',
      guest_count: guestCount,
    })
    setBooking(false)
    if (error || !data) {
      Alert.alert('Booking failed', error?.message ?? 'Please try again.')
      return
    }
    router.replace(`/halls/bookings/${data.id}`)
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900 flex-1" numberOfLines={1}>
          {hall.name}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {hall.images[0] ? (
          <Image source={{ uri: hall.images[0] }} style={{ width: '100%', height: 220 }} contentFit="cover" />
        ) : (
          <View className="h-56 bg-gray-100 items-center justify-center">
            <Text className="text-6xl">🎉</Text>
          </View>
        )}

        <View className="bg-white p-4">
          <Text className="text-xl font-bold text-gray-900">{hall.name}</Text>
          <Text className="text-sm text-gray-600 mt-0.5">{hall.address_line}</Text>
          <View className="flex-row items-center mt-2">
            <Users size={16} color="#6B7280" />
            <Text className="ml-1 text-sm text-gray-700">Up to {hall.capacity} guests</Text>
          </View>
          <Text className="text-lg font-semibold text-brand mt-2">
            {formatPrice(hall.price_per_day)} / day
          </Text>
          {hall.description_en ? (
            <Text className="text-sm text-gray-700 mt-3 leading-5">{hall.description_en}</Text>
          ) : null}
          {hall.amenities?.length ? (
            <View className="mt-3">
              <Text className="text-sm font-semibold text-gray-900">Amenities</Text>
              <View className="flex-row flex-wrap mt-1">
                {hall.amenities.map((a) => (
                  <View key={a} className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2">
                    <Text className="text-xs text-gray-700">{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        <View className="bg-white mt-3 p-4">
          <Text className="text-sm font-semibold text-gray-900 mb-2">Event date (YYYY-MM-DD)</Text>
          <TextInput
            value={eventDate}
            onChangeText={setEventDate}
            placeholder="2026-06-15"
            className="border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900"
          />
          <Text className="text-sm font-semibold text-gray-900 mt-4 mb-2">Number of guests</Text>
          <TextInput
            value={guests}
            onChangeText={(t) => setGuests(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            placeholder={`Max ${hall.capacity}`}
            className="border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900"
          />
        </View>
      </ScrollView>
      <View className="absolute left-0 right-0 bottom-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6">
        <Button size="lg" loading={booking} onPress={book}>
          {`Request booking · ${formatPrice(hall.price_per_day)}`}
        </Button>
      </View>
    </SafeAreaView>
  )
}
