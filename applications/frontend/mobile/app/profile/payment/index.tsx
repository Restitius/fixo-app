import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../../components/ScreenHeader'
import Button from '../../../components/Button'
import { CheckCircleIcon, PlusIcon } from '../../../components/icons'
import PaymentIcon from '../../../components/PaymentIcon'
import { fixoSdk, type PaymentMethod } from '../../../lib/api-client'
import { humanize } from '../../../lib/format'

export default function PaymentSettings() {
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null)

  function refresh() {
    fixoSdk.listPaymentMethods().then(setMethods).catch(() => setMethods([]))
  }

  useEffect(refresh, [])

  async function makeDefault(id: string) {
    setMethods((prev) => (prev ?? []).map((m) => ({ ...m, is_default: m.method_id === id })))
    try {
      await fixoSdk.setDefaultPaymentMethod(id)
    } catch {
      refresh()
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Payment Methods" back="/(tabs)/profile" />
      <ScrollView>
        <View className="flex-col gap-3 px-6 mt-3">
          {methods === null ? (
            <View className="h-20 rounded-2xl bg-[#f5f5f5]" />
          ) : methods.length === 0 ? (
            <Text className="text-center text-muted py-8 text-[14px]">No payment methods yet.</Text>
          ) : (
            methods.map((pm) => {
              const last4 = (pm.details_masked?.['last4'] as string | undefined) ?? '••••'
              return (
                <Pressable
                  key={pm.method_id}
                  onPress={() => makeDefault(pm.method_id)}
                  className={`flex-row items-center gap-4 rounded-2xl p-4 ${pm.is_default ? 'border-2 border-primary bg-primary/5' : 'border border-hairline'}`}
                >
                  <View className="items-center justify-center size-11 rounded-full bg-primary/8 shrink-0">
                    <PaymentIcon icon={(pm.provider ?? pm.type).toLowerCase()} />
                  </View>
                  <Text className="text-[14px] text-ink flex-1">{pm.provider ?? humanize(pm.type)} •••• {last4}</Text>
                  {pm.is_default && <CheckCircleIcon size={20} color="#7210FF" />}
                </Pressable>
              )
            })
          )}
        </View>

        <View className="px-6 mt-6">
          <Button variant="outline" onPress={() => router.push('/profile/payment/add-card')}>
            <View className="flex-row items-center justify-center gap-2 w-full">
              <PlusIcon size={16} color="#0B111F" />
              <Text className="text-[16px] font-bold text-ink">Add New Card</Text>
            </View>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
