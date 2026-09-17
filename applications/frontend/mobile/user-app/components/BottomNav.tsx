import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router, usePathname } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { BookingsIcon, CalendarIcon, ChatBubbleIcon, HomeIcon, UserIcon } from './icons'
import { bookingApi, fixoSdk } from '../lib/api-client'

const TABS = [
  { to: '/(tabs)/home', match: '/home', icon: HomeIcon, labelKey: 'nav.home' },
  { to: '/(tabs)/bookings', match: '/bookings', icon: BookingsIcon, labelKey: 'nav.bookings' },
  { to: '/(tabs)/calendar', match: '/calendar', icon: CalendarIcon, labelKey: 'nav.calendar' },
  { to: '/(tabs)/inbox', match: '/inbox', icon: ChatBubbleIcon, labelKey: 'nav.inbox' },
  { to: '/(tabs)/profile', match: '/profile', icon: UserIcon, labelKey: 'nav.profile' },
] as const

export default function BottomNav() {
  const { t } = useTranslation('tabs')
  const pathname = usePathname()
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(() => {
    let cancelled = false
    fixoSdk
      .bookingHistory(undefined, 20, 0)
      .then((bookings) =>
        Promise.all(
          bookings.filter((b) => b.provider_name).map((b) => bookingApi.listBookingMessages(b.booking_id, 1, 0).then((r) => r.unread_count).catch(() => 0)),
        ),
      )
      .then((counts) => {
        if (!cancelled) setHasUnread(counts.some((c) => c > 0))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [pathname])

  return (
    <View className="absolute bottom-4 left-4 right-4 z-30">
      <View
        className="flex-row items-center justify-between gap-1 bg-white rounded-full p-1.5"
        style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 }}
      >
        {TABS.map(({ to, match, icon: Icon, labelKey }) => {
          const isActive = pathname.endsWith(match)
          return (
            <Pressable key={to} onPress={() => router.replace(to as any)}>
              {isActive ? (
                <View className="flex-row items-center gap-2 rounded-full bg-primary pl-3 pr-4 py-2.5">
                  <Icon size={20} color="#ffffff" filled />
                  <Text className="text-white text-[13px] font-semibold">{t(labelKey)}</Text>
                </View>
              ) : (
                <View className="relative items-center justify-center size-11 rounded-full">
                  <Icon size={20} color="#bdbdbd" />
                  {match === '/inbox' && hasUnread && (
                    <View className="absolute top-2 right-2.5 size-2 rounded-full bg-[#FF6B6B]" />
                  )}
                </View>
              )}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
