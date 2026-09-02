import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import ScreenHeader from '../../components/ScreenHeader'
import { CheckCircleIcon, HistoryIcon, TagIcon } from '../../components/icons'
import { fixoSdk, type Promotion } from '../../lib/api-client'
import { useAuth } from '../../lib/auth-context'
import { colorForSeed } from '../../lib/category-visuals'
import { fmtMoney, timeAgo } from '../../lib/format'

// The backend never records per-customer redemption history (PROMOTIONS.used_count
// is a single global counter with no customer/date/amount trail), so "Redemption
// History" below is a local, honest ledger of promotions this device has actually
// applied via the real /promotions/{id}/use call — never invented example rows.
interface RedemptionEntry {
  promo_id: string
  code: string
  savings: number
  currency: string
  at: string
}

function ledgerKey(customerId?: string) {
  return `fixo.promo_redemptions.${customerId ?? 'anon'}`
}

async function loadLedger(customerId?: string): Promise<RedemptionEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(ledgerKey(customerId))
    return raw ? (JSON.parse(raw) as RedemptionEntry[]) : []
  } catch {
    return []
  }
}

async function appendLedger(customerId: string | undefined, entry: RedemptionEntry): Promise<RedemptionEntry[]> {
  const next = [entry, ...(await loadLedger(customerId))].slice(0, 50)
  try {
    await AsyncStorage.setItem(ledgerKey(customerId), JSON.stringify(next))
  } catch {
    // storage unavailable — the ledger just won't persist across reloads
  }
  return next
}

function discountLabel(p: Promotion): string {
  if (p.description) return p.description
  return p.discount_type === 'PERCENT' ? `${p.discount_value}% off` : `${fmtMoney(p.discount_value)} off`
}

export default function Promotions() {
  const { customer } = useAuth()
  const [promos, setPromos] = useState<Promotion[]>([])
  const [ledger, setLedger] = useState<RedemptionEntry[]>([])
  const [code, setCode] = useState('')
  const [amount, setAmount] = useState('')
  const [applied, setApplied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    fixoSdk.listPromotions(20, 0).then(setPromos).catch(() => setPromos([]))
    loadLedger(customer?.customer_id).then(setLedger)
  }, [customer?.customer_id])

  async function apply(p?: Promotion) {
    setError(null)
    setApplied(null)
    const useCode = (p?.code ?? code).trim()
    const amt = Number(amount)
    if (!useCode) {
      setError('Enter a promo code')
      return
    }
    if (!amt || amt <= 0) {
      setError('Enter your order amount so we can calculate real savings')
      return
    }
    setApplying(true)
    try {
      const validated = await fixoSdk.validatePromotion(useCode, amt)
      await fixoSdk.usePromotion(validated.promo_id)
      const entry: RedemptionEntry = { promo_id: validated.promo_id, code: validated.code, savings: validated.discount_amount, currency: 'TZS', at: new Date().toISOString() }
      setLedger(await appendLedger(customer?.customer_id, entry))
      setApplied(`${validated.code} applied — saved ${fmtMoney(validated.discount_amount)}`)
      setCode('')
    } catch {
      setError('This code is not valid, expired, or below its minimum order amount')
    } finally {
      setApplying(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Promotions" back="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-2">
          <Text className="text-[14px] font-semibold text-ink mb-2">Have a promo code?</Text>
          <View className="gap-2">
            <TextInput
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              placeholder="Enter code"
              placeholderTextColor="#9e9e9e"
              className="rounded-2xl bg-[#f5f5f5] px-5 py-4 text-[15px] text-ink"
            />
            <View className="flex-row items-center gap-3">
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="Order amount (TZS)"
                placeholderTextColor="#9e9e9e"
                className="flex-1 rounded-2xl bg-[#f5f5f5] px-5 py-4 text-[15px] text-ink"
              />
              <Pressable onPress={() => apply()} disabled={applying} className="items-center justify-center rounded-2xl bg-primary px-5 py-4">
                <Text className="text-[14px] font-bold text-white">Apply</Text>
              </Pressable>
            </View>
          </View>
          {applied && (
            <View className="flex-row items-center gap-2 mt-3 rounded-xl bg-[#00B894]/10 px-4 py-3">
              <CheckCircleIcon size={16} color="#00B894" />
              <Text className="text-[13px] font-medium flex-1" style={{ color: '#00B894' }}>{applied}</Text>
            </View>
          )}
          {error && (
            <View className="rounded-xl bg-[#FF6B6B]/10 px-4 py-3 mt-3">
              <Text className="text-[13px] font-medium" style={{ color: '#FF6B6B' }}>{error}</Text>
            </View>
          )}

          <Text className="text-[16px] font-bold text-ink mt-7 mb-3">Available Promotions</Text>
          <View className="flex-col gap-3">
            {promos.length === 0 ? (
              <Text className="text-[13px] text-muted">No active promotions right now.</Text>
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

          <Text className="text-[16px] font-bold text-ink mt-7 mb-3">Redemption History</Text>
          {ledger.length === 0 ? (
            <View className="items-center py-8">
              <HistoryIcon size={40} color="#e0e0e0" />
              <Text className="text-[13px] text-muted mt-2">Promotions you apply will show up here.</Text>
            </View>
          ) : (
            <View className="flex-col gap-3">
              {ledger.map((r, i) => (
                <View key={i} className="flex-row items-center justify-between rounded-2xl border border-hairline p-4">
                  <View>
                    <Text className="font-bold text-primary text-[14px]">{r.code}</Text>
                    <Text className="text-[12px] text-muted mt-0.5">{timeAgo(r.at)}</Text>
                  </View>
                  <Text className="font-bold text-[#00B894] text-[14px]">-{fmtMoney(r.savings, r.currency)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
