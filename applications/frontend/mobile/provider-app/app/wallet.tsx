// Wallet — real /providers/me/wallet* + payout-method endpoints, ported
// from web-provider's wallet.tsx. entry_type values (WITHDRAWAL, BONUS,
// ADJUSTMENT, REFUND_DEDUCTION) confirmed against real ledger inserts —
// there's no "earning credit from a completed job" pathway in the
// backend yet, so that's not offered as a filter option here either.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import MetricCard from '../components/MetricCard'
import Button from '../components/Button'
import Field from '../components/Field'
import { WalletIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { payoutsApi, walletApi, type PayoutMethod, type WalletOverview, type WalletTransaction } from '../lib/api-client'
import { fmtMoney, humanize } from '../lib/format'

export default function Wallet() {
  const { access_token, loading: authLoading } = useAuth()
  const [overview, setOverview] = useState<WalletOverview | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [methods, setMethods] = useState<PayoutMethod[]>([])
  const [amount, setAmount] = useState('')
  const [methodId, setMethodId] = useState('')
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)

  function load() {
    return Promise.all([walletApi.overview(), walletApi.transactions(50), payoutsApi.listMethods()]).then(([ov, tx, m]) => {
      setOverview(ov)
      setTransactions(tx)
      setMethods(m)
      if (m[0]) setMethodId(m[0].method_id)
    })
  }

  useEffect(() => {
    if (authLoading || !access_token) return
    load().finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  const currency = overview?.currency ?? 'TZS'

  async function requestWithdrawal() {
    const value = Number(amount)
    if (!methodId || !value || value <= 0) return
    setWithdrawing(true)
    try {
      await payoutsApi.withdraw({ method_id: methodId, amount: value, currency })
      setAmount('')
      const [ov, tx] = await Promise.all([walletApi.overview(), walletApi.transactions(50)])
      setOverview(ov)
      setTransactions(tx)
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Wallet" back="/(tabs)/profile" />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && (
          <>
            <View className="rounded-3xl bg-primary p-6 mt-2">
              <Text className="text-white/85 text-[13px]">Available balance</Text>
              <Text className="text-white text-[30px] font-extrabold mt-1">{fmtMoney(overview?.available_balance ?? 0, currency)}</Text>
              <Text className="text-white/70 text-[12px] mt-1">Ready to withdraw</Text>
            </View>

            <View className="mt-3" style={{ gap: 10 }}>
              <MetricCard icon={WalletIcon} label="Pending clearance" value={fmtMoney(overview?.pending_balance ?? 0, currency)} hint="Clears after sign-off" tone="amber" tintValue />
              <MetricCard icon={WalletIcon} label="Reserved" value={fmtMoney(overview?.reserved_funds ?? 0, currency)} hint="Held for open disputes" tone="destructive" tintValue />
              <MetricCard icon={WalletIcon} label="Withdrawn" value={fmtMoney(overview?.withdrawals ?? 0, currency)} hint={`${fmtMoney(overview?.bonuses ?? 0, currency)} in bonuses`} tone="success" tintValue />
            </View>

            <Text className="text-[15px] font-bold text-ink mt-7">Withdraw</Text>
            {methods.length === 0 ? (
              <Pressable onPress={() => router.push('/payouts' as any)} className="mt-3">
                <Text className="text-[13px] text-muted">Add a payout method on the Payouts page before withdrawing.</Text>
              </Pressable>
            ) : (
              <View className="mt-3" style={{ gap: 10 }}>
                <Field label={`Amount (${currency})`}>
                  <TextInput keyboardType="numeric" value={amount} onChangeText={setAmount} className="rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink" />
                </Field>
                <View style={{ gap: 6 }}>
                  {methods.map((m) => (
                    <Pressable
                      key={m.method_id}
                      onPress={() => setMethodId(m.method_id)}
                      className="flex-row items-center justify-between rounded-2xl px-4 py-3"
                      style={{ backgroundColor: methodId === m.method_id ? 'rgba(114,16,255,0.08)' : '#f5f5f5' }}
                    >
                      <Text className="text-[13px] text-ink">
                        {humanize(m.method_type)} — {m.mobile_number || m.account_number || m.provider_name}
                      </Text>
                      {methodId === m.method_id && <View className="rounded-full bg-primary" style={{ width: 8, height: 8 }} />}
                    </Pressable>
                  ))}
                </View>
                <Button onPress={() => void requestWithdrawal()} loading={withdrawing}>
                  Request withdrawal
                </Button>
              </View>
            )}

            <Text className="text-[15px] font-bold text-ink mt-7">Transactions</Text>
            <View className="mt-3" style={{ gap: 8 }}>
              {transactions.length === 0 && <Text className="text-[13px] text-muted">No transactions yet.</Text>}
              {transactions.map((t) => (
                <View key={t.entry_id} className="rounded-2xl bg-[#f5f5f5] p-3.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[13px] font-semibold text-ink">{humanize(t.entry_type)}</Text>
                    <Text className="text-[13px] font-semibold" style={{ color: t.amount < 0 ? '#DC2626' : '#00B894' }}>
                      {fmtMoney(t.amount, t.currency)}
                    </Text>
                  </View>
                  <Text className="text-[12px] text-muted mt-0.5">{t.description ?? t.booking_number ?? '—'}</Text>
                  <Text className="text-[11px] text-muted mt-0.5">{t.created_at.slice(0, 10)}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
