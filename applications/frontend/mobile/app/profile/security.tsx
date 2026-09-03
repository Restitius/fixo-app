import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import Toggle from '../../components/Toggle'
import Button from '../../components/Button'
import Sheet from '../../components/Sheet'
import { ChevronRightIcon, FingerprintIcon, LockIcon, ShieldIcon } from '../../components/icons'
import { fixoSdk, ApiError } from '../../lib/api-client'

export default function Security() {
  // PIN / biometric / 2FA have no backend concept (CUSTOMERS has no such
  // columns) — these stay local-only device preferences, same as the PIN
  // collected during onboarding.
  const [biometric, setBiometric] = useState(true)
  const [twoFactor, setTwoFactor] = useState(false)

  const [showChangePassword, setShowChangePassword] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function submit() {
    setError(null)
    if (next.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    if (next !== confirm) {
      setError('Passwords do not match')
      return
    }
    setSaving(true)
    try {
      await fixoSdk.changePassword(current, next)
      setSuccess(true)
      setCurrent('')
      setNext('')
      setConfirm('')
      setTimeout(() => {
        setSuccess(false)
        setShowChangePassword(false)
      }, 1200)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update your password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Security" back="/(tabs)/profile" />
      <ScrollView>
        <View className="flex-col px-6 mt-2">
          <Pressable onPress={() => router.push('/auth/create-pin')} className="flex-row items-center gap-4 py-4 border-b border-hairline">
            <View className="items-center justify-center size-10 rounded-full bg-primary/8 shrink-0">
              <LockIcon color="#7210FF" />
            </View>
            <Text className="flex-1 text-[14px] font-medium text-ink">Change PIN</Text>
            <ChevronRightIcon size={16} color="#6C7585" />
          </Pressable>

          <Pressable onPress={() => setShowChangePassword(true)} className="flex-row items-center gap-4 py-4 border-b border-hairline">
            <View className="items-center justify-center size-10 rounded-full bg-primary/8 shrink-0">
              <ShieldIcon size={20} color="#7210FF" />
            </View>
            <Text className="flex-1 text-[14px] font-medium text-ink">Change Password</Text>
            <ChevronRightIcon size={16} color="#6C7585" />
          </Pressable>

          <View className="flex-row items-center gap-4 py-4 border-b border-hairline">
            <View className="items-center justify-center size-10 rounded-full bg-primary/8 shrink-0">
              <FingerprintIcon size={20} color="#7210FF" />
            </View>
            <Text className="flex-1 text-[14px] font-medium text-ink">Biometric Login</Text>
            <Toggle checked={biometric} onChange={setBiometric} />
          </View>

          <View className="flex-row items-center gap-4 py-4">
            <View className="items-center justify-center size-10 rounded-full bg-primary/8 shrink-0">
              <ShieldIcon size={20} color="#7210FF" />
            </View>
            <Text className="flex-1 text-[14px] font-medium text-ink">Two-Factor Authentication</Text>
            <Toggle checked={twoFactor} onChange={setTwoFactor} />
          </View>
        </View>
      </ScrollView>

      <Sheet open={showChangePassword} onClose={() => setShowChangePassword(false)}>
        <View className="w-10 h-1 bg-hairline rounded-full self-center mb-6" />
        {success ? (
          <Text className="text-center text-[15px] font-semibold text-ink py-6">Password updated!</Text>
        ) : (
          <>
            <Text className="text-[18px] font-bold text-ink text-center mb-5">Change Password</Text>
            <View className="gap-3">
              <TextInput value={current} onChangeText={setCurrent} secureTextEntry placeholder="Current password" placeholderTextColor="#9e9e9e" className="rounded-2xl bg-[#f5f5f5] px-5 py-4 text-[14px] text-ink" />
              <TextInput value={next} onChangeText={setNext} secureTextEntry placeholder="New password" placeholderTextColor="#9e9e9e" className="rounded-2xl bg-[#f5f5f5] px-5 py-4 text-[14px] text-ink" />
              <TextInput value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="Confirm new password" placeholderTextColor="#9e9e9e" className="rounded-2xl bg-[#f5f5f5] px-5 py-4 text-[14px] text-ink" />
            </View>
            {error && <Text className="text-[13px] text-red-500 mt-3">{error}</Text>}
            <View className="mt-6">
              <Button onPress={submit} loading={saving}>Update Password</Button>
            </View>
          </>
        )}
      </Sheet>
    </SafeAreaView>
  )
}
