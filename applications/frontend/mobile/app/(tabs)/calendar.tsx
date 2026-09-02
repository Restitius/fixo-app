import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from '../../components/Avatar'
import { CalendarEmptyIllustration, ChevronRightIcon } from '../../components/icons'
import { fixoSdk, type BookingHistoryRow } from '../../lib/api-client'
import { humanize, initialsOf } from '../../lib/format'

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export default function MyCalendar() {
  const [bookings, setBookings] = useState<BookingHistoryRow[] | null>(null)
  const today = useMemo(() => new Date(), [])
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(today)

  useEffect(() => {
    fixoSdk.bookingHistory(undefined, 100, 0).then(setBookings).catch(() => setBookings([]))
  }, [])

  const byDay = useMemo(() => {
    const map = new Map<string, BookingHistoryRow[]>()
    for (const b of bookings ?? []) {
      if (!b.scheduled_date) continue
      const key = dateKey(new Date(b.scheduled_date))
      map.set(key, [...(map.get(key) ?? []), b])
    }
    return map
  }, [bookings])

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const dayBookings = byDay.get(dateKey(selected)) ?? []

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View className="flex-row items-center justify-between px-6 pt-2">
          <View>
            <Text className="text-[22px] font-extrabold text-ink">My Calendar</Text>
            <Text className="text-[14px] text-muted mt-1">{monthLabel}</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable onPress={() => setViewMonth(new Date(year, month - 1, 1))} className="rotate-180">
              <ChevronRightIcon size={18} color="#6C7585" />
            </Pressable>
            <Pressable onPress={() => setViewMonth(new Date(year, month + 1, 1))}>
              <ChevronRightIcon size={18} color="#6C7585" />
            </Pressable>
          </View>
        </View>

        <View className="px-6 mt-5">
          <View className="flex-row flex-wrap">
            {WEEKDAYS.map((w, i) => (
              <Text key={i} style={{ width: `${100 / 7}%` }} className="text-[12px] text-muted font-medium text-center mb-2">
                {w}
              </Text>
            ))}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <View key={`b${i}`} style={{ width: `${100 / 7}%` }} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const date = new Date(year, month, day)
              const key = dateKey(date)
              const isSelected = dateKey(selected) === key
              const isToday = dateKey(today) === key
              const hasBooking = byDay.has(key)
              return (
                <Pressable key={day} onPress={() => setSelected(date)} style={{ width: `${100 / 7}%` }} className="items-center gap-1 py-1">
                  <View className={`items-center justify-center size-8 rounded-full ${isSelected ? 'bg-primary' : isToday ? 'border border-primary' : ''}`}>
                    <Text className={`text-[13px] font-medium ${isSelected ? 'text-white' : 'text-ink'}`}>{day}</Text>
                  </View>
                  <View className={`size-1.5 rounded-full ${hasBooking ? 'bg-primary' : 'bg-transparent'}`} />
                </Pressable>
              )
            })}
          </View>
        </View>

        <View className="px-6 mt-8">
          <Text className="text-[14px] font-semibold text-ink mb-3">
            {bookings === null ? 'Loading…' : dayBookings.length > 0 ? `Bookings on ${selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No bookings this day'}
          </Text>

          {bookings !== null && dayBookings.length === 0 ? (
            <View className="items-center py-10">
              <CalendarEmptyIllustration size={110} />
              <Text className="text-[13px] text-muted mt-3">Dates with a dot below them have a real booking.</Text>
            </View>
          ) : (
            <View className="gap-3">
              {dayBookings.map((b) => (
                <Pressable
                  key={b.booking_id}
                  onPress={() => router.push('/(tabs)/bookings')}
                  className="flex-row items-center gap-4 rounded-2xl border border-hairline p-4"
                >
                  <Avatar label={initialsOf(b.provider_name ?? '?')} size={44} />
                  <View className="flex-1">
                    <Text numberOfLines={1} className="font-bold text-ink">
                      {b.provider_name ?? b.service_name ?? 'Service'}
                    </Text>
                    <Text className="text-[13px] text-muted">{b.time_window ? humanize(b.time_window) : humanize(b.status)}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
