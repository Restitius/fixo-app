import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import Toggle from '../../components/Toggle'

const OPTIONS = [
  { id: 'push', label: 'Push Notifications', desc: 'Get notified about booking updates', default: true },
  { id: 'email', label: 'Email Notifications', desc: 'Receive receipts and updates by email', default: true },
  { id: 'sms', label: 'SMS Notifications', desc: 'Get text messages for important updates', default: false },
  { id: 'promo', label: 'Promotions & Offers', desc: 'Special deals and discounts', default: true },
  { id: 'chat', label: 'Chat Messages', desc: 'New messages from providers', default: true },
]

export default function NotificationSettings() {
  const [state, setState] = useState<Record<string, boolean>>(Object.fromEntries(OPTIONS.map((o) => [o.id, o.default])))

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Notification Settings" back="/(tabs)/profile" />
      <ScrollView>
        <View className="flex-col px-6 mt-2">
          {OPTIONS.map((o, i) => (
            <View
              key={o.id}
              className={`flex-row items-center gap-4 py-4 ${i === OPTIONS.length - 1 ? '' : 'border-b border-hairline'}`}
            >
              <View className="flex-1 min-w-0">
                <Text className="font-semibold text-ink text-[14px]">{o.label}</Text>
                <Text className="text-[13px] text-muted mt-0.5">{o.desc}</Text>
              </View>
              <Toggle checked={state[o.id]!} onChange={(v) => setState((s) => ({ ...s, [o.id]: v }))} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
