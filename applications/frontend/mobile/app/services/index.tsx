import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import { SearchIcon } from '../../components/icons'
import { CATEGORIES } from '../../data/mock'

export default function AllServices() {
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
          {CATEGORIES.map((c) => (
            <Pressable key={c.id} onPress={() => router.push(`/services/${c.id}` as any)} className="items-center gap-2" style={{ width: '25%' }}>
              <View className="items-center justify-center size-16 rounded-2xl" style={{ backgroundColor: `${c.color}14` }}>
                <Text style={{ fontSize: 24 }}>{c.emoji}</Text>
              </View>
              <Text className="text-[11px] font-medium text-ink text-center leading-tight">{c.name}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
