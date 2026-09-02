import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import { OFFERS } from '../data/mock'
import { TagIcon } from '../components/icons'

export default function SpecialOffers() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Special Offers" back="/(tabs)/home" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-col gap-4 px-6 mt-2">
          {OFFERS.map((o) => (
            <View key={o.id} className="rounded-3xl p-6" style={{ backgroundColor: o.color }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1 bg-white/20 rounded-full px-3 py-1 self-start">
                  <TagIcon size={14} color="#fff" />
                  <Text className="text-[12px] font-bold text-white">{o.discount}</Text>
                </View>
              </View>
              <Text className="text-[20px] font-bold text-white mt-4">{o.title}</Text>
              <Text className="text-[14px] text-white/90 mt-1">{o.subtitle}</Text>
              <Text className="text-[12px] text-white/75 mt-4">Valid until Sep 30, 2026</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
