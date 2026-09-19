import { router, usePathname } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { BookingsIcon, CalendarIcon, ClipboardCheckIcon, HomeIcon, UserIcon } from './icons'

const TABS = [
  { to: '/(tabs)/dashboard', match: '/dashboard', icon: HomeIcon, labelKey: 'nav.dashboard' },
  { to: '/(tabs)/requests', match: '/requests', icon: ClipboardCheckIcon, labelKey: 'nav.requests' },
  { to: '/(tabs)/bookings', match: '/bookings', icon: BookingsIcon, labelKey: 'nav.bookings' },
  { to: '/(tabs)/calendar', match: '/calendar', icon: CalendarIcon, labelKey: 'nav.calendar' },
  { to: '/(tabs)/profile', match: '/profile', icon: UserIcon, labelKey: 'nav.profile' },
] as const

export default function BottomNav() {
  const { t } = useTranslation('tabs')
  const pathname = usePathname()

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
                  <Icon size={20} color="#ffffff" />
                  <Text className="text-white text-[13px] font-semibold">{t(labelKey)}</Text>
                </View>
              ) : (
                <View className="items-center justify-center size-11 rounded-full">
                  <Icon size={20} color="#bdbdbd" />
                </View>
              )}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
