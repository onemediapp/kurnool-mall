import { Alert, Pressable, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Plus } from 'lucide-react-native'
import { router } from 'expo-router'
import type { Product } from '@kurnool-mall/shared-types'
import { formatPrice, discountPercent } from '@kurnool-mall/shared-utils'
import { useCart } from '@/hooks/useCart'
import { QuantityStepper } from './QuantityStepper'

interface Props {
  product: Product & { vendor_id: string }
}

export function ProductCard({ product }: Props) {
  const items = useCart((s) => s.items)
  const addItem = useCart((s) => s.addItem)
  const updateQuantity = useCart((s) => s.updateQuantity)
  const clearCart = useCart((s) => s.clearCart)

  const inCart = items.find((i) => i.product_id === product.id)
  const qty = inCart?.quantity ?? 0
  const outOfStock = product.stock_qty <= 0
  const discount = discountPercent(product.price_mrp, product.price_selling)

  function handleAdd() {
    const result = addItem({
      product_id: product.id,
      vendor_id: product.vendor_id,
      name_en: product.name_en,
      name_te: product.name_te,
      image: product.images[0] ?? null,
      price_selling: product.price_selling,
      unit: product.unit,
      quantity: 1,
      max_qty: Math.max(1, Math.min(product.stock_qty, 10)),
    })
    if (!result.success) {
      Alert.alert('Cart has another shop', result.message ?? '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear cart', style: 'destructive', onPress: clearCart },
      ])
    }
  }

  return (
    <Pressable
      onPress={() => router.push(`/products/${product.id}`)}
      className="flex-1 bg-white rounded-2xl p-3 shadow-sm"
    >
      <View className="aspect-square rounded-xl bg-gray-100 items-center justify-center overflow-hidden">
        {product.images[0] ? (
          <Image source={{ uri: product.images[0] }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <Text className="text-3xl">📦</Text>
        )}
        {discount > 0 ? (
          <View className="absolute top-1 left-1 bg-accent px-2 py-0.5 rounded-md">
            <Text className="text-[10px] font-bold text-white">{discount}% OFF</Text>
          </View>
        ) : null}
        {outOfStock ? (
          <View className="absolute inset-0 bg-white/80 items-center justify-center">
            <Text className="text-xs font-semibold text-gray-700">Out of stock</Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={2} className="mt-2 text-sm font-medium text-gray-900">
        {product.name_en}
      </Text>
      <Text className="text-xs text-gray-500">{product.unit}</Text>
      <View className="mt-1 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-gray-900">
          {formatPrice(product.price_selling)}
        </Text>
        {outOfStock ? null : qty === 0 ? (
          <Pressable
            onPress={handleAdd}
            className="h-9 w-9 items-center justify-center rounded-lg bg-brand"
          >
            <Plus size={18} color="#fff" />
          </Pressable>
        ) : (
          <QuantityStepper
            value={qty}
            max={Math.min(product.stock_qty, 10)}
            onChange={(next) => updateQuantity(product.id, next)}
          />
        )}
      </View>
    </Pressable>
  )
}
