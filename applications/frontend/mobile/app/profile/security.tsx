import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import Toggle from '../../components/Toggle'
import { ChevronRightIcon, FingerprintIcon, LockIcon, ShieldIcon } from '../../components/icons'

export default function Security() {
  const [biometric, setBiometric] = useState(true)
  const [twoFactor, setTwoFactor] = useState(false)

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

          <Pressable onPress={() => router.push('/auth/forgot-password')} className="flex-row items-center gap-4 py-4 border-b border-hairline">
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
    </SafeAreaView>
  )
}
