import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../components/ScreenHeader'
import { BellIcon } from '../components/icons'
import { fixoSdk, type NotificationRow } from '../lib/api-client'
import { humanize, timeAgo } from '../lib/format'

export default function Notifications() {
  const { t } = useTranslation('misc')
  const [notifications, setNotifications] = useState<NotificationRow[] | null>(null)

  function load() {
    return fixoSdk.notifications(false, 50, 0).then(setNotifications).catch(() => setNotifications([]))
  }

  useEffect(() => {
    void load()
  }, [])

  async function markRead(notification: NotificationRow) {
    if (notification.read_at) return
    setNotifications((previous) => (previous ?? []).map((row) => (
      row.notification_id === notification.notification_id
        ? { ...row, read_at: new Date().toISOString() }
        : row
    )))
    try {
      await fixoSdk.markNotificationRead(notification.notification_id)
    } catch {
      // The next refresh reconciles an optimistic read state.
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title={t('notifications.title')} back="/(tabs)/home" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mx-4 mt-2 rounded-[28px] bg-[#2f69d9] p-4" style={{ gap: 14 }}>
          {notifications === null ? (
            <View className="h-[270px] rounded-[22px] bg-white/90" />
          ) : notifications.length === 0 ? (
            <View className="min-h-[280px] items-center justify-center rounded-[22px] bg-white px-7 py-8">
              <View className="relative h-20 w-28 items-center justify-center">
                <View className="absolute h-[1px] w-28 bg-[#dceaff]" />
                <View className="absolute size-16 rounded-full bg-[#f4f8ff]" />
                <BellIcon size={38} color="#2468C7" />
              </View>
              <Text className="mt-3 text-center text-[15px] font-bold text-ink">{t('notifications.empty')}</Text>
              <Text className="mt-1 text-center text-[13px] leading-5 text-muted">Booking, provider, payment and service updates will appear here.</Text>
              <Pressable onPress={() => void load()} className="mt-6 min-w-[190px] rounded-full bg-[#2476f2] px-6 py-3">
                <Text className="text-center text-[13px] font-bold text-white">Refresh notifications</Text>
              </Pressable>
            </View>
          ) : notifications.map((notification) => (
            <View
              key={notification.notification_id}
              className="relative min-h-[270px] items-center rounded-[22px] bg-white px-6 py-6"
              style={{ shadowColor: '#0A2D69', shadowOpacity: 0.2, shadowRadius: 14, elevation: 5 }}
            >
              {!notification.read_at && <View className="absolute right-4 top-4 size-2.5 rounded-full bg-[#2476f2]" />}
              <View className="relative h-20 w-28 items-center justify-center">
                <View className="absolute h-[1px] w-28 bg-[#dceaff]" />
                <View className="absolute size-16 rounded-full bg-[#f4f8ff]" />
                <BellIcon size={38} color="#2468C7" />
              </View>
              <Text numberOfLines={2} className="mt-3 text-center text-[15px] font-bold text-ink">{notification.title}</Text>
              {notification.body && <Text numberOfLines={3} className="mt-1 text-center text-[13px] leading-5 text-muted">{notification.body}</Text>}
              <Text className="mt-2 text-center text-[11px] text-[#9aa7ba]">{humanize(notification.type)} · {timeAgo(notification.created_at)}</Text>
              <Pressable
                disabled={Boolean(notification.read_at)}
                onPress={() => void markRead(notification)}
                className={`mt-auto min-w-[180px] rounded-full px-6 py-3 ${notification.read_at ? 'bg-[#e8f0fb]' : 'bg-[#2476f2]'}`}
              >
                <Text className={`text-center text-[13px] font-bold ${notification.read_at ? 'text-[#2468c7]' : 'text-white'}`}>
                  {notification.read_at ? 'Read' : 'Mark as read'}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
