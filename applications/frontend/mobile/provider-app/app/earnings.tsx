// Earnings — real /providers/me/earnings/* endpoints, ported from
// web-provider's real (post-rewrite) earnings.tsx. Same honest scope as
// web: only a balance summary + the real invoice transaction ledger — no
// monthly trend chart, revenue-by-service, conversion funnel, or
// promotions, since earnings_router.py doesn't support any of those (they'd
// need entirely different, unexplored backend domains).
import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import MetricCard from '../components/MetricCard'
import StatusBadge from '../components/StatusBadge'
import { ArrowUpRightIcon, CalendarIcon, WalletIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { earningsApi, type EarningsSummary, type EarningsTransaction } from '../lib/api-client'
import { fmtDate, fmtMoney } from '../lib/format'

export default function Earnings() {
  const { access_token, loading: authLoading } = useAuth()
  const [summary, setSummary] = useState<EarningsSummary | null>(null)
  const [transactions, setTransactions] = useState<EarningsTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !access_token) return
    Promise.all([earningsApi.summary(), earningsApi.transactions(50, 0)])
      .then(([s, t]) => {
        setSummary(s)
        setTransactions(t)
      })
      .finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Earnings" back="/(tabs)/profile" />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && (
          <>
            <View className="flex-row mt-2" style={{ gap: 10 }}>
              <View className="flex-1">
                <MetricCard icon={WalletIcon} label="Lifetime" value={fmtMoney(summary?.total_earnings ?? 0, summary?.currency)} hint="Issued + paid" />
              </View>
              <View className="flex-1">
                <MetricCard icon={ArrowUpRightIcon} label="Available" value={fmtMoney(summary?.available_balance ?? 0, summary?.currency)} hint="Paid invoices" tone="success" tintValue />
              </View>
            </View>
            <View className="flex-row mt-3" style={{ gap: 10 }}>
              <View className="flex-1">
                <MetricCard icon={CalendarIcon} label="Pending" value={fmtMoney(summary?.pending_earnings ?? 0, summary?.currency)} hint="Not yet paid" tone="amber" tintValue />
              </View>
              <View className="flex-1">
                <MetricCard icon={WalletIcon} label="Withdrawn" value={fmtMoney(summary?.withdrawn_amount ?? 0, summary?.currency)} hint="To payout methods" />
              </View>
            </View>

            <Text className="text-[15px] font-bold text-ink mt-7">This period</Text>
            <View className="mt-3 rounded-2xl bg-[#f5f5f5] p-4" style={{ gap: 8 }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] text-muted">Today</Text>
                <Text className="text-[13px] font-semibold text-ink">{fmtMoney(summary?.views.today ?? 0, summary?.currency)}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] text-muted">This week</Text>
                <Text className="text-[13px] font-semibold text-ink">{fmtMoney(summary?.views.this_week ?? 0, summary?.currency)}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] text-muted">This month</Text>
                <Text className="text-[13px] font-semibold text-ink">{fmtMoney(summary?.views.this_month ?? 0, summary?.currency)}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] text-muted">This year</Text>
                <Text className="text-[13px] font-semibold text-ink">{fmtMoney(summary?.views.this_year ?? 0, summary?.currency)}</Text>
              </View>
            </View>

            <Text className="text-[15px] font-bold text-ink mt-7 mb-3">Invoice transactions</Text>
            {transactions.length === 0 && <Text className="text-[13px] text-muted">No transactions yet.</Text>}
            <View style={{ gap: 8 }}>
              {transactions.map((t) => (
                <View key={t.invoice_id} className="rounded-2xl bg-[#f5f5f5] p-3.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[13px] font-semibold text-ink">{t.invoice_number}</Text>
                    <StatusBadge status={t.status} />
                  </View>
                  <Text className="text-[12px] text-muted mt-0.5">
                    {t.customer_name} · {t.service_name}
                  </Text>
                  <View className="flex-row items-center justify-between mt-1">
                    <Text className="text-[11px] text-muted">{t.paid_at ? fmtDate(t.paid_at) : '—'}</Text>
                    <Text className="text-[13px] font-semibold text-primary">{fmtMoney(t.amount, t.currency)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
