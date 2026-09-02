import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Button from '../../components/Button'
import { CATEGORIES, providerById, reviewsFor } from '../../data/mock'
import {
  ArrowLeftIcon,
  BookmarkIcon,
  CameraIcon,
  LocationIcon,
  MoreHorizontalIcon,
  StarIcon,
  ThumbsUpIcon,
} from '../../components/icons'

const PALETTE = ['#7210FF', '#00B894', '#0984E3', '#E17055', '#FDCB6E', '#A29BFE', '#FF6B35']
function colorFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

const STAR_FILTERS = ['All', 5, 4, 3, 2, 1] as const

export default function ServiceDetails() {
  const { providerId = '' } = useLocalSearchParams<{ providerId: string }>()
  const provider = providerById(providerId)
  const [saved, setSaved] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [bioExpanded, setBioExpanded] = useState(false)
  const [starFilter, setStarFilter] = useState<(typeof STAR_FILTERS)[number]>('All')

  if (!provider) return null
  const category = CATEGORIES.find((c) => c.id === provider.categoryId)
  const reviews = reviewsFor(provider.id).filter((r) => starFilter === 'All' || r.rating === starFilter)
  const heroColor = colorFor(provider.id)

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View className="relative h-[280px] items-center justify-center" style={{ backgroundColor: heroColor }}>
          <SafeAreaView edges={['top']} className="absolute top-0 left-0">
            <Pressable
              onPress={() => router.replace(`/services/${provider.categoryId}` as any)}
              className="mt-4 ml-5 items-center justify-center size-9 rounded-full bg-black/20"
            >
              <ArrowLeftIcon size={20} color="#fff" />
            </Pressable>
          </SafeAreaView>
          <Text style={{ fontSize: 96 }}>{category?.emoji}</Text>
          <View className="absolute bottom-4 flex-row items-center gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <Pressable key={i} onPress={() => setPhotoIndex(i)}>
                <View className={`h-1.5 rounded-full ${i === photoIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />
              </Pressable>
            ))}
          </View>
        </View>

        <View className="px-6 pt-5">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="text-[24px] font-bold text-ink flex-1">{provider.title}</Text>
            <Pressable
              onPress={() => setSaved((s) => !s)}
              className="items-center justify-center size-9 rounded-full bg-primary/8 shrink-0 mt-1"
            >
              <BookmarkIcon size={16} color="#7210FF" filled={saved} />
            </Pressable>
          </View>

          <View className="flex-row items-center gap-3 mt-1">
            <Text className="text-primary font-semibold text-[14px]">{provider.name}</Text>
            <View className="flex-row items-center gap-1">
              <StarIcon size={14} />
              <Text className="text-[13px] text-ink font-semibold">{provider.rating}</Text>
              <Text className="text-[13px] text-muted">({provider.reviews.toLocaleString()} reviews)</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3 mt-3 flex-wrap">
            <Text className="text-[12px] px-3 py-1 rounded-full bg-primary/8 text-primary font-medium">{category?.name}</Text>
            <View className="flex-row items-center gap-1">
              <LocationIcon size={14} color="#6C7585" />
              <Text className="text-[13px] text-muted">{provider.location}</Text>
            </View>
          </View>

          <Text className="mt-4">
            <Text className="text-[22px] font-bold text-primary">${provider.price}</Text>
            <Text className="text-[13px] text-muted"> (Floor price)</Text>
          </Text>

          <Text className="text-[16px] font-bold text-ink mt-6">About me</Text>
          <Text numberOfLines={bioExpanded ? undefined : 2} className="text-[14px] text-muted mt-2 leading-relaxed">
            {provider.bio}
          </Text>
          {!bioExpanded && (
            <Pressable onPress={() => setBioExpanded(true)}>
              <Text className="text-primary text-[13px] font-semibold mt-1">Read more...</Text>
            </Pressable>
          )}

          <View className="flex-row items-center justify-between mt-6">
            <Text className="text-[16px] font-bold text-ink">Photos & Videos</Text>
            <Text className="text-[13px] font-semibold text-primary">See All</Text>
          </View>
          <View className="flex-row flex-wrap gap-3 mt-3">
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                className="items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${heroColor}14`, width: '48%', aspectRatio: 1 }}
              >
                <CameraIcon size={24} color={heroColor} />
              </View>
            ))}
          </View>

          <View className="flex-row items-center justify-between mt-6">
            <Text className="text-[16px] font-bold text-ink">
              {provider.rating} ({provider.reviews.toLocaleString()} reviews)
            </Text>
            <Text className="text-[13px] font-semibold text-primary">See All</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
            {STAR_FILTERS.map((f) => (
              <Pressable
                key={f}
                onPress={() => setStarFilter(f)}
                className={`flex-row items-center gap-1 px-4 py-2 rounded-full ${starFilter === f ? 'bg-primary' : 'bg-[#f5f5f5]'}`}
              >
                {f === 'All' ? (
                  <Text className={`text-[13px] font-medium ${starFilter === f ? 'text-white' : 'text-ink'}`}>All</Text>
                ) : (
                  <>
                    <StarIcon size={14} filled={starFilter === f} />
                    <Text className={`text-[13px] font-medium ${starFilter === f ? 'text-white' : 'text-ink'}`}>{f}</Text>
                  </>
                )}
              </Pressable>
            ))}
          </ScrollView>

          <View className="flex-col gap-4 mt-2">
            {reviews.map((r, i) => (
              <View key={r.id} className={`pb-4 ${i === reviews.length - 1 ? '' : 'border-b border-hairline'}`}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View
                      className="items-center justify-center size-9 rounded-full shrink-0"
                      style={{ backgroundColor: colorFor(r.name) }}
                    >
                      <Text className="text-white text-[13px] font-bold">
                        {r.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </Text>
                    </View>
                    <Text className="font-semibold text-ink text-[14px]">{r.name}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="flex-row items-center gap-1 border border-primary/30 rounded-full px-2 py-0.5">
                      <StarIcon size={12} />
                      <Text className="text-[12px] font-semibold text-primary">{r.rating}</Text>
                    </View>
                    <MoreHorizontalIcon size={16} color="#6C7585" />
                  </View>
                </View>
                <Text className="text-[13px] text-ink mt-2 leading-relaxed">{r.text}</Text>
                <View className="flex-row items-center gap-4 mt-2">
                  <View className="flex-row items-center gap-1.5">
                    <ThumbsUpIcon size={14} color="#6C7585" />
                    <Text className="text-[12px] text-muted">{r.likes}</Text>
                  </View>
                  <Text className="text-[12px] text-muted">{r.time}</Text>
                </View>
              </View>
            ))}
            {reviews.length === 0 && <Text className="text-center text-muted text-[13px] py-4">No reviews at this rating yet.</Text>}
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="absolute bottom-0 inset-x-0 bg-white border-t border-hairline">
        <View className="px-6 py-4 flex-row items-center gap-3">
          <View className="flex-1">
            <Button variant="outline" onPress={() => router.push('/inbox/chat/c1' as any)}>
              Message
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={() => router.push(`/booking/${provider.id}` as any)}>Book Now</Button>
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}
