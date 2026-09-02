import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import { FileTextIcon } from '../../components/icons'
import { INVOICES, providerById, bookingById } from '../../data/mock'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  paid: { bg: '#00B894' + '1A', color: '#00B894' },
  pending: { bg: '#FDCB6E' + '33', color: '#B8860B' },
  overdue: { bg: '#FF6B6B' + '1A', color: '#FF6B6B' },
}

export default function Invoices() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Invoices" back="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-col gap-3 px-6 mt-2">
          {INVOICES.map((inv) => {
            const booking = bookingById(inv.bookingId)
            const provider = booking ? providerById(booking.providerId) : undefined
            const style = STATUS_STYLE[inv.status]!
            return (
              <View key={inv.id} className="rounded-2xl border border-hairline p-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-row items-center gap-3 flex-1 min-w-0">
                    <View className="items-center justify-center size-11 rounded-full bg-primary/8 shrink-0">
                      <FileTextIcon size={18} color="#7210FF" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text numberOfLines={1} className="font-bold text-ink text-[14px]">
                        {provider?.title ?? 'Service'}
                      </Text>
                      <Text className="text-[12px] text-primary font-semibold mt-0.5">{inv.invoiceNumber}</Text>
                    </View>
                  </View>
                  <View className="items-end shrink-0">
                    <Text className="font-bold text-ink text-[14px]">${inv.amount.toFixed(2)}</Text>
                    <View className="mt-1 rounded-full px-2.5 py-0.5" style={{ backgroundColor: style.bg }}>
                      <Text className="text-[11px] font-semibold" style={{ color: style.color }}>
                        {inv.status[0]!.toUpperCase() + inv.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text className="text-[12px] text-muted mt-2">Issued {inv.issuedDate}{provider ? ` · ${provider.name}` : ''}</Text>
              </View>
            )
          })}
          {INVOICES.length === 0 && <Text className="text-center text-muted py-8 text-[14px]">No invoices yet.</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
