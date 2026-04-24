import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Camera, X } from 'lucide-react-native'
import type { Category, Product, Vendor } from '@kurnool-mall/shared-types'
import { supabase } from '@/lib/supabase'
import { Button } from './Button'

interface Props {
  visible: boolean
  onClose: () => void
  onSaved: () => void
  vendor: Vendor
  // When editing an existing product, pass it in; otherwise insert mode.
  product?: Product
}

// Upload bucket is `product-images`; path convention is vendor-scoped so RLS
// can use storage.objects.name to authorize per-vendor writes.
const BUCKET = 'product-images'

export function ProductFormModal({ visible, onClose, onSaved, vendor, product }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [nameEn, setNameEn] = useState(product?.name_en ?? '')
  const [nameTe, setNameTe] = useState(product?.name_te ?? '')
  const [categoryId, setCategoryId] = useState<string | null>(product?.category_id ?? null)
  const [mrp, setMrp] = useState(product ? String(product.price_mrp) : '')
  const [selling, setSelling] = useState(product ? String(product.price_selling) : '')
  const [stock, setStock] = useState(product ? String(product.stock_qty) : '')
  const [unit, setUnit] = useState(product?.unit ?? '')
  const [description, setDescription] = useState(product?.description_en ?? '')
  const [imageUri, setImageUri] = useState<string | null>(product?.images[0] ?? null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!visible) return
    supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setCategories((data as Category[] | null) ?? []))
  }, [visible])

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Grant photo access to upload product images.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      aspect: [1, 1],
      allowsEditing: true,
    })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]

    setUploading(true)
    try {
      // Fetch the local file into a Blob — React Native's fetch supports file:// URIs.
      const response = await fetch(asset.uri)
      const blob = await response.blob()
      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${vendor.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: blob.type || `image/${ext}`,
        upsert: false,
      })
      if (error) {
        Alert.alert('Upload failed', error.message)
        return
      }
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
      setImageUri(pub.publicUrl)
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (!nameEn.trim() || !categoryId || !mrp || !selling || !stock || !unit.trim()) {
      Alert.alert('Fill required fields', 'Name, category, pricing, stock and unit are required.')
      return
    }
    const payload = {
      vendor_id: vendor.id,
      category_id: categoryId,
      name_en: nameEn.trim(),
      name_te: nameTe.trim(),
      description_en: description.trim() || null,
      description_te: null,
      price_mrp: Number(mrp),
      price_selling: Number(selling),
      stock_qty: Number(stock),
      unit: unit.trim(),
      images: imageUri ? [imageUri] : [],
      is_available: true,
      is_deleted: false,
    }
    setSaving(true)
    const { error } = product
      ? await supabase.from('products').update(payload).eq('id', product.id)
      : await supabase.from('products').insert(payload)
    setSaving(false)
    if (error) {
      Alert.alert('Could not save product', error.message)
      return
    }
    onSaved()
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        <View className="px-4 py-3 border-b border-gray-100 flex-row items-center">
          <Pressable onPress={onClose} className="mr-3">
            <X size={22} color="#111827" />
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900 flex-1">
            {product ? 'Edit product' : 'Add product'}
          </Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
          {/* Image */}
          <Pressable
            onPress={uploading ? undefined : pickImage}
            className="h-48 rounded-2xl bg-gray-100 items-center justify-center mb-5 overflow-hidden"
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : uploading ? (
              <ActivityIndicator color="#1A56DB" />
            ) : (
              <View className="items-center">
                <Camera size={28} color="#6B7280" />
                <Text className="mt-2 text-sm text-gray-600">Tap to add photo</Text>
              </View>
            )}
          </Pressable>

          <Field label="Name (English)" value={nameEn} onChangeText={setNameEn} />
          <Field label="Name (Telugu)" value={nameTe} onChangeText={setNameTe} />

          <Text className="text-xs font-semibold text-gray-700 mt-4 mb-1">Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0">
            {categories.map((c) => {
              const selected = c.id === categoryId
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategoryId(c.id)}
                  className={`mr-2 px-4 py-2 rounded-full border ${selected ? 'bg-brand border-brand' : 'border-gray-300 bg-white'}`}
                >
                  <Text className={selected ? 'text-white font-semibold' : 'text-gray-700'}>
                    {c.name_en}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <View className="flex-row gap-3 mt-4">
            <View className="flex-1">
              <Field label="MRP" value={mrp} onChangeText={setMrp} keyboardType="number-pad" />
            </View>
            <View className="flex-1">
              <Field label="Selling price" value={selling} onChangeText={setSelling} keyboardType="number-pad" />
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Stock" value={stock} onChangeText={setStock} keyboardType="number-pad" />
            </View>
            <View className="flex-1">
              <Field label="Unit (kg, L, ea)" value={unit} onChangeText={setUnit} />
            </View>
          </View>

          <Text className="text-xs font-semibold text-gray-700 mt-4 mb-1">Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Describe the product"
            className="border border-gray-300 rounded-xl p-3 text-sm text-gray-900 min-h-[80px]"
          />
        </ScrollView>
        <View className="absolute left-0 right-0 bottom-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6">
          <Button size="lg" loading={saving} onPress={save}>
            {product ? 'Save changes' : 'Add product'}
          </Button>
        </View>
      </View>
    </Modal>
  )
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string
  value: string
  onChangeText: (t: string) => void
  keyboardType?: 'default' | 'number-pad'
}) {
  return (
    <View className="mt-4">
      <Text className="text-xs font-semibold text-gray-700 mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        className="border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900"
      />
    </View>
  )
}
