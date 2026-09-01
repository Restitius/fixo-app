import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from '../../components/Avatar'
import { CalendarEmptyIllustration } from '../../components/icons'
import { BOOKINGS, providerById } from '../../data/mock'

const MONTH_DAYS = Array.from({ length: 30 }, (_, i) => i + 1)
const BOOKED_DAYS = new Set([3, 5, 12, 28])
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function MyCalendar() {
  const [selected, setSelected] = useState(3)
  const dayBookings = BOOKINGS.filter((b) => b.date.includes(`Sep ${selected},`))

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View className="flex-row items-center justify-between px-6 pt-2">
          <View>
            <Text className="text-[22px] font-extrabold text-ink">My Calendar</Text>
            <Text className="text-[14px] text-muted mt-1">September 2026</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/bookings')}>
            <Text className="text-[13px] font-semibold text-primary">My Bookings</Text>
          </Pressable>
        </View>

        <View className="px-6 mt-5">
          <View className="flex-row flex-wrap">
            {WEEKDAYS.map((w, i) => (
              <Text key={i} style={{ width: `${100 / 7}%` }} className="text-[12px] text-muted font-medium text-center mb-2">
                {w}
              </Text>
            ))}
            {MONTH_DAYS.map((d) => {
              const isSelected = d === selected
              const hasBooking = BOOKED_DAYS.has(d)
              return (
                <Pressable key={d} onPress={() => setSelected(d)} style={{ width: `${100 / 7}%` }} className="items-center gap-1 py-1">
                  <View className={`items-center justify-center size-8 rounded-full ${isSelected ? 'bg-primary' : ''}`}>
                    <Text className={`text-[13px] font-medium ${isSelected ? 'text-white' : 'text-ink'}`}>{d}</Text>
                  </View>
                  <View className={`size-1.5 rounded-full ${hasBooking ? 'bg-primary' : 'bg-transparent'}`} />
                </Pressable>
              )
            })}
          </View>
        </View>

        <View className="px-6 mt-8">
          <Text className="text-[14px] font-semibold text-ink mb-3">
            {dayBookings.length > 0 ? `Bookings on Sep ${selected}` : 'No bookings this day'}
          </Text>

          {dayBookings.length === 0 ? (
            <View className="items-center py-10">
              <CalendarEmptyIllustration size={110} />
              <Text className="text-[13px] text-muted mt-3">Select a highlighted date to view bookings.</Text>
            </View>
          ) : (
            <View className="gap-3">
              {dayBookings.map((b) => {
                const provider = providerById(b.providerId)
                if (!provider) return null
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => router.push('/(tabs)/bookings')}
                    className="flex-row items-center gap-4 rounded-2xl border border-hairline p-4"
                  >
                    <Avatar label={provider.avatar} size={44} />
                    <View className="flex-1">
                      <Text numberOfLines={1} className="font-bold text-ink">
                        {provider.name}
                      </Text>
                      <Text className="text-[13px] text-muted">{b.time}</Text>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
