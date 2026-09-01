import { Pressable, Text, View } from 'react-native'
import { router, usePathname } from 'expo-router'
import { BookingsIcon, CalendarIcon, ChatBubbleIcon, HomeIcon, UserIcon } from './icons'
import { CHATS } from '../data/mock'

const TABS = [
  { to: '/(tabs)/home', match: '/home', icon: HomeIcon, label: 'Home' },
  { to: '/(tabs)/bookings', match: '/bookings', icon: BookingsIcon, label: 'Bookings' },
  { to: '/(tabs)/calendar', match: '/calendar', icon: CalendarIcon, label: 'Calendar' },
  { to: '/(tabs)/inbox', match: '/inbox', icon: ChatBubbleIcon, label: 'Inbox' },
  { to: '/(tabs)/profile', match: '/profile', icon: UserIcon, label: 'Profile' },
] as const

const hasUnread = CHATS.some((c) => c.unread > 0)

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <View className="absolute bottom-4 left-4 right-4 z-30">
      <View
        className="flex-row items-center justify-between gap-1 bg-white rounded-full p-1.5"
        style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 }}
      >
        {TABS.map(({ to, match, icon: Icon, label }) => {
          const isActive = pathname.endsWith(match)
          return (
            <Pressable key={to} onPress={() => router.replace(to as any)}>
              {isActive ? (
                <View className="flex-row items-center gap-2 rounded-full bg-primary pl-3 pr-4 py-2.5">
                  <Icon size={20} color="#ffffff" filled />
                  <Text className="text-white text-[13px] font-semibold">{label}</Text>
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
