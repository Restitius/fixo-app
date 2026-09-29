import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import { CheckCircleIcon, HistoryIcon, TagIcon } from '../../components/icons'
import { fixoSdk, type BookingHistoryRow, type Promotion } from '../../lib/api-client'
import { colorForSeed } from '../../lib/category-visuals'
import { fmtMoney, timeAgo } from '../../lib/format'

export default function Promotions() {
  const { t } = useTranslation('profile')
  function discountLabel(p: Promotion): string {
    if (p.description) return p.description
    return t('promotions.discountOff', { amount: p.discount_type === 'PERCENT' ? `${p.discount_value}%` : fmtMoney(p.discount_value) })
  }
  const [promos, setPromos] = useState<Promotion[]>([])
  const [redemptions, setRedemptions] = useState<BookingHistoryRow[]>([])
  const [code, setCode] = useState('')
  const [amount, setAmount] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    fixoSdk.listPromotions(20, 0).then(setPromos).catch(() => setPromos([]))
    // "Recent redemptions" is real data: past bookings that actually carried a promo
    // code, read off the booking's own discount snapshot — never a local, invented record.
    fixoSdk
      .bookingHistory(undefined, 100, 0)
      .then((rows) => setRedemptions(rows.filter((r) => (r.discount_amount ?? 0) > 0 && r.promo_code)))
      .catch(() => setRedemptions([]))
  }, [])

  // Promo codes are only ever spent for real at checkout (each customer can use a
  // given code once). This just previews the discount and hands the code to the
  // booking screen — nothing is "used" from here.
  async function check(p?: Promotion) {
    setError(null)
    setPreview(null)
    const useCode = (p?.code ?? code).trim()
    const amt = Number(amount)
    if (!useCode) {
      setError(t('promotions.enterCodeError'))
      return
    }
    if (!amt || amt <= 0) {
      setError(t('promotions.enterAmountError'))
      return
    }
    setChecking(true)
    try {
      const validated = await fixoSdk.validatePromotion(useCode, amt)
      setPreview(t('promotions.appliedMessage', { code: validated.code, amount: fmtMoney(validated.discount_amount) }))
      try {
        await AsyncStorage.setItem('fixo.pendingPromoCode', validated.code)
      } catch {
        // storage unavailable — the customer can still type the code at checkout
      }
    } catch {
      setError(t('promotions.invalidError'))
    } finally {
      setChecking(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title={t('promotions.title')} back="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-2">
          <Text className="text-[14px] font-semibold text-ink mb-2">{t('promotions.havePromoCode')}</Text>
          <View className="gap-2">
            <TextInput
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              placeholder={t('promotions.codePlaceholder')}
              placeholderTextColor="#9e9e9e"
              className="rounded-2xl bg-[#f5f5f5] px-5 py-4 text-[15px] text-ink"
            />
            <View className="flex-row items-center gap-3">
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder={t('promotions.amountPlaceholder')}
                placeholderTextColor="#9e9e9e"
                className="flex-1 rounded-2xl bg-[#f5f5f5] px-5 py-4 text-[15px] text-ink"
              />
              <Pressable onPress={() => void check()} disabled={checking} className="items-center justify-center rounded-2xl bg-primary px-5 py-4">
                <Text className="text-[14px] font-bold text-white">{t('promotions.check', { defaultValue: 'Check' })}</Text>
              </Pressable>
            </View>
          </View>
          {preview && (
            <Pressable onPress={() => router.push('/search')} className="flex-row items-center gap-2 mt-3 rounded-xl bg-[#00B894]/10 px-4 py-3">
              <CheckCircleIcon size={16} color="#00B894" />
              <Text className="text-[13px] font-medium flex-1" style={{ color: '#00B894' }}>
                {preview} {t('promotions.readyAtCheckout', { defaultValue: '— ready to book.' })}
              </Text>
            </Pressable>
          )}
          {error && (
            <View className="rounded-xl bg-[#FF6B6B]/10 px-4 py-3 mt-3">
              <Text className="text-[13px] font-medium" style={{ color: '#FF6B6B' }}>{error}</Text>
            </View>
          )}

          <Text className="text-[16px] font-bold text-ink mt-7 mb-3">{t('promotions.availablePromotions')}</Text>
          <View className="flex-col gap-3">
            {promos.length === 0 ? (
              <Text className="text-[13px] text-muted">{t('promotions.noActive')}</Text>
            ) : (
              promos.map((p) => (
                <Pressable key={p.promo_id} onPress={() => setCode(p.code)} className="flex-row items-center gap-4 rounded-2xl border border-hairline p-4">
                  <View className="items-center justify-center size-11 rounded-full shrink-0" style={{ backgroundColor: colorForSeed(p.promo_id) }}>
                    <TagIcon size={18} color="#fff" />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="font-bold text-ink text-[14px]">{p.name}</Text>
                    <Text className="text-[12px] text-muted mt-0.5">{p.code}</Text>
                  </View>
                  <Text className="font-bold text-primary text-[14px] shrink-0">{discountLabel(p)}</Text>
                </Pressable>
              ))
            )}
          </View>

          <Text className="text-[16px] font-bold text-ink mt-7 mb-3">{t('promotions.redemptionHistory')}</Text>
          {redemptions.length === 0 ? (
            <View className="items-center py-8">
              <HistoryIcon size={40} color="#e0e0e0" />
              <Text className="text-[13px] text-muted mt-2">{t('promotions.redemptionEmpty')}</Text>
            </View>
          ) : (
            <View className="flex-col gap-3">
              {redemptions.map((r) => (
                <View key={r.booking_id} className="flex-row items-center justify-between rounded-2xl border border-hairline p-4">
                  <View>
                    <Text className="font-bold text-primary text-[14px]">{r.promo_code}</Text>
                    <Text className="text-[12px] text-muted mt-0.5">{r.booking_number} · {timeAgo(r.created_at)}</Text>
                  </View>
                  <Text className="font-bold text-[#00B894] text-[14px]">-{fmtMoney(r.discount_amount ?? 0, r.currency)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
