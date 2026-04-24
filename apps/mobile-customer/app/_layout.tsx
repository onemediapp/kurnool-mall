import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import * as Notifications from 'expo-notifications'
import { useAuth } from '@/hooks/useAuth'
import { usePushToken } from '@/hooks/usePushToken'
import '../global.css'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export default function RootLayout() {
  const { user } = useAuth()
  usePushToken(user?.id ?? null)

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        type?: string
        order_id?: string
        booking_id?: string
        booking_type?: 'service' | 'hall'
      }
      if (data.type === 'order_status' && data.order_id) {
        router.push(`/orders/${data.order_id}`)
      } else if (data.type === 'booking_status' && data.booking_id) {
        if (data.booking_type === 'hall') router.push(`/halls/bookings/${data.booking_id}`)
        else router.push(`/services/bookings/${data.booking_id}`)
      }
    })
    return () => sub.remove()
  }, [])

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="products/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="categories/[slug]" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="orders/[id]" />
        <Stack.Screen name="account/addresses/index" />
        <Stack.Screen name="account/addresses/new" />
        <Stack.Screen name="services/index" />
        <Stack.Screen name="services/[category]" />
        <Stack.Screen name="services/providers/[id]" />
        <Stack.Screen name="services/bookings/[id]" />
        <Stack.Screen name="halls/index" />
        <Stack.Screen name="halls/[id]" />
        <Stack.Screen name="halls/bookings/[id]" />
      </Stack>
    </SafeAreaProvider>
  )
}
