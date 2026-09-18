// Payouts — real /providers/me/payouts/* endpoints, ported from
// web-provider's payouts.tsx. No "payout schedule" panel — the real
// backend only supports on-demand withdrawal, no scheduling.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import MetricCard from '../components/MetricCard'
import StatusBadge from '../components/StatusBadge'
import Button from '../components/Button'
import Select from '../components/Select'
import { WalletIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { payoutsApi, type PayoutMethod, type PayoutRow } from '../lib/api-client'
import { fmtMoney, humanize } from '../lib/format'

const fieldCls = 'rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink'

export default function Payouts() {
  const { access_token, loading: authLoading } = useAuth()
  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [methods, setMethods] = useState<PayoutMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [methodType, setMethodType] = useState<'Mobile money' | 'Bank account'>('Mobile money')
  const [providerName, setProviderName] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (authLoading || !access_token) return
    Promise.all([payoutsApi.list(), payoutsApi.listMethods()])
      .then(([p, m]) => {
        setPayouts(p)
        setMethods(m)
      })
      .finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  const paid = payouts.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
  const processing = payouts.filter((p) => p.status === 'PROCESSING').reduce((s, p) => s + p.amount, 0)

  async function addMethod() {
    setSaving(true)
    try {
      const added = await payoutsApi.addMethod({
        method_type: methodType === 'Mobile money' ? 'MOBILE_MONEY' : 'BANK',
        provider_name: providerName || undefined,
        account_holder: accountHolder || undefined,
        account_number: accountNumber || undefined,
        mobile_number: mobileNumber || undefined,
        currency: 'TZS',
        is_default: methods.length === 0,
      })
      setMethods((prev) => [...prev, added])
      setShowAdd(false)
      setProviderName('')
      setAccountHolder('')
      setAccountNumber('')
      setMobileNumber('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Payouts" back="/(tabs)/profile" />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && (
          <>
            <View className="mt-2" style={{ gap: 10 }}>
              <MetricCard icon={WalletIcon} label="Processing" value={fmtMoney(processing)} hint="Settling now" tone="amber" tintValue />
              <MetricCard icon={WalletIcon} label="Paid out" value={fmtMoney(paid)} hint="All time" tone="success" tintValue />
            </View>

            <View className="flex-row items-center justify-between mt-7">
              <Text className="text-[15px] font-bold text-ink">Payout methods</Text>
              <Pressable onPress={() => setShowAdd((v) => !v)}>
                <Text className="text-primary font-semibold text-[13px]">Add</Text>
              </Pressable>
            </View>
            <View className="mt-3" style={{ gap: 8 }}>
              {methods.length === 0 && <Text className="text-[13px] text-muted">No payout methods yet.</Text>}
              {methods.map((m) => (
                <View key={m.method_id} className="rounded-2xl bg-[#f5f5f5] p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[14px] font-semibold text-ink">{humanize(m.method_type)}</Text>
                    {m.is_default && <StatusBadge label="Default" tone="success" />}
                  </View>
                  <Text className="text-[12px] text-muted mt-0.5">{m.mobile_number || m.account_number || m.provider_name}</Text>
                  <Text className="text-[12px] text-muted">
                    {m.account_holder ?? m.provider_name} · {m.currency}
                  </Text>
                </View>
              ))}
            </View>

            {showAdd && (
              <View className="rounded-2xl border border-hairline p-4 mt-3" style={{ gap: 10 }}>
                <Select value={methodType} onChange={(v) => setMethodType(v as 'Mobile money' | 'Bank account')} options={['Mobile money', 'Bank account']} />
                {methodType === 'Mobile money' ? (
                  <>
                    <TextInput className={fieldCls} placeholder="Provider (M-Pesa, Tigo Pesa…)" value={providerName} onChangeText={setProviderName} />
                    <TextInput className={fieldCls} placeholder="Mobile number" value={mobileNumber} onChangeText={setMobileNumber} keyboardType="phone-pad" />
                  </>
                ) : (
                  <>
                    <TextInput className={fieldCls} placeholder="Account holder" value={accountHolder} onChangeText={setAccountHolder} />
                    <TextInput className={fieldCls} placeholder="Bank name" value={providerName} onChangeText={setProviderName} />
                    <TextInput className={fieldCls} placeholder="Account number" value={accountNumber} onChangeText={setAccountNumber} />
                  </>
                )}
                <Button onPress={() => void addMethod()} loading={saving}>
                  Save method
                </Button>
              </View>
            )}

            <Text className="text-[15px] font-bold text-ink mt-7">Payout history</Text>
            <View className="mt-3" style={{ gap: 8 }}>
              {payouts.length === 0 && <Text className="text-[13px] text-muted">No payouts requested yet.</Text>}
              {payouts.map((p) => (
                <View key={p.payout_id} className="rounded-2xl bg-[#f5f5f5] p-3.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[13px] font-semibold text-ink">{p.payout_number}</Text>
                    <StatusBadge status={p.status} />
                  </View>
                  <View className="flex-row items-center justify-between mt-1">
                    <Text className="text-[12px] text-muted">{p.destination ?? (p.method_type ? humanize(p.method_type) : '—')}</Text>
                    <Text className="text-[13px] font-semibold text-ink">{fmtMoney(p.amount, p.currency)}</Text>
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
