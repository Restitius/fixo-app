import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from '../../components/Avatar'
import { fixoSdk, type BookingHistoryRow } from '../../lib/api-client'
import { humanize, initialsOf, timeAgo } from '../../lib/format'

export default function Inbox() {
  const [bookings, setBookings] = useState<BookingHistoryRow[] | null>(null)

  useEffect(() => {
    fixoSdk.bookingHistory(undefined, 100, 0).then(setBookings).catch(() => setBookings([]))
  }, [])

  const withProvider = (bookings ?? []).filter((b) => b.provider_name)

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <Text className="text-[22px] font-extrabold text-ink px-6 pt-2">Inbox</Text>
        <Text className="text-[13px] text-muted px-6 mt-1">Message the providers on your real bookings.</Text>

        <View className="mt-4 px-6">
          {bookings === null ? (
            <View className="h-24 rounded-2xl bg-[#f5f5f5]" />
          ) : withProvider.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-[15px] font-semibold text-ink">No conversations yet</Text>
              <Text className="text-[13px] text-muted mt-1 text-center">Once a provider is assigned to a booking, you can message them here.</Text>
            </View>
          ) : (
            withProvider.map((b) => (
              <Pressable
                key={b.booking_id}
                onPress={() => router.push(`/inbox/chat/${b.booking_id}` as any)}
                className="flex-row items-center gap-4 py-3.5 border-b border-hairline"
              >
                <Avatar label={initialsOf(b.provider_name!)} size={52} />
                <View className="flex-1">
                  <Text numberOfLines={1} className="font-bold text-ink">
                    {b.provider_name}
                  </Text>
                  <Text numberOfLines={1} className="text-[13px] text-muted">
                    {b.service_name ?? 'Service'} · {humanize(b.status)}
                  </Text>
                </View>
                <Text className="text-[12px] text-muted">{timeAgo(b.created_at)}</Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
