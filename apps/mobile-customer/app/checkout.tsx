import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ArrowLeft, Banknote, Smartphone, CreditCard, MapPin, Plus } from 'lucide-react-native'
import type { Address, PaymentMethod } from '@kurnool-mall/shared-types'
import { formatPrice, calculateDeliveryFee } from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { Button } from '@/components/Button'
import { Spinner } from '@/components/Spinner'

// Razorpay is a native module that only links in development/production
// builds, NOT in Expo Go. We lazy-require so importing this screen doesn't
// crash the JS bundle in Expo Go while the user is still browsing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RazorpayCheckout: { open: (opts: any) => Promise<any> } | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  RazorpayCheckout = require('react-native-razorpay').default
} catch {
  RazorpayCheckout = null
}

export default function Checkout() {
  const { user } = useAuth()
  const items = useCart((s) => s.items)
  const vendor_id = useCart((s) => s.vendor_id)
  const clearCart = useCart((s) => s.clearCart)
  const subtotal = useCart((s) => s.totalPrice())
  const delivery = calculateDeliveryFee(subtotal)
  const total = subtotal + delivery

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [placing, setPlacing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login')
      return
    }
    supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .then(({ data }) => {
        const list = (data as Address[] | null) ?? []
        setAddresses(list)
        const def = list.find((a) => a.is_default) ?? list[0]
        if (def) setSelectedAddressId(def.id)
        setLoading(false)
      })
  }, [user])

  if (loading || !user) return <Spinner />
  if (items.length === 0) {
    router.replace('/(tabs)/cart')
    return null
  }

  async function placeOrder() {
    if (!selectedAddressId || !vendor_id) {
      Alert.alert('Select an address', 'Please pick a delivery address.')
      return
    }
    setPlacing(true)
    const { data, error } = await api.createOrder({
      vendor_id,
      items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      delivery_address_id: selectedAddressId,
      payment_method: paymentMethod,
      notes: '',
    })
    if (error || !data) {
      setPlacing(false)
      Alert.alert('Failed to place order', error?.message ?? 'Please try again.')
      return
    }

    if (paymentMethod === 'cod') {
      clearCart()
      setPlacing(false)
      router.replace(`/orders/${data.order.id}?success=true`)
      return
    }

    if (!RazorpayCheckout) {
      setPlacing(false)
      Alert.alert(
        'Development build required',
        'Online payments only work in EAS builds. Use Cash on Delivery in Expo Go.'
      )
      return
    }
    if (!data.razorpay_order_id || !data.razorpay_key_id) {
      setPlacing(false)
      Alert.alert('Payment unavailable', 'Razorpay order details missing. Try again.')
      return
    }
    try {
      const result = await RazorpayCheckout.open({
        key: data.razorpay_key_id,
        amount: data.order.grand_total * 100,
        currency: 'INR',
        order_id: data.razorpay_order_id,
        name: 'Kurnool Mall',
        prefill: { contact: user?.phone ?? '' },
        theme: { color: '#1A56DB' },
      })
      const verify = await api.verifyPayment({
        order_id: data.order.id,
        razorpay_order_id: result.razorpay_order_id,
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature: result.razorpay_signature,
      })
      if (verify.error) {
        Alert.alert('Payment verification failed', verify.error.message)
        return
      }
      clearCart()
      router.replace(`/orders/${data.order.id}?success=true`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Payment cancelled or failed.'
      Alert.alert('Payment failed', msg)
    } finally {
      setPlacing(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 180 }}>
        {/* Address */}
        <View className="bg-white rounded-2xl p-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-semibold text-gray-900">Delivery address</Text>
            <Pressable onPress={() => router.push('/account/addresses/new')} className="flex-row items-center">
              <Plus size={14} color="#1A56DB" />
              <Text className="ml-1 text-xs text-brand font-medium">Add new</Text>
            </Pressable>
          </View>
          {addresses.length === 0 ? (
            <Pressable
              onPress={() => router.push('/account/addresses/new')}
              className="border border-dashed border-gray-300 rounded-xl p-4 items-center"
            >
              <MapPin size={20} color="#6B7280" />
              <Text className="mt-2 text-sm text-gray-600">Add a delivery address</Text>
            </Pressable>
          ) : (
            addresses.map((a) => {
              const selected = a.id === selectedAddressId
              return (
                <Pressable
                  key={a.id}
                  onPress={() => setSelectedAddressId(a.id)}
                  className={`border rounded-xl p-3 mb-2 ${selected ? 'border-brand bg-brand-light' : 'border-gray-200'}`}
                >
                  <Text className="text-sm font-semibold text-gray-900">{a.label}</Text>
                  <Text className="text-xs text-gray-600 mt-0.5">{a.address_line}</Text>
                  <Text className="text-xs text-gray-600">
                    {a.city} — {a.pincode}
                  </Text>
                </Pressable>
              )
            })
          )}
        </View>

        {/* Payment */}
        <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
          <Text className="text-sm font-semibold text-gray-900 mb-3">Payment method</Text>
          <PaymentOption
            Icon={Banknote}
            label="Cash on Delivery"
            sublabel="Pay when delivered"
            value="cod"
            selected={paymentMethod === 'cod'}
            onSelect={setPaymentMethod}
          />
          <PaymentOption
            Icon={Smartphone}
            label="UPI"
            sublabel="GPay, PhonePe, Paytm"
            value="upi"
            selected={paymentMethod === 'upi'}
            onSelect={setPaymentMethod}
          />
          <PaymentOption
            Icon={CreditCard}
            label="Card"
            sublabel="Credit or debit card"
            value="card"
            selected={paymentMethod === 'card'}
            onSelect={setPaymentMethod}
          />
        </View>

        {/* Summary */}
        <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
          <Text className="text-sm font-semibold text-gray-900 mb-3">Order summary</Text>
          <SummaryRow label={`Items (${items.length})`} value={formatPrice(subtotal)} />
          <SummaryRow label="Delivery" value={delivery === 0 ? 'FREE' : formatPrice(delivery)} />
          <View className="h-px bg-gray-200 my-2" />
          <SummaryRow label="Grand total" value={formatPrice(total)} bold />
        </View>
      </ScrollView>

      <View className="absolute left-0 right-0 bottom-0 bg-white border-t border-gray-100 px-4 pt-3 pb-6">
        <Button size="lg" loading={placing} onPress={placeOrder}>
          {paymentMethod === 'cod' ? `Place Order · ${formatPrice(total)}` : `Pay & Place · ${formatPrice(total)}`}
        </Button>
      </View>
    </SafeAreaView>
  )
}

function PaymentOption({
  Icon,
  label,
  sublabel,
  value,
  selected,
  onSelect,
}: {
  Icon: typeof Banknote
  label: string
  sublabel: string
  value: PaymentMethod
  selected: boolean
  onSelect: (v: PaymentMethod) => void
}) {
  return (
    <Pressable
      onPress={() => onSelect(value)}
      className={`flex-row items-center border rounded-xl p-3 mb-2 ${selected ? 'border-brand bg-brand-light' : 'border-gray-200'}`}
    >
      <Icon size={20} color={selected ? '#1A56DB' : '#6B7280'} />
      <View className="ml-3 flex-1">
        <Text className={`text-sm font-semibold ${selected ? 'text-brand' : 'text-gray-900'}`}>{label}</Text>
        <Text className="text-xs text-gray-500">{sublabel}</Text>
      </View>
      <View
        className={`w-5 h-5 rounded-full border-2 ${selected ? 'border-brand' : 'border-gray-300'} items-center justify-center`}
      >
        {selected ? <View className="w-2.5 h-2.5 rounded-full bg-brand" /> : null}
      </View>
    </Pressable>
  )
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
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
