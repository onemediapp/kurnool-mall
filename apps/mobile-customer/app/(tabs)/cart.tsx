import { FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { ShoppingCart } from 'lucide-react-native'
import { formatPrice, calculateDeliveryFee } from '@kurnool-mall/shared-utils'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { QuantityStepper } from '@/components/QuantityStepper'

export default function CartTab() {
  const items = useCart((s) => s.items)
  const updateQuantity = useCart((s) => s.updateQuantity)
  const removeItem = useCart((s) => s.removeItem)
  const clearCart = useCart((s) => s.clearCart)
  const subtotal = useCart((s) => s.totalPrice())
  const delivery = calculateDeliveryFee(subtotal)
  const total = subtotal + delivery
  const FREE_THRESHOLD = 499

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="bg-white px-4 py-3 border-b border-gray-100">
          <Text className="text-lg font-semibold text-gray-900">Cart</Text>
        </View>
        <EmptyState
          Icon={ShoppingCart}
          title="Your cart is empty"
          description="Add items from the Home or Search tab."
          actionLabel="Browse products"
          onAction={() => router.push('/(tabs)')}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-gray-900">Cart ({items.length})</Text>
        <Pressable onPress={clearCart}>
          <Text className="text-sm text-red-600">Clear all</Text>
        </Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.product_id}
        contentContainerStyle={{ padding: 12, paddingBottom: 180 }}
        renderItem={({ item }) => (
          <View className="flex-row bg-white rounded-2xl p-3 mb-2 shadow-sm">
            <View className="w-20 h-20 rounded-xl bg-gray-100 items-center justify-center overflow-hidden">
              {item.image ? (
                <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
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
                <Text className="text-base font-semibold text-gray-900">
                  {formatPrice(item.price_selling * item.quantity)}
                </Text>
                <QuantityStepper
                  value={item.quantity}
                  max={item.max_qty}
                  onChange={(n) => (n === 0 ? removeItem(item.product_id) : updateQuantity(item.product_id, n))}
                />
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View className="bg-white rounded-2xl p-4 mt-2 shadow-sm">
            {subtotal < FREE_THRESHOLD ? (
              <View className="mb-3 bg-brand-light rounded-lg p-2">
                <Text className="text-xs text-brand-dark">
                  Add {formatPrice(FREE_THRESHOLD - subtotal)} more for free delivery
                </Text>
              </View>
            ) : null}
            <Row label="Items subtotal" value={formatPrice(subtotal)} />
            <Row label="Delivery" value={delivery === 0 ? 'FREE' : formatPrice(delivery)} />
            <View className="h-px bg-gray-200 my-2" />
            <Row label="Grand total" value={formatPrice(total)} bold />
          </View>
        }
      />
      <View className="absolute left-0 right-0 bottom-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6">
        <Button size="lg" onPress={() => router.push('/checkout')}>
          {`Proceed to Checkout · ${formatPrice(total)}`}
        </Button>
      </View>
    </SafeAreaView>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className={bold ? 'text-base font-semibold text-gray-900' : 'text-sm text-gray-600'}>
        {label}
      </Text>
      <Text className={bold ? 'text-base font-semibold text-gray-900' : 'text-sm text-gray-900'}>
        {value}
      </Text>
    </View>
  )
}
