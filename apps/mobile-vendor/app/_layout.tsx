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
      }
      if ((data.type === 'new_order' || data.type === 'order_status') && data.order_id) {
        router.push(`/orders/${data.order_id}`)
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
        <Stack.Screen name="register" />
        <Stack.Screen name="products/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="products/[id]/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="orders/[id]" />
      </Stack>
    </SafeAreaProvider>
  )
}
