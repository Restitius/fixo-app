import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import ProviderCard from '../components/ProviderCard'
import { PROVIDERS } from '../data/mock'

export default function PopularServices() {
  const popular = [...PROVIDERS].sort((a, b) => b.rating - a.rating)

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Most Popular" back="/(tabs)/home" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-col gap-3 px-6 mt-2">
          {popular.map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
