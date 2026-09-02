import { Pressable, ScrollView, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import ProviderCard from '../../components/ProviderCard'
import { SearchIcon } from '../../components/icons'
import { CATEGORIES, providersByCategory } from '../../data/mock'

export default function CategoryList() {
  const { categoryId = '' } = useLocalSearchParams<{ categoryId: string }>()
  const category = CATEGORIES.find((c) => c.id === categoryId)
  const providers = providersByCategory(categoryId)

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader
        title={category ? category.name : 'Services'}
        back="/services"
        right={
          <Pressable onPress={() => router.push('/search')} className="items-center justify-center size-9 rounded-full bg-[#f5f5f5]">
            <SearchIcon size={16} color="#0B111F" />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-col gap-3 px-6 pt-2 mt-2">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
          {providers.length === 0 && <Text className="text-center text-muted mt-10">No providers available yet.</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
