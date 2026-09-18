// Bookings list — real /providers/me/bookings feed, ported from
// web-provider's bookings.tsx. Tapping a card pushes the detail screen
// (app/bookings/[bookingId].tsx) for stage/arrival/checklist/materials —
// a phone can't show list+detail side by side the way the web table does.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import StatusBadge from '../../components/StatusBadge'
import { bookingsApi, type BookingFeedRow } from '../../lib/api-client'
import { fmtMoney } from '../../lib/format'

export default function Bookings() {
  const [bookings, setBookings] = useState<BookingFeedRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    bookingsApi
      .feed()
      .then(setBookings)
      .finally(() => setLoading(false))
  }, [])

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Text className="text-[22px] font-extrabold text-ink px-6 pt-2">Bookings</Text>
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 110 }}>
        {!loading && bookings.length === 0 && (
          <View className="items-center pt-20">
            <Text className="text-[15px] text-muted">No bookings yet.</Text>
          </View>
        )}

        <View className="mt-4" style={{ gap: 10 }}>
          {bookings.map((b) => (
            <Pressable
              key={b.booking_id}
              onPress={() => router.push(`/bookings/${b.booking_id}` as any)}
              className="rounded-2xl border border-hairline p-4"
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-[14px] font-semibold text-ink">{b.booking_number}</Text>
                <StatusBadge status={b.status} />
              </View>
              <Text className="text-[13px] text-muted mt-0.5">
                {b.customer_name} · {b.service_name}
              </Text>
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-[12px] text-muted">
                  {b.scheduled_date} {b.time_window ? `· ${b.time_window}` : ''}
                </Text>
                <Text className="text-[15px] font-extrabold text-primary">{fmtMoney(b.agreed_amount, b.currency)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
