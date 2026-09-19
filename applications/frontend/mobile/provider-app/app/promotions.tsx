// Promotions — real /providers/me/promotions/* endpoints, ported from
// web-provider's now-real promotions.tsx. Create/list/deactivate only —
// validate/redeem read like a checkout-time integration, not provider-
// side manual action (redeem has no amount check of its own and could
// desync usage counts outside a real transaction), so no UI for those.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import Button from '../components/Button'
import Field from '../components/Field'
import Select from '../components/Select'
import StatusBadge from '../components/StatusBadge'
import Sheet, { CenterModal } from '../components/Sheet'
import { PlusIcon, TagIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { promotionsApi, type DiscountType, type Promotion } from '../lib/api-client'
import { fmtDate, fmtMoney } from '../lib/format'

export default function Promotions() {
  const { access_token, loading: authLoading } = useAuth()
  const [promos, setPromos] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deactivating, setDeactivating] = useState<Promotion | null>(null)
  const [busy, setBusy] = useState(false)

  function load() {
    return promotionsApi.list(undefined, 50, 0).then(setPromos)
  }

  useEffect(() => {
    if (authLoading || !access_token) return
    load().finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  async function confirmDeactivate() {
    if (!deactivating) return
    setBusy(true)
    try {
      await promotionsApi.deactivate(deactivating.promo_id)
      await load()
      setDeactivating(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader
        title="Promotions"
        back="/(tabs)/profile"
        right={
          <Pressable onPress={() => setCreating(true)}>
            <PlusIcon size={20} color="#7210FF" />
          </Pressable>
        }
      />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && promos.length === 0 && <Text className="text-[13px] text-muted mt-4">No promotion codes yet. Tap + to create one.</Text>}
        <View className="mt-2" style={{ gap: 10 }}>
          {promos.map((p) => (
            <View key={p.promo_id} className="rounded-2xl bg-[#f5f5f5] p-4">
              <View className="flex-row items-center gap-3">
                <View className="items-center justify-center rounded-2xl bg-primary/10" style={{ width: 40, height: 40 }}>
                  <TagIcon size={18} color="#7210FF" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-[14px] font-semibold text-ink">{p.code}</Text>
                  <Text className="text-[12px] text-muted" numberOfLines={1}>
                    {p.name}
                  </Text>
                </View>
                <StatusBadge label={p.active ? 'Active' : 'Inactive'} tone={p.active ? 'success' : 'muted'} />
              </View>
              <Text className="text-[13px] font-semibold text-primary mt-2">{p.discount_type === 'PERCENT' ? `${p.discount_value}% off` : fmtMoney(p.discount_value)}</Text>
              <Text className="text-[11px] text-muted mt-0.5">
                Min {fmtMoney(p.min_amount)} · {p.used_count} used{p.usage_limit ? ` of ${p.usage_limit}` : ''}
              </Text>
              <Text className="text-[11px] text-muted">
                {fmtDate(p.valid_from)} – {fmtDate(p.valid_until)}
              </Text>
              {p.active && (
                <Pressable onPress={() => setDeactivating(p)} className="mt-2 self-start">
                  <Text className="text-[12px] font-semibold" style={{ color: '#DC2626' }}>
                    Deactivate
                  </Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <Sheet open={creating} onClose={() => setCreating(false)}>
        <CreateForm
          onSaved={async () => {
            setCreating(false)
            await load()
          }}
        />
      </Sheet>

      <CenterModal open={!!deactivating}>
        <Text className="text-[18px] font-bold text-ink">Deactivate {deactivating?.code}?</Text>
        <Text className="text-[14px] text-muted mt-2 text-center">This can't be undone.</Text>
        <View className="flex-row gap-3 w-full mt-6">
          <View className="flex-1">
            <Button variant="outline" onPress={() => setDeactivating(null)}>
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={() => void confirmDeactivate()} loading={busy}>
              Deactivate
            </Button>
          </View>
        </View>
      </CenterModal>
    </SafeAreaView>
  )
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function CreateForm({ onSaved }: { onSaved: () => void }) {
  const now = new Date()
  const inAMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENT')
  const [discountValue, setDiscountValue] = useState('10')
  const [minAmount, setMinAmount] = useState('0')
  const [validFrom, setValidFrom] = useState(toIsoDate(now))
  const [validUntil, setValidUntil] = useState(toIsoDate(inAMonth))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setError(null)
    if (code.trim().length < 2 || name.trim().length < 1) {
      setError('Code and name are required')
      return
    }
    const value = Number(discountValue)
    if (!discountValue || value < 0 || (discountType === 'PERCENT' && value > 100)) {
      setError(discountType === 'PERCENT' ? 'Enter a discount between 0 and 100' : 'Enter a valid discount value')
      return
    }
    setSaving(true)
    try {
      await promotionsApi.create({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        discount_type: discountType,
        discount_value: value,
        min_amount: Number(minAmount) || 0,
        valid_from: new Date(validFrom).toISOString(),
        valid_until: new Date(validUntil).toISOString(),
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create promotion')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View>
      <Text className="text-[18px] font-bold text-ink">Create promotion</Text>
      <View className="mt-4" style={{ gap: 12 }}>
        <Field label="Code (e.g. SAVE10)">
          <TextInput className="rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink" value={code} onChangeText={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" />
        </Field>
        <Field label="Name">
          <TextInput className="rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink" value={name} onChangeText={setName} />
        </Field>
        <Select value={discountType === 'PERCENT' ? 'Percent' : 'Fixed amount'} onChange={(v) => setDiscountType(v === 'Percent' ? 'PERCENT' : 'FIXED_AMOUNT')} options={['Percent', 'Fixed amount']} />
        <Field label="Discount value">
          <TextInput className="rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink" value={discountValue} onChangeText={setDiscountValue} keyboardType="numeric" />
        </Field>
        <Field label="Minimum order amount">
          <TextInput className="rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink" value={minAmount} onChangeText={setMinAmount} keyboardType="numeric" />
        </Field>
        <Field label="Valid from (YYYY-MM-DD)">
          <TextInput className="rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink" value={validFrom} onChangeText={setValidFrom} />
        </Field>
        <Field label="Valid until (YYYY-MM-DD)">
          <TextInput className="rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink" value={validUntil} onChangeText={setValidUntil} />
        </Field>
      </View>
      {error && (
        <Text className="text-[13px] mt-3" style={{ color: '#DC2626' }}>
          {error}
        </Text>
      )}
      <View className="mt-5">
        <Button onPress={() => void save()} loading={saving}>
          Create
        </Button>
      </View>
    </View>
  )
}
