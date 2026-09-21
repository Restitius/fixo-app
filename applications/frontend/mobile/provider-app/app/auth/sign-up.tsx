// Registration — real POST /providers/auth/register (first_name, last_name,
// email, phone, password, account_type, terms_accepted, privacy_accepted).
// Matches web-provider's register.tsx field-for-field, including the
// terms/privacy checkboxes the real backend schema requires (a bug fixed on
// web-provider this session was this exact form missing them).
import { useState } from 'react'
import { Text, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Link, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import TextField from '../../components/TextField'
import Select from '../../components/Select'
import Checkbox from '../../components/Checkbox'
import Button from '../../components/Button'
import { MailIcon, LockIcon, PhoneIcon, UserIcon } from '../../components/icons'
import { useAuth, ApiError } from '../../lib/auth-context'

const ACCOUNT_TYPES = ['Individual', 'Business'] as const

export default function SignUp() {
  const { t } = useTranslation('auth')
  const { register } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [accountType, setAccountType] = useState<(typeof ACCOUNT_TYPES)[number]>('Individual')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email')
      return
    }
    if (!phone.trim()) {
      setError('Phone number is required')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (!termsAccepted || !privacyAccepted) {
      setError('You must accept the terms and privacy policy')
      return
    }
    setLoading(true)
    try {
      const { otp, email: registeredEmail } = await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        account_type: accountType === 'Business' ? 'BUSINESS' : 'INDIVIDUAL',
        terms_accepted: termsAccepted,
        privacy_accepted: privacyAccepted,
      })
      router.push({
        pathname: '/auth/verify-otp',
        params: otp ? { email: registeredEmail, otp_dev: otp } : { email: registeredEmail },
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('signUp.genericError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader back="/auth" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1 px-6 pt-2" contentContainerStyle={{ paddingBottom: 24 }}>
          <Text className="text-[28px] leading-[34px] font-extrabold text-ink">{t('signUp.title')}</Text>
          <Text className="text-[14px] text-muted mt-2">{t('signUp.subtitle')}</Text>

          <View className="gap-4 mt-6">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextField icon={<UserIcon size={20} color="#6C7585" />} placeholder={t('signUp.firstNameLabel')} value={firstName} onChangeText={setFirstName} />
              </View>
              <View className="flex-1">
                <TextField icon={<UserIcon size={20} color="#6C7585" />} placeholder={t('signUp.lastNameLabel')} value={lastName} onChangeText={setLastName} />
              </View>
            </View>
            <TextField icon={<MailIcon color="#6C7585" />} placeholder={t('signUp.emailLabel')} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <TextField icon={<PhoneIcon size={20} color="#6C7585" />} placeholder={t('signUp.phoneLabel')} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <TextField icon={<LockIcon color="#6C7585" />} placeholder={t('signUp.passwordPlaceholder')} isPassword value={password} onChangeText={setPassword} />

            <View>
              <Text className="text-[13px] text-muted mb-1.5 ml-1">{t('signUp.accountTypeLabel')}</Text>
              <Select value={accountType} onChange={(v) => setAccountType(v as (typeof ACCOUNT_TYPES)[number])} options={[...ACCOUNT_TYPES]} />
            </View>
          </View>

          <View className="gap-3 mt-5">
            <Checkbox
              checked={termsAccepted}
              onChange={setTermsAccepted}
              label={`${t('signUp.agreeTermsPrefix')} ${t('signUp.termsLink')}`}
            />
            <Checkbox
              checked={privacyAccepted}
              onChange={setPrivacyAccepted}
              label={`${t('signUp.agreePrivacyPrefix')} ${t('signUp.privacyLink')}`}
            />
          </View>

          {error && <Text className="text-center text-[13px] text-red-500 mt-4">{error}</Text>}

          <View className="mt-6">
            <Button onPress={() => void submit()} loading={loading}>
              {loading ? t('signUp.submittingCta') : t('signUp.submitCta')}
            </Button>
          </View>

          <Text className="text-center text-[14px] text-muted pt-8">
            {t('signUp.alreadyHaveAccount')}{' '}
            <Link href="/auth/sign-in" className="text-primary font-semibold">
              {t('signUp.logIn')}
            </Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
