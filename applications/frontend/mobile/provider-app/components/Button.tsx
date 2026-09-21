import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, Text } from 'react-native'

type Props = {
  children: ReactNode
  onPress?: () => void
  variant?: 'primary' | 'outline'
  disabled?: boolean
  loading?: boolean
  className?: string
}

export default function Button({ children, onPress, variant = 'primary', disabled, loading, className = '' }: Props) {
  const isDisabled = disabled || loading
  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      className={`w-full rounded-full py-[18px] px-4 items-center justify-center ${
        variant === 'primary' ? 'bg-primary' : 'bg-white border border-hairline'
      } ${isDisabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#7210FF'} />
      ) : typeof children === 'string' ? (
        <Text
          className={`text-[16px] tracking-[0.2px] ${variant === 'primary' ? 'text-white font-bold' : 'text-ink font-bold'}`}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  )
}
