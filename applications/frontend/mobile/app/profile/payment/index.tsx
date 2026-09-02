import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../../components/ScreenHeader'
import Button from '../../../components/Button'
import { CheckCircleIcon, PlusIcon } from '../../../components/icons'
import PaymentIcon from '../../../components/PaymentIcon'
import { PAYMENT_METHODS } from '../../../data/mock'

export default function PaymentSettings() {
  const [defaultId, setDefaultId] = useState(PAYMENT_METHODS[0]!.id)

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Payment Methods" back="/(tabs)/profile" />
      <ScrollView>
        <View className="flex-col gap-3 px-6 mt-3">
          {PAYMENT_METHODS.map((pm) => (
            <Pressable
              key={pm.id}
              onPress={() => setDefaultId(pm.id)}
              className={`flex-row items-center gap-4 rounded-2xl p-4 ${
                defaultId === pm.id ? 'border-2 border-primary bg-primary/5' : 'border border-hairline'
              }`}
            >
              <View className="items-center justify-center size-11 rounded-full bg-primary/8 shrink-0">
                <PaymentIcon icon={pm.icon} />
              </View>
              <Text className="text-[14px] text-ink flex-1">{pm.label}</Text>
              {defaultId === pm.id && <CheckCircleIcon size={20} color="#7210FF" />}
            </Pressable>
          ))}
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
