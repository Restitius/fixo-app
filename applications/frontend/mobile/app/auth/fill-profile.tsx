import { useState } from 'react'
import { Text, View, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import TextField from '../../components/TextField'
import Button from '../../components/Button'
import Avatar from '../../components/Avatar'
import { EditIcon, MailIcon } from '../../components/icons'
import { useAuth, ApiError } from '../../lib/auth-context'

export default function FillProfile() {
  const { register } = useAuth()
  const { email, password } = useLocalSearchParams<{ email: string; password: string }>()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (name.trim().length < 2) {
      setError('Enter your full name')
      return
    }
    if (phone.trim().length < 7) {
      setError('Enter a valid phone number')
      return
    }
    setLoading(true)
    try {
      await register({
        full_name: name.trim(),
        phone: phone.trim(),
        email,
        password,
        terms_accepted: true,
        privacy_accepted: true,
      })
      router.push('/auth/create-pin')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title="Fill Your Profile" back="/auth/sign-up" />

      <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="self-center relative">
          <Avatar label={name || '?'} size={110} />
          <View className="absolute bottom-0 right-0 items-center justify-center size-8 rounded-full bg-primary">
            <EditIcon size={16} color="#ffffff" />
          </View>
        </View>

        <View className="gap-4 mt-8">
          <TextField icon={<EditIcon color="#6C7585" />} placeholder="Full Name" value={name} onChangeText={setName} />
          <TextField icon={<MailIcon color="#6C7585" />} placeholder="Email" value={email} editable={false} />
          <TextField icon={<EditIcon color="#6C7585" />} placeholder="Phone Number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        </View>

        {error && <Text className="text-center text-[13px] text-red-500 mt-4">{error}</Text>}

        <View className="mt-8">
          <Button onPress={submit} loading={loading}>Continue</Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
