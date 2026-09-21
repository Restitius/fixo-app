// Quotations — real /providers/quotations endpoints, ported from
// web-provider's quotes.tsx (list + detail + submit/withdraw). Also wires
// the actual quote-creation call (quotesApi.save, POST .../{requestId}) —
// web-provider's own version links here from "Send quotation" but never
// calls it, so creating a quote was a real dead end there; the mobile
// version completes it via a requestId param, since the endpoint already
// exists and is already typed in the shared api-client.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import StatusBadge from '../components/StatusBadge'
import Button from '../components/Button'
import Field from '../components/Field'
import Sheet from '../components/Sheet'
import { useAuth } from '../lib/auth-context'
import { quotesApi, type QuoteDetail, type QuoteRow } from '../lib/api-client'
import { fmtMoney } from '../lib/format'

const fieldCls = 'rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink'

export default function Quotes() {
  // Root-level routes (outside the (tabs) group) aren't behind the tab
  // layout's auth guard, so a direct reload/deep-link can mount before
  // AuthProvider finishes restoring the token from AsyncStorage — firing
  // API calls with no bearer token yet. Real bug hit live while testing:
  // reloading straight into /quotes threw "Missing bearer token" (401)
  // because this screen's fetch ran before that restore completed. Every
  // root-level screen from here on needs this same guard.
  const { access_token, loading: authLoading } = useAuth()
  const { requestId } = useLocalSearchParams<{ requestId?: string }>()
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [selected, setSelected] = useState<QuoteDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [showCreate, setShowCreate] = useState(!!requestId)

  function load() {
    return quotesApi.list().then(setQuotes)
  }

  useEffect(() => {
    if (authLoading || !access_token) return
    load().finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  async function openDetail(quoteId: string) {
    const detail = await quotesApi.get(quoteId)
    setSelected(detail)
  }

  async function submit(quoteId: string) {
    setBusy(true)
    try {
      const updated = await quotesApi.submit(quoteId)
      setSelected(updated)
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function withdraw(quoteId: string) {
    setBusy(true)
    try {
      const updated = await quotesApi.withdraw(quoteId)
      setSelected(updated)
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader
        title="Quotations"
        right={
          requestId ? (
            <Pressable onPress={() => setShowCreate(true)}>
              <Text className="text-primary font-semibold text-[14px]">New quote</Text>
            </Pressable>
          ) : undefined
        }
      />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-[13px] text-muted mt-1">New quotes are created from a request's "Send quotation" action.</Text>

        {!loading && quotes.length === 0 && (
          <View className="items-center pt-16">
            <Text className="text-[15px] text-muted">No quotations yet.</Text>
          </View>
        )}

        <View className="mt-4" style={{ gap: 10 }}>
          {quotes.map((q) => (
            <Pressable
              key={q.quote_id}
              onPress={() => void openDetail(q.quote_id)}
              className="rounded-2xl border border-hairline p-4"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-[14px] font-semibold text-ink">{q.request_number}</Text>
                <StatusBadge status={q.status} />
              </View>
              <Text className="text-[13px] text-muted mt-0.5">{q.service_name}</Text>
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-[16px] font-extrabold text-primary">{fmtMoney(q.total_amount, q.currency)}</Text>
                <Text className="text-[12px] text-muted">{q.valid_until ? `Valid until ${q.valid_until}` : ''}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Sheet open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <View>
            <View className="flex-row items-center justify-between">
              <Text className="text-[18px] font-bold text-ink">Quote for {selected.request_number}</Text>
              <StatusBadge status={selected.status} />
            </View>
            <Text className="text-[14px] text-muted mt-1">{selected.service_name}</Text>

            <View className="mt-4" style={{ gap: 8 }}>
              {selected.labour_cost != null && <QuoteLine label="Labour" value={fmtMoney(selected.labour_cost, selected.currency)} />}
              {selected.materials_cost != null && <QuoteLine label="Materials" value={fmtMoney(selected.materials_cost, selected.currency)} />}
              {selected.transport_cost != null && <QuoteLine label="Transport" value={fmtMoney(selected.transport_cost, selected.currency)} />}
              {selected.tax_amount != null && <QuoteLine label="Tax" value={fmtMoney(selected.tax_amount, selected.currency)} />}
              {selected.discount_amount != null && <QuoteLine label="Discount" value={`- ${fmtMoney(selected.discount_amount, selected.currency)}`} />}
              <View className="flex-row items-center justify-between pt-2 border-t border-hairline mt-1">
                <Text className="text-[14px] font-semibold text-ink">Total</Text>
                <Text className="text-[18px] font-extrabold text-primary">{fmtMoney(selected.total_amount, selected.currency)}</Text>
              </View>
            </View>

            <View className="mt-5 flex-row gap-2">
              {selected.status === 'DRAFT' && (
                <Pressable onPress={() => void submit(selected.quote_id)} disabled={busy} className="rounded-xl bg-primary px-5 py-3" style={{ opacity: busy ? 0.5 : 1 }}>
                  <Text className="text-white text-[14px] font-semibold">Send to customer</Text>
                </Pressable>
              )}
              {(selected.status === 'SUBMITTED' || selected.status === 'VIEWED') && (
                <Pressable onPress={() => void withdraw(selected.quote_id)} disabled={busy} className="rounded-xl px-5 py-3" style={{ opacity: busy ? 0.5 : 1 }}>
                  <Text className="text-[14px] font-semibold" style={{ color: '#DC2626' }}>
                    Withdraw
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </Sheet>

      {requestId && (
        <Sheet
          open={showCreate}
          onClose={() => setShowCreate(false)}
        >
          <CreateQuoteForm
            requestId={requestId}
            onSaved={async () => {
              setShowCreate(false)
              await load()
            }}
          />
        </Sheet>
      )}
    </SafeAreaView>
  )
}

function QuoteLine({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[13px] text-muted">{label}</Text>
      <Text className="text-[13px] font-semibold text-ink">{value}</Text>
    </View>
  )
}

function CreateQuoteForm({ requestId, onSaved }: { requestId: string; onSaved: () => void }) {
  const [totalAmount, setTotalAmount] = useState('')
  const [labourCost, setLabourCost] = useState('')
  const [materialsCost, setMaterialsCost] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setError(null)
    const total = Number(totalAmount)
    if (!total || total <= 0) {
      setError('Enter a valid total amount')
      return
    }
    setSaving(true)
    try {
      await quotesApi.save(requestId, {
        total_amount: total,
        labour_cost: labourCost ? Number(labourCost) : undefined,
        materials_cost: materialsCost ? Number(materialsCost) : undefined,
        notes: notes || undefined,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save quote')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View>
      <Text className="text-[18px] font-bold text-ink">New quotation</Text>
      <View className="mt-4" style={{ gap: 12 }}>
        <Field label="Total amount">
          <TextInput className={fieldCls} keyboardType="numeric" value={totalAmount} onChangeText={setTotalAmount} />
        </Field>
        <Field label="Labour cost (optional)">
          <TextInput className={fieldCls} keyboardType="numeric" value={labourCost} onChangeText={setLabourCost} />
        </Field>
        <Field label="Materials cost (optional)">
          <TextInput className={fieldCls} keyboardType="numeric" value={materialsCost} onChangeText={setMaterialsCost} />
        </Field>
        <Field label="Notes (optional)">
          <TextInput className={fieldCls} value={notes} onChangeText={setNotes} multiline />
        </Field>
      </View>
      {error && (
        <Text className="text-[13px] mt-3" style={{ color: '#DC2626' }}>
          {error}
        </Text>
      )}
      <View className="mt-5">
        <Button onPress={() => void save()} loading={saving}>
          Save as draft
        </Button>
      </View>
    </View>
  )
}
