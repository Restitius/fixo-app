import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import Toggle from '../../components/Toggle'
import { fixoSdk } from '../../lib/api-client'

export default function NotificationSettings() {
  const { t } = useTranslation('profile')
  // Same real preference keys as web's Notifications tab
  // (NOTIFY_<ROW>_<CHANNEL>), using the PUSH channel since mobile shows one
  // toggle per category rather than web's full push/email/sms matrix.
  const OPTIONS = [
    { key: 'NOTIFY_BOOKING_UPDATES_PUSH', label: t('notifications.bookingUpdates'), desc: t('notifications.bookingUpdatesDesc'), default: true },
    { key: 'NOTIFY_PROVIDER_MESSAGES_PUSH', label: t('notifications.providerMessages'), desc: t('notifications.providerMessagesDesc'), default: true },
    { key: 'NOTIFY_PAYMENT_RECEIPTS_PUSH', label: t('notifications.paymentReceipts'), desc: t('notifications.paymentReceiptsDesc'), default: false },
    { key: 'NOTIFY_PROMOTIONS_PUSH', label: t('notifications.promotions'), desc: t('notifications.promotionsDesc'), default: false },
    { key: 'NOTIFY_QUIET_HOURS_PUSH', label: t('notifications.quietHours'), desc: t('notifications.quietHoursDesc'), default: true },
  ]
  const [values, setValues] = useState<Record<string, boolean> | null>(null)

  useEffect(() => {
    fixoSdk.listPreferences().then((prefs) => {
      const map: Record<string, boolean> = {}
      for (const o of OPTIONS) {
        const found = prefs.find((p) => p.key === o.key)
        map[o.key] = found ? found.value === 'true' : o.default
      }
      setValues(map)
    }).catch(() => setValues(Object.fromEntries(OPTIONS.map((o) => [o.key, o.default]))))
  }, [])

  async function toggle(key: string) {
    const next = !(values?.[key] ?? false)
    setValues((prev) => ({ ...(prev ?? {}), [key]: next }))
    try {
      await fixoSdk.setPreference(key, String(next))
    } catch {
      setValues((prev) => ({ ...(prev ?? {}), [key]: !next }))
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title={t('notifications.title')} back="/(tabs)/profile" />
      <ScrollView>
        <View className="flex-col px-6 mt-2">
          {OPTIONS.map((o, i) => (
            <View key={o.key} className={`flex-row items-center gap-4 py-4 ${i === OPTIONS.length - 1 ? '' : 'border-b border-hairline'}`}>
              <View className="flex-1 min-w-0">
                <Text className="font-semibold text-ink text-[14px]">{o.label}</Text>
                <Text className="text-[13px] text-muted mt-0.5">{o.desc}</Text>
              </View>
              <Toggle checked={values?.[o.key] ?? o.default} onChange={() => toggle(o.key)} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
