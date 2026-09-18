// Pricing — real per-service structured pricing (5 mutually exclusive
// models), ported from web-provider's pricing.tsx.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import Button from '../components/Button'
import Select from '../components/Select'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../lib/auth-context'
import { onboardingApi, type ProviderServiceConfig, type ProviderServicePricing } from '../lib/api-client'
import { fmtMoney } from '../lib/format'

const PRICING_MODELS = [
  { code: 'FIXED', label: 'Fixed price' },
  { code: 'STARTING', label: 'Starting from' },
  { code: 'HOURLY', label: 'Hourly rate' },
  { code: 'INSPECTION_THEN_QUOTE', label: 'Inspection, then quote' },
  { code: 'CUSTOM_QUOTATION', label: 'Custom quotation only' },
] as const

const fieldCls = 'rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink'

type Draft = Partial<ProviderServicePricing>

export default function Pricing() {
  const { access_token, loading: authLoading } = useAuth()
  const [services, setServices] = useState<ProviderServiceConfig[]>([])
  const [pricing, setPricing] = useState<Record<string, ProviderServicePricing>>({})
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !access_token) return
    Promise.all([onboardingApi.myServices(), onboardingApi.listPricing()])
      .then(([svcs, prices]) => {
        setServices(svcs)
        const byId: Record<string, ProviderServicePricing> = {}
        for (const p of prices) byId[p.service_id] = p
        setPricing(byId)
        const validModels: readonly string[] = PRICING_MODELS.map((m) => m.code)
        const initial: Record<string, Draft> = {}
        for (const s of svcs) {
          initial[s.service_id] = byId[s.service_id] ?? {
            pricing_model: validModels.includes(s.pricing_model) ? s.pricing_model : 'CUSTOM_QUOTATION',
            currency: 'TZS',
            is_negotiable: false,
          }
        }
        setDrafts(initial)
      })
      .finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  function updateDraft(serviceId: string, patch: Draft) {
    setDrafts((d) => ({ ...d, [serviceId]: { ...d[serviceId], ...patch } }))
  }

  async function save(serviceId: string) {
    const draft = drafts[serviceId]
    if (!draft?.pricing_model) return
    setSavingId(serviceId)
    try {
      const saved = await onboardingApi.upsertPricing(serviceId, draft)
      setPricing((p) => ({ ...p, [serviceId]: saved }))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Pricing" back="/(tabs)/profile" />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && services.length === 0 && <Text className="text-[13px] text-muted mt-4">You haven't configured any services yet. Add services first.</Text>}

        <View className="mt-2" style={{ gap: 16 }}>
          {services.map((s) => {
            const draft = drafts[s.service_id] ?? {}
            const model = draft.pricing_model ?? 'CUSTOM_QUOTATION'
            const existing = pricing[s.service_id]
            const modelLabel = PRICING_MODELS.find((m) => m.code === model)?.label ?? model
            return (
              <View key={s.service_id} className="rounded-2xl bg-[#f5f5f5] p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[14px] font-semibold text-ink">{s.display_name || s.service_id}</Text>
                  {existing && <StatusBadge label="Priced" tone="success" />}
                </View>

                <View className="mt-3" style={{ gap: 8 }}>
                  <Select value={modelLabel} onChange={(v) => updateDraft(s.service_id, { pricing_model: PRICING_MODELS.find((m) => m.label === v)?.code })} options={PRICING_MODELS.map((m) => m.label)} />

                  {model === 'FIXED' && <AmountField label="Price" value={draft.base_amount} onChange={(v) => updateDraft(s.service_id, { base_amount: v })} />}
                  {model === 'STARTING' && <AmountField label="Starting from" value={draft.from_amount} onChange={(v) => updateDraft(s.service_id, { from_amount: v })} />}
                  {model === 'HOURLY' && (
                    <>
                      <AmountField label="Hourly rate" value={draft.hourly_rate} onChange={(v) => updateDraft(s.service_id, { hourly_rate: v })} />
                      <AmountField label="Minimum hours (optional)" value={draft.minimum_hours} onChange={(v) => updateDraft(s.service_id, { minimum_hours: v })} />
                    </>
                  )}
                  {model === 'INSPECTION_THEN_QUOTE' && (
                    <AmountField label="Inspection fee (optional)" value={draft.inspection_fee} onChange={(v) => updateDraft(s.service_id, { inspection_fee: v })} />
                  )}
                </View>

                {existing?.base_amount != null && <Text className="text-[12px] text-muted mt-2">Currently: {fmtMoney(existing.base_amount)}</Text>}

                <View className="mt-3">
                  <Button onPress={() => void save(s.service_id)} loading={savingId === s.service_id}>
                    Save pricing
                  </Button>
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function AmountField({ label, value, onChange }: { label: string; value: number | null | undefined; onChange: (v: number | undefined) => void }) {
  return (
    <View>
      <Text className="text-[12px] text-muted mb-1">{label}</Text>
      <TextInput className={fieldCls} keyboardType="numeric" value={value != null ? String(value) : ''} onChangeText={(v) => onChange(v === '' ? undefined : Number(v))} />
    </View>
  )
}
