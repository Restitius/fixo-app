import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import { fixoSdk, type Promotion } from '../lib/api-client'
import { COLOR_PALETTE } from '../lib/category-visuals'
import { fmtDate, fmtMoney } from '../lib/format'
import { TagIcon } from '../components/icons'

function discountLabel(p: Promotion) {
  return p.discount_type === 'PERCENT' ? `${p.discount_value}% OFF` : `${fmtMoney(p.discount_value)} OFF`
}

export default function SpecialOffers() {
  const [offers, setOffers] = useState<Promotion[] | null>(null)

  useEffect(() => {
    fixoSdk.listPromotions(20, 0).then(setOffers).catch(() => setOffers([]))
  }, [])

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Special Offers" back="/(tabs)/home" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-col gap-4 px-6 mt-2">
          {offers === null ? (
            <View className="h-32 rounded-3xl bg-[#f5f5f5]" />
          ) : offers.length === 0 ? (
            <Text className="text-center text-muted py-8 text-[14px]">No active promotions right now.</Text>
          ) : (
            offers.map((o, i) => (
              <View key={o.promo_id} className="rounded-3xl p-6" style={{ backgroundColor: COLOR_PALETTE[i % COLOR_PALETTE.length] }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1 bg-white/20 rounded-full px-3 py-1 self-start">
                    <TagIcon size={14} color="#fff" />
                    <Text className="text-[12px] font-bold text-white">{discountLabel(o)}</Text>
                  </View>
                </View>
                <Text className="text-[20px] font-bold text-white mt-4">{o.name}</Text>
                {o.description && <Text className="text-[14px] text-white/90 mt-1">{o.description}</Text>}
                <Text className="text-[12px] text-white/75 mt-4">Code {o.code} · Valid until {fmtDate(o.valid_until)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
