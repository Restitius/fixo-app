import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from '../../components/Avatar'
import Tabs from '../../components/Tabs'
import Button from '../../components/Button'
import StatusBadge from '../../components/StatusBadge'
import { CalendarEmptyIllustration, ChevronDownIcon, ChevronRightIcon, LocationIcon } from '../../components/icons'
import { bookingApi, fixoSdk, type BookingHistoryRow, type BookingRow } from '../../lib/api-client'
import { fmtDate, fmtMoney, humanize, initialsOf } from '../../lib/format'

const TABS = [
  { id: 'upcoming' as const, label: 'Upcoming' },
  { id: 'completed' as const, label: 'Completed' },
  { id: 'cancelled' as const, label: 'Cancelled' },
]

const UPCOMING_STATUSES = ['CONFIRMED', 'PAYMENT_AUTHORIZED', 'PROVIDER_SELECTED', 'QUOTE_ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'STARTED', 'IN_PROGRESS']
const COMPLETED_STATUSES = ['PAID', 'CLOSED']

export default function MyBookings() {
  const [tab, setTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming')
  const [rows, setRows] = useState<BookingHistoryRow[] | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [detail, setDetail] = useState<BookingRow | null>(null)

  useEffect(() => {
    fixoSdk.bookingHistory(undefined, 100, 0).then(setRows).catch(() => setRows([]))
  }, [])

  const bookings = (rows ?? []).filter((b) =>
    tab === 'upcoming' ? UPCOMING_STATUSES.includes(b.status) : tab === 'completed' ? COMPLETED_STATUSES.includes(b.status) : b.status === 'CANCELLED',
  )

  function toggle(b: BookingHistoryRow) {
    if (expanded === b.booking_id) {
      setExpanded(null)
      return
    }
    setExpanded(b.booking_id)
    setDetail(null)
    bookingApi.getBooking(b.booking_id).then(setDetail).catch(() => setDetail(null))
  }

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

        {rows === null ? (
          <View className="px-6 mt-5 h-24 rounded-2xl bg-[#f5f5f5]" />
        ) : bookings.length === 0 ? (
          <View className="items-center px-10 pt-16">
            <CalendarEmptyIllustration size={130} />
            <Text className="text-[16px] font-semibold text-ink mt-4">No {tab} bookings</Text>
            <Text className="text-[14px] text-muted mt-1 text-center">Your {tab} bookings will show up here.</Text>
          </View>
        ) : (
          <View className="gap-3 px-6 mt-5">
            {bookings.map((b) => {
              const isOpen = expanded === b.booking_id
              return (
                <View key={b.booking_id} className="rounded-2xl border border-hairline overflow-hidden">
                  <Pressable onPress={() => toggle(b)} className="flex-row items-center gap-4 p-4">
                    <Avatar label={initialsOf(b.provider_name ?? '?')} size={48} />
                    <View className="flex-1">
                      <Text numberOfLines={1} className="font-bold text-ink">
                        {b.provider_name ?? b.service_name ?? 'Service'}
                      </Text>
                      <Text className="text-[13px] text-muted">
                        {fmtDate(b.scheduled_date)}{b.time_window ? ` • ${humanize(b.time_window)}` : ''}
                      </Text>
                    </View>
                    <StatusBadge status={tab} />
                    <ChevronDownIcon size={16} color="#6C7585" />
                  </Pressable>

                  {isOpen && (
                    <View className="px-4 pb-4">
                      <View className="rounded-xl bg-[#f7f7f7] p-4 gap-2">
                        {detail === null ? (
                          <Text className="text-[13px] text-muted">Loading details…</Text>
                        ) : (
                          <>
                            {detail.address_street && (
                              <View className="flex-row items-start gap-2">
                                <LocationIcon size={16} color="#6C7585" />
                                <Text className="text-[13px] text-muted flex-1">
                                  {detail.address_street}{detail.address_city ? `, ${detail.address_city}` : ''}
                                </Text>
                              </View>
                            )}
                            <View className="flex-row justify-between pt-2 border-t border-hairline mt-1">
                              <Text className="text-[13px] text-muted">Total paid</Text>
                              <Text className="text-[13px] font-bold text-ink">{fmtMoney(b.agreed_amount, b.currency)}</Text>
                            </View>
                          </>
                        )}
                      </View>

                      <View className="flex-row gap-3 mt-3">
                        {detail?.selected_provider_id && (
                          <View className="flex-1">
                            <Button variant="outline" onPress={() => router.push(`/service/${detail.selected_provider_id}` as any)}>
                              View Provider
                            </Button>
                          </View>
                        )}
                        {tab === 'upcoming' ? (
                          <View className="flex-1">
                            <Button onPress={() => router.push(`/bookings/${b.booking_id}/cancel` as any)}>Cancel Booking</Button>
                          </View>
                        ) : tab === 'completed' ? (
                          <View className="flex-1">
                            <Button onPress={() => router.push(`/booking/${detail?.selected_provider_id ?? ''}/receipt?bookingId=${b.booking_id}` as any)}>
                              <View className="flex-row items-center gap-1.5">
                                <Text className="text-white font-bold text-[16px]">E-Receipt</Text>
                                <ChevronRightIcon size={16} color="#ffffff" />
                              </View>
                            </Button>
                          </View>
                        ) : null}
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
