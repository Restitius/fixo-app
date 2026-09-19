// Performance — real ranking_router.py + kpis_router.py data, ported from
// web-provider's real (post-rewrite) performance.tsx. Same honest scope:
// no fabricated ranking-factor weights, level-progression ladder, or
// disputes panel (that's a different, unexplored backend domain).
import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import MetricCard from '../components/MetricCard'
import StatusBadge from '../components/StatusBadge'
import { AwardIcon, CheckCircleIcon, ClockIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { kpisApi, rankingApi, type KpiPeriod, type KpiSummary, type ProviderRanking } from '../lib/api-client'
import { fmtDate, fmtMoney, humanize } from '../lib/format'

export default function Performance() {
  const { access_token, loading: authLoading } = useAuth()
  const [ranking, setRanking] = useState<ProviderRanking | null>(null)
  const [rankingChecked, setRankingChecked] = useState(false)
  const [summary, setSummary] = useState<KpiSummary | null>(null)
  const [periods, setPeriods] = useState<KpiPeriod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !access_token) return
    // ranking_router raises 404 until a batch job first computes this
    // provider's ranking — not an error state, just "not ranked yet".
    rankingApi
      .mine()
      .then(setRanking)
      .catch(() => setRanking(null))
      .finally(() => setRankingChecked(true))
    Promise.all([kpisApi.summary(), kpisApi.list('monthly', 12, 0)])
      .then(([s, k]) => {
        setSummary(s)
        setPeriods(k)
      })
      .finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Performance" back="/(tabs)/profile" />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && (
          <>
            <View className="mt-2">
              <MetricCard
                icon={AwardIcon}
                label="Rank level"
                value={rankingChecked ? (ranking ? humanize(ranking.rank_level) : 'Not ranked yet') : '…'}
                hint={ranking ? `${ranking.completed_jobs} jobs completed` : 'Computed periodically, not in real time'}
              />
            </View>
            <View className="flex-row mt-3" style={{ gap: 10 }}>
              <View className="flex-1">
                <MetricCard icon={CheckCircleIcon} label="Completion" value={`${(summary?.avg_completion_rate ?? 0).toFixed(0)}%`} hint={`${summary?.total_jobs_completed ?? 0} jobs`} tone="success" tintValue />
              </View>
              <View className="flex-1">
                <MetricCard icon={ClockIcon} label="Avg. response" value={`${Math.round(summary?.avg_response_time_minutes ?? 0)} min`} hint={`${(summary?.avg_rating ?? 0).toFixed(1)}★ rating`} tone="amber" tintValue />
              </View>
            </View>

            <Text className="text-[15px] font-bold text-ink mt-7">Ranking signals</Text>
            {!ranking ? (
              <Text className="text-[13px] text-muted mt-2">Your ranking hasn't been computed yet. It updates periodically based on completed jobs, ratings and response time.</Text>
            ) : (
              <View className="mt-3 rounded-2xl bg-[#f5f5f5] p-4" style={{ gap: 8 }}>
                <Row label="Rank score" value={String(ranking.rank_score)} />
                <Row label="Recurring customers" value={String(ranking.recurring_customers)} />
                <Row label="Referrals" value={String(ranking.referrals)} />
                <Row label="Avg completion rate" value={`${ranking.avg_completion_rate.toFixed(0)}%`} />
                <Row label="Avg on-time rate" value={`${ranking.avg_on_time_rate.toFixed(0)}%`} />
                <Row label="Avg rating" value={`${ranking.avg_rating.toFixed(1)}★`} />
                {ranking.badges.length > 0 && (
                  <View className="flex-row flex-wrap gap-2 mt-1">
                    {ranking.badges.map((b) => (
                      <StatusBadge key={b} label={b} tone="primary" />
                    ))}
                  </View>
                )}
              </View>
            )}

            <Text className="text-[15px] font-bold text-ink mt-7 mb-3">Monthly KPI history</Text>
            {periods.length === 0 && <Text className="text-[13px] text-muted">No KPI periods recorded yet.</Text>}
            <View style={{ gap: 8 }}>
              {periods.map((p) => (
                <View key={p.id} className="rounded-2xl bg-[#f5f5f5] p-3.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[13px] font-semibold text-ink">
                      {fmtDate(p.period_start)} – {fmtDate(p.period_end)}
                    </Text>
                    <Text className="text-[13px] font-semibold text-primary">{fmtMoney(p.revenue)}</Text>
                  </View>
                  <Text className="text-[11px] text-muted mt-1">
                    {p.jobs_completed} completed · {p.jobs_cancelled} cancelled · {p.completion_rate.toFixed(0)}% completion · {p.avg_rating.toFixed(1)}★
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[13px] text-muted">{label}</Text>
      <Text className="text-[13px] font-semibold text-ink">{value}</Text>
    </View>
  )
}
