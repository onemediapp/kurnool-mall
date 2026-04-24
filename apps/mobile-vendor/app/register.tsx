import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import type { Category, Vendor } from '@kurnool-mall/shared-types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useVendor } from '@/hooks/useVendor'
import { Button } from '@/components/Button'
import { Spinner } from '@/components/Spinner'

export default function RegisterVendor() {
  const { user, loading: authLoading } = useAuth()
  const { vendor, refresh } = useVendor()
  const isEditing = !!vendor

  const [shopName, setShopName] = useState(vendor?.shop_name ?? '')
  const [description, setDescription] = useState(vendor?.description ?? '')
  const [addressLine, setAddressLine] = useState(vendor?.address_line ?? '')
  const [gstin, setGstin] = useState(vendor?.gstin ?? '')
  const [fssai, setFssai] = useState(vendor?.fssai_no ?? '')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCats, setSelectedCats] = useState<string[]>(vendor?.category_ids ?? [])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setCategories((data as Category[] | null) ?? []))
  }, [])

  function toggleCategory(id: string) {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  async function save() {
    if (!user) return
    if (!shopName.trim() || !addressLine.trim() || selectedCats.length === 0) {
      Alert.alert('Fill required fields', 'Shop name, address, and at least one category.')
      return
    }
    setSaving(true)
    const payload = {
      user_id: user.id,
      shop_name: shopName.trim(),
      description: description.trim() || null,
      address_line: addressLine.trim(),
      category_ids: selectedCats,
      gstin: gstin.trim() || null,
      fssai_no: fssai.trim() || null,
      is_active: true,
    } satisfies Partial<Vendor>
    const { error } = isEditing
      ? await supabase.from('vendors').update(payload).eq('id', vendor!.id)
      : await supabase.from('vendors').insert(payload)
    setSaving(false)
    if (error) {
      Alert.alert('Could not save', error.message)
      return
    }
    await refresh()
    router.replace('/(tabs)')
  }

  if (authLoading) return <Spinner />
  if (!user) {
    router.replace('/(auth)/login')
    return null
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <Text className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Shop details' : 'Register your shop'}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <Field label="Shop name *" value={shopName} onChangeText={setShopName} />
        <Field
          label="Short description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Field label="Address *" value={addressLine} onChangeText={setAddressLine} multiline />
        <Field label="GSTIN (optional)" value={gstin} onChangeText={setGstin} />
        <Field label="FSSAI number (optional)" value={fssai} onChangeText={setFssai} />

        <Text className="text-xs font-semibold text-gray-700 mt-5 mb-2">Categories *</Text>
        <View className="flex-row flex-wrap">
          {categories.map((c) => {
            const selected = selectedCats.includes(c.id)
            return (
              <Pressable
                key={c.id}
                onPress={() => toggleCategory(c.id)}
                className={`mr-2 mb-2 px-3 py-1.5 rounded-full border ${selected ? 'bg-brand border-brand' : 'border-gray-300 bg-white'}`}
              >
                <Text className={selected ? 'text-white text-xs font-semibold' : 'text-gray-700 text-xs'}>
                  {c.name_en}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <View className="mt-8">
          <Button size="lg" loading={saving} onPress={save}>
            {isEditing ? 'Save changes' : 'Register shop'}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
}: {
  label: string
  value: string
  onChangeText: (t: string) => void
  multiline?: boolean
}) {
  return (
    <View className="mt-4">
      <Text className="text-xs font-semibold text-gray-700 mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        className={`border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 ${multiline ? 'min-h-[80px]' : ''}`}
      />
    </View>
  )
}
