// Incoming requests — real /providers/requests feed + respond endpoint,
// ported from web-provider's requests.tsx. Mobile drops the side detail
// panel (redundant with the card's own content on a phone) in favor of a
// single scrollable card list with inline actions.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import StatusBadge from '../../components/StatusBadge'
import { ClockIcon, LocationIcon } from '../../components/icons'
import { dashboardApi, requestsApi, type RequestFeedItem } from '../../lib/api-client'
import { fmtMoney } from '../../lib/format'

function countdown(seconds?: number | null) {
  if (seconds == null) return ''
  if (seconds <= 0) return 'Expired'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min left`
  return `${Math.floor(seconds / 3600)} hrs left`
}

export default function Requests() {
  const [requests, setRequests] = useState<RequestFeedItem[]>([])
  const [handled, setHandled] = useState<Record<string, 'ACCEPTED' | 'DECLINED'>>({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    dashboardApi
      .requestsFeed()
      .then(setRequests)
      .finally(() => setLoading(false))
  }, [])

  async function respond(requestId: string, response_type: 'ACCEPTED' | 'DECLINED') {
    setBusyId(requestId)
    try {
      await requestsApi.respond(requestId, { response_type })
      setHandled((h) => ({ ...h, [requestId]: response_type }))
    } finally {
      setBusyId(null)
    }
  }

  const open = requests.filter((r) => !handled[r.request_id])

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Text className="text-[22px] font-extrabold text-ink px-6 pt-2">Requests</Text>
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 110 }}>
        {!loading && open.length === 0 && (
          <View className="items-center pt-20">
            <Text className="text-[15px] text-muted text-center">
              No open requests.{'\n'}New matched requests will appear here instantly.
            </Text>
          </View>
        )}

        <View className="mt-4" style={{ gap: 12 }}>
          {requests.map((r) => {
            const state = handled[r.request_id]
            return (
              <View key={r.match_id} className="rounded-3xl bg-white p-5" style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-[16px] font-bold text-ink">{r.service_name}</Text>
                      {state && <StatusBadge label={state === 'ACCEPTED' ? 'Accepted' : 'Declined'} tone={state === 'ACCEPTED' ? 'success' : 'muted'} />}
                    </View>
                    <Text className="text-[12px] text-muted mt-0.5">{r.request_number}</Text>
                  </View>
                  <View className="items-end">
                    {r.estimated_earnings != null && <Text className="text-[17px] font-extrabold text-primary">{fmtMoney(r.estimated_earnings)}</Text>}
                    <Text className="text-[12px] font-semibold" style={{ color: '#B45309' }}>
                      {countdown(r.respond_in_seconds)}
                    </Text>
                  </View>
                </View>

                <Text className="text-[14px] text-muted mt-3">{r.description}</Text>

                <View className="flex-row flex-wrap gap-x-5 gap-y-2 mt-4">
                  <View className="flex-row items-center gap-1.5">
                    <LocationIcon size={14} color="#7210FF" />
                    <Text className="text-[12px] text-muted">{[r.city, r.region].filter(Boolean).join(', ') || '—'}</Text>
                  </View>
                  {r.preferred_date && (
                    <View className="flex-row items-center gap-1.5">
                      <ClockIcon size={14} color="#7210FF" />
                      <Text className="text-[12px] text-muted">
                        {r.preferred_date} {r.time_window ? `· ${r.time_window}` : ''}
                      </Text>
                    </View>
                  )}
                </View>

                {!state && (
                  <View className="flex-row flex-wrap gap-2 mt-4">
                    <Pressable
                      onPress={() => void respond(r.request_id, 'ACCEPTED')}
                      disabled={busyId === r.request_id}
                      className="rounded-xl bg-primary px-4 py-2.5"
                      style={{ opacity: busyId === r.request_id ? 0.5 : 1 }}
                    >
                      <Text className="text-white text-[13px] font-semibold">Accept job</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push({ pathname: '/quotes', params: { requestId: r.request_id } } as any)}
                      className="rounded-xl border border-hairline px-4 py-2.5"
                    >
                      <Text className="text-ink text-[13px] font-semibold">Send quotation</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void respond(r.request_id, 'DECLINED')}
                      disabled={busyId === r.request_id}
                      className="rounded-xl px-4 py-2.5"
                      style={{ opacity: busyId === r.request_id ? 0.5 : 1 }}
                    >
                      <Text className="text-[13px] font-semibold" style={{ color: '#DC2626' }}>
                        Decline
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
