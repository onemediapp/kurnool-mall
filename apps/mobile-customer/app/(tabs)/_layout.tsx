import { Tabs } from 'expo-router'
import { Home, Search, ShoppingCart, Package, User } from 'lucide-react-native'
import { View, Text } from 'react-native'
import { useCart } from '@/hooks/useCart'

function CartIcon({ color, size }: { color: string; size: number }) {
  const count = useCart((s) => s.totalItems())
  return (
    <View>
      <ShoppingCart color={color} size={size} />
      {count > 0 ? (
        <View className="absolute -right-2 -top-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 items-center justify-center">
          <Text className="text-[10px] font-bold text-white">{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1A56DB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 8 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => <CartIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
