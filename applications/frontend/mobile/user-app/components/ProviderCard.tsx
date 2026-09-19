import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { favoritesApi } from '../lib/api-client'
import { fmtMoney } from '../lib/format'
import { colorForSeed } from '../lib/category-visuals'
import { BookmarkIcon, StarIcon } from './icons'

interface ProviderCardData {
  provider_id: string
  display_name: string
  headline?: string | null
  city?: string | null
  rating_avg: number
  rating_count: number
  base_amount?: number
}

export default function ProviderCard({
  provider,
  emoji = '🔧',
  saved: savedProp,
  onToggleSave,
}: {
  provider: ProviderCardData
  emoji?: string
  saved?: boolean
  onToggleSave?: () => void
}) {
  const [savedState, setSavedState] = useState(false)
  const saved = savedProp ?? savedState

  async function defaultToggle() {
    try {
      const result = await favoritesApi.toggle(provider.provider_id)
      setSavedState(result.is_favorite)
    } catch {
      // leave saved state unchanged on failure
    }
  }

  return (
    <Pressable
      onPress={() => router.push(`/service/${provider.provider_id}` as any)}
      className="relative w-full flex-row items-center gap-4 rounded-2xl border border-hairline p-3"
    >
      <View className="items-center justify-center size-20 rounded-2xl shrink-0" style={{ backgroundColor: colorForSeed(provider.provider_id) }}>
        <Text style={{ fontSize: 28 }}>{emoji}</Text>
      </View>
      <View className="flex-1 pr-6">
        <Text numberOfLines={1} className="text-[12px] text-muted">
          {provider.headline || provider.city || ''}
        </Text>
        <Text numberOfLines={1} className="font-bold text-ink mt-0.5">
          {provider.display_name}
        </Text>
        {provider.base_amount != null && <Text className="font-bold text-primary mt-0.5">{fmtMoney(provider.base_amount)}</Text>}
        <View className="flex-row items-center gap-1 mt-1">
          <StarIcon size={14} />
          <Text className="text-[13px] text-ink font-semibold">{provider.rating_avg.toFixed(1)}</Text>
          <Text className="text-[13px] text-muted">| {provider.rating_count.toLocaleString()} reviews</Text>
        </View>
      </View>
      <Pressable
        onPress={() => (onToggleSave ? onToggleSave() : void defaultToggle())}
        hitSlop={8}
        className="absolute top-3 right-3"
      >
        <BookmarkIcon size={20} color="#7210FF" filled={saved} />
      </Pressable>
    </Pressable>
  )
}
