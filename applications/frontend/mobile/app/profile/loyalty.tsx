import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import Button from '../../components/Button'
import { CenterModal } from '../../components/Sheet'
import { AwardIcon, GiftIcon, TagIcon } from '../../components/icons'
import { LOYALTY, LOYALTY_TRANSACTIONS, REWARDS, type Reward } from '../../data/mock'

export default function Loyalty() {
  const [points, setPoints] = useState(LOYALTY.pointsBalance)
  const [redeeming, setRedeeming] = useState<Reward | null>(null)
  const [redeemed, setRedeemed] = useState<Reward | null>(null)
  const progressPct = Math.min(100, Math.round((points / LOYALTY.nextTierAt) * 100))

  function confirmRedeem() {
    if (!redeeming || points < redeeming.pointsCost) return
    setPoints((p) => p - redeeming.pointsCost)
    setRedeemed(redeeming)
    setRedeeming(null)
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Loyalty & Rewards" back="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-2">
          <View className="rounded-3xl p-6 bg-primary">
            <View className="flex-row items-center gap-3">
              <View className="items-center justify-center size-12 rounded-full bg-white/15">
                <AwardIcon size={24} color="#fff" />
              </View>
              <View>
                <Text className="text-[13px] text-white/80">Current tier</Text>
                <Text className="text-[20px] font-bold text-white">{LOYALTY.tier}</Text>
              </View>
            </View>
            <View className="mt-5">
              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] text-white/80">Progress to {LOYALTY.nextTier}</Text>
                <Text className="text-[12px] text-white/80">
                  {points} / {LOYALTY.nextTierAt} pts
                </Text>
              </View>
              <View className="h-2 rounded-full bg-white/25 mt-2 overflow-hidden">
                <View className="h-full rounded-full bg-white" style={{ width: `${progressPct}%` }} />
              </View>
            </View>
          </View>

          <Text className="text-[16px] font-bold text-ink mt-7 mb-3">Redeem Rewards</Text>
          <View className="flex-col gap-3">
            {REWARDS.map((r) => (
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
                  <Text className={`text-[12px] font-bold ${points < r.pointsCost ? 'text-muted' : 'text-white'}`}>{r.pointsCost} pts</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <Text className="text-[16px] font-bold text-ink mt-7 mb-3">Points Activity</Text>
          <View className="flex-col gap-3">
            {LOYALTY_TRANSACTIONS.map((t) => (
              <View key={t.id} className="flex-row items-center gap-4 rounded-2xl border border-hairline p-4">
                <View className={`items-center justify-center size-11 rounded-full shrink-0 ${t.points > 0 ? 'bg-[#00B894]/10' : 'bg-[#FF6B6B]/10'}`}>
                  <TagIcon size={18} color={t.points > 0 ? '#00B894' : '#FF6B6B'} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text numberOfLines={1} className="font-semibold text-ink text-[14px]">
                    {t.activity}
                  </Text>
                  <Text className="text-[12px] text-muted mt-0.5">{t.date}</Text>
                </View>
                <Text className={`font-bold text-[14px] shrink-0 ${t.points > 0 ? 'text-[#00B894]' : 'text-ink'}`}>
                  {t.points > 0 ? '+' : ''}
                  {t.points}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <CenterModal open={!!redeeming}>
        <View className="items-center justify-center size-16 rounded-full bg-primary/8 mb-5">
          <GiftIcon size={28} color="#7210FF" />
        </View>
        <Text className="text-[18px] font-bold text-ink text-center">Redeem {redeeming?.title}?</Text>
        <Text className="text-[14px] text-muted mt-2 text-center">This will use {redeeming?.pointsCost} of your points.</Text>
        <View className="flex-row gap-3 w-full mt-6">
          <View className="flex-1">
            <Button variant="outline" onPress={() => setRedeeming(null)}>
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={confirmRedeem}>Redeem</Button>
          </View>
        </View>
      </CenterModal>

      <CenterModal open={!!redeemed}>
        <View className="items-center justify-center size-16 rounded-full bg-[#00B894]/10 mb-5">
          <AwardIcon size={28} color="#00B894" />
        </View>
        <Text className="text-[18px] font-bold text-ink text-center">Reward Redeemed!</Text>
        <Text className="text-[14px] text-muted mt-2 text-center">{redeemed?.title} has been added to your account.</Text>
        <View className="w-full mt-6">
          <Button onPress={() => setRedeemed(null)}>Done</Button>
        </View>
      </CenterModal>
    </SafeAreaView>
  )
}
