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
        <Stack.Screen name="register" />
        <Stack.Screen name="products/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="products/[id]/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="orders/[id]" />
      </Stack>
    </SafeAreaProvider>
  )
}
