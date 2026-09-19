import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import Button from '../../components/Button'
import { CenterModal } from '../../components/Sheet'
import { AwardIcon, GiftIcon, TagIcon } from '../../components/icons'
import { fixoSdk, type LoyaltyAccount, type LoyaltyTxn } from '../../lib/api-client'
import { fmtDateTime, humanize } from '../../lib/format'

// The backend's `tier` column is a static default ("SILVER") — nothing
// recalculates it from points. This ladder is a disclosed, client-defined
// progression (mirrors web's loyalty page) used only to show "points to next
// tier"; it doesn't override any real backend rule because none exists.
const TIER_LADDER = [
  { name: 'Bronze', min: 0 },
  { name: 'Silver', min: 1000 },
  { name: 'Gold', min: 3000 },
  { name: 'Platinum', min: 6000 },
] as const

function tierIndex(tierName: string) {
  const i = TIER_LADDER.findIndex((t) => t.name.toLowerCase() === tierName.toLowerCase())
  return i === -1 ? 0 : i
}

export default function Loyalty() {
  const { t } = useTranslation('profile')
  const TIER_LABELS: Record<string, string> = {
    Bronze: t('loyalty.tierBronze'),
    Silver: t('loyalty.tierSilver'),
    Gold: t('loyalty.tierGold'),
    Platinum: t('loyalty.tierPlatinum'),
  }
  // A disclosed, hardcoded reward catalog — there's no backend rewards-catalog
  // domain, so this is product config, not user data. Redeeming spends real
  // points via the real loyalty API.
  const REWARD_CATALOG = [
    { id: 'discount-5000', title: t('loyalty.reward5000Title'), description: t('loyalty.reward5000Desc'), pointsCost: 3000, activity: 'REWARD_DISCOUNT_5000' },
    { id: 'priority-booking', title: t('loyalty.rewardPriorityTitle'), description: t('loyalty.rewardPriorityDesc'), pointsCost: 2000, activity: 'REWARD_PRIORITY_BOOKING' },
    { id: 'free-inspection', title: t('loyalty.rewardInspectionTitle'), description: t('loyalty.rewardInspectionDesc'), pointsCost: 1500, activity: 'REWARD_FREE_INSPECTION' },
  ] as const
  type Reward = (typeof REWARD_CATALOG)[number]
  const [account, setAccount] = useState<LoyaltyAccount | null>(null)
  const [txns, setTxns] = useState<LoyaltyTxn[] | null>(null)
  const [redeeming, setRedeeming] = useState<Reward | null>(null)
  const [redeemed, setRedeemed] = useState<Reward | null>(null)
  const [redeemLoading, setRedeemLoading] = useState(false)

  function refresh() {
    fixoSdk.loyaltyAccount().then(setAccount).catch(() => setAccount(null))
    fixoSdk.loyaltyTransactions(50, 0).then(setTxns).catch(() => setTxns([]))
  }

  useEffect(refresh, [])

  const points = account?.points_balance ?? 0
  const tierNameRaw = account?.tier ? account.tier.charAt(0) + account.tier.slice(1).toLowerCase() : 'Bronze'
  const tierName = TIER_LABELS[tierNameRaw] ?? tierNameRaw
  const curIdx = tierIndex(tierNameRaw)
  const nextTier = TIER_LADDER[curIdx + 1]
  const progressPct = nextTier ? Math.min(100, Math.round(((points - TIER_LADDER[curIdx]!.min) / (nextTier.min - TIER_LADDER[curIdx]!.min)) * 100)) : 100

  async function confirmRedeem() {
    if (!redeeming || points < redeeming.pointsCost) return
    setRedeemLoading(true)
    try {
      await fixoSdk.loyaltySpend(redeeming.pointsCost, redeeming.activity)
      refresh()
      setRedeemed(redeeming)
      setRedeeming(null)
    } catch {
      // apiClient throws on failure; points simply won't have moved
    } finally {
      setRedeemLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title={t('loyalty.title')} back="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-2">
          <View className="rounded-3xl p-6 bg-primary">
            <View className="flex-row items-center gap-3">
              <View className="items-center justify-center size-12 rounded-full bg-white/15">
                <AwardIcon size={24} color="#fff" />
              </View>
              <View>
                <Text className="text-[13px] text-white/80">{t('loyalty.currentTier')}</Text>
                <Text className="text-[20px] font-bold text-white">{tierName}</Text>
              </View>
            </View>
            <View className="mt-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] text-white/80">{nextTier ? t('loyalty.progressTo', { tier: TIER_LABELS[nextTier.name] ?? nextTier.name }) : t('loyalty.topTierReached')}</Text>
                <Text className="text-[12px] text-white/80">
                  {nextTier ? t('loyalty.ptsOf', { points, max: nextTier.min }) : t('loyalty.ptsOnly', { points })}
                </Text>
              </View>
              <View className="h-2 rounded-full bg-white/25 mt-2 overflow-hidden">
                <View className="h-full rounded-full bg-white" style={{ width: `${progressPct}%` }} />
              </View>
            </View>
          </View>

          <Text className="text-[16px] font-bold text-ink mt-7 mb-3">{t('loyalty.redeemRewards')}</Text>
          <View className="flex-col gap-3">
            {REWARD_CATALOG.map((r) => (
              <View key={r.id} className="flex-row items-center gap-4 rounded-2xl border border-hairline p-4">
                <View className="items-center justify-center size-11 rounded-full bg-primary/8 shrink-0">
                  <GiftIcon size={20} color="#7210FF" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="font-semibold text-ink text-[14px]">{r.title}</Text>
                  <Text className="text-[12px] text-muted mt-0.5">{r.description}</Text>
                </View>
                <Pressable
                  onPress={() => setRedeeming(r)}
                  disabled={points < r.pointsCost}
                  className={`shrink-0 rounded-full px-4 py-2 ${points < r.pointsCost ? 'bg-[#f5f5f5]' : 'bg-primary'}`}
                >
                  <Text className={`text-[12px] font-bold ${points < r.pointsCost ? 'text-muted' : 'text-white'}`}>{t('loyalty.ptsOnly', { points: r.pointsCost })}</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <Text className="text-[16px] font-bold text-ink mt-7 mb-3">{t('loyalty.pointsActivity')}</Text>
          <View className="flex-col gap-3">
            {txns === null ? (
              <View className="h-20 rounded-2xl bg-[#f5f5f5]" />
            ) : txns.length === 0 ? (
              <Text className="text-[13px] text-muted">{t('loyalty.noPointsActivity')}</Text>
            ) : (
              txns.map((t, i) => (
                <View key={t.txn_id ?? i} className="flex-row items-center gap-4 rounded-2xl border border-hairline p-4">
                  <View className={`items-center justify-center size-11 rounded-full shrink-0 ${t.points > 0 ? 'bg-[#00B894]/10' : 'bg-[#FF6B6B]/10'}`}>
                    <TagIcon size={18} color={t.points > 0 ? '#00B894' : '#FF6B6B'} />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text numberOfLines={1} className="font-semibold text-ink text-[14px]">
                      {humanize(t.activity)}
                    </Text>
                    <Text className="text-[12px] text-muted mt-0.5">{fmtDateTime(t.created_at)}</Text>
                  </View>
                  <Text className={`font-bold text-[14px] shrink-0 ${t.points > 0 ? 'text-[#00B894]' : 'text-ink'}`}>
                    {t.points > 0 ? '+' : ''}
                    {t.points}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <CenterModal open={!!redeeming}>
        <View className="items-center justify-center size-16 rounded-full bg-primary/8 mb-5">
          <GiftIcon size={28} color="#7210FF" />
        </View>
        <Text className="text-[18px] font-bold text-ink text-center">{t('loyalty.redeemConfirmTitle', { reward: redeeming?.title })}</Text>
        <Text className="text-[14px] text-muted mt-2 text-center">{t('loyalty.redeemConfirmBody', { points: redeeming?.pointsCost })}</Text>
        <View className="flex-row gap-3 w-full mt-6">
          <View className="flex-1">
            <Button variant="outline" onPress={() => setRedeeming(null)}>
              {t('loyalty.cancel')}
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={confirmRedeem} loading={redeemLoading}>{t('loyalty.redeem')}</Button>
          </View>
        </View>
      </CenterModal>

      <CenterModal open={!!redeemed}>
        <View className="items-center justify-center size-16 rounded-full bg-[#00B894]/10 mb-5">
          <AwardIcon size={28} color="#00B894" />
        </View>
        <Text className="text-[18px] font-bold text-ink text-center">{t('loyalty.redeemedTitle')}</Text>
        <Text className="text-[14px] text-muted mt-2 text-center">{t('loyalty.redeemedBody', { reward: redeemed?.title })}</Text>
        <View className="w-full mt-6">
          <Button onPress={() => setRedeemed(null)}>{t('loyalty.done')}</Button>
        </View>
      </CenterModal>
    </SafeAreaView>
  )
}
