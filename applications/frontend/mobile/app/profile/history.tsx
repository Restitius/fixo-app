import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import { BOOKINGS, INVOICES, LOYALTY_TRANSACTIONS, WALLET_TRANSACTIONS, providerById, bookingById } from '../../data/mock'

const TABS = ['Bookings', 'Wallet', 'Loyalty', 'Invoices'] as const
type Tab = (typeof TABS)[number]

const BOOKING_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  upcoming: { bg: '#0984E3' + '1A', color: '#0984E3' },
  completed: { bg: '#00B894' + '1A', color: '#00B894' },
  cancelled: { bg: '#FF6B6B' + '1A', color: '#FF6B6B' },
}

export default function History() {
  const [tab, setTab] = useState<Tab>('Bookings')

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="History" back="/(tabs)/profile" />
      <View className="px-6">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {TABS.map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} className={`rounded-full px-4 py-2 ${tab === t ? 'bg-primary' : 'bg-[#f5f5f5]'}`}>
              <Text className={`text-[13px] font-semibold ${tab === t ? 'text-white' : 'text-ink'}`}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-col gap-3 px-6 mt-4">
          {tab === 'Bookings' &&
            BOOKINGS.map((b) => {
              const provider = providerById(b.providerId)
              const style = BOOKING_STATUS_STYLE[b.status]!
              return (
                <View key={b.id} className="rounded-2xl border border-hairline p-4">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1 min-w-0">
                      <Text numberOfLines={1} className="font-bold text-ink text-[14px]">
                        {provider?.title ?? 'Service'}
                      </Text>
                      <Text className="text-[12px] text-muted mt-0.5">{provider?.name} · {b.date}</Text>
                    </View>
                    <View className="items-end shrink-0">
                      <Text className="font-bold text-ink text-[14px]">${b.price.toFixed(2)}</Text>
                      <View className="mt-1 rounded-full px-2.5 py-0.5" style={{ backgroundColor: style.bg }}>
                        <Text className="text-[11px] font-semibold" style={{ color: style.color }}>
                          {b.status[0]!.toUpperCase() + b.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )
            })}

          {tab === 'Wallet' &&
            WALLET_TRANSACTIONS.map((t) => (
              <View key={t.id} className="flex-row items-center justify-between rounded-2xl border border-hairline p-4">
                <View className="flex-1 min-w-0">
                  <Text numberOfLines={1} className="font-semibold text-ink text-[14px]">
                    {t.note}
                  </Text>
                  <Text className="text-[12px] text-muted mt-0.5">{t.date}</Text>
                </View>
                <Text className={`font-bold text-[14px] shrink-0 ${t.entryType === 'credit' ? 'text-[#00B894]' : 'text-ink'}`}>
                  {t.entryType === 'credit' ? '+' : '-'}${t.amount.toFixed(2)}
                </Text>
              </View>
            ))}

          {tab === 'Loyalty' &&
            LOYALTY_TRANSACTIONS.map((t) => (
              <View key={t.id} className="flex-row items-center justify-between rounded-2xl border border-hairline p-4">
                <View className="flex-1 min-w-0">
                  <Text numberOfLines={1} className="font-semibold text-ink text-[14px]">
                    {t.activity}
                  </Text>
                  <Text className="text-[12px] text-muted mt-0.5">{t.date}</Text>
                </View>
                <Text className={`font-bold text-[14px] shrink-0 ${t.points > 0 ? 'text-[#00B894]' : 'text-ink'}`}>
                  {t.points > 0 ? '+' : ''}
                  {t.points} pts
                </Text>
              </View>
            ))}

          {tab === 'Invoices' &&
            INVOICES.map((inv) => {
              const booking = bookingById(inv.bookingId)
              const provider = booking ? providerById(booking.providerId) : undefined
              return (
                <View key={inv.id} className="flex-row items-center justify-between rounded-2xl border border-hairline p-4">
                  <View className="flex-1 min-w-0">
                    <Text numberOfLines={1} className="font-semibold text-ink text-[14px]">
                      {provider?.title ?? 'Service'}
                    </Text>
                    <Text className="text-[12px] text-primary font-medium mt-0.5">{inv.invoiceNumber}</Text>
                  </View>
                  <Text className="font-bold text-ink text-[14px] shrink-0">${inv.amount.toFixed(2)}</Text>
                </View>
              )
            })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
