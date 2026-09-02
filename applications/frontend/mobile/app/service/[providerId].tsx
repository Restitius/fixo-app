import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Button from '../../components/Button'
import { bookingApi, favoritesApi, type ProviderProfile } from '../../lib/api-client'
import { fmtMoney } from '../../lib/format'
import { colorForSeed } from '../../lib/category-visuals'
import { ArrowLeftIcon, BookmarkIcon, LocationIcon, StarIcon } from '../../components/icons'

export default function ServiceDetails() {
  const { providerId = '' } = useLocalSearchParams<{ providerId: string }>()
  const [provider, setProvider] = useState<ProviderProfile | null>(null)
  const [saved, setSaved] = useState(false)
  const [bioExpanded, setBioExpanded] = useState(false)

  useEffect(() => {
    bookingApi.getProviderProfile(providerId).then(setProvider).catch(() => setProvider(null))
  }, [providerId])

  async function toggleSave() {
    try {
      const result = await favoritesApi.toggle(providerId)
      setSaved(result.is_favorite)
    } catch {
      // leave state unchanged on failure
    }
  }

  if (!provider) return null
  const heroColor = colorForSeed(provider.provider_id)

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View className="relative h-[220px] items-center justify-center" style={{ backgroundColor: heroColor }}>
          <SafeAreaView edges={['top']} className="absolute top-0 left-0">
            <Pressable onPress={() => router.back()} className="mt-4 ml-5 items-center justify-center size-9 rounded-full bg-black/20">
              <ArrowLeftIcon size={20} color="#fff" />
            </Pressable>
          </SafeAreaView>
          <Text style={{ fontSize: 96 }}>🔧</Text>
        </View>

        <View className="px-6 pt-5">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="text-[24px] font-bold text-ink flex-1">{provider.display_name}</Text>
            <Pressable onPress={toggleSave} className="items-center justify-center size-9 rounded-full bg-primary/8 shrink-0 mt-1">
              <BookmarkIcon size={16} color="#7210FF" filled={saved} />
            </Pressable>
          </View>

          <View className="flex-row items-center gap-3 mt-1 flex-wrap">
            {provider.headline && <Text className="text-primary font-semibold text-[14px]">{provider.headline}</Text>}
            <View className="flex-row items-center gap-1">
              <StarIcon size={14} />
              <Text className="text-[13px] text-ink font-semibold">{provider.rating_avg.toFixed(1)}</Text>
              <Text className="text-[13px] text-muted">({provider.rating_count.toLocaleString()} reviews)</Text>
            </View>
          </View>

          {provider.city && (
            <View className="flex-row items-center gap-1 mt-3">
              <LocationIcon size={14} color="#6C7585" />
              <Text className="text-[13px] text-muted">{provider.city}{provider.region ? `, ${provider.region}` : ''}</Text>
            </View>
          )}

          <View className="flex-row gap-3 mt-5">
            <View className="flex-1 items-center rounded-2xl bg-[#f5f5f5] py-3">
              <Text className="text-[11px] text-muted">Active Since</Text>
              <Text className="text-[15px] font-bold text-ink mt-0.5">{new Date(provider.created_at).getFullYear()}</Text>
            </View>
            <View className="flex-1 items-center rounded-2xl bg-[#f5f5f5] py-3">
              <Text className="text-[11px] text-muted">Jobs Done</Text>
              <Text className="text-[15px] font-bold text-ink mt-0.5">{provider.jobs_completed.toLocaleString()}</Text>
            </View>
            <View className="flex-1 items-center rounded-2xl bg-[#f5f5f5] py-3">
              <Text className="text-[11px] text-muted">Services</Text>
              <Text className="text-[15px] font-bold text-ink mt-0.5">{provider.services.length}</Text>
            </View>
          </View>

          {provider.bio && (
            <>
              <Text className="text-[16px] font-bold text-ink mt-6">About</Text>
              <Text numberOfLines={bioExpanded ? undefined : 2} className="text-[14px] text-muted mt-2 leading-relaxed">
                {provider.bio}
              </Text>
              {!bioExpanded && (
                <Pressable onPress={() => setBioExpanded(true)}>
                  <Text className="text-primary text-[13px] font-semibold mt-1">Read more...</Text>
                </Pressable>
              )}
            </>
          )}

          <Text className="text-[16px] font-bold text-ink mt-6">Services & Pricing</Text>
          <View className="flex-col gap-2 mt-3">
            {provider.services.length === 0 ? (
              <Text className="text-[13px] text-muted">No services listed yet.</Text>
            ) : (
              provider.services.map((s) => (
                <View key={s.service_id} className="flex-row items-center gap-3 rounded-2xl bg-[#f5f5f5] p-3">
                  <View className="items-center justify-center size-10 rounded-xl bg-primary/10">
                    <Text style={{ fontSize: 16 }}>🔧</Text>
                  </View>
                  <Text className="flex-1 text-[14px] font-medium text-ink">{s.name}</Text>
                  <Text className="font-bold text-primary">{fmtMoney(s.base_amount)}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} className="absolute bottom-0 inset-x-0 bg-white border-t border-hairline">
        <View className="px-6 py-4">
          <Button onPress={() => router.push(`/booking/${provider.provider_id}` as any)}>Book Now</Button>
        </View>
      </SafeAreaView>
    </View>
  )
}
