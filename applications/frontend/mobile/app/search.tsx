import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Sheet from '../components/Sheet'
import Button from '../components/Button'
import ProviderCard from '../components/ProviderCard'
import { ArrowLeftIcon, FilterIcon, SearchIcon, StarIcon } from '../components/icons'
import { CATEGORIES, PROVIDERS } from '../data/mock'

const RECENT = ['House cleaning', 'Plumber near me', 'Car repair', 'Laundry service']

export default function Search() {
  const [query, setQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [category, setCategory] = useState<string | null>(null)

  const results = useMemo(() => {
    if (!query.trim()) return null
    const q = query.toLowerCase()
    return PROVIDERS.filter((p) => {
      const matchesQuery =
        p.name.toLowerCase().includes(q) ||
        p.categoryId.includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      const matchesRating = p.rating >= minRating
      const matchesCategory = !category || p.categoryId === category
      return matchesQuery && matchesRating && matchesCategory
    })
  }, [query, minRating, category])

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
            placeholder="Search services..."
            placeholderTextColor="#9e9e9e"
            className="flex-1 text-[15px] text-ink"
          />
        </View>
        <Pressable onPress={() => setFilterOpen(true)} className="items-center justify-center size-11 rounded-2xl bg-[#f5f5f5] shrink-0">
          <FilterIcon size={20} color="#0B111F" />
        </Pressable>
      </View>

      {results === null ? (
        <View className="px-6 mt-4">
          <Text className="text-[14px] font-semibold text-ink mb-3">Recent searches</Text>
          <View className="flex-row flex-wrap gap-2">
            {RECENT.map((r) => (
              <Pressable key={r} onPress={() => setQuery(r)} className="px-4 py-2 rounded-full bg-[#f5f5f5]">
                <Text className="text-[13px] text-ink">{r}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : results.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <SearchIcon size={64} color="#e0e0e0" />
          <Text className="text-[16px] font-semibold text-ink mt-4">No results found</Text>
          <Text className="text-[14px] text-muted mt-1 text-center">Try a different keyword or adjust your filters.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="flex-col gap-3 px-6 mt-4">
            <Text className="text-[13px] text-muted">
              {results.length} results for "{query}"
            </Text>
            {results.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </View>
        </ScrollView>
      )}

      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)}>
        <View className="w-10 h-1 bg-hairline rounded-full self-center mb-6" />
        <Text className="text-[18px] font-bold text-ink mb-4">Filters</Text>

        <Text className="text-[14px] font-semibold text-ink mb-2">Category</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          <Pressable onPress={() => setCategory(null)} className={`px-4 py-2 rounded-full ${!category ? 'bg-primary' : 'bg-[#f5f5f5]'}`}>
            <Text className={`text-[13px] ${!category ? 'text-white' : 'text-ink'}`}>All</Text>
          </Pressable>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setCategory(c.id)}
              className={`px-4 py-2 rounded-full ${category === c.id ? 'bg-primary' : 'bg-[#f5f5f5]'}`}
            >
              <Text className={`text-[13px] ${category === c.id ? 'text-white' : 'text-ink'}`}>
                {c.emoji} {c.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-[14px] font-semibold text-ink mb-2">Minimum rating</Text>
        <View className="flex-row gap-2 mb-8">
          {[0, 3, 4, 4.5].map((r) => (
            <Pressable
              key={r}
              onPress={() => setMinRating(r)}
              className={`flex-row items-center gap-1 px-4 py-2 rounded-full ${minRating === r ? 'bg-primary' : 'bg-[#f5f5f5]'}`}
            >
              {r === 0 ? (
                <Text className={`text-[13px] ${minRating === r ? 'text-white' : 'text-ink'}`}>Any</Text>
              ) : (
                <>
                  <StarIcon size={14} filled={minRating === r} />
                  <Text className={`text-[13px] ${minRating === r ? 'text-white' : 'text-ink'}`}>{r}+</Text>
                </>
              )}
            </Pressable>
          ))}
        </View>

        <Button onPress={() => setFilterOpen(false)}>Apply Filters</Button>
      </Sheet>
    </SafeAreaView>
  )
}
