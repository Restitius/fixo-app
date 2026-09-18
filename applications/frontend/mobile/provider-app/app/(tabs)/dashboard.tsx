// Dashboard — wired to the real /providers/dashboard* endpoints, ported
// from web-provider's already-verified dashboard.tsx. Structured as a
// vertical scroll (header, stat cards, schedule, wallet, requests, quick
// actions) following user-app's home.tsx page conventions: avatar+greeting
// header, "See all" section links, px-6 margins, mt-7 section spacing.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from '../../components/Avatar'
import MetricCard from '../../components/MetricCard'
import StatusBadge from '../../components/StatusBadge'
import { ArrowUpRightIcon, BellIcon, BookingsIcon, CalendarIcon, ChatBubbleIcon, StarIcon, WalletIcon } from '../../components/icons'
import { useAuth } from '../../lib/auth-context'
import {
  dashboardApi,
  onboardingApi,
  type DashboardOverview,
  type DashboardScheduleItem,
  type RequestFeedItem,
  type WalletOverview,
} from '../../lib/api-client'
import { fmtMoney, initialsOf } from '../../lib/format'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { provider } = useAuth()
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [todaySchedule, setTodaySchedule] = useState<DashboardScheduleItem[]>([])
  const [wallet, setWallet] = useState<WalletOverview | null>(null)
  const [requests, setRequests] = useState<RequestFeedItem[]>([])
  const [onboarding, setOnboarding] = useState<{ progress: string; completed: boolean } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const [ov, sched, wal, reqs, ob] = await Promise.all([
          dashboardApi.overview(),
          dashboardApi.schedule(),
          // Non-critical for the dashboard to render — a real bug on
          // web-provider this session (missing response envelope) made
          // this throw on every call; without a .catch() here that alone
          // killed the whole Promise.all and every zero-fallback in the
          // UI made total failure look identical to a genuinely new account.
          dashboardApi.wallet().catch(() => null),
          dashboardApi.requestsFeed().catch(() => []),
          onboardingApi.status().catch(() => null),
        ])
        setOverview(ov)
        setTodaySchedule(sched.today)
        setWallet(wal)
        setRequests(reqs)
        if (ob) setOnboarding({ progress: ob.progress, completed: ob.completed })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const stats = overview?.stats
  const firstName = provider?.first_name ?? provider?.display_name ?? 'there'

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <View className="size-8 rounded-full border-[3px] border-primary" style={{ borderTopColor: 'transparent' }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View className="flex-row items-center gap-3 px-6 pt-2">
          <Avatar label={initialsOf(provider?.display_name ?? '?')} size={48} />
          <View className="flex-1">
            <Text className="text-[13px] text-muted">{greeting()} 👋</Text>
            <Text numberOfLines={1} className="text-[16px] font-bold text-ink">
              {firstName}
            </Text>
          </View>
          <Pressable className="relative items-center justify-center size-11 rounded-full bg-[#f5f5f5]">
            <BellIcon size={20} color="#0B111F" />
          </Pressable>
        </View>

        <View className="px-6 mt-6" style={{ gap: 12 }}>
          <View className="flex-row" style={{ gap: 12 }}>
            <View className="flex-1">
              <MetricCard icon={BookingsIcon} label="Jobs today" value={String(stats?.todays_jobs ?? 0)} hint={`${stats?.active_jobs ?? 0} active`} />
            </View>
            <View className="flex-1">
              <MetricCard icon={ChatBubbleIcon} label="New requests" value={String(stats?.pending_requests ?? 0)} hint="Awaiting reply" tone="amber" tintValue />
            </View>
          </View>
          <View className="flex-row" style={{ gap: 12 }}>
            <View className="flex-1">
              <MetricCard
                icon={WalletIcon}
                label="Earned today"
                value={fmtMoney(stats?.earnings_today ?? 0, stats?.currency)}
                hint="Collected today"
                tone="success"
                tintValue
              />
            </View>
            <View className="flex-1">
              <MetricCard
                icon={StarIcon}
                label="Rating"
                value={stats?.rating_avg != null ? String(stats.rating_avg) : '—'}
                hint={`${stats?.rating_count ?? 0} reviews`}
              />
            </View>
          </View>
        </View>

        {onboarding && !onboarding.completed && (
          <Pressable onPress={() => router.push('/onboarding-steps' as any)} className="mx-6 mt-6 rounded-3xl p-5 bg-primary">
            <Text className="text-white font-bold text-[15px]">Finish your onboarding ({onboarding.progress})</Text>
            <Text className="text-white/85 text-[13px] mt-1">Complete service areas, payout details and agreements to unlock full job matching.</Text>
          </Pressable>
        )}

        <View className="flex-row items-center justify-between px-6 mt-7">
          <Text className="text-[17px] font-bold text-ink">Today's schedule</Text>
          <Pressable onPress={() => router.push('/(tabs)/calendar')}>
            <Text className="text-[13px] font-semibold text-primary">Open calendar</Text>
          </Pressable>
        </View>
        <View className="px-6 mt-3" style={{ gap: 10 }}>
          {todaySchedule.length === 0 && <Text className="text-[13px] text-muted">No jobs scheduled for today.</Text>}
          {todaySchedule.map((b) => (
            <View key={b.booking_id} className="flex-row items-center gap-3 rounded-2xl bg-[#f5f5f5] p-4">
              <View className="items-center justify-center rounded-2xl bg-primary/10" style={{ width: 44, height: 44 }}>
                <Text className="text-[11px] font-bold text-primary">{b.time_window ?? '—'}</Text>
              </View>
              <View className="flex-1 min-w-0">
                <Text numberOfLines={1} className="text-[14px] font-semibold text-ink">
                  {b.service_name}
                </Text>
                <Text numberOfLines={1} className="text-[12px] text-muted">
                  {b.booking_number}
                </Text>
              </View>
              <StatusBadge status={b.status} />
              <Text className="text-[13px] font-bold text-primary">{fmtMoney(b.agreed_amount, b.currency)}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row items-center justify-between px-6 mt-7">
          <Text className="text-[17px] font-bold text-ink">Wallet</Text>
          <Pressable onPress={() => router.push('/payouts' as any)}>
            <Text className="text-[13px] font-semibold text-primary">Withdraw</Text>
          </Pressable>
        </View>
        <View className="mx-6 mt-3 rounded-3xl bg-[#f5f5f5] p-5">
          <Text className="text-[26px] font-extrabold text-primary">{fmtMoney(wallet?.available_balance ?? 0, wallet?.currency)}</Text>
          <Text className="text-[13px] text-muted">Available for withdrawal</Text>
          <View className="flex-row justify-between mt-3">
            <Text className="text-[13px] text-muted">Pending clearance</Text>
            <Text className="text-[13px] font-semibold text-ink">{fmtMoney(wallet?.pending_balance ?? 0, wallet?.currency)}</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between px-6 mt-7">
          <Text className="text-[17px] font-bold text-ink">Incoming requests</Text>
          <Pressable onPress={() => router.push('/(tabs)/requests')}>
            <Text className="text-[13px] font-semibold text-primary">View all</Text>
          </Pressable>
        </View>
        <View className="px-6 mt-3" style={{ gap: 10 }}>
          {requests.length === 0 && <Text className="text-[13px] text-muted">No incoming requests right now.</Text>}
          {requests.slice(0, 3).map((r) => (
            <Pressable key={r.match_id} onPress={() => router.push('/(tabs)/requests')} className="rounded-2xl border border-hairline p-4">
              <Text numberOfLines={1} className="text-[14px] font-semibold text-ink">
                {r.service_name}
              </Text>
              <Text numberOfLines={1} className="text-[12px] text-muted mt-0.5">
                {r.customer_name} · {[r.city, r.region].filter(Boolean).join(', ')}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row items-center justify-between px-6 mt-7 mb-3">
          <Text className="text-[17px] font-bold text-ink">Quick actions</Text>
        </View>
        <View className="flex-row flex-wrap px-6" style={{ rowGap: 16 }}>
          {[
            { label: 'Quotes', to: '/quotes', icon: ArrowUpRightIcon },
            { label: 'Calendar', to: '/(tabs)/calendar', icon: CalendarIcon },
            { label: 'Bookings', to: '/(tabs)/bookings', icon: BookingsIcon },
            { label: 'Messages', to: '/messages', icon: ChatBubbleIcon },
          ].map((a) => (
            <Pressable key={a.label} onPress={() => router.push(a.to as any)} className="items-center gap-2" style={{ width: '25%' }}>
              <View className="items-center justify-center size-14 rounded-2xl bg-primary/8">
                <a.icon size={20} color="#7210FF" />
              </View>
              <Text className="text-[11px] font-medium text-ink">{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
