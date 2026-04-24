import { ActivityIndicator, View } from 'react-native'

export function Spinner({ full = true }: { full?: boolean }) {
  if (!full) return <ActivityIndicator color="#1A56DB" />
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#1A56DB" />
    </View>
  )
}
