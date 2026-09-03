import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../../components/ScreenHeader'
import { bookingApi, type BookingRow } from '../../../lib/api-client'
import { fmtDate, fmtMoney, humanize } from '../../../lib/format'
import { ChevronDownIcon, CopyIcon, DownloadIcon, MoreHorizontalIcon, PrintIcon, ShareIcon } from '../../../components/icons'

function copyToClipboard(text: string) {
  if (typeof navigator !== 'undefined' && (navigator as any).clipboard) {
    ;(navigator as any).clipboard.writeText(text).catch(() => {})
  }
}

function Barcode() {
  const bars = Array.from({ length: 34 }, (_, i) => 1 + ((i * 37) % 4))
  return (
    <View className="flex-row items-end gap-[2px] h-16">
      {bars.map((w, i) => (
        <View key={i} className="bg-ink" style={{ width: w, height: '100%' }} />
      ))}
    </View>
  )
}

export default function EReceipt() {
  const { bookingId = '' } = useLocalSearchParams<{ bookingId: string }>()
  const [booking, setBooking] = useState<BookingRow | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (bookingId) bookingApi.getBooking(bookingId).then(setBooking).catch(() => setBooking(null))
  }, [bookingId])

  if (!booking) return null

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader
        title="E-Receipt"
        back="/(tabs)/bookings"
        right={
          <View>
            <Pressable onPress={() => setMenuOpen((v) => !v)} className="items-center justify-center size-9 rounded-full bg-[#f5f5f5]">
              <MoreHorizontalIcon size={16} color="#0B111F" />
            </Pressable>
            {menuOpen && (
              <View className="absolute right-0 top-11 z-20 w-52 rounded-2xl bg-white border border-hairline py-2">
                {[
                  { icon: ShareIcon, label: 'Share E-Receipt' },
                  { icon: DownloadIcon, label: 'Download E-Receipt' },
                  { icon: PrintIcon, label: 'Print' },
                ].map(({ icon: Icon, label }) => (
                  <Pressable key={label} onPress={() => setMenuOpen(false)} className="flex-row items-center gap-3 px-4 py-2.5">
                    <Icon size={16} color="#7210FF" />
                    <Text className="text-[14px] text-ink">{label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        }
      />

      <Pressable onPress={() => menuOpen && setMenuOpen(false)}>
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="px-6 pt-4">
            <View className="items-center py-4">
              <Barcode />
              <Text className="text-[12px] text-muted tracking-widest mt-2">{booking.booking_number}</Text>
            </View>

            <View className="rounded-2xl border border-hairline p-4 flex-col gap-3">
              <Row label="Service" value={booking.service_name ?? 'Service'} />
              <Row label="Provider" value={booking.provider_name ?? '—'} />
              <Row label="Date" value={fmtDate(booking.scheduled_date)} />
              {booking.time_window && <Row label="Time" value={humanize(booking.time_window)} />}
              {booking.address_street && <Row label="Address" value={`${booking.address_street}${booking.address_city ? `, ${booking.address_city}` : ''}`} />}
            </View>

            <View className="rounded-2xl border border-hairline p-4 mt-4 flex-col gap-2">
              <View className="flex-row justify-between">
                <Text className="text-ink text-[14px]">Amount</Text>
                <Text className="text-ink text-[14px]">{fmtMoney(booking.agreed_amount, booking.currency)}</Text>
              </View>
              {booking.arrival_code && (
                <View className="flex-row items-center justify-between">
                  <Text className="text-muted text-[14px]">Arrival Code</Text>
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-ink font-medium text-[14px]">{booking.arrival_code}</Text>
                    <Pressable onPress={() => copyToClipboard(booking.arrival_code!)}>
                      <CopyIcon size={14} color="#7210FF" />
                    </Pressable>
                  </View>
                </View>
              )}
              {booking.payment && (
                <>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted text-[14px]">Payment ID</Text>
                    <Text className="text-ink font-medium text-[14px]">{booking.payment.payment_id.slice(0, 12)}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-muted text-[14px]">Status</Text>
                    <Text className="text-[12px] font-semibold bg-primary/8 text-primary rounded-full px-3 py-1">{humanize(booking.payment.status)}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </Pressable>
    </SafeAreaView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text className="text-muted shrink-0 text-[14px]">{label}</Text>
      <Text className="text-ink font-medium text-right text-[14px]">{value}</Text>
    </View>
  )
}
