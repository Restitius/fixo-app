import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import Button from '../../components/Button'
import { CheckCircleIcon, HistoryIcon, TagIcon } from '../../components/icons'
import { PROMOS, PROMO_REDEMPTIONS } from '../../data/mock'

export default function Promotions() {
  const [code, setCode] = useState('')
  const [applied, setApplied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function validate() {
    setError(null)
    setApplied(null)
    const match = PROMOS.find((p) => p.title.toLowerCase().includes(code.trim().toLowerCase()) && code.trim().length > 0)
    if (!code.trim()) {
      setError('Enter a promo code')
    } else if (match) {
      setApplied(match.title)
    } else {
      setError('This code is not valid or has expired')
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Promotions" back="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-2">
          <Text className="text-[14px] font-semibold text-ink mb-2">Have a promo code?</Text>
          <View className="flex-row items-center gap-3">
            <TextInput
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              placeholder="Enter code"
              placeholderTextColor="#9e9e9e"
              className="flex-1 rounded-2xl bg-[#f5f5f5] px-5 py-4 text-[15px] text-ink"
            />
            <Pressable onPress={validate} className="items-center justify-center rounded-2xl bg-primary px-5 py-4">
              <Text className="text-[14px] font-bold text-white">Apply</Text>
            </Pressable>
          </View>
          {applied && (
            <View className="flex-row items-center gap-2 mt-3 rounded-xl bg-[#00B894]/10 px-4 py-3">
              <CheckCircleIcon size={16} color="#00B894" />
              <Text className="text-[13px] font-medium" style={{ color: '#00B894' }}>
                "{applied}" applied — it'll be available on your next booking.
              </Text>
            </View>
          )}
          {error && (
            <View className="rounded-xl bg-[#FF6B6B]/10 px-4 py-3 mt-3">
              <Text className="text-[13px] font-medium" style={{ color: '#FF6B6B' }}>
                {error}
              </Text>
            </View>
          )}

          <Text className="text-[16px] font-bold text-ink mt-7 mb-3">Available Promotions</Text>
          <View className="flex-col gap-3">
            {PROMOS.map((p) => (
              <View key={p.id} className="flex-row items-center gap-4 rounded-2xl border border-hairline p-4">
                <View className="items-center justify-center size-11 rounded-full shrink-0" style={{ backgroundColor: p.color }}>
                  <TagIcon size={18} color="#fff" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="font-bold text-ink text-[14px]">{p.title}</Text>
                  <Text className="text-[12px] text-muted mt-0.5">{p.subtitle}</Text>
                </View>
                <Text className="font-bold text-primary text-[14px] shrink-0">{p.discountPercent}% OFF</Text>
              </View>
            ))}
          </View>

          <Text className="text-[16px] font-bold text-ink mt-7 mb-3">Redemption History</Text>
          {PROMO_REDEMPTIONS.length === 0 ? (
            <View className="items-center py-8">
              <HistoryIcon size={40} color="#e0e0e0" />
              <Text className="text-[13px] text-muted mt-2">Promotions you apply will show up here.</Text>
            </View>
          ) : (
            <View className="flex-col gap-3">
              {PROMO_REDEMPTIONS.map((r) => (
                <View key={r.id} className="flex-row items-center justify-between rounded-2xl border border-hairline p-4">
                  <View>
                    <Text className="font-bold text-primary text-[14px]">{r.code}</Text>
                    <Text className="text-[12px] text-muted mt-0.5">{r.date}</Text>
                  </View>
                  <Text className="font-bold text-[#00B894] text-[14px]">-${r.savings.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
