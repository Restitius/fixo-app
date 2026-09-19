import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import { CheckCircleIcon, ClockIcon, CreditCardIcon, StarIcon, XCircleIcon } from '../../components/icons'
import { fixoSdk, type ActivityEvent } from '../../lib/api-client'
import { fmtDateTime, humanize } from '../../lib/format'

function eventMeta(event: string): { icon: (p: { size?: number; color?: string }) => ReactNode; color: string } {
  const e = event.toUpperCase()
  if (e.includes('CANCEL')) return { icon: XCircleIcon, color: '#FF6B6B' }
  if (e.includes('CONFIRM')) return { icon: CheckCircleIcon, color: '#00B894' }
  if (e.includes('PAYMENT') || e.includes('INVOICE')) return { icon: CreditCardIcon, color: '#7210FF' }
  if (e.includes('REVIEW') || e.includes('RATING')) return { icon: StarIcon, color: '#FDCB6E' }
  return { icon: ClockIcon, color: '#0984E3' }
}

export default function Activity() {
  const { t } = useTranslation('profile')
  const [events, setEvents] = useState<ActivityEvent[] | null>(null)

  useEffect(() => {
    fixoSdk.activityFeed(undefined, 50, 0).then(setEvents).catch(() => setEvents([]))
  }, [])

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title={t('activity.title')} back="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-2">
          {events === null ? (
            <View className="h-24 rounded-2xl bg-[#f5f5f5]" />
          ) : events.length === 0 ? (
            <Text className="text-center text-muted py-8 text-[14px]">{t('activity.empty')}</Text>
          ) : (
            events.map((a, i) => {
              const meta = eventMeta(a.event)
              const Icon = meta.icon
              const isLast = i === events.length - 1
              return (
                <View key={i} className="flex-row gap-4">
                  <View className="items-center">
                    <View className="items-center justify-center size-9 rounded-full shrink-0" style={{ backgroundColor: `${meta.color}1A` }}>
                      <Icon size={16} color={meta.color} />
                    </View>
                    {!isLast && <View className="w-px flex-1 bg-hairline my-1" />}
                  </View>
                  <View className="flex-1 min-w-0 pb-6">
                    <Text className="font-bold text-ink text-[14px]">{humanize(a.event)}</Text>
                    {a.detail && <Text className="text-[13px] text-muted mt-0.5">{a.detail}</Text>}
                    {a.service_name && <Text className="text-[12px] text-primary font-medium mt-0.5">{a.service_name} · {a.booking_number}</Text>}
                    <Text className="text-[11px] text-[#bdbdbd] mt-1">{fmtDateTime(a.created_at)}</Text>
                  </View>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
