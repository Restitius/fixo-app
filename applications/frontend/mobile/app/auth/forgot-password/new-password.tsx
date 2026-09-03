import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../../components/ScreenHeader'
import TextField from '../../../components/TextField'
import Button from '../../../components/Button'
import { CenterModal } from '../../../components/Sheet'
import { useAuth, ApiError } from '../../../lib/auth-context'
import { LockIcon, ShieldCheckIcon } from '../../../components/icons'

export default function CreatePassword() {
  const { email = '', code = '' } = useLocalSearchParams<{ email: string; code: string }>()
  const { resetPassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => router.replace('/auth/sign-in'), 2200)
    return () => clearTimeout(t)
  }, [success])

  async function submit() {
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      // This is the call that actually verifies the OTP code and sets the
      // new password server-side, atomically — nothing before this screen
      // has touched the account.
      await resetPassword(email, code, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset your password — the code may have expired')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title="Create New Password" back="/auth/forgot-password/otp" />

      <View className="flex-1 px-6 pt-4">
        <View className="size-32 rounded-full bg-primary/8 items-center justify-center self-center">
          <Text style={{ fontSize: 56 }}>🔑</Text>
        </View>

        <Text className="text-[18px] font-bold text-ink mt-6">Create Your New Password</Text>

        <View className="gap-4 mt-4">
          <TextField icon={<LockIcon color="#6C7585" />} placeholder="Password" isPassword value={password} onChangeText={setPassword} />
          <TextField icon={<LockIcon color="#6C7585" />} placeholder="Confirm password" isPassword value={confirm} onChangeText={setConfirm} />
        </View>

        {error && <Text className="text-center text-[13px] text-red-500 mt-4">{error}</Text>}

        <View className="flex-1" />

        <View className="pb-10 pt-6">
          <Button onPress={submit} loading={loading}>Continue</Button>
        </View>
      </View>

      <CenterModal open={success}>
        <View className="size-24 rounded-full bg-primary items-center justify-center mb-6">
          <ShieldCheckIcon size={44} color="#ffffff" />
        </View>
        <Text className="text-primary text-[22px] font-bold">Password Reset!</Text>
        <Text className="text-[15px] text-ink mt-3 text-center">
          Your password has been changed and you've been signed out everywhere for security. Sign in with your new password.
        </Text>
      </CenterModal>
    </SafeAreaView>
  )
}
