import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import type { Provider } from '../data/mock'
import { CATEGORIES } from '../data/mock'
import { BookmarkIcon, StarIcon } from './icons'

const PALETTE = ['#7210FF', '#00B894', '#0984E3', '#E17055', '#FDCB6E', '#A29BFE', '#FF6B35']
function colorFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export default function ProviderCard({
  provider,
  saved: savedProp,
  onToggleSave,
}: {
  provider: Provider
  saved?: boolean
  onToggleSave?: () => void
}) {
  const [savedState, setSavedState] = useState(false)
  const saved = savedProp ?? savedState
  const category = CATEGORIES.find((c) => c.id === provider.categoryId)

  return (
    <Pressable
      onPress={() => router.push(`/service/${provider.id}` as any)}
      className="relative w-full flex-row items-center gap-4 rounded-2xl border border-hairline p-3"
    >
      <View className="items-center justify-center size-20 rounded-2xl shrink-0" style={{ backgroundColor: colorFor(provider.id) }}>
        <Text style={{ fontSize: 28 }}>{category?.emoji}</Text>
      </View>
      <View className="flex-1 pr-6">
        <Text numberOfLines={1} className="text-[12px] text-muted">
          {provider.name}
        </Text>
        <Text numberOfLines={1} className="font-bold text-ink mt-0.5">
          {provider.title}
        </Text>
        <Text className="font-bold text-primary mt-0.5">${provider.price}</Text>
        <View className="flex-row items-center gap-1 mt-1">
          <StarIcon size={14} />
          <Text className="text-[13px] text-ink font-semibold">{provider.rating}</Text>
          <Text className="text-[13px] text-muted">| {provider.reviews.toLocaleString()} reviews</Text>
        </View>
      </View>
      <Pressable
        onPress={() => (onToggleSave ? onToggleSave() : setSavedState((s) => !s))}
        hitSlop={8}
        className="absolute top-3 right-3"
      >
        <BookmarkIcon size={20} color="#7210FF" filled={saved} />
      </Pressable>
    </Pressable>
  )
}
