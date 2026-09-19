// Booking detail + job execution — ported from web-provider's bookings.tsx
// detail panel. Real GPS via expo-location (the web version could only use
// the browser Geolocation API with a 0,0 fallback and said so honestly;
// on-device this can get real coordinates). The arrival PIN is
// deliberately never sent to the provider by any real endpoint — the
// customer hands it over in person as proof of a genuine visit — so this
// never displays a "demo PIN" hint, matching web-provider's own comment.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import ScreenHeader from '../../components/ScreenHeader'
import StatusBadge, { humanizeStatus } from '../../components/StatusBadge'
import { CheckCircleIcon, LocationIcon, LockIcon, PlusIcon, ToolIcon } from '../../components/icons'
import { useAuth } from '../../lib/auth-context'
import {
  arrivalApi,
  bookingsApi,
  checklistApi,
  completionApi,
  materialsApi,
  trackingApi,
  type ArrivalStatus,
  type BookingDetail,
  type ChecklistItem,
  type MaterialItem,
} from '../../lib/api-client'
import { fmtMoney } from '../../lib/format'

const STAGES = ['CONFIRMED', 'ON_THE_WAY', 'ARRIVED', 'STARTED', 'IN_PROGRESS', 'COMPLETION_REQUESTED', 'CUSTOMER_CONFIRMED', 'PAID', 'CLOSED']

export default function BookingDetailScreen() {
  // See quotes.tsx for why root-level (non-tab) screens need this guard —
  // a direct reload/deep-link can otherwise fire API calls before the
  // auth token finishes restoring from AsyncStorage.
  const { access_token, loading: authLoading } = useAuth()
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const [detail, setDetail] = useState<BookingDetail | null>(null)
  const [arrival, setArrival] = useState<ArrivalStatus | null>(null)
  const [tasks, setTasks] = useState<ChecklistItem[]>([])
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [pin, setPin] = useState('')
  const [newMaterial, setNewMaterial] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  function load() {
    return Promise.all([
      bookingsApi.details(bookingId),
      arrivalApi.status(bookingId).catch(() => null),
      checklistApi.listForBooking(bookingId).catch(() => []),
      materialsApi.list(bookingId).catch(() => []),
    ]).then(([d, a, t, m]) => {
      setDetail(d)
      setArrival(a)
      setTasks(t)
      setMaterials(m)
    })
  }

  useEffect(() => {
    if (authLoading || !access_token) return
    load().finally(() => setLoading(false))
  }, [authLoading, access_token, bookingId])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  const stageIndex = detail ? STAGES.indexOf(detail.status) : 0
  const doneTasks = tasks.filter((t) => t.is_completed).length

  async function startTrip() {
    setBusy(true)
    try {
      await trackingApi.startTrip(bookingId)
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function recordArrival() {
    setBusy(true)
    try {
      let lat = 0
      let lng = 0
      const perm = await Location.requestForegroundPermissionsAsync().catch(() => null)
      if (perm?.status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({}).catch(() => null)
        if (pos) {
          lat = pos.coords.latitude
          lng = pos.coords.longitude
        }
      }
      await arrivalApi.arrive(bookingId, lat, lng)
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function verifyPin() {
    if (pin.length !== 4) return
    setBusy(true)
    try {
      await arrivalApi.verifyPin(bookingId, pin)
      setPin('')
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function startJob() {
    setBusy(true)
    try {
      await bookingsApi.startService(bookingId)
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function toggleTask(itemId: string, isCompleted: boolean) {
    setTasks((prev) => prev.map((t) => (t.item_id === itemId ? { ...t, is_completed: isCompleted } : t)))
    try {
      await checklistApi.setCompleted(bookingId, itemId, isCompleted)
    } catch {
      checklistApi.listForBooking(bookingId).then(setTasks).catch(() => {})
    }
  }

  async function addMaterial() {
    if (!newMaterial.trim()) return
    const added = await materialsApi.add(bookingId, { item_name: newMaterial.trim(), quantity: 1 })
    setMaterials((prev) => [...prev, added])
    setNewMaterial('')
  }

  async function markComplete() {
    setBusy(true)
    try {
      await completionApi.complete(bookingId, {})
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (loading || !detail) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <ScreenHeader back="/(tabs)/bookings" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title={detail.booking_number} back="/(tabs)/bookings" />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-[16px] font-bold text-ink">{detail.service_name}</Text>
          <StatusBadge status={detail.status} />
        </View>
        <Text className="text-[13px] text-muted">{detail.customer_name}</Text>
        {detail.street_address && (
          <View className="flex-row items-start gap-2 mt-3">
            <LocationIcon size={16} color="#7210FF" />
            <Text className="text-[13px] text-muted flex-1">{[detail.street_address, detail.city, detail.region].filter(Boolean).join(', ')}</Text>
          </View>
        )}
        <Text className="text-[13px] text-muted mt-2">
          {detail.scheduled_date} {detail.time_window ? `at ${detail.time_window}` : ''}
        </Text>

        {/* Stage timeline */}
        <View className="mt-5" style={{ gap: 8 }}>
          {STAGES.map((s, i) => (
            <View key={s} className="flex-row items-center gap-3">
              <View
                className="items-center justify-center rounded-full"
                style={{ width: 22, height: 22, backgroundColor: i <= stageIndex ? 'rgba(0,184,148,0.15)' : '#f0f0f0' }}
              >
                {i <= stageIndex ? <CheckCircleIcon size={13} color="#00B894" /> : <Text className="text-[10px] font-bold text-muted">{i + 1}</Text>}
              </View>
              <Text className={`text-[13px] ${i <= stageIndex ? 'font-medium text-ink' : 'text-muted'}`}>{humanizeStatus(s)}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View className="flex-row flex-wrap gap-2 mt-5">
          <ActionButton label="Start trip" onPress={() => void startTrip()} disabled={busy || detail.status !== 'CONFIRMED'} />
          <ActionButton label="Start job" onPress={() => void startJob()} disabled={busy || detail.status !== 'ARRIVED' || !arrival?.verified_at} />
          <ActionButton label="Mark complete" onPress={() => void markComplete()} disabled={busy || (detail.status !== 'STARTED' && detail.status !== 'IN_PROGRESS')} />
        </View>

        {/* Arrival verification */}
        <View className="rounded-3xl bg-[#f5f5f5] p-5 mt-6">
          <Text className="text-[15px] font-bold text-ink">Arrival verification</Text>
          {detail.status === 'ON_THE_WAY' && !arrival?.arrived_at && (
            <Pressable onPress={() => void recordArrival()} disabled={busy} className="flex-row items-center gap-2 rounded-xl bg-primary px-4 py-2.5 mt-3 self-start">
              <LocationIcon size={16} color="#ffffff" />
              <Text className="text-white text-[13px] font-semibold">Record arrival (GPS)</Text>
            </Pressable>
          )}
          <Text className="text-[13px] text-muted mt-3">Ask the customer for their job PIN — it's never shown to you here by design; only the customer's copy is valid.</Text>
          <View className="flex-row items-center gap-2 mt-3">
            <TextInput
              value={pin}
              onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              keyboardType="number-pad"
              editable={!!arrival?.arrived_at && !arrival?.verified_at}
              maxLength={4}
              className="rounded-xl bg-white px-4 py-3 text-[18px] font-semibold text-center tracking-[8px]"
              style={{ width: 130, opacity: !!arrival?.arrived_at && !arrival?.verified_at ? 1 : 0.5 }}
            />
            <Pressable
              onPress={() => void verifyPin()}
              disabled={busy || pin.length !== 4 || !arrival?.arrived_at || !!arrival?.verified_at}
              className="flex-row items-center gap-2 rounded-xl bg-primary px-4 py-3"
              style={{ opacity: busy || pin.length !== 4 || !arrival?.arrived_at || !!arrival?.verified_at ? 0.5 : 1 }}
            >
              <LockIcon size={16} color="#ffffff" />
              <Text className="text-white text-[13px] font-semibold">Verify</Text>
            </Pressable>
          </View>
          {arrival?.verified_at && (
            <Text className="text-[13px] font-semibold mt-2" style={{ color: '#00B894' }}>
              Arrival confirmed — you may start the job.
            </Text>
          )}
        </View>

        {/* Checklist */}
        <Text className="text-[15px] font-bold text-ink mt-6">
          Work checklist ({doneTasks}/{tasks.length})
        </Text>
        <View className="mt-3" style={{ gap: 8 }}>
          {tasks.length === 0 && <Text className="text-[13px] text-muted">No checklist instantiated for this booking yet.</Text>}
          {tasks.map((t) => (
            <Pressable
              key={t.item_id}
              onPress={() => !t.is_completed && void toggleTask(t.item_id, true)}
              className="flex-row items-center gap-3 rounded-xl bg-[#f5f5f5] px-4 py-3"
            >
              <View
                className="items-center justify-center rounded-md border-2"
                style={{ width: 20, height: 20, borderColor: '#7210FF', backgroundColor: t.is_completed ? '#7210FF' : 'white' }}
              >
                {t.is_completed && <CheckCircleIcon size={13} color="#ffffff" />}
              </View>
              <Text className={`text-[14px] ${t.is_completed ? 'text-muted line-through' : 'text-ink'}`}>{t.task_title}</Text>
            </Pressable>
          ))}
        </View>

        {/* Materials */}
        <View className="flex-row items-center justify-between mt-6">
          <Text className="text-[15px] font-bold text-ink">Materials used</Text>
        </View>
        <View className="flex-row items-center gap-2 mt-3">
          <TextInput value={newMaterial} onChangeText={setNewMaterial} placeholder="Item name" className="flex-1 rounded-xl bg-[#f5f5f5] px-4 py-3 text-[14px] text-ink" />
          <Pressable onPress={() => void addMaterial()} className="flex-row items-center gap-1 rounded-xl bg-primary/10 px-3 py-3">
            <PlusIcon size={16} color="#7210FF" />
          </Pressable>
        </View>
        <View className="mt-3" style={{ gap: 8 }}>
          {materials.length === 0 && <Text className="text-[13px] text-muted">No materials logged yet.</Text>}
          {materials.map((m) => (
            <View key={m.material_id} className="flex-row items-center justify-between rounded-xl bg-[#f5f5f5] px-4 py-3">
              <View className="flex-row items-center gap-2">
                <ToolIcon size={16} color="#7210FF" />
                <Text className="text-[13px] text-ink">
                  {m.item_name} × {m.quantity}
                </Text>
              </View>
              {m.amount != null && <Text className="text-[13px] font-semibold text-ink">{fmtMoney(m.amount, m.currency)}</Text>}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function ActionButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} className="rounded-xl border border-hairline px-4 py-2.5" style={{ opacity: disabled ? 0.4 : 1 }}>
      <Text className="text-[13px] font-semibold text-ink">{label}</Text>
    </Pressable>
  )
}
