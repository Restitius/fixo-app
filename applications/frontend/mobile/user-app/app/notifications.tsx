import { useEffect, useState } from 'react'
import { Pressable, ScrollView, View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../components/ScreenHeader'
import { BellIcon } from '../components/icons'
import { fixoSdk, type NotificationRow } from '../lib/api-client'
import { humanize, timeAgo } from '../lib/format'

export default function Notifications() {
  const { t } = useTranslation('misc')
  const [notifications, setNotifications] = useState<NotificationRow[] | null>(null)

  useEffect(() => {
    fixoSdk.notifications(false, 50, 0).then(setNotifications).catch(() => setNotifications([]))
  }, [])

  async function markRead(n: NotificationRow) {
    if (n.read_at) return
    setNotifications((prev) => (prev ?? []).map((row) => (row.notification_id === n.notification_id ? { ...row, read_at: new Date().toISOString() } : row)))
    try {
      await fixoSdk.markNotificationRead(n.notification_id)
    } catch {
      // leave optimistic read state — a retry on next load will reconcile
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title={t('notifications.title')} back="/(tabs)/home" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-col px-6 mt-2">
          {notifications === null ? (
            <View className="h-24 rounded-2xl bg-[#f5f5f5] mt-2" />
          ) : notifications.length === 0 ? (
            <Text className="text-center text-muted py-8 text-[14px]">{t('notifications.empty')}</Text>
          ) : (
            notifications.map((n, i) => (
              <Pressable
                key={n.notification_id}
                onPress={() => markRead(n)}
                className={`flex-row gap-4 py-4 ${i === notifications.length - 1 ? '' : 'border-b border-hairline'}`}
              >
                <View className={`items-center justify-center size-11 rounded-full shrink-0 ${n.read_at ? 'bg-[#f5f5f5]' : 'bg-primary/8'}`}>
                  <BellIcon size={20} color={n.read_at ? '#6C7585' : '#7210FF'} />
                </View>
                <View className="flex-1 min-w-0">
                  <View className="flex-row items-start justify-between gap-2">
                    <Text className="font-bold text-ink text-[15px] flex-1">{n.title}</Text>
                    {!n.read_at && <View className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                  </View>
                  {n.body && <Text className="text-[13px] text-muted mt-0.5">{n.body}</Text>}
                  <Text className="text-[12px] text-[#bdbdbd] mt-1">{humanize(n.type)} · {timeAgo(n.created_at)}</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
