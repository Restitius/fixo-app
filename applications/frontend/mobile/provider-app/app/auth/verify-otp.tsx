import { useState } from 'react'
import { Text, View, KeyboardAvoidingView, Platform } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import TextField from '../../components/TextField'
import Button from '../../components/Button'
import { MailIcon } from '../../components/icons'
import { useAuth, ApiError } from '../../lib/auth-context'

export default function VerifyOtp() {
  const { t } = useTranslation('auth')
  const { email = '', otp_dev } = useLocalSearchParams<{ email: string; otp_dev?: string }>()
  const { verifyOtp, requestOtp } = useAuth()
  const [code, setCode] = useState(otp_dev ?? '')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (code.trim().length < 4) {
      setError(t('verifyOtp.genericError'))
      return
    }
    setLoading(true)
    try {
      await verifyOtp(email, code.trim())
      router.replace({ pathname: '/auth/sign-in', params: { verified: '1' } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('verifyOtp.genericError'))
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    setResending(true)
    try {
      await requestOtp(email)
    } finally {
      setResending(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader back="/auth/sign-up" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="flex-1 px-6 pt-2">
          <Text className="text-[28px] leading-[34px] font-extrabold text-ink">{t('verifyOtp.title')}</Text>
          <Text className="text-[14px] text-muted mt-2">
            {t('verifyOtp.subtitlePrefix')} <Text className="font-semibold text-ink">{email}</Text>
          </Text>
          {otp_dev && (
            <Text className="text-[13px] text-muted mt-2">
              {t('verifyOtp.devModeCode')} <Text className="font-semibold text-ink">{otp_dev}</Text>
            </Text>
          )}

          <View className="mt-6">
            <TextField
              icon={<MailIcon color="#6C7585" />}
              placeholder={t('verifyOtp.codePlaceholder')}
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
            />
          </View>

          {error && <Text className="text-center text-[13px] text-red-500 mt-4">{error}</Text>}

          <View className="mt-6">
            <Button onPress={() => void submit()} loading={loading}>
              {loading ? t('verifyOtp.submittingCta') : t('verifyOtp.submitCta')}
            </Button>
          </View>

          <Text onPress={() => void resend()} className="text-center text-[14px] font-medium text-primary pt-6">
            {resending ? t('verifyOtp.submittingCta') : t('verifyOtp.resendPrompt')}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
