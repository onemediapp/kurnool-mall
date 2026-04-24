import { Text, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'

interface Props {
  Icon: LucideIcon
  label: string
  value: string
  tint?: string
}

export function StatCard({ Icon, label, value, tint = '#1A56DB' }: Props) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 m-1 shadow-sm">
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: tint + '22' }}
      >
        <Icon size={20} color={tint} />
      </View>
      <Text className="mt-3 text-2xl font-bold text-gray-900">{value}</Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </View>
  )
}
