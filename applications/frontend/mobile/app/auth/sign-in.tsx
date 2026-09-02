import { useState } from 'react'
import { Text, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Link, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import TextField from '../../components/TextField'
import Checkbox from '../../components/Checkbox'
import Button from '../../components/Button'
import { MailIcon, LockIcon } from '../../components/icons'
import { useAuth, ApiError } from '../../lib/auth-context'

export default function SignIn() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (!email.trim() || !password) {
      setError('Enter your email and password')
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
      router.replace('/(tabs)/home')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader back="/auth" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1 px-6 pt-2" contentContainerStyle={{ paddingBottom: 24 }}>
          <Text className="text-[32px] leading-[38px] font-extrabold text-ink">Login to your Account</Text>

          <View className="gap-4 mt-8">
            <TextField icon={<MailIcon color="#6C7585" />} placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <TextField icon={<LockIcon color="#6C7585" />} placeholder="Password" isPassword value={password} onChangeText={setPassword} />
          </View>

          <View className="items-center mt-5">
            <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
          </View>

          {error && <Text className="text-center text-[13px] text-red-500 mt-4">{error}</Text>}

          <View className="mt-6">
            <Button onPress={submit} loading={loading}>Sign in</Button>
          </View>

          <Link href="/auth/forgot-password" className="text-center text-primary font-semibold text-[14px] mt-4">
            Forgot the password?
          </Link>

          <Text className="text-center text-[14px] text-muted pt-8">
            Don't have an account? <Link href="/auth/sign-up" className="text-primary font-semibold">Sign up</Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
