import { useEffect, useState } from 'react'
import { AppState, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import type { HallBooking } from '@kurnool-mall/shared-types'
import { formatDate, formatPrice } from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/Spinner'
import { BookingStatusBadge } from '@/components/BookingStatusBadge'

export default function HallBookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [booking, setBooking] = useState<HallBooking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('hall_bookings')
        .select('*')
        .eq('id', id)
        .single()
      if (!cancelled) {
        setBooking((data as HallBooking | null) ?? null)
        setLoading(false)
      }
    }
    load()

    const channel = supabase
      .channel(`hb-${id}`)
      .on(
        'postgres_changes' as never,
        { event: 'UPDATE', schema: 'public', table: 'hall_bookings', filter: `id=eq.${id}` },
        (payload: { new: HallBooking }) => {
          setBooking((prev) => (prev ? { ...prev, ...payload.new } : prev))
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
  if (!booking) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text>Booking not found</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">Hall booking</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-3">
              <Text className="text-sm font-semibold text-gray-900">
                {formatDate(booking.booking_date)}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5">Hall booking</Text>
              <Text className="text-sm font-semibold text-gray-900 mt-2">
                {formatPrice(booking.price)}
              </Text>
            </View>
            <BookingStatusBadge status={booking.status} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
