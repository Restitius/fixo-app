// Subscription — real /providers/me/subscription/* endpoints, ported from
// web-provider's now-real subscription.tsx. subscribe() also covers plan
// switching since the backend atomically cancels the old plan. current()
// 404s when there's no active subscription — treated as the "pick a plan"
// empty state, not an error.
import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import { CenterModal } from '../components/Sheet'
import { AwardIcon, UserIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { subscriptionsApi, type CurrentSubscription, type SubscriptionHistoryRow, type SubscriptionPlan } from '../lib/api-client'
import { fmtDate, fmtMoney } from '../lib/format'

export default function Subscription() {
  const { access_token, loading: authLoading } = useAuth()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [current, setCurrent] = useState<CurrentSubscription | null>(null)
  const [history, setHistory] = useState<SubscriptionHistoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [switchingTo, setSwitchingTo] = useState<SubscriptionPlan | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [busy, setBusy] = useState(false)

  function load() {
    return Promise.all([subscriptionsApi.listPlans(), subscriptionsApi.current().catch(() => null), subscriptionsApi.history(50, 0)]).then(([p, c, h]) => {
      setPlans(p)
      setCurrent(c)
      setHistory(h)
    })
  }

  useEffect(() => {
    if (authLoading || !access_token) return
    load().finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  async function confirmSwitch() {
    if (!switchingTo) return
    setBusy(true)
    try {
      await subscriptionsApi.subscribe(switchingTo.plan_id)
      await load()
      setSwitchingTo(null)
    } finally {
      setBusy(false)
    }
  }

  async function confirmCancel() {
    setBusy(true)
    try {
      await subscriptionsApi.cancel()
      await load()
      setCancelling(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Subscription" back="/(tabs)/profile" />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-[13px] font-semibold text-muted mt-4 mb-2">CURRENT PLAN</Text>
        {!loading &&
          (current ? (
            <View className="rounded-2xl bg-[#f5f5f5] p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="items-center justify-center rounded-2xl bg-primary/10" style={{ width: 40, height: 40 }}>
                    <AwardIcon size={20} color="#7210FF" />
                  </View>
                  <View>
                    <Text className="text-[15px] font-semibold text-ink">{current.plan_name}</Text>
                    <Text className="text-[12px] text-muted">{fmtMoney(current.price_monthly)}/month</Text>
                  </View>
                </View>
                <StatusBadge status={current.status} />
              </View>
              <Text className="text-[11px] text-muted mt-3">Started {fmtDate(current.started_at)}</Text>
              {current.current_period_end && <Text className="text-[11px] text-muted">Renews {fmtDate(current.current_period_end)}</Text>}
              {current.max_team_members != null && (
                <View className="flex-row items-center gap-1 mt-0.5">
                  <UserIcon size={12} color="#6C7585" />
                  <Text className="text-[11px] text-muted">Up to {current.max_team_members} team members</Text>
                </View>
              )}
              {current.status === 'ACTIVE' && (
                <Text onPress={() => setCancelling(true)} className="text-[12px] font-semibold mt-3" style={{ color: '#DC2626' }}>
                  Cancel subscription
                </Text>
              )}
            </View>
          ) : (
            <Text className="text-[13px] text-muted">You're not subscribed to a plan yet. Pick one below.</Text>
          ))}

        <Text className="text-[13px] font-semibold text-muted mt-6 mb-2">{current ? 'SWITCH PLAN' : 'AVAILABLE PLANS'}</Text>
        <View style={{ gap: 10 }}>
          {plans.map((p) => {
            const isCurrent = current?.plan_id === p.plan_id && current.status === 'ACTIVE'
            return (
              <View key={p.plan_id} className="rounded-2xl bg-[#f5f5f5] p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[14px] font-semibold text-ink">{p.name}</Text>
                  {isCurrent && <StatusBadge label="Current" tone="success" />}
                </View>
                {p.description && <Text className="text-[12px] text-muted mt-0.5">{p.description}</Text>}
                <Text className="text-[13px] font-semibold text-primary mt-2">{fmtMoney(p.price_monthly)}/month</Text>
                {p.max_team_members != null && <Text className="text-[11px] text-muted">Up to {p.max_team_members} team members</Text>}
                {!isCurrent && (
                  <View className="mt-3">
                    <Button onPress={() => setSwitchingTo(p)}>{current ? 'Switch to this plan' : 'Subscribe'}</Button>
                  </View>
                )}
              </View>
            )
          })}
        </View>

        <Text className="text-[13px] font-semibold text-muted mt-6 mb-2">HISTORY</Text>
        {!loading && history.length === 0 && <Text className="text-[13px] text-muted">No subscription history yet.</Text>}
        <View style={{ gap: 8 }}>
          {history.map((h) => (
            <View key={`${h.subscription_id}-${h.started_at}`} className="flex-row items-center justify-between rounded-xl bg-[#f5f5f5] px-4 py-3">
              <View>
                <Text className="text-[13px] font-semibold text-ink">{h.plan_name}</Text>
                <Text className="text-[11px] text-muted">
                  {fmtDate(h.started_at)} {h.cancelled_at ? `– ${fmtDate(h.cancelled_at)}` : h.current_period_end ? `– renews ${fmtDate(h.current_period_end)}` : ''}
                </Text>
              </View>
              <StatusBadge status={h.status} />
            </View>
          ))}
        </View>
      </ScrollView>

      <CenterModal open={!!switchingTo}>
        <Text className="text-[18px] font-bold text-ink">{current ? 'Switch to' : 'Subscribe to'} {switchingTo?.name}?</Text>
        <Text className="text-[14px] text-muted mt-2 text-center">
          {switchingTo ? fmtMoney(switchingTo.price_monthly) : ''}/month
        </Text>
        <View className="flex-row gap-3 w-full mt-6">
          <View className="flex-1">
            <Button variant="outline" onPress={() => setSwitchingTo(null)}>
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={() => void confirmSwitch()} loading={busy}>
              Confirm
            </Button>
          </View>
        </View>
      </CenterModal>

      <CenterModal open={cancelling}>
        <Text className="text-[18px] font-bold text-ink">Cancel subscription?</Text>
        <Text className="text-[14px] text-muted mt-2 text-center">You'll lose plan benefits immediately.</Text>
        <View className="flex-row gap-3 w-full mt-6">
          <View className="flex-1">
            <Button variant="outline" onPress={() => setCancelling(false)}>
              Keep plan
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={() => void confirmCancel()} loading={busy}>
              Cancel it
            </Button>
          </View>
        </View>
      </CenterModal>
    </SafeAreaView>
  )
}
