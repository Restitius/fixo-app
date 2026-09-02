import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import { SearchIcon } from '../../components/icons'
import { bookingApi, type CatalogCategory } from '../../lib/api-client'
import { colorForSeed, emojiForCategory } from '../../lib/category-visuals'

export default function AllServices() {
  const [categories, setCategories] = useState<CatalogCategory[] | null>(null)

  useEffect(() => {
    bookingApi.catalogCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader
        title="All Services"
        back="/(tabs)/home"
        right={
          <Pressable onPress={() => router.push('/search')} className="items-center justify-center size-9 rounded-full bg-[#f5f5f5]">
            <SearchIcon size={16} color="#0B111F" />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-row flex-wrap px-6 pt-4" style={{ rowGap: 24 }}>
          {(categories ?? []).map((c) => (
            <Pressable key={c.category_id} onPress={() => router.push(`/services/${c.category_id}` as any)} className="items-center gap-2" style={{ width: '25%' }}>
              <View className="items-center justify-center size-16 rounded-2xl" style={{ backgroundColor: `${colorForSeed(c.category_id)}14` }}>
                <Text style={{ fontSize: 24 }}>{emojiForCategory(c.icon)}</Text>
              </View>
              <Text numberOfLines={2} className="text-[11px] font-medium text-ink text-center leading-tight">{c.name}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
