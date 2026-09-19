// Disputes — real /providers/me/disputes/* endpoints, ported from web-
// provider's now-real disputes.tsx. Raw/unwrapped responses (getRaw/
// postRaw) — this router never calls ok(). Resolution is platform-side;
// the response composer disables once a dispute is resolved/withdrawn,
// matching the real backend's rejection of responses on closed disputes.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import Select from '../components/Select'
import StatusBadge from '../components/StatusBadge'
import Sheet from '../components/Sheet'
import { SendIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { disputesApi, type Dispute, type DisputeEvidenceItem, type DisputeResponse, type DisputeResponseKind } from '../lib/api-client'
import { fmtDateTime, humanize } from '../lib/format'

function statusTone(status: string): 'success' | 'amber' | 'muted' | 'destructive' {
  const s = status.toLowerCase()
  if (s === 'resolved') return 'success'
  if (s === 'withdrawn') return 'muted'
  if (s === 'under_review') return 'amber'
  return 'destructive'
}

export default function Disputes() {
  const { access_token, loading: authLoading } = useAuth()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [openDispute, setOpenDispute] = useState<Dispute | null>(null)

  useEffect(() => {
    if (authLoading || !access_token) return
    disputesApi
      .list('all', undefined, 50, 0)
      .then(setDisputes)
      .finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Disputes" back="/(tabs)/profile" />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && disputes.length === 0 && <Text className="text-[13px] text-muted mt-4">No disputes on your bookings.</Text>}
        <View className="mt-2" style={{ gap: 10 }}>
          {disputes.map((d) => (
            <Pressable key={d.dispute_id} onPress={() => setOpenDispute(d)} className="rounded-2xl bg-[#f5f5f5] p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] font-semibold text-ink flex-1" numberOfLines={1}>
                  {d.dispute_number} · #{d.booking_number}
                </Text>
                <StatusBadge label={d.status} tone={statusTone(d.status)} />
              </View>
              <Text className="text-[11px] text-muted mt-1">
                {humanize(d.category)} · {fmtDateTime(d.created_at)}
              </Text>
              <Text numberOfLines={2} className="text-[13px] text-muted mt-2">
                {d.description}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Sheet open={!!openDispute} onClose={() => setOpenDispute(null)}>
        {openDispute && <DisputeDetail dispute={openDispute} />}
      </Sheet>
    </SafeAreaView>
  )
}

function DisputeDetail({ dispute }: { dispute: Dispute }) {
  const [full, setFull] = useState<Dispute>(dispute)
  const [evidence, setEvidence] = useState<DisputeEvidenceItem[]>([])
  const [responses, setResponses] = useState<DisputeResponse[] | null>(null)
  const [kind, setKind] = useState<DisputeResponseKind>('explanation')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const closed = full.status === 'resolved' || full.status === 'withdrawn'

  useEffect(() => {
    disputesApi.get(dispute.dispute_id).then(setFull)
    disputesApi.listEvidence(dispute.dispute_id).then(setEvidence)
    disputesApi
      .listResponses(dispute.dispute_id)
      .then(setResponses)
      .catch(() => setResponses([]))
  }, [dispute.dispute_id])

  async function send() {
    setError(null)
    if (!body.trim()) return
    setSending(true)
    try {
      const sent = await disputesApi.respond(dispute.dispute_id, kind, body.trim())
      setResponses((prev) => [...(prev ?? []), sent])
      setBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send response — the dispute may already be closed')
    } finally {
      setSending(false)
    }
  }

  return (
    <View>
      <View className="flex-row items-center justify-between">
        <Text className="text-[18px] font-bold text-ink">{full.dispute_number}</Text>
        <StatusBadge label={full.status} tone={statusTone(full.status)} />
      </View>
      <Text className="text-[12px] text-muted mt-1">
        Booking #{full.booking_number} · {humanize(full.category)}
      </Text>
      <Text className="text-[13px] text-ink mt-3">{full.description}</Text>

      {full.resolution && (
        <View className="mt-3 rounded-xl bg-[#f5f5f5] p-3">
          <Text className="text-[12px] font-semibold text-ink">Resolution</Text>
          <Text className="text-[12px] text-muted mt-1">{full.resolution}</Text>
        </View>
      )}

      {evidence.length > 0 && (
        <View className="mt-3">
          <Text className="text-[11px] font-semibold text-muted">Evidence ({evidence.length})</Text>
          <View className="flex-row flex-wrap gap-2 mt-1">
            {evidence.map((e) => (
              <View key={e.evidence_id} className="rounded-lg border border-hairline px-2 py-1">
                <Text className="text-[11px] text-ink">{e.kind}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Text className="text-[13px] font-bold text-ink mt-5 mb-2">Responses</Text>
      <View style={{ gap: 8, maxHeight: 220 }}>
        <ScrollView style={{ maxHeight: 220 }}>
          {responses === null ? (
            <Text className="text-[12px] text-muted">Loading…</Text>
          ) : responses.length === 0 ? (
            <Text className="text-[12px] text-muted">No responses yet.</Text>
          ) : (
            responses.map((r) => (
              <View key={r.response_id} className="rounded-2xl bg-[#f5f5f5] p-3 mb-2">
                <View className="flex-row items-center justify-between">
                  <StatusBadge label={r.kind} tone="primary" />
                  <Text className="text-[10px] text-muted">{fmtDateTime(r.created_at)}</Text>
                </View>
                <Text className="text-[13px] text-ink mt-2">{r.body}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {closed ? (
        <Text className="text-[12px] text-muted text-center mt-4">This dispute is {full.status} — no further responses can be added.</Text>
      ) : (
        <>
          <View className="mt-4">
            <Select value={humanize(kind)} onChange={(v) => setKind(v.toLowerCase().replace(/ /g, '_') as DisputeResponseKind)} options={['Acknowledgment', 'Explanation', 'Refund offer']} />
          </View>
          <View className="flex-row items-center gap-2 mt-3">
            <TextInput value={body} onChangeText={setBody} placeholder="Write your response…" placeholderTextColor="#9e9e9e" className="flex-1 rounded-full bg-[#f5f5f5] px-4 py-3 text-[14px] text-ink" />
            <Pressable onPress={() => void send()} disabled={sending || !body.trim()} className="items-center justify-center size-11 rounded-full bg-primary" style={{ opacity: sending || !body.trim() ? 0.5 : 1 }}>
              <SendIcon size={16} color="#fff" />
            </Pressable>
          </View>
          {error && (
            <Text className="text-[12px] mt-2" style={{ color: '#DC2626' }}>
              {error}
            </Text>
          )}
        </>
      )}
    </View>
  )
}
