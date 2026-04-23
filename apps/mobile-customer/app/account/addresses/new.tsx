import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/Button'

type LabelOption = 'Home' | 'Work' | 'Other'

export default function NewAddress() {
  const { user } = useAuth()
  const [label, setLabel] = useState<LabelOption>('Home')
  const [addressLine, setAddressLine] = useState('')
  const [city] = useState('Kurnool')
  const [pincode, setPincode] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!user) return
    if (!addressLine.trim() || !/^\d{6}$/.test(pincode)) {
      Alert.alert('Fill all fields', 'Enter the full address and a valid 6-digit pincode.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('addresses').insert({
      user_id: user.id,
      label,
      address_line: addressLine.trim(),
      city,
      pincode,
      is_default: false,
    })
    setSaving(false)
    if (error) {
      Alert.alert('Could not save', error.message)
      return
    }
    router.back()
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">Add address</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text className="text-sm font-semibold text-gray-900 mb-2">Label</Text>
        <View className="flex-row gap-2">
          {(['Home', 'Work', 'Other'] as LabelOption[]).map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setLabel(opt)}
              className={`px-4 py-2 rounded-full border ${label === opt ? 'bg-brand border-brand' : 'border-gray-300 bg-white'}`}
            >
              <Text className={label === opt ? 'text-white font-semibold' : 'text-gray-700'}>{opt}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-sm font-semibold text-gray-900 mt-5 mb-2">Address line</Text>
        <TextInput
          multiline
          value={addressLine}
          onChangeText={setAddressLine}
          placeholder="House, street, landmark"
          className="border border-gray-300 rounded-xl p-3 text-base text-gray-900 min-h-[80px]"
        />

        <Text className="text-sm font-semibold text-gray-900 mt-5 mb-2">City</Text>
        <View className="border border-gray-300 rounded-xl px-3 py-3 bg-gray-50">
          <Text className="text-base text-gray-500">{city}</Text>
        </View>

        <Text className="text-sm font-semibold text-gray-900 mt-5 mb-2">Pincode</Text>
        <TextInput
          value={pincode}
          onChangeText={(t) => setPincode(t.replace(/\D/g, '').slice(0, 6))}
          placeholder="518001"
          keyboardType="number-pad"
          className="border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900"
        />

        <View className="mt-8">
          <Button size="lg" loading={saving} onPress={save}>
            Save address
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
