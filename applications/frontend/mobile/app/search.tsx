import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Sheet from '../components/Sheet'
import Button from '../components/Button'
import { ArrowLeftIcon, FilterIcon, SearchIcon } from '../components/icons'
import { bookingApi, type CatalogCategory, type CatalogServiceResult } from '../lib/api-client'
import { colorForSeed, emojiForCategory } from '../lib/category-visuals'

export default function Search() {
  const { t } = useTranslation('misc')
  const [query, setQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [category, setCategory] = useState<string | null>(null)
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [results, setResults] = useState<CatalogServiceResult[] | null>(null)

  useEffect(() => {
    bookingApi.catalogCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults(null)
      return
    }
    const t = setTimeout(() => {
      bookingApi.catalogSearch(query.trim()).then((r) => setResults(r.results)).catch(() => setResults([]))
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const filtered = useMemo(() => {
    if (!results) return null
    if (!category) return results
    const cat = categories.find((c) => c.category_id === category)
    return cat ? results.filter((r) => r.category_code === cat.code) : results
  }, [results, category, categories])

  const categoryIdFor = (code: string) => categories.find((c) => c.code === code)?.category_id ?? ''

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center gap-3 px-6 pt-3 pb-2 shrink-0">
        <Pressable onPress={() => router.replace('/(tabs)/home')} className="items-center justify-center size-7">
          <ArrowLeftIcon color="#0B111F" />
        </Pressable>
        <View className="flex-1 flex-row items-center gap-3 rounded-2xl bg-[#f5f5f5] px-4 py-3">
          <SearchIcon size={20} color="#6C7585" />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.placeholder')}
            placeholderTextColor="#9e9e9e"
            className="flex-1 text-[15px] text-ink"
          />
        </View>
        <Pressable onPress={() => setFilterOpen(true)} className="items-center justify-center size-11 rounded-2xl bg-[#f5f5f5] shrink-0">
          <FilterIcon size={20} color="#0B111F" />
        </Pressable>
      </View>

      {filtered === null ? (
        <View className="px-6 mt-4">
          <Text className="text-[13px] text-muted">{t('search.hint')}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <SearchIcon size={64} color="#e0e0e0" />
          <Text className="text-[16px] font-semibold text-ink mt-4">{t('search.noResultsTitle')}</Text>
          <Text className="text-[14px] text-muted mt-1 text-center">{t('search.noResultsSubtitle')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="flex-col gap-3 px-6 mt-4">
            <Text className="text-[13px] text-muted">
              {t('search.resultsFor', { count: filtered.length, query })}
            </Text>
            {filtered.map((r) => (
              <Pressable
                key={r.service_id}
                onPress={() => router.push(`/services/${categoryIdFor(r.category_code)}` as any)}
                className="w-full flex-row items-center gap-4 rounded-2xl border border-hairline p-3"
              >
                <View className="items-center justify-center size-14 rounded-2xl shrink-0" style={{ backgroundColor: `${colorForSeed(r.service_id)}14` }}>
                  <Text style={{ fontSize: 24 }}>{emojiForCategory(r.icon)}</Text>
                </View>
                <View className="flex-1">
                  <Text numberOfLines={1} className="font-bold text-ink">{r.name}</Text>
                  <Text numberOfLines={1} className="text-[13px] text-muted mt-0.5">{r.description}</Text>
                  <Text className="text-[12px] font-semibold text-primary mt-1">{r.category_name}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)}>
        <View className="w-10 h-1 bg-hairline rounded-full self-center mb-6" />
        <Text className="text-[18px] font-bold text-ink mb-4">{t('search.filtersTitle')}</Text>

        <Text className="text-[14px] font-semibold text-ink mb-2">{t('search.category')}</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          <Pressable onPress={() => setCategory(null)} className={`px-4 py-2 rounded-full ${!category ? 'bg-primary' : 'bg-[#f5f5f5]'}`}>
            <Text className={`text-[13px] ${!category ? 'text-white' : 'text-ink'}`}>{t('search.all')}</Text>
          </Pressable>
          {categories.map((c) => (
            <Pressable
              key={c.category_id}
              onPress={() => setCategory(c.category_id)}
              className={`px-4 py-2 rounded-full ${category === c.category_id ? 'bg-primary' : 'bg-[#f5f5f5]'}`}
            >
              <Text className={`text-[13px] ${category === c.category_id ? 'text-white' : 'text-ink'}`}>
                {emojiForCategory(c.icon)} {c.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button onPress={() => setFilterOpen(false)}>{t('search.applyFilters')}</Button>
      </Sheet>
    </SafeAreaView>
  )
}
