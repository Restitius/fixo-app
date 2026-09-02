import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import { fixoSdk, type BookingHistoryRow, type InvoiceRow, type LoyaltyTxn, type WalletTxn } from '../../lib/api-client'
import { fmtDate, fmtDateTime, fmtMoney, humanize } from '../../lib/format'

const TABS = ['Bookings', 'Wallet', 'Loyalty', 'Invoices'] as const
type Tab = (typeof TABS)[number]

const BOOKING_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  CLOSED: { bg: '#00B894' + '1A', color: '#00B894' },
  CANCELLED: { bg: '#FF6B6B' + '1A', color: '#FF6B6B' },
}
const DEFAULT_STATUS_STYLE = { bg: '#0984E3' + '1A', color: '#0984E3' }

export default function History() {
  const [tab, setTab] = useState<Tab>('Bookings')
  const [bookings, setBookings] = useState<BookingHistoryRow[] | null>(null)
  const [wallet, setWallet] = useState<WalletTxn[] | null>(null)
  const [loyalty, setLoyalty] = useState<LoyaltyTxn[] | null>(null)
  const [invoices, setInvoices] = useState<InvoiceRow[] | null>(null)

  useEffect(() => {
    fixoSdk.bookingHistory(undefined, 100, 0).then(setBookings).catch(() => setBookings([]))
    fixoSdk.walletTransactions(100, 0).then(setWallet).catch(() => setWallet([]))
    fixoSdk.loyaltyTransactions(100, 0).then(setLoyalty).catch(() => setLoyalty([]))
    fixoSdk.listInvoices(100, 0).then(setInvoices).catch(() => setInvoices([]))
  }, [])

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="History" back="/(tabs)/profile" />
      <View className="px-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {TABS.map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} className={`rounded-full px-4 py-2 ${tab === t ? 'bg-primary' : 'bg-[#f5f5f5]'}`}>
              <Text className={`text-[13px] font-semibold ${tab === t ? 'text-white' : 'text-ink'}`}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-col gap-3 px-6 mt-4">
          {tab === 'Bookings' &&
            (bookings === null ? (
              <View className="h-24 rounded-2xl bg-[#f5f5f5]" />
            ) : bookings.length === 0 ? (
              <Text className="text-center text-muted py-8 text-[14px]">No bookings yet.</Text>
            ) : (
              bookings.map((b) => {
                const style = BOOKING_STATUS_STYLE[b.status.toUpperCase()] ?? DEFAULT_STATUS_STYLE
                return (
                  <View key={b.booking_id} className="rounded-2xl border border-hairline p-4">
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1 min-w-0">
                        <Text numberOfLines={1} className="font-bold text-ink text-[14px]">
                          {b.service_name ?? 'Service'}
                        </Text>
                        <Text className="text-[12px] text-muted mt-0.5">{b.provider_name ?? '—'} · {fmtDate(b.created_at)}</Text>
                      </View>
                      <View className="items-end shrink-0">
                        <Text className="font-bold text-ink text-[14px]">{fmtMoney(b.agreed_amount, b.currency)}</Text>
                        <View className="mt-1 rounded-full px-2.5 py-0.5" style={{ backgroundColor: style.bg }}>
                          <Text className="text-[11px] font-semibold" style={{ color: style.color }}>{humanize(b.status)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )
              })
            ))}

          {tab === 'Wallet' &&
            (wallet === null ? (
              <View className="h-24 rounded-2xl bg-[#f5f5f5]" />
            ) : wallet.length === 0 ? (
              <Text className="text-center text-muted py-8 text-[14px]">No wallet activity yet.</Text>
            ) : (
              wallet.map((t, i) => (
                <View key={t.entry_id ?? i} className="flex-row items-center justify-between rounded-2xl border border-hairline p-4">
                  <View className="flex-1 min-w-0">
                    <Text numberOfLines={1} className="font-semibold text-ink text-[14px]">{humanize(t.entry_type)}</Text>
                    <Text className="text-[12px] text-muted mt-0.5">{fmtDateTime(t.created_at)}</Text>
                  </View>
                  <Text className={`font-bold text-[14px] shrink-0 ${t.entry_type === 'CREDIT' ? 'text-[#00B894]' : 'text-ink'}`}>
                    {t.entry_type === 'CREDIT' ? '+' : '-'}{fmtMoney(t.amount, t.currency)}
                  </Text>
                </View>
              ))
            ))}

          {tab === 'Loyalty' &&
            (loyalty === null ? (
              <View className="h-24 rounded-2xl bg-[#f5f5f5]" />
            ) : loyalty.length === 0 ? (
              <Text className="text-center text-muted py-8 text-[14px]">No points activity yet.</Text>
            ) : (
              loyalty.map((t, i) => (
                <View key={t.txn_id ?? i} className="flex-row items-center justify-between rounded-2xl border border-hairline p-4">
                  <View className="flex-1 min-w-0">
                    <Text numberOfLines={1} className="font-semibold text-ink text-[14px]">{humanize(t.activity)}</Text>
                    <Text className="text-[12px] text-muted mt-0.5">{fmtDateTime(t.created_at)}</Text>
                  </View>
                  <Text className={`font-bold text-[14px] shrink-0 ${t.points > 0 ? 'text-[#00B894]' : 'text-ink'}`}>
                    {t.points > 0 ? '+' : ''}{t.points} pts
                  </Text>
                </View>
              ))
            ))}

          {tab === 'Invoices' &&
            (invoices === null ? (
              <View className="h-24 rounded-2xl bg-[#f5f5f5]" />
            ) : invoices.length === 0 ? (
              <Text className="text-center text-muted py-8 text-[14px]">No invoices yet.</Text>
            ) : (
              invoices.map((inv) => (
                <View key={inv.invoice_id} className="flex-row items-center justify-between rounded-2xl border border-hairline p-4">
                  <View className="flex-1 min-w-0">
                    <Text numberOfLines={1} className="font-semibold text-ink text-[14px]">{inv.service_name ?? 'Service'}</Text>
                    <Text className="text-[12px] text-primary font-medium mt-0.5">{inv.invoice_number}</Text>
                  </View>
                  <Text className="font-bold text-ink text-[14px] shrink-0">{fmtMoney(inv.total_amount, inv.currency)}</Text>
                </View>
              ))
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
