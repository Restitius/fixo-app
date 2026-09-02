import type { ReactNode } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import { CheckCircleIcon, ClockIcon, CreditCardIcon, StarIcon, XCircleIcon } from '../../components/icons'
import { ACTIVITY_EVENTS, bookingById, providerById } from '../../data/mock'

const EVENT_ICON: Record<string, { icon: (p: { size?: number; color?: string }) => ReactNode; color: string }> = {
  'Booking Created': { icon: ClockIcon, color: '#0984E3' },
  'Booking Confirmed': { icon: CheckCircleIcon, color: '#00B894' },
  'Payment Authorized': { icon: CreditCardIcon, color: '#7210FF' },
  'Review Submitted': { icon: StarIcon, color: '#FDCB6E' },
  'Invoice Ready': { icon: CreditCardIcon, color: '#7210FF' },
  'Booking Cancelled': { icon: XCircleIcon, color: '#FF6B6B' },
}

export default function Activity() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Activity" back="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-2">
          {ACTIVITY_EVENTS.map((a, i) => {
            const booking = bookingById(a.bookingId)
            const provider = booking ? providerById(booking.providerId) : undefined
            const meta = EVENT_ICON[a.event] ?? { icon: ClockIcon, color: '#6C7585' }
            const Icon = meta.icon
            const isLast = i === ACTIVITY_EVENTS.length - 1
            return (
              <View key={a.id} className="flex-row gap-4">
                <View className="items-center">
                  <View className="items-center justify-center size-9 rounded-full shrink-0" style={{ backgroundColor: `${meta.color}1A` }}>
                    <Icon size={16} color={meta.color} />
                  </View>
                  {!isLast && <View className="w-px flex-1 bg-hairline my-1" />}
                </View>
                <View className="flex-1 min-w-0 pb-6">
                  <Text className="font-bold text-ink text-[14px]">{a.event}</Text>
                  <Text className="text-[13px] text-muted mt-0.5">{a.detail}</Text>
                  {provider && <Text className="text-[12px] text-primary font-medium mt-0.5">{provider.title} · {provider.name}</Text>}
                  <Text className="text-[11px] text-[#bdbdbd] mt-1">{a.date}</Text>
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
