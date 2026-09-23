import { Pressable, Text, View } from 'react-native'

import type { SystemMessage } from '../lib/api-client'

export default function SystemMessageCard({ message, onAction }: { message: SystemMessage; onAction?: () => void }) {
  const symbol = message.type === 'success' ? '✓' : message.type === 'warning' ? '!' : message.type === 'info' ? 'i' : '×'
  return (
    <View accessibilityRole="alert" className="w-full items-center rounded-[28px] border border-gray-100 bg-white px-6 py-7 shadow-sm">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-blue-50"><Text className="text-2xl font-bold text-primary">{symbol}</Text></View>
      <Text className="mt-4 text-center text-lg font-bold text-ink">{message.title}</Text>
      <Text className="mt-1 text-center text-sm leading-5 text-muted">{message.body}</Text>
      {message.action && onAction ? <Pressable onPress={onAction} className="mt-5 min-w-36 rounded-full bg-primary px-6 py-3"><Text className="text-center text-sm font-semibold text-white">{message.action.label}</Text></Pressable> : null}
    </View>
  )
}
