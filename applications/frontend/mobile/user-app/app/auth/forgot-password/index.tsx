import { useState } from 'react'
import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../../components/ScreenHeader'
import TextField from '../../../components/TextField'
import Button from '../../../components/Button'
import { useAuth, ApiError } from '../../../lib/auth-context'
import { MailIcon } from '../../../components/icons'

// Real reset codes are only ever sent by email (the backend's OTP channel is
// hardcoded to EMAIL — there's no SMS integration), so this only offers that
// real path rather than the original mock's fake "SMS or Email" choice with
// pre-filled fake masked contact info.
export default function ForgotPassword() {
  const { t } = useTranslation('auth')
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(t('forgotPassword.invalidEmail'))
      return
    }
    setLoading(true)
    try {
      const otp = await forgotPassword(email.trim())
      router.push({
        pathname: '/auth/forgot-password/otp',
        params: { email: email.trim(), ...(otp ? { otp_dev: otp } : {}) },
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('forgotPassword.genericError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title={t('forgotPassword.title')} back="/auth/sign-in" />

      <View className="flex-1 px-6 pt-6">
        <View className="size-32 rounded-full bg-primary/8 items-center justify-center self-center">
          <Text style={{ fontSize: 56 }}>🔒</Text>
        </View>

        <Text className="text-[18px] font-medium text-ink mt-6 text-center">
          {t('forgotPassword.instructions')}
        </Text>

        <View className="mt-6">
          <TextField
            icon={<MailIcon color="#6C7585" />}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {error && <Text className="text-center text-[13px] text-red-500 mt-4">{error}</Text>}

        <View className="flex-1" />

        <View className="pb-10 pt-6">
          <Button onPress={submit} loading={loading}>{t('forgotPassword.submitCta')}</Button>
        </View>
      </View>
    </SafeAreaView>
  )
}
