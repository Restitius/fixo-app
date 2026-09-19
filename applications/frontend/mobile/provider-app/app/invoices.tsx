// Invoices — real /providers/me/invoices/* endpoints, ported from
// web-provider's invoices.tsx. Real model is periodic earnings
// STATEMENTS (gross/commission/tax/net per period), not per-booking
// customer invoices — provider_invoices_service.py's own docstring says
// no generation/delivery happens in this phase, so no download action.
import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import MetricCard from '../components/MetricCard'
import StatusBadge from '../components/StatusBadge'
import { FileTextIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { invoicesApi, type InvoiceRow, type InvoiceSummary } from '../lib/api-client'
import { fmtMoney } from '../lib/format'

export default function Invoices() {
  const { access_token, loading: authLoading } = useAuth()
  const [rows, setRows] = useState<InvoiceRow[]>([])
  const [summary, setSummary] = useState<InvoiceSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !access_token) return
    Promise.all([invoicesApi.list(), invoicesApi.summary()])
      .then(([r, s]) => {
        setRows(r)
        setSummary(s)
      })
      .finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Invoices" back="/(tabs)/profile" />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && summary && (
          <View className="mt-2" style={{ gap: 10 }}>
            <MetricCard icon={FileTextIcon} label="Statements" value={String(summary.total_count)} hint="All time" />
            <MetricCard icon={FileTextIcon} label="Net" value={fmtMoney(summary.total_net)} hint="After commission + tax" tone="success" tintValue />
            {summary.overdue_count > 0 && (
              <MetricCard icon={FileTextIcon} label="Overdue" value={String(summary.overdue_count)} hint="Need attention" tone="destructive" tintValue />
            )}
          </View>
        )}

        <Text className="text-[15px] font-bold text-ink mt-7">Statements</Text>
        <View className="mt-3" style={{ gap: 8 }}>
          {!loading && rows.length === 0 && <Text className="text-[13px] text-muted">No statements yet.</Text>}
          {rows.map((i) => (
            <View key={i.id} className="rounded-2xl bg-[#f5f5f5] p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-[14px] font-semibold text-ink">{i.invoice_number}</Text>
                <StatusBadge status={i.status.toUpperCase()} />
              </View>
              <Text className="text-[12px] text-muted mt-0.5">
                {i.period_start} – {i.period_end}
              </Text>
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-[12px] text-muted">Gross {fmtMoney(i.gross_amount, i.currency)}</Text>
                <Text className="text-[15px] font-extrabold text-primary">{fmtMoney(i.net_amount, i.currency)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
