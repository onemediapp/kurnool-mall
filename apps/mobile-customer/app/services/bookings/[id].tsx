import { useEffect, useState } from 'react'
import { AppState, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import type { ServiceBooking } from '@kurnool-mall/shared-types'
import {
  formatDate,
  formatPrice,
  BOOKING_PROGRESS_STEPS,
  BOOKING_STATUS_LABELS,
} from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/Spinner'
import { BookingStatusBadge } from '@/components/BookingStatusBadge'

export default function ServiceBookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [booking, setBooking] = useState<ServiceBooking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      const { data } = await supabase
        .from('service_bookings')
        .select('*')
        .eq('id', id)
        .single()
      if (!cancelled) {
        setBooking((data as ServiceBooking | null) ?? null)
        setLoading(false)
      }
    }
    load()

    const channel = supabase
      .channel(`sb-${id}`)
      .on(
        'postgres_changes' as never,
        { event: 'UPDATE', schema: 'public', table: 'service_bookings', filter: `id=eq.${id}` },
        (payload: { new: ServiceBooking }) => {
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

  const currentStep = BOOKING_PROGRESS_STEPS.indexOf(
    booking.status as (typeof BOOKING_PROGRESS_STEPS)[number]
  )

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">Service booking</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-xs text-gray-500">{formatDate(booking.scheduled_at)}</Text>
              <Text className="text-sm font-semibold text-gray-900 mt-0.5">
                {formatPrice(booking.price)}
              </Text>
            </View>
            <BookingStatusBadge status={booking.status} />
          </View>
          <View className="mt-4">
            {BOOKING_PROGRESS_STEPS.map((step, idx) => {
              const done = idx <= currentStep
              const isLast = idx === BOOKING_PROGRESS_STEPS.length - 1
              return (
                <View key={step} className="flex-row">
                  <View className="items-center w-8">
                    <View className={`w-3 h-3 rounded-full ${done ? 'bg-brand' : 'bg-gray-300'}`} />
                    {!isLast ? (
                      <View className={`w-0.5 flex-1 ${done ? 'bg-brand' : 'bg-gray-300'}`} />
                    ) : null}
                  </View>
                  <Text className={`flex-1 pb-4 text-sm ${done ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {BOOKING_STATUS_LABELS[step]}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
