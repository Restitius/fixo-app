// Job calendar — real /providers/me/calendar/month + agenda + working
// hours, ported from web-provider's calendar.tsx. Same month-grid +
// upcoming-agenda structure, stacked vertically for a phone instead of
// side-by-side.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import StatusBadge from '../../components/StatusBadge'
import { availabilityApi, calendarApi, type CalendarEvent, type WorkingHoursRow } from '../../lib/api-client'

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function Calendar() {
  const now = new Date()
  const [year] = useState(now.getFullYear())
  const [month] = useState(now.getMonth() + 1)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [agenda, setAgenda] = useState<CalendarEvent[]>([])
  const [hours, setHours] = useState<WorkingHoursRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const todayIso = now.toISOString().slice(0, 10)
    Promise.all([calendarApi.month(year, month), calendarApi.agenda(todayIso, 4), availabilityApi.listHours()])
      .then(([ev, ag, hrs]) => {
        setEvents(ev)
        setAgenda(ag)
        setHours(hrs)
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  const eventsByDate = new Map<string, CalendarEvent[]>()
  for (const e of events) {
    const day = e.start_at.slice(0, 10)
    eventsByDate.set(day, [...(eventsByDate.get(day) ?? []), e])
  }

  const firstOfMonth = new Date(year, month - 1, 1)
  const startWeekday = (firstOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(year, month, 0).getDate()
  const monthLabel = firstOfMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-6 pt-3 pb-2">
        <Text className="text-[20px] font-extrabold text-ink">{monthLabel}</Text>
        <Pressable onPress={() => router.push('/availability' as any)}>
          <Text className="text-primary font-semibold text-[13px]">Availability</Text>
        </Pressable>
      </View>
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 110 }}>
        {!loading && (
          <>
            <View className="rounded-3xl bg-[#f5f5f5] p-4">
              <View className="flex-row justify-between">
                {DAY_LABELS.map((d) => (
                  <Text key={d} className="text-[11px] font-semibold text-muted" style={{ width: `${100 / 7}%`, textAlign: 'center' }}>
                    {d}
                  </Text>
                ))}
              </View>
              <View className="flex-row flex-wrap mt-1">
                {Array.from({ length: startWeekday }, (_, i) => (
                  <View key={`pad-${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1
                  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayEvents = eventsByDate.get(iso) ?? []
                  return (
                    <View key={day} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} className="items-center justify-center">
                      <View
                        className="items-center justify-center rounded-xl"
                        style={{ width: 32, height: 32, backgroundColor: dayEvents.length ? 'rgba(114,16,255,0.1)' : 'transparent' }}
                      >
                        <Text className="text-[13px]" style={{ color: dayEvents.length ? '#7210FF' : '#0B111F', fontWeight: dayEvents.length ? '700' : '400' }}>
                          {day}
                        </Text>
                      </View>
                      {dayEvents.length > 0 && <View className="rounded-full bg-primary mt-0.5" style={{ width: 4, height: 4 }} />}
                    </View>
                  )
                })}
              </View>
            </View>

            <Text className="text-[15px] font-bold text-ink mt-6">Upcoming</Text>
            <View className="mt-3" style={{ gap: 8 }}>
              {agenda.length === 0 && <Text className="text-[13px] text-muted">Nothing scheduled.</Text>}
              {agenda.map((e) => (
                <View key={e.event_id} className="rounded-2xl bg-[#f5f5f5] p-3.5">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text numberOfLines={1} className="text-[14px] font-semibold text-ink flex-1">
                      {e.title}
                    </Text>
                    <StatusBadge status={e.status} />
                  </View>
                  <Text className="text-[12px] text-muted mt-1">{e.start_at.replace('T', ' ').slice(0, 16)}</Text>
                </View>
              ))}
            </View>

            <Text className="text-[15px] font-bold text-ink mt-6 mb-3">Working hours</Text>
            <View style={{ gap: 6 }}>
              {DAY_NAMES.map((label, i) => {
                const h = hours.find((x) => x.day_of_week === i)
                return (
                  <View key={label} className="flex-row items-center justify-between">
                    <Text className="text-[13px] text-muted">{label}</Text>
                    <Text className="text-[13px] font-semibold text-ink">{h?.is_available ? `${h.start_time}–${h.end_time}` : 'Off'}</Text>
                  </View>
                )
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
