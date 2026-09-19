// Messages inbox — real /providers/me/bookings feed used as the
// conversation list, ported from web-provider's messages.tsx (which
// itself lists bookings as the left-hand conversation panel). A phone
// can't show list+thread side by side, so this screen is just the list;
// tapping a row pushes the thread at messages/[bookingId].tsx.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { Redirect, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import Avatar from '../components/Avatar'
import { useAuth } from '../lib/auth-context'
import { fixoSdk, type ProviderBookingFeedRow } from '../lib/api-client'
import { initialsOf } from '../lib/format'

export default function Messages() {
  const { access_token, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<ProviderBookingFeedRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !access_token) return
    fixoSdk
      .bookingFeed(50, 0)
      .then(setBookings)
      .finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Messages" back="/(tabs)/dashboard" />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && bookings.length === 0 && (
          <View className="items-center pt-20 px-6">
            <Text className="text-[15px] text-muted text-center">No conversations yet. Messages stay attached to each booking.</Text>
          </View>
        )}
        {bookings.map((b) => (
          <Pressable
            key={b.booking_id}
            onPress={() => router.push({ pathname: '/messages/[bookingId]', params: { bookingId: b.booking_id, customerName: b.customer_name, bookingNumber: b.booking_number } } as any)}
            className="flex-row items-center gap-3 px-6 py-4 border-b border-hairline"
          >
            <Avatar label={initialsOf(b.customer_name)} size={44} />
            <View className="flex-1 min-w-0">
              <Text numberOfLines={1} className="text-[14px] font-semibold text-ink">
                {b.customer_name}
              </Text>
              <Text numberOfLines={1} className="text-[12px] text-muted">
                {b.service_name ?? '—'}
              </Text>
              <Text className="text-[11px] font-medium text-primary mt-0.5">#{b.booking_number}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}
