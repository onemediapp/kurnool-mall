import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props {
  variant?: Variant
  size?: Size
  loading?: boolean
  disabled?: boolean
  onPress?: () => void
  children: ReactNode
}

const containerClasses: Record<Variant, string> = {
  primary: 'bg-brand',
  outline: 'border border-brand bg-white',
  ghost: 'bg-transparent',
  danger: 'bg-red-600',
}

const textClasses: Record<Variant, string> = {
  primary: 'text-white',
  outline: 'text-brand',
  ghost: 'text-brand',
  danger: 'text-white',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-4',
  md: 'h-12 px-6',
  lg: 'h-14 px-6',
}

const textSizeClasses: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-semibold',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  children,
}: Props) {
  const isDisabled = disabled || loading
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      className={[
        'rounded-xl items-center justify-center flex-row',
        containerClasses[variant],
        sizeClasses[size],
        isDisabled ? 'opacity-60' : '',
      ].join(' ')}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : '#1A56DB'} />
      ) : typeof children === 'string' ? (
        <Text className={`${textClasses[variant]} ${textSizeClasses[size]}`}>{children}</Text>
      ) : (
        <View className="flex-row items-center">{children}</View>
      )}
    </Pressable>
  )
}
