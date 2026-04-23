import { Pressable, Text, View } from 'react-native'
import { Minus, Plus } from 'lucide-react-native'

interface Props {
  value: number
  onChange: (next: number) => void
  min?: number
  max: number
}

export function QuantityStepper({ value, onChange, min = 0, max }: Props) {
  const decDisabled = value <= min
  const incDisabled = value >= max
  return (
    <View className="flex-row items-center">
      <Pressable
        onPress={decDisabled ? undefined : () => onChange(value - 1)}
        className={`h-9 w-9 rounded-lg items-center justify-center ${
          decDisabled ? 'bg-gray-200' : 'bg-brand'
        }`}
      >
        <Minus size={16} color={decDisabled ? '#9CA3AF' : '#fff'} />
      </Pressable>
      <Text className="w-10 text-center text-base font-semibold">{value}</Text>
      <Pressable
        onPress={incDisabled ? undefined : () => onChange(value + 1)}
        className={`h-9 w-9 rounded-lg items-center justify-center ${
          incDisabled ? 'bg-gray-200' : 'bg-brand'
        }`}
      >
        <Plus size={16} color={incDisabled ? '#9CA3AF' : '#fff'} />
      </Pressable>
    </View>
  )
}
