import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../../components/ScreenHeader'
import Button from '../../../components/Button'
import { useAuth } from '../../../lib/auth-context'
import { BackspaceIcon } from '../../../components/icons'

// Real codes are 6 digits (matches the backend's f"{secrets.randbelow(1_000_000):06d}"),
// not the mock's 4-digit PIN-style code. The code itself isn't verified here —
// the backend verifies it atomically together with setting the new password
// on the next screen, so there's nothing real to "check" until then.
const LENGTH = 6
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', 'back']

export default function OtpVerify() {
  const { t } = useTranslation('auth')
  const { email = '', otp_dev } = useLocalSearchParams<{ email: string; otp_dev?: string }>()
  const { forgotPassword } = useAuth()
  const [digits, setDigits] = useState<string[]>([])
  const [seconds, setSeconds] = useState(55)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (seconds <= 0) return
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [seconds])

  function press(key: string) {
    if (key === 'back') return setDigits((d) => d.slice(0, -1))
    if (key === '*') return
    setDigits((d) => (d.length < LENGTH ? [...d, key] : d))
  }

  async function resend() {
    if (seconds > 0 || resending) return
    setResending(true)
    try {
      await forgotPassword(email)
      setSeconds(55)
      setDigits([])
    } finally {
      setResending(false)
    }
  }

  const complete = digits.length === LENGTH

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title={t('forgotPassword.title')} back="/auth/forgot-password" />

      <View className="flex-1 px-6 pt-10">
        <Text className="text-center text-[16px] text-ink">{t('forgotPassword.codeSentTo', { email })}</Text>
        {otp_dev && <Text className="text-center text-[12px] text-muted mt-1">{t('forgotPassword.devModeCode', { code: otp_dev })}</Text>}

        <View className="flex-row justify-center flex-wrap gap-3 mt-8">
          {Array.from({ length: LENGTH }).map((_, i) => {
            const filled = digits[i] !== undefined
            const active = i === digits.length
            return (
              <View
                key={i}
                className={`size-12 rounded-2xl items-center justify-center ${active ? 'border-2 border-primary bg-primary/5' : 'bg-[#f5f5f5]'}`}
              >
                <Text className={`text-[20px] font-bold ${active ? 'text-primary' : 'text-ink'}`}>{filled ? digits[i] : ''}</Text>
              </View>
            )
          })}
        </View>

        <Text className="text-center text-[14px] text-muted mt-6">
          {seconds > 0 ? (
            t('forgotPassword.resendIn', { seconds })
          ) : (
            <Text onPress={resend} className="text-primary font-semibold">{resending ? t('forgotPassword.resending') : t('forgotPassword.resendCta')}</Text>
          )}
        </Text>

        <View className="mt-8">
          <Button
            disabled={!complete}
            onPress={() => router.push({ pathname: '/auth/forgot-password/new-password', params: { email, code: digits.join('') } })}
          >
            {t('forgotPassword.verifyCta')}
          </Button>
        </View>
      </View>

      <View className="bg-[#f7f7f7] rounded-t-[32px] px-6 pt-6 pb-8">
        <View className="flex-row flex-wrap">
          {KEYS.map((key) => (
            <Pressable key={key} onPress={() => press(key)} className="w-1/3 h-16 items-center justify-center">
              {key === 'back' ? <BackspaceIcon size={24} color="#0B111F" /> : <Text className="text-[24px] font-medium text-ink">{key}</Text>}
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  )
}
