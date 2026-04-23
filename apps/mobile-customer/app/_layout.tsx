import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import '../global.css'

export default function RootLayout() {
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
