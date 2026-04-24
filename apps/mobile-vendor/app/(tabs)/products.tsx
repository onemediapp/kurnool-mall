import { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, Pressable, Switch, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { Redirect } from 'expo-router'
import { Package, Plus } from 'lucide-react-native'
import type { Product } from '@kurnool-mall/shared-types'
import { formatPrice } from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { useVendor } from '@/hooks/useVendor'
import { Spinner } from '@/components/Spinner'
import { EmptyState } from '@/components/EmptyState'
import { ProductFormModal } from '@/components/ProductFormModal'

export default function ProductsTab() {
  const { vendor, loading } = useVendor()
  const [products, setProducts] = useState<Product[]>([])
  const [fetching, setFetching] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)

  const load = useCallback(async () => {
    if (!vendor) return
    setFetching(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', vendor.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
    setProducts((data as Product[] | null) ?? [])
    setFetching(false)
  }, [vendor])

  useEffect(() => {
    if (vendor) load()
  }, [vendor, load])

  async function toggleAvailability(p: Product, next: boolean) {
    // Optimistic update, rollback on error.
    setProducts((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, is_available: next } : x))
    )
    const { error } = await supabase
      .from('products')
      .update({ is_available: next })
      .eq('id', p.id)
    if (error) {
      Alert.alert('Update failed', error.message)
      setProducts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, is_available: !next } : x))
      )
    }
  }

  if (loading) return <Spinner />
  if (!vendor) return <Redirect href="/register" />

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-gray-900">Products ({products.length})</Text>
        <Pressable
          onPress={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="bg-brand rounded-full w-10 h-10 items-center justify-center"
        >
          <Plus size={22} color="#fff" />
        </Pressable>
      </View>
      {fetching ? (
        <Spinner />
      ) : products.length === 0 ? (
        <EmptyState
          Icon={Package}
          title="No products listed"
          description="Add your first product to start selling."
          actionLabel="Add product"
          onAction={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setEditing(item)
                setModalOpen(true)
              }}
              className="flex-row bg-white rounded-2xl p-3 mb-2 shadow-sm"
            >
              <View className="w-20 h-20 rounded-xl bg-gray-100 items-center justify-center overflow-hidden">
                {item.images[0] ? (
                  <Image source={{ uri: item.images[0] }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <Text className="text-3xl">📦</Text>
                )}
              </View>
              <View className="flex-1 ml-3">
                <Text numberOfLines={2} className="text-sm font-medium text-gray-900">
                  {item.name_en}
                </Text>
                <Text className="text-xs text-gray-500">{item.unit}</Text>
                <View className="flex-row items-center justify-between mt-2">
                  <View>
                    <Text className="text-base font-semibold text-gray-900">
                      {formatPrice(item.price_selling)}
                    </Text>
                    <Text className="text-[10px] text-gray-400">Stock: {item.stock_qty}</Text>
                  </View>
                  <Switch
                    value={item.is_available}
                    onValueChange={(v) => toggleAvailability(item, v)}
                    thumbColor={item.is_available ? '#1A56DB' : '#9CA3AF'}
                    trackColor={{ true: '#DBEAFE', false: '#E5E7EB' }}
                  />
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
      <ProductFormModal
        visible={modalOpen}
        vendor={vendor}
        product={editing ?? undefined}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </SafeAreaView>
  )
}
