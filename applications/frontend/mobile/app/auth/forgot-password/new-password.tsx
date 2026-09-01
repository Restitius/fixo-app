import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../../components/ScreenHeader'
import TextField from '../../../components/TextField'
import Checkbox from '../../../components/Checkbox'
import Button from '../../../components/Button'
import { CenterModal } from '../../../components/Sheet'
import { LockIcon, ShieldCheckIcon } from '../../../components/icons'

export default function CreatePassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [remember, setRemember] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => router.replace('/auth/sign-in'), 2200)
    return () => clearTimeout(t)
  }, [success])

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

        <View className="items-center mt-5">
          <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
        </View>

        <View className="flex-1" />

        <View className="pb-10 pt-6">
          <Button onPress={() => setSuccess(true)}>Continue</Button>
        </View>
      </View>

      <CenterModal open={success}>
        <View className="size-24 rounded-full bg-primary items-center justify-center mb-6">
          <ShieldCheckIcon size={44} color="#ffffff" />
        </View>
        <Text className="text-primary text-[22px] font-bold">Congratulations!</Text>
        <Text className="text-[15px] text-ink mt-3 text-center">
          Your account is ready to use. You will be redirected to the Home page in a few seconds..
        </Text>
      </CenterModal>
    </SafeAreaView>
  )
}
