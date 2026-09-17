import { useState } from 'react'
import { Text, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Link, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import TextField from '../../components/TextField'
import Checkbox from '../../components/Checkbox'
import Button from '../../components/Button'
import { MailIcon, LockIcon } from '../../components/icons'

export default function SignUp() {
  const { t } = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function submit() {
    setError(null)
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(t('signUp.invalidEmail'))
      return
    }
    if (password.length < 8) {
      setError(t('signUp.passwordTooShort'))
      return
    }
    router.push({ pathname: '/auth/fill-profile', params: { email: email.trim(), password } })
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader back="/auth" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1 px-6 pt-2" contentContainerStyle={{ paddingBottom: 24 }}>
          <Text className="text-[32px] leading-[38px] font-extrabold text-ink">{t('signUp.title')}</Text>

          <View className="gap-4 mt-8">
            <TextField icon={<MailIcon color="#6C7585" />} placeholder={t('signUp.emailPlaceholder')} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <TextField icon={<LockIcon color="#6C7585" />} placeholder={t('signUp.passwordPlaceholder')} isPassword value={password} onChangeText={setPassword} />
          </View>

          <View className="items-center mt-5">
            <Checkbox checked={remember} onChange={setRemember} label={t('signUp.rememberMe')} />
          </View>

          {error && <Text className="text-center text-[13px] text-red-500 mt-4">{error}</Text>}

          <View className="mt-6">
            <Button onPress={submit}>{t('signUp.submitCta')}</Button>
          </View>

          <Text className="text-center text-[14px] text-muted pt-8">
            {t('signUp.alreadyHaveAccount')} <Link href="/auth/sign-in" className="text-primary font-semibold">{t('signUp.signInCta')}</Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
