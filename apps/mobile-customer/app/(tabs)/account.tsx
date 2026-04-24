import { Alert, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ChevronRight, MapPin, Package, HelpCircle, LogOut } from 'lucide-react-native'
import { getInitials } from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/hooks/useAppStore'
import { Button } from '@/components/Button'
import { Spinner } from '@/components/Spinner'

export default function AccountTab() {
  const { user, loading } = useAuth()
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)

  if (loading) return <Spinner />

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-8" edges={['top']}>
        <Text className="text-base text-gray-600 mb-4 text-center">Sign in to manage your account.</Text>
        <Button onPress={() => router.push('/(auth)/login')}>Login</Button>
      </SafeAreaView>
    )
  }

  async function setLanguagePref(lang: 'en' | 'te') {
    setLanguage(lang)
    if (user) {
      await supabase.from('users').update({ language_pref: lang }).eq('id', user.id)
    }
  }

  async function signOut() {
    Alert.alert('Log out?', 'You will need to sign in again to view your orders.', [
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
          <Text className="text-2xl font-bold text-white">{getInitials(user.name)}</Text>
        </View>
        <Text className="mt-3 text-lg font-semibold text-gray-900">{user.name ?? 'Customer'}</Text>
        <Text className="text-sm text-gray-500">{user.phone}</Text>
      </View>

      <View className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <Text className="text-sm font-semibold text-gray-900 mb-3">Language</Text>
        <View className="flex-row bg-gray-100 rounded-full p-1">
          <Pressable
            onPress={() => setLanguagePref('en')}
            className={`flex-1 py-2 rounded-full items-center ${language === 'en' ? 'bg-brand' : ''}`}
          >
            <Text className={language === 'en' ? 'text-white font-semibold' : 'text-gray-600'}>EN</Text>
          </Pressable>
          <Pressable
            onPress={() => setLanguagePref('te')}
            className={`flex-1 py-2 rounded-full items-center ${language === 'te' ? 'bg-brand' : ''}`}
          >
            <Text className={language === 'te' ? 'text-white font-semibold' : 'text-gray-600'}>తెలుగు</Text>
          </Pressable>
        </View>
      </View>

      <View className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden shadow-sm">
        <Row Icon={MapPin} label="Saved addresses" onPress={() => router.push('/account/addresses')} />
        <Divider />
        <Row Icon={Package} label="Order history" onPress={() => router.push('/(tabs)/orders')} />
        <Divider />
        <Row Icon={HelpCircle} label="Help & support" onPress={() => Alert.alert('Coming soon', 'Support is not wired up yet.')} />
      </View>

      <Pressable onPress={signOut} className="mx-4 mt-6 flex-row items-center justify-center py-3">
        <LogOut size={18} color="#DC2626" />
        <Text className="ml-2 text-base font-semibold text-red-600">Log out</Text>
      </Pressable>
    </SafeAreaView>
  )
}

function Row({
  Icon,
  label,
  onPress,
}: {
  Icon: typeof MapPin
  label: string
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center px-4 py-4">
      <Icon size={20} color="#1A56DB" />
      <Text className="flex-1 ml-3 text-base text-gray-900">{label}</Text>
      <ChevronRight size={18} color="#9CA3AF" />
    </Pressable>
  )
}

function Divider() {
  return <View className="h-px bg-gray-100 ml-12" />
}
