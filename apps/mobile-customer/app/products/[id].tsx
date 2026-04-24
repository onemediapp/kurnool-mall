import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Star } from 'lucide-react-native'
import type { Product, Vendor, Category } from '@kurnool-mall/shared-types'
import { formatPrice, discountPercent } from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/Button'
import { Spinner } from '@/components/Spinner'
import { QuantityStepper } from '@/components/QuantityStepper'

type Row = Product & {
  vendor_id: string
  vendor: Vendor | null
  category: Category | null
}

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [product, setProduct] = useState<Row | null>(null)
  const [loading, setLoading] = useState(true)

  const items = useCart((s) => s.items)
  const addItem = useCart((s) => s.addItem)
  const updateQuantity = useCart((s) => s.updateQuantity)
  const clearCart = useCart((s) => s.clearCart)
  const qty = items.find((i) => i.product_id === id)?.quantity ?? 0

  useEffect(() => {
    if (!id) return
    supabase
      .from('products')
      .select('*, vendor:vendors(*), category:categories(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setProduct((data as Row | null) ?? null)
        setLoading(false)
      })
  }, [id])

  if (loading) return <Spinner />
  if (!product) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text>Product not found</Text>
      </SafeAreaView>
    )
  }

  const outOfStock = product.stock_qty <= 0
  const discount = discountPercent(product.price_mrp, product.price_selling)
  const maxQty = Math.max(1, Math.min(product.stock_qty, 10))

  function handleAdd() {
    if (!product) return
    const result = addItem({
      product_id: product.id,
      vendor_id: product.vendor_id,
      name_en: product.name_en,
      name_te: product.name_te,
      image: product.images[0] ?? null,
      price_selling: product.price_selling,
      unit: product.unit,
      quantity: 1,
      max_qty: maxQty,
    })
    if (!result.success) {
      Alert.alert('Cart has another shop', result.message ?? '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear cart', style: 'destructive', onPress: clearCart },
      ])
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View className="relative">
          {product.images[0] ? (
            <Image source={{ uri: product.images[0] }} style={{ aspectRatio: 1, width: '100%' }} contentFit="cover" />
          ) : (
            <View className="aspect-square bg-gray-100 items-center justify-center">
              <Text className="text-6xl">📦</Text>
            </View>
          )}
          <Pressable
            onPress={() => router.back()}
            className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow"
          >
            <ArrowLeft size={20} color="#111827" />
          </Pressable>
          {discount > 0 ? (
            <View className="absolute top-3 right-3 bg-accent px-3 py-1 rounded-full">
              <Text className="text-xs font-bold text-white">{discount}% OFF</Text>
            </View>
          ) : null}
        </View>

        <View className="px-4 pt-4">
          {product.category ? (
            <Text className="text-xs text-brand">{product.category.name_en}</Text>
          ) : null}
          <Text className="text-xl font-bold text-gray-900 mt-1">{product.name_en}</Text>
          {product.name_te ? (
            <Text className="text-sm text-gray-600 font-telugu">{product.name_te}</Text>
          ) : null}
          <Text className="text-xs text-gray-500 mt-1">{product.unit}</Text>

          <View className="flex-row items-baseline mt-3">
            <Text className="text-2xl font-bold text-gray-900">{formatPrice(product.price_selling)}</Text>
            {product.price_mrp > product.price_selling ? (
              <Text className="ml-2 text-sm text-gray-400 line-through">
                {formatPrice(product.price_mrp)}
              </Text>
            ) : null}
          </View>

          <Text className={`mt-2 text-xs font-semibold ${outOfStock ? 'text-red-600' : product.stock_qty < 5 ? 'text-orange-600' : 'text-green-700'}`}>
            {outOfStock ? 'Out of Stock' : product.stock_qty < 5 ? `Only ${product.stock_qty} left` : 'In Stock'}
          </Text>

          {product.vendor ? (
            <View className="bg-gray-50 rounded-2xl p-4 mt-4">
              <Text className="text-sm font-semibold text-gray-900">{product.vendor.shop_name}</Text>
              <View className="flex-row items-center mt-1">
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text className="ml-1 text-xs text-gray-700">{product.vendor.rating.toFixed(1)}</Text>
                <Text className="ml-2 text-xs text-gray-500" numberOfLines={1}>
                  {product.vendor.address_line}
                </Text>
              </View>
            </View>
          ) : null}

          {product.description_en ? (
            <View className="mt-4">
              <Text className="text-sm font-semibold text-gray-900 mb-1">About this product</Text>
              <Text className="text-sm text-gray-700 leading-5">{product.description_en}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View className="absolute left-0 right-0 bottom-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6">
        {outOfStock ? (
          <Button disabled>Out of Stock</Button>
        ) : qty === 0 ? (
          <Button size="lg" onPress={handleAdd}>Add to Cart</Button>
        ) : (
          <View className="flex-row items-center gap-3">
            <QuantityStepper value={qty} max={maxQty} onChange={(n) => updateQuantity(product.id, n)} />
            <View className="flex-1">
              <Button size="lg" onPress={() => router.push('/(tabs)/cart')}>Go to Cart</Button>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}
