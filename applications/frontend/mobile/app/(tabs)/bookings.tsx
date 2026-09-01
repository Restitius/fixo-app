import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from '../../components/Avatar'
import Tabs from '../../components/Tabs'
import Button from '../../components/Button'
import StatusBadge from '../../components/StatusBadge'
import { CalendarEmptyIllustration, ChevronDownIcon, ChevronRightIcon, LocationIcon } from '../../components/icons'
import { bookingsByStatus, providerById, type Booking } from '../../data/mock'

const TABS = [
  { id: 'upcoming' as const, label: 'Upcoming' },
  { id: 'completed' as const, label: 'Completed' },
  { id: 'cancelled' as const, label: 'Cancelled' },
]

export default function MyBookings() {
  const [tab, setTab] = useState<Booking['status']>('upcoming')
  const [expanded, setExpanded] = useState<string | null>(null)
  const bookings = bookingsByStatus(tab)

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <Text className="text-[22px] font-extrabold text-ink px-6 pt-2">My Bookings</Text>

        <View className="mt-4">
          <Tabs
            tabs={TABS}
            active={tab}
            onChange={(t) => {
              setTab(t)
              setExpanded(null)
            }}
          />
        </View>

        {bookings.length === 0 ? (
          <View className="items-center px-10 pt-16">
            <CalendarEmptyIllustration size={130} />
            <Text className="text-[16px] font-semibold text-ink mt-4">No {tab} bookings</Text>
            <Text className="text-[14px] text-muted mt-1 text-center">Your {tab} bookings will show up here.</Text>
          </View>
        ) : (
          <View className="gap-3 px-6 mt-5">
            {bookings.map((b) => {
              const provider = providerById(b.providerId)
              if (!provider) return null
              const isOpen = expanded === b.id
              return (
                <View key={b.id} className="rounded-2xl border border-hairline overflow-hidden">
                  <Pressable onPress={() => setExpanded(isOpen ? null : b.id)} className="flex-row items-center gap-4 p-4">
                    <Avatar label={provider.avatar} size={48} />
                    <View className="flex-1">
                      <Text numberOfLines={1} className="font-bold text-ink">
                        {provider.name}
                      </Text>
                      <Text className="text-[13px] text-muted">
                        {b.date} • {b.time}
                      </Text>
                    </View>
                    <StatusBadge status={b.status} />
                    <ChevronDownIcon size={16} color="#6C7585" />
                  </Pressable>

                  {isOpen && (
                    <View className="px-4 pb-4">
                      <View className="rounded-xl bg-[#f7f7f7] p-4 gap-2">
                        <View className="flex-row items-start gap-2">
                          <LocationIcon size={16} color="#6C7585" />
                          <Text className="text-[13px] text-muted flex-1">{b.address}</Text>
                        </View>
                        <View className="flex-row justify-between pt-2 border-t border-hairline mt-1">
                          <Text className="text-[13px] text-muted">Total paid</Text>
                          <Text className="text-[13px] font-bold text-ink">${b.price}</Text>
                        </View>
                      </View>

                      <View className="flex-row gap-3 mt-3">
                        <View className="flex-1">
                          <Button variant="outline" onPress={() => router.push(`/service/${provider.id}` as any)}>
                            View Provider
                          </Button>
                        </View>
                        {b.status === 'upcoming' ? (
                          <View className="flex-1">
                            <Button onPress={() => router.push(`/bookings/${b.id}/cancel` as any)}>Cancel Booking</Button>
                          </View>
                        ) : (
                          <View className="flex-1">
                            <Button onPress={() => router.push(`/booking/${provider.id}/receipt` as any)}>
                              <View className="flex-row items-center gap-1.5">
                                <Text className="text-white font-bold text-[16px]">E-Receipt</Text>
                                <ChevronRightIcon size={16} color="#ffffff" />
                              </View>
                            </Button>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
