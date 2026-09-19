// My Services — real catalog + per-service configuration + submit-for-
// approval, ported from web-provider's services.tsx.
import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import Button from '../components/Button'
import Select from '../components/Select'
import Sheet from '../components/Sheet'
import StatusBadge from '../components/StatusBadge'
import { PlusIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { onboardingApi, type CatalogServiceOption, type ProviderServiceConfig } from '../lib/api-client'
import { fmtMoney } from '../lib/format'

const fieldCls = 'rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink'

export default function Services() {
  const { access_token, loading: authLoading } = useAuth()
  const [configured, setConfigured] = useState<ProviderServiceConfig[]>([])
  const [catalog, setCatalog] = useState<CatalogServiceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [picker, setPicker] = useState<CatalogServiceOption | null>(null)

  function load() {
    return Promise.all([onboardingApi.myServices(), onboardingApi.serviceCatalog()]).then(([cfg, cat]) => {
      setConfigured(cfg)
      setCatalog(cat)
    })
  }

  useEffect(() => {
    if (authLoading || !access_token) return
    load().finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  const configuredIds = new Set(configured.map((s) => s.service_id))
  const available = catalog.filter((c) => !configuredIds.has(c.service_id))

  async function archive(serviceId: string) {
    await onboardingApi.removeService(serviceId)
    await load()
  }

  async function submit(serviceId: string) {
    await onboardingApi.submitService(serviceId)
    await load()
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader
        title="My services"
        back="/(tabs)/profile"
        right={
          available.length > 0 ? (
            <Pressable onPress={() => setPicker(available[0] ?? null)}>
              <PlusIcon size={20} color="#7210FF" />
            </Pressable>
          ) : undefined
        }
      />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && configured.length === 0 && <Text className="text-[13px] text-muted mt-4">No services configured yet. Tap + to add one.</Text>}

        <View className="mt-3" style={{ gap: 10 }}>
          {configured.map((s) => (
            <View key={s.service_id} className="rounded-2xl bg-[#f5f5f5] p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-[14px] font-semibold text-ink">{s.display_name || s.service_name}</Text>
                <StatusBadge status={s.status ?? 'DRAFT'} />
              </View>
              <Text className="text-[12px] text-muted mt-0.5">{s.category_name ?? '—'}</Text>
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-[12px] text-muted">{s.pricing_model}</Text>
                {s.minimum_charge ? <Text className="text-[13px] font-semibold text-primary">{fmtMoney(s.minimum_charge)}</Text> : null}
              </View>
              <View className="flex-row gap-4 mt-3">
                {(s.status === 'DRAFT' || s.status === 'REJECTED') && (
                  <Pressable onPress={() => void submit(s.service_id)}>
                    <Text className="text-primary text-[13px] font-semibold">Submit</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => void archive(s.service_id)}>
                  <Text className="text-[13px] font-semibold" style={{ color: '#DC2626' }}>
                    Remove
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {available.length > 0 && (
          <>
            <Text className="text-[15px] font-bold text-ink mt-7 mb-3">Available catalogue</Text>
            <View style={{ gap: 8 }}>
              {available.map((c) => (
                <Pressable key={c.service_id} onPress={() => setPicker(c)} className="flex-row items-center justify-between rounded-xl bg-[#f5f5f5] px-4 py-3">
                  <Text className="text-[13px] text-ink">
                    {c.name} <Text className="text-muted">· {c.category_name}</Text>
                  </Text>
                  <PlusIcon size={16} color="#6C7585" />
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Sheet open={!!picker} onClose={() => setPicker(null)}>
        {picker && (
          <ConfigureForm
            option={picker}
            onSaved={async () => {
              setPicker(null)
              await load()
            }}
          />
        )}
      </Sheet>
    </SafeAreaView>
  )
}

function ConfigureForm({ option, onSaved }: { option: CatalogServiceOption; onSaved: () => void }) {
  const [pricingModel, setPricingModel] = useState<'Quoted per job' | 'Fixed' | 'Hourly'>('Quoted per job')
  const [minimumCharge, setMinimumCharge] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const modelCode = useMemo(() => (pricingModel === 'Fixed' ? 'FIXED' : pricingModel === 'Hourly' ? 'HOURLY' : 'QUOTED'), [pricingModel])

  async function save() {
    setError(null)
    if (modelCode === 'FIXED' && (!minimumCharge || Number(minimumCharge) <= 0)) {
      setError('Minimum charge is required for fixed pricing')
      return
    }
    setSaving(true)
    try {
      await onboardingApi.configureService(option.service_id, {
        display_name: option.name,
        pricing_model: modelCode,
        minimum_charge: modelCode === 'FIXED' ? Number(minimumCharge) : undefined,
        duration_minutes: durationMinutes ? Number(durationMinutes) : undefined,
        is_emergency_available: false,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add service')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View>
      <Text className="text-[18px] font-bold text-ink">{option.name}</Text>
      <Text className="text-[13px] text-muted mt-0.5">{option.category_name}</Text>
      <View className="mt-4" style={{ gap: 12 }}>
        <Select value={pricingModel} onChange={(v) => setPricingModel(v as typeof pricingModel)} options={['Quoted per job', 'Fixed', 'Hourly']} />
        {modelCode === 'FIXED' && <TextInput className={fieldCls} placeholder="Minimum charge" keyboardType="numeric" value={minimumCharge} onChangeText={setMinimumCharge} />}
        <TextInput className={fieldCls} placeholder="Duration in minutes (optional)" keyboardType="numeric" value={durationMinutes} onChangeText={setDurationMinutes} />
      </View>
      {error && (
        <Text className="text-[13px] mt-3" style={{ color: '#DC2626' }}>
          {error}
        </Text>
      )}
      <View className="mt-5">
        <Button onPress={() => void save()} loading={saving}>
          Add service
        </Button>
      </View>
    </View>
  )
}
