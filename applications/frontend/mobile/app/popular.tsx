import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import ProviderCard from '../components/ProviderCard'
import { bookingApi, type ProviderListing } from '../lib/api-client'
import { emojiForCategory } from '../lib/category-visuals'

export default function PopularServices() {
  const [popular, setPopular] = useState<{ provider: ProviderListing; categoryIcon: string }[] | null>(null)

  useEffect(() => {
    let cancelled = false
    bookingApi.catalogCategories().then((cats) => {
      // No single "all providers" endpoint exists — merge real providers
      // fetched per real category, same approach as the home screen.
      Promise.all(
        cats.map((c) =>
          bookingApi
            .listProvidersByCategory(c.category_id)
            .then((rows) => rows.map((provider) => ({ provider, categoryIcon: c.icon })))
            .catch(() => []),
        ),
      ).then((groups) => {
        if (cancelled) return
        // A provider can offer services in more than one category, so the
        // same provider_id may come back from multiple fetches — dedupe
        // before rendering (duplicate keys would otherwise break the list).
        const seen = new Set<string>()
        const merged = groups
          .flat()
          .filter(({ provider }) => (seen.has(provider.provider_id) ? false : (seen.add(provider.provider_id), true)))
          .sort((a, b) => b.provider.rating_avg - a.provider.rating_avg)
        setPopular(merged)
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Most Popular" back="/(tabs)/home" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-col gap-3 px-6 mt-2">
          {popular === null ? (
            <View className="h-24 rounded-2xl bg-[#f5f5f5]" />
          ) : popular.length === 0 ? (
            <Text className="text-center text-muted mt-10">No providers available yet.</Text>
          ) : (
            popular.map(({ provider, categoryIcon }) => (
              <ProviderCard key={provider.provider_id} provider={provider} emoji={emojiForCategory(categoryIcon)} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
