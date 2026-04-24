import { Alert, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ChevronRight, LogOut, Store } from 'lucide-react-native'
import { getInitials } from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useVendor } from '@/hooks/useVendor'
import { Button } from '@/components/Button'
import { Spinner } from '@/components/Spinner'

export default function AccountTab() {
  const { user, loading: authLoading } = useAuth()
  const { vendor, loading: vendorLoading } = useVendor()

  if (authLoading || vendorLoading) return <Spinner />

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-8" edges={['top']}>
        <Text className="text-base text-gray-600 mb-4 text-center">Sign in to manage your shop.</Text>
        <Button onPress={() => router.push('/(auth)/login')}>Login</Button>
      </SafeAreaView>
    )
  }

  async function signOut() {
    Alert.alert('Log out?', 'You will need to sign in again to manage your shop.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 pt-5 pb-6 items-center border-b border-gray-100">
        <View className="w-20 h-20 rounded-full bg-brand items-center justify-center">
          <Text className="text-2xl font-bold text-white">
            {getInitials(vendor?.shop_name ?? user.name)}
          </Text>
        </View>
        <Text className="mt-3 text-lg font-semibold text-gray-900">
          {vendor?.shop_name ?? 'Vendor'}
        </Text>
        <Text className="text-sm text-gray-500">{user.phone}</Text>
        {vendor ? (
          <Text className="text-xs text-gray-500 mt-1">
            KYC: {vendor.kyc_status.toUpperCase()} · Rating: {vendor.rating.toFixed(1)}
          </Text>
        ) : null}
      </View>

      <View className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden shadow-sm">
        <Pressable
          onPress={() => router.push(vendor ? '/register' : '/register')}
          className="flex-row items-center px-4 py-4"
        >
          <Store size={20} color="#1A56DB" />
          <Text className="flex-1 ml-3 text-base text-gray-900">
            {vendor ? 'Shop details' : 'Register shop'}
          </Text>
          <ChevronRight size={18} color="#9CA3AF" />
        </Pressable>
      </View>

      <Pressable onPress={signOut} className="mx-4 mt-6 flex-row items-center justify-center py-3">
        <LogOut size={18} color="#DC2626" />
        <Text className="ml-2 text-base font-semibold text-red-600">Log out</Text>
      </Pressable>
    </SafeAreaView>
  )
}
