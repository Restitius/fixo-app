import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../../components/ScreenHeader'
import Button from '../../../components/Button'
import { CenterModal } from '../../../components/Sheet'
import { bookingById, providerById, PAYMENT_METHODS } from '../../../data/mock'
import { BackspaceIcon, CheckCircleIcon } from '../../../components/icons'
import PaymentIcon from '../../../components/PaymentIcon'

type Step = 'modal' | 'refund' | 'pin' | 'success'

const REASONS = ['Change of plans', 'Found a better price', 'Booked by mistake', 'Provider unavailable', 'Other']

export default function CancelBookingFlow() {
  const { bookingId = '' } = useLocalSearchParams<{ bookingId: string }>()
  const booking = bookingById(bookingId)
  const provider = booking ? providerById(booking.providerId) : undefined

  const [step, setStep] = useState<Step>('modal')
  const [reason, setReason] = useState(REASONS[0])
  const [refund, setRefund] = useState(PAYMENT_METHODS[0]!.id)
  const [pin, setPin] = useState<string[]>([])

  if (!booking || !provider) return null

  if (step === 'modal') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <ScreenHeader title="Cancel Booking" back="/(tabs)/bookings" />
        <View className="flex-1 px-6 pt-4">
          <Text className="text-[14px] font-semibold text-ink mb-3">Why are you cancelling?</Text>
          <View className="flex-col gap-2.5">
            {REASONS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setReason(r)}
                className={`flex-row items-center justify-between rounded-2xl p-4 ${
                  reason === r ? 'border-2 border-primary bg-primary/5' : 'border border-hairline'
                }`}
              >
                <Text className="text-[14px] text-ink">{r}</Text>
                {reason === r && <CheckCircleIcon size={20} color="#7210FF" />}
              </Pressable>
            ))}
          </View>
          <View className="flex-1" />
          <View className="pb-6 pt-6">
            <Button onPress={() => setStep('refund')}>Continue</Button>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (step === 'refund') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <ScreenHeader title="Refund Method" onBack={() => setStep('modal')} />
        <View className="flex-1 px-6 pt-4">
          <Text className="text-[14px] font-semibold text-ink mb-3">Where should we send your ${booking.price} refund?</Text>
          <View className="flex-col gap-3">
            {PAYMENT_METHODS.filter((p) => p.icon !== 'cash').map((pm) => (
              <Pressable
                key={pm.id}
                onPress={() => setRefund(pm.id)}
                className={`flex-row items-center gap-4 rounded-2xl p-4 ${
                  refund === pm.id ? 'border-2 border-primary bg-primary/5' : 'border border-hairline'
                }`}
              >
                <View className="items-center justify-center size-11 rounded-full bg-primary/8 shrink-0">
                  <PaymentIcon icon={pm.icon} />
                </View>
                <Text className="text-[14px] text-ink flex-1">{pm.label}</Text>
                {refund === pm.id && <CheckCircleIcon size={20} color="#7210FF" />}
              </Pressable>
            ))}
          </View>
          <View className="flex-1" />
          <View className="pb-6 pt-6">
            <Button onPress={() => setStep('pin')}>Continue</Button>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (step === 'pin') {
    const LENGTH = 4
    const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', 'back']
    function press(key: string) {
      if (key === 'back') return setPin(pin.slice(0, -1))
      if (key === '*') return
      if (pin.length < LENGTH) {
        const next = [...pin, key]
        setPin(next)
        if (next.length === LENGTH) setTimeout(() => setStep('success'), 400)
      }
    }
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <ScreenHeader title="Confirm Cancellation" onBack={() => setStep('refund')} />
        <View className="flex-1 px-6 pt-10">
          <Text className="text-center text-[16px] text-ink">Enter your PIN to confirm cancellation</Text>
          <View className="flex-row justify-center gap-4 mt-8">
            {Array.from({ length: LENGTH }).map((_, i) => {
              const isLast = i === pin.length - 1
              const hasDigit = pin[i] !== undefined
              return (
                <View key={i} className={`size-16 rounded-2xl items-center justify-center ${isLast ? 'border-2 border-primary bg-primary/5' : 'bg-[#f5f5f5]'}`}>
                  <Text className={`text-[22px] font-bold ${isLast ? 'text-primary' : 'text-ink'}`}>{hasDigit ? (isLast ? pin[i] : '●') : ''}</Text>
                </View>
              )
            })}
          </View>
        </View>
        <View className="bg-[#f7f7f7] rounded-t-[32px] px-6 pt-6 pb-8">
          <View className="flex-row flex-wrap">
            {KEYS.map((key) => (
              <Pressable key={key} onPress={() => press(key)} className="h-16 items-center justify-center" style={{ width: '33.33%' }}>
                {key === 'back' ? <BackspaceIcon size={24} color="#0B111F" /> : <Text className="text-[24px] font-medium text-ink">{key}</Text>}
              </Pressable>
            ))}
          </View>
          <View className="w-32 h-1.5 bg-ink/80 rounded-full self-center mt-4" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <View className="flex-1 bg-white">
      <CenterModal open>
        <View className="items-center justify-center size-24 rounded-full bg-[#FF6B6B]/10 mb-6">
          <CheckCircleIcon size={44} color="#FF6B6B" />
        </View>
        <Text className="text-[22px] font-bold text-ink">Booking Cancelled</Text>
        <Text className="text-[15px] text-muted mt-3 text-center">
          Your booking with {provider.name} has been cancelled. Your refund of ${booking.price} will arrive within 3-5 business days.
        </Text>
        <View className="w-full mt-8">
          <Button onPress={() => router.replace('/(tabs)/bookings')}>Back to Bookings</Button>
        </View>
      </CenterModal>
    </View>
  )
}
