import { useEffect } from 'react'
import { View, Text, Image } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../lib/auth-context'

export default function Splash() {
  const { access_token, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    const t = setTimeout(() => router.replace(access_token ? '/(tabs)/dashboard' : '/onboarding'), 1200)
    return () => clearTimeout(t)
  }, [loading, access_token])

  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center">
      <Image source={require('../assets/logo-mark.png')} className="size-28" resizeMode="contain" />
      <Text className="text-ink text-[22px] font-extrabold mt-5">FIXO Provider</Text>
      <View className="absolute bottom-24">
        <View className="size-8 rounded-full border-[3px] border-primary" style={{ borderTopColor: 'transparent' }} />
      </View>
    </SafeAreaView>
  )
}
