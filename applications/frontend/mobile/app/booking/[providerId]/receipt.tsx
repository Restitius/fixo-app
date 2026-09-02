import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../../components/ScreenHeader'
import PaymentIcon from '../../../components/PaymentIcon'
import { providerById, CATEGORIES, PAYMENT_METHODS } from '../../../data/mock'
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
  const { providerId = '', date, time, workingHours, itemsSummary, payment, subtotal, discount, total } = useLocalSearchParams<{
    providerId: string
    date?: string
    time?: string
    workingHours?: string
    itemsSummary?: string
    payment?: string
    subtotal?: string
    discount?: string
    total?: string
  }>()
  const provider = providerById(providerId)
  const [menuOpen, setMenuOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  if (!provider) return null
  const category = CATEGORIES.find((c) => c.id === provider.categoryId)

  const info = date
    ? {
        date,
        time: time ?? '—',
        workingHours: Number(workingHours ?? 0),
        itemsSummary: itemsSummary ?? '',
        payment: payment ?? PAYMENT_METHODS[0]!.id,
        subtotal: Number(subtotal ?? provider.price),
        discount: Number(discount ?? 0),
        total: Number(total ?? provider.price),
      }
    : {
        date: 'Sep 3, 2026',
        time: '10:00 AM',
        workingHours: 2,
        itemsSummary: 'No details available',
        payment: PAYMENT_METHODS[0]!.id,
        subtotal: provider.price,
        discount: 0,
        total: provider.price,
      }
  const pm = PAYMENT_METHODS.find((p) => p.id === info.payment)

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
              <Text className="text-[12px] text-muted tracking-widest mt-2">273628   837279</Text>
            </View>

            <View className="rounded-2xl border border-hairline p-4 flex-col gap-3">
              <Row label="Services" value={provider.title} />
              <Row label="Category" value={category?.name ?? ''} />
              <Row label="Workers" value={provider.name} />
              <Row label="Date & Time" value={`${info.date} | ${info.time}`} />
              <Row label="Working Hours" value={`${info.workingHours} hours`} />
            </View>

            <Pressable
              onPress={() => setDetailsOpen((v) => !v)}
              className="w-full flex-row items-center justify-between rounded-2xl border border-hairline p-4 mt-4"
            >
              <Text className="text-[14px] font-medium text-ink">{provider.title} Details</Text>
              <View style={{ transform: [{ rotate: detailsOpen ? '180deg' : '0deg' }] }}>
                <ChevronDownIcon size={16} color="#6C7585" />
              </View>
            </Pressable>
            {detailsOpen && <Text className="text-[13px] text-muted px-4 pt-2 leading-relaxed">{info.itemsSummary}</Text>}

            <View className="rounded-2xl border border-hairline p-4 mt-4 flex-col gap-2">
              <View className="flex-row justify-between">
                <Text className="text-ink text-[14px]">Amount</Text>
                <Text className="text-ink text-[14px]">${info.subtotal.toFixed(2)}</Text>
              </View>
              {info.discount > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-primary font-medium text-[14px]">Promo</Text>
                  <Text className="text-primary font-medium text-[14px]">- ${info.discount.toFixed(2)}</Text>
                </View>
              )}
              <View className="flex-row items-center justify-between">
                <Text className="text-muted text-[14px]">Payment Methods</Text>
                <View className="flex-row items-center gap-2">
                  <PaymentIcon icon={pm?.icon ?? ''} size={16} />
                  <Text className="text-ink font-medium text-[14px]">{pm?.icon === 'cash' ? 'Cash' : 'Credit Card'}</Text>
                </View>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted text-[14px]">Date</Text>
                <Text className="text-ink font-medium text-[14px]">Dec 14, 2026 | 10:01:16 AM</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-muted text-[14px]">Transaction ID</Text>
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-ink font-medium text-[14px]">SK7263727399</Text>
                  <Pressable onPress={() => copyToClipboard('SK7263727399')}>
                    <CopyIcon size={14} color="#7210FF" />
                  </Pressable>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-muted text-[14px]">Status</Text>
                <Text className="text-[12px] font-semibold bg-primary/8 text-primary rounded-full px-3 py-1">Paid</Text>
              </View>
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
