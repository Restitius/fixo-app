import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import { FileTextIcon } from '../../components/icons'
import { fixoSdk, type InvoiceRow } from '../../lib/api-client'
import { fmtDate, fmtMoney, humanize } from '../../lib/format'

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  PAID: { bg: '#00B894' + '1A', color: '#00B894' },
  PENDING: { bg: '#FDCB6E' + '33', color: '#B8860B' },
  OVERDUE: { bg: '#FF6B6B' + '1A', color: '#FF6B6B' },
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<InvoiceRow[] | null>(null)

  useEffect(() => {
    fixoSdk.listInvoices(50, 0).then(setInvoices).catch(() => setInvoices([]))
  }, [])

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Invoices" back="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-col gap-3 px-6 mt-2">
          {invoices === null ? (
            <View className="h-24 rounded-2xl bg-[#f5f5f5]" />
          ) : invoices.length === 0 ? (
            <Text className="text-center text-muted py-8 text-[14px]">No invoices yet.</Text>
          ) : (
            invoices.map((inv) => {
              const style = STATUS_STYLE[inv.status.toUpperCase()] ?? STATUS_STYLE.PENDING!
              return (
                <View key={inv.invoice_id} className="rounded-2xl border border-hairline p-4">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-row items-center gap-3 flex-1 min-w-0">
                      <View className="items-center justify-center size-11 rounded-full bg-primary/8 shrink-0">
                        <FileTextIcon size={18} color="#7210FF" />
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text numberOfLines={1} className="font-bold text-ink text-[14px]">
                          {inv.service_name ?? 'Service'}
                        </Text>
                        <Text className="text-[12px] text-primary font-semibold mt-0.5">{inv.invoice_number}</Text>
                      </View>
                    </View>
                    <View className="items-end shrink-0">
                      <Text className="font-bold text-ink text-[14px]">{fmtMoney(inv.total_amount, inv.currency)}</Text>
                      <View className="mt-1 rounded-full px-2.5 py-0.5" style={{ backgroundColor: style.bg }}>
                        <Text className="text-[11px] font-semibold" style={{ color: style.color }}>
                          {humanize(inv.status)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text className="text-[12px] text-muted mt-2">
                    Issued {fmtDate(inv.issued_at ?? inv.created_at)} · {inv.provider_name}
                  </Text>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
