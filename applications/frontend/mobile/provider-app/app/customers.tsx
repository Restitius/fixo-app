// Customers — real /providers/me/business-customers/* CRUD, ported from
// web-provider's now-real customers.tsx. A negotiated-rate domain, not
// general customer relationship tracking — no jobs/last-service/revenue
// fields exist on the real record. Adding one requires picking a real
// customer_id from the provider's own booking history (no customer search
// endpoint exists), same as web.
import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import Button from '../components/Button'
import Field from '../components/Field'
import Select from '../components/Select'
import StatusBadge from '../components/StatusBadge'
import Sheet, { CenterModal } from '../components/Sheet'
import { PlusIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { bookingsApi, businessCustomersApi, type BookingFeedRow, type BusinessCustomer, type NegotiatedRateType } from '../lib/api-client'

const fieldCls = 'rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink'

export default function Customers() {
  const { access_token, loading: authLoading } = useAuth()
  const [customers, setCustomers] = useState<BusinessCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [deactivating, setDeactivating] = useState<BusinessCustomer | null>(null)
  const [busy, setBusy] = useState(false)

  function load() {
    return businessCustomersApi.list(undefined, 50, 0).then(setCustomers)
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
      await businessCustomersApi.deactivate(deactivating.record_id)
      await load()
      setDeactivating(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader
        title="Customers"
        back="/(tabs)/profile"
        right={
          <Pressable onPress={() => setAdding(true)}>
            <PlusIcon size={20} color="#7210FF" />
          </Pressable>
        }
      />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && customers.length === 0 && <Text className="text-[13px] text-muted mt-4">No business customers yet. Add one from a customer you've served before.</Text>}
        <View className="mt-2" style={{ gap: 10 }}>
          {customers.map((c) => (
            <View key={c.record_id} className="rounded-2xl bg-[#f5f5f5] p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-[14px] font-semibold text-ink">{c.full_name}</Text>
                <StatusBadge label={c.status} tone={c.status === 'ACTIVE' ? 'success' : 'muted'} />
              </View>
              <Text className="text-[12px] text-muted mt-0.5">{c.company_name || '—'}</Text>
              <Text className="text-[12px] text-ink mt-1">{c.negotiated_rate_type === 'PERCENT_DISCOUNT' ? `${c.negotiated_rate_value}% off` : `Fixed ${c.negotiated_rate_value}`}</Text>
              {c.status === 'ACTIVE' && (
                <Pressable onPress={() => setDeactivating(c)} className="mt-2 self-start">
                  <Text className="text-[12px] font-semibold" style={{ color: '#DC2626' }}>
                    Deactivate
                  </Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>

        <Text className="text-[15px] font-bold text-ink mt-7 mb-2">Business account tools</Text>
        <View style={{ gap: 6 }}>
          <Text className="text-[13px] text-muted">Negotiate a per-customer discount or fixed rate.</Text>
          <Text className="text-[13px] text-muted">Track which repeat customers get special pricing.</Text>
          <Text className="text-[13px] text-muted">Deactivate a deal any time — it won't apply to future bookings.</Text>
        </View>
      </ScrollView>

      <Sheet open={adding} onClose={() => setAdding(false)}>
        <AddForm
          onSaved={async () => {
            setAdding(false)
            await load()
          }}
        />
      </Sheet>

      <CenterModal open={!!deactivating}>
        <Text className="text-[18px] font-bold text-ink">Deactivate {deactivating?.full_name}?</Text>
        <Text className="text-[14px] text-muted mt-2 text-center">This won't apply to future bookings.</Text>
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

function AddForm({ onSaved }: { onSaved: () => void }) {
  const [bookings, setBookings] = useState<BookingFeedRow[]>([])
  const [customerName, setCustomerName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [rateType, setRateType] = useState<NegotiatedRateType>('PERCENT_DISCOUNT')
  const [rateValue, setRateValue] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    bookingsApi.feed(undefined, 50, 0).then(setBookings)
  }, [])

  const uniqueCustomers = useMemo(() => {
    const seen = new Map<string, BookingFeedRow>()
    for (const b of bookings) if (!seen.has(b.customer_id)) seen.set(b.customer_id, b)
    return Array.from(seen.values())
  }, [bookings])

  async function save() {
    setError(null)
    const selected = uniqueCustomers.find((b) => b.customer_name === (customerName || uniqueCustomers[0]?.customer_name))
    if (!selected) {
      setError('Select a customer')
      return
    }
    const value = Number(rateValue)
    if (!rateValue || value < 0 || (rateType === 'PERCENT_DISCOUNT' && value > 100)) {
      setError(rateType === 'PERCENT_DISCOUNT' ? 'Enter a discount between 0 and 100' : 'Enter a valid rate value')
      return
    }
    setSaving(true)
    try {
      await businessCustomersApi.create({
        customer_id: selected.customer_id,
        company_name: companyName || undefined,
        negotiated_rate_type: rateType,
        negotiated_rate_value: value,
        notes: notes || undefined,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add business customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View>
      <Text className="text-[18px] font-bold text-ink">Add business customer</Text>
      <Text className="text-[12px] text-muted mt-1">Only customers you've served before can be added.</Text>
      <View className="mt-4" style={{ gap: 12 }}>
        {uniqueCustomers.length === 0 ? (
          <Text className="text-[13px] text-muted">No booking history yet — complete a job before adding a business customer.</Text>
        ) : (
          <Select value={customerName || uniqueCustomers[0]!.customer_name} onChange={setCustomerName} options={uniqueCustomers.map((b) => b.customer_name)} />
        )}
        <Field label="Company name (optional)">
          <TextInput className={fieldCls} value={companyName} onChangeText={setCompanyName} />
        </Field>
        <Select value={rateType === 'PERCENT_DISCOUNT' ? 'Percent discount' : 'Fixed rate'} onChange={(v) => setRateType(v === 'Percent discount' ? 'PERCENT_DISCOUNT' : 'FIXED_RATE')} options={['Percent discount', 'Fixed rate']} />
        <Field label={rateType === 'PERCENT_DISCOUNT' ? 'Discount % (0-100)' : 'Fixed rate amount'}>
          <TextInput className={fieldCls} value={rateValue} onChangeText={setRateValue} keyboardType="numeric" />
        </Field>
        <Field label="Notes (optional)">
          <TextInput className={fieldCls} value={notes} onChangeText={setNotes} multiline numberOfLines={2} />
        </Field>
      </View>
      {error && (
        <Text className="text-[13px] mt-3" style={{ color: '#DC2626' }}>
          {error}
        </Text>
      )}
      <View className="mt-5">
        <Button onPress={() => void save()} loading={saving} disabled={uniqueCustomers.length === 0}>
          Save
        </Button>
      </View>
    </View>
  )
}
