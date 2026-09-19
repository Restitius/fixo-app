// Availability — real /providers/availability/* endpoints, ported from
// web-provider's availability.tsx. The "Capacity" panel (max jobs/day,
// buffer minutes, advance booking window) and "auto-accept"/"pause
// bookings" toggles from the old mock stay dropped: the real
// AvailabilitySettings schema has no such fields. "Schedule time off"
// stays a disclosed stub too — no date-range picker endpoint exists
// beyond raw create/list, matching web-provider's own honesty about it.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import Button from '../components/Button'
import { useAuth } from '../lib/auth-context'
import { availabilityApi, type AvailabilitySettings, type TimeOffRow, type WorkingHoursRow } from '../lib/api-client'

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function Availability() {
  const { access_token, loading: authLoading } = useAuth()
  const [hours, setHours] = useState<Record<number, WorkingHoursRow>>({})
  const [settings, setSettings] = useState<Partial<AvailabilitySettings>>({})
  const [timeOff, setTimeOff] = useState<TimeOffRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (authLoading || !access_token) return
    Promise.all([availabilityApi.listHours(), availabilityApi.getSettings().catch(() => null), availabilityApi.listTimeOff().catch(() => [])])
      .then(([hrs, s, off]) => {
        const byDay: Record<number, WorkingHoursRow> = {}
        for (const h of hrs) byDay[h.day_of_week] = h
        setHours(byDay)
        if (s) setSettings(s)
        setTimeOff(off)
      })
      .finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  function updateDay(day: number, patch: Partial<WorkingHoursRow>) {
    const defaults: WorkingHoursRow = { day_of_week: day, is_available: true, start_time: '08:00', end_time: '18:00' }
    setHours((prev) => ({
      ...prev,
      [day]: { ...defaults, ...prev[day], ...patch },
    }))
  }

  async function saveSchedule() {
    setSaving(true)
    try {
      await Promise.all(
        Object.entries(hours).map(([day, h]) =>
          availabilityApi.setDay(Number(day), {
            is_available: h.is_available,
            start_time: h.start_time ?? undefined,
            end_time: h.end_time ?? undefined,
          }),
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleSetting(key: keyof AvailabilitySettings, value: boolean) {
    setSettings((prev) => ({ ...prev, [key]: value }))
    try {
      await availabilityApi.saveSettings({ [key]: value })
    } catch {
      setSettings((prev) => ({ ...prev, [key]: !value }))
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Availability" back="/(tabs)/calendar" />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && (
          <>
            <Text className="text-[15px] font-bold text-ink mt-2">Weekly working hours</Text>
            <View className="mt-3" style={{ gap: 8 }}>
              {DAY_LABELS.map((label, i) => {
                const h = hours[i]
                const isAvailable = h?.is_available ?? false
                return (
                  <View key={label} className="rounded-2xl bg-[#f5f5f5] p-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[14px] font-semibold text-ink">{label}</Text>
                      <Switch value={isAvailable} onValueChange={(v) => updateDay(i, { is_available: v })} trackColor={{ false: '#e0e0e0', true: '#7210FF' }} thumbColor="#ffffff" />
                    </View>
                    {isAvailable && (
                      <View className="flex-row items-center gap-2 mt-3">
                        <TextInput
                          className="rounded-xl bg-white px-3 py-2.5 text-[14px] text-ink"
                          style={{ width: 90 }}
                          value={h?.start_time ?? '08:00'}
                          onChangeText={(v) => updateDay(i, { start_time: v })}
                        />
                        <Text className="text-[13px] text-muted">to</Text>
                        <TextInput
                          className="rounded-xl bg-white px-3 py-2.5 text-[14px] text-ink"
                          style={{ width: 90 }}
                          value={h?.end_time ?? '18:00'}
                          onChangeText={(v) => updateDay(i, { end_time: v })}
                        />
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
            <View className="mt-4">
              <Button onPress={() => void saveSchedule()} loading={saving}>
                Save schedule
              </Button>
            </View>

            <Text className="text-[15px] font-bold text-ink mt-7">Job preferences</Text>
            <View className="mt-3" style={{ gap: 8 }}>
              <ToggleRow label="Accept emergency jobs" checked={!!settings.accepts_emergency} onChange={(v) => void toggleSetting('accepts_emergency', v)} />
              <ToggleRow label="Accept same-day jobs" checked={!!settings.accepts_same_day} onChange={(v) => void toggleSetting('accepts_same_day', v)} />
              <ToggleRow label="Accept holiday jobs" checked={!!settings.accepts_holidays} onChange={(v) => void toggleSetting('accepts_holidays', v)} />
            </View>

            <Text className="text-[15px] font-bold text-ink mt-7">Time off</Text>
            <View className="mt-3" style={{ gap: 8 }}>
              {timeOff.length === 0 && <Text className="text-[13px] text-muted">No upcoming leave scheduled.</Text>}
              {timeOff.map((t) => (
                <View key={t.time_off_id} className="flex-row items-center justify-between rounded-xl bg-[#f5f5f5] px-4 py-3">
                  <Text className="text-[13px] text-ink">{t.reason || 'Unavailable'}</Text>
                  <Text className="text-[12px] text-muted">
                    {t.starts_at.slice(0, 10)} – {t.ends_at.slice(0, 10)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <View className="flex-row items-center justify-between rounded-xl bg-[#f5f5f5] px-4 py-3.5">
      <Text className="text-[14px] text-ink">{label}</Text>
      <Switch value={checked} onValueChange={onChange} trackColor={{ false: '#e0e0e0', true: '#7210FF' }} thumbColor="#ffffff" />
    </View>
  )
}
