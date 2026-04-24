import { Text, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { Button } from './Button'

interface Props {
  Icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ Icon, title, description, actionLabel, onAction }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <Icon size={64} color="#9CA3AF" />
      <Text className="mt-4 text-lg font-semibold text-gray-900 text-center">{title}</Text>
      {description ? (
        <Text className="mt-2 text-sm text-gray-500 text-center">{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View className="mt-6 w-full max-w-xs">
          <Button onPress={onAction}>{actionLabel}</Button>
        </View>
      ) : null}
    </View>
  )
}
