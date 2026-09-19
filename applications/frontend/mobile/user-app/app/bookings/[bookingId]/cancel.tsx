import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../../components/ScreenHeader'
import Button from '../../../components/Button'
import { CenterModal } from '../../../components/Sheet'
import { bookingApi, type BookingRow } from '../../../lib/api-client'
import { fmtMoney } from '../../../lib/format'
import { BackspaceIcon, CheckCircleIcon } from '../../../components/icons'

type Step = 'reason' | 'pin' | 'success'

export default function CancelBookingFlow() {
  const { t } = useTranslation('booking')
  const REASONS = [
    t('cancel.reasonChangeOfPlans'),
    t('cancel.reasonBetterPrice'),
    t('cancel.reasonMistake'),
    t('cancel.reasonUnavailable'),
    t('cancel.reasonOther'),
  ]
  const { bookingId = '' } = useLocalSearchParams<{ bookingId: string }>()
  const [booking, setBooking] = useState<BookingRow | null>(null)
  const [step, setStep] = useState<Step>('reason')
  const [reason, setReason] = useState(REASONS[0])
  const [pin, setPin] = useState<string[]>([])
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    bookingApi.getBooking(bookingId).then(setBooking).catch(() => setBooking(null))
  }, [bookingId])

  async function confirmCancel() {
    setCancelling(true)
    setError(null)
    try {
      await bookingApi.cancelBooking(bookingId)
      setStep('success')
    } catch {
      setError(t('cancel.genericError'))
      setStep('reason')
    } finally {
      setCancelling(false)
    }
  }

  if (!booking) return null

  if (step === 'reason') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <ScreenHeader title={t('cancel.title')} back="/(tabs)/bookings" />
        <View className="flex-1 px-6 pt-4">
          <Text className="text-[14px] font-semibold text-ink mb-3">{t('cancel.whyCancelling')}</Text>
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
          {error && <Text className="text-[13px] text-red-500 mt-4 text-center">{error}</Text>}
          <View className="flex-1" />
          <View className="pb-6 pt-6">
            <Button onPress={() => setStep('pin')}>{t('cancel.continue')}</Button>
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
        if (next.length === LENGTH) setTimeout(() => void confirmCancel(), 400)
      }
    }
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <ScreenHeader title={t('cancel.confirmTitle')} onBack={() => setStep('reason')} />
        <View className="flex-1 px-6 pt-10">
          <Text className="text-center text-[16px] text-ink">
            {cancelling ? t('cancel.cancelling') : t('cancel.enterPinToConfirm')}
          </Text>
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
        <Text className="text-[22px] font-bold text-ink">{t('cancel.cancelledTitle')}</Text>
        <Text className="text-[15px] text-muted mt-3 text-center">
          {t('cancel.cancelledBody', { provider: booking.provider_name ?? t('cancel.providerFallback') })}
          {booking.payment?.status === 'AUTHORIZED' ? t('cancel.cancelledBodyRelease', { amount: fmtMoney(booking.agreed_amount, booking.currency) }) : ''}
        </Text>
        <View className="w-full mt-8">
          <Button onPress={() => router.replace('/(tabs)/bookings')}>{t('cancel.backToBookings')}</Button>
        </View>
      </CenterModal>
    </View>
  )
}
