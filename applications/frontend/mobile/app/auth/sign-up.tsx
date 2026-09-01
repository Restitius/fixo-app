import { useState } from 'react'
import { Text, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { Link, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import TextField from '../../components/TextField'
import Checkbox from '../../components/Checkbox'
import Button from '../../components/Button'
import { MailIcon, LockIcon } from '../../components/icons'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader back="/auth" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView className="flex-1 px-6 pt-2" contentContainerStyle={{ paddingBottom: 24 }}>
          <Text className="text-[32px] leading-[38px] font-extrabold text-ink">Create your Account</Text>

          <View className="gap-4 mt-8">
            <TextField icon={<MailIcon color="#6C7585" />} placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            <TextField icon={<LockIcon color="#6C7585" />} placeholder="Password" isPassword value={password} onChangeText={setPassword} />
          </View>

          <View className="items-center mt-5">
            <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
          </View>

          <View className="mt-6">
            <Button onPress={() => router.push('/auth/fill-profile')}>Sign up</Button>
          </View>

          <Text className="text-center text-[14px] text-muted pt-8">
            Already have an account? <Link href="/auth/sign-in" className="text-primary font-semibold">Sign in</Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
