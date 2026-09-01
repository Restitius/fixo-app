import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../../components/ScreenHeader'
import Button from '../../../components/Button'
import { ChatIcon, MessageIcon } from '../../../components/icons'

const METHODS = [
  { id: 'sms', label: 'via SMS:', value: '+1 111 ******99', icon: ChatIcon },
  { id: 'email', label: 'via Email:', value: 'and***ley@yourdomain.com', icon: MessageIcon },
] as const

export default function ForgotPassword() {
  const [selected, setSelected] = useState<'sms' | 'email'>('sms')

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title="Forgot Password" back="/auth/sign-in" />

      <View className="flex-1 px-6 pt-6">
        <View className="size-32 rounded-full bg-primary/8 items-center justify-center self-center">
          <Text style={{ fontSize: 56 }}>🔒</Text>
        </View>

        <Text className="text-[18px] font-medium text-ink mt-6">
          Select which contact details should we use to reset your password
        </Text>

        <View className="gap-4 mt-6">
          {METHODS.map(({ id, label, value, icon: Icon }) => {
            const active = selected === id
            return (
              <Pressable
                key={id}
                onPress={() => setSelected(id)}
                className={`flex-row items-center gap-5 rounded-3xl p-6 ${active ? 'border-[3px] border-primary bg-white' : 'border border-hairline bg-white'}`}
              >
                <View className="items-center justify-center size-14 rounded-full bg-primary/8 shrink-0">
                  <Icon size={26} color="#7210FF" />
                </View>
                <View className="gap-1">
                  <Text className="text-[14px] text-muted">{label}</Text>
                  <Text className="text-[16px] font-bold text-ink">{value}</Text>
                </View>
              </Pressable>
            )
          })}
        </View>

        <View className="flex-1" />

        <View className="pb-10 pt-6">
          <Button onPress={() => router.push('/auth/forgot-password/otp')}>Continue</Button>
        </View>
      </View>
    </SafeAreaView>
  )
}
