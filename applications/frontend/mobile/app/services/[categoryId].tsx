import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import ProviderCard from '../../components/ProviderCard'
import { SearchIcon } from '../../components/icons'
import { bookingApi, type CatalogCategory, type ProviderListing } from '../../lib/api-client'
import { emojiForCategory } from '../../lib/category-visuals'

export default function CategoryList() {
  const { t } = useTranslation('services')
  const { categoryId = '' } = useLocalSearchParams<{ categoryId: string }>()
  const [category, setCategory] = useState<CatalogCategory | null>(null)
  const [providers, setProviders] = useState<ProviderListing[] | null>(null)

  useEffect(() => {
    bookingApi.catalogCategories().then((cats) => setCategory(cats.find((c) => c.category_id === categoryId) ?? null))
    bookingApi.listProvidersByCategory(categoryId).then(setProviders).catch(() => setProviders([]))
  }, [categoryId])

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader
        title={category ? category.name : t('category.titleFallback')}
        back="/services"
        right={
          <Pressable onPress={() => router.push('/search')} className="items-center justify-center size-9 rounded-full bg-[#f5f5f5]">
            <SearchIcon size={16} color="#0B111F" />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-col gap-3 px-6 pt-2 mt-2">
          {providers === null ? (
            <View className="h-24 rounded-2xl bg-[#f5f5f5]" />
          ) : (
            <>
              {providers.map((p) => (
                <ProviderCard key={p.provider_id} provider={p} emoji={emojiForCategory(category?.icon)} />
              ))}
              {providers.length === 0 && <Text className="text-center text-muted mt-10">{t('category.noProviders')}</Text>}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
