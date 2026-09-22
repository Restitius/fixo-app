import { useEffect } from 'react'
import { View, Text, Image } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Splash() {
  useEffect(() => {
    const t = setTimeout(() => router.replace('/onboarding'), 1800)
    return () => clearTimeout(t)
  }, [])

  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center">
      <Image source={require('../assets/logo-mark.png')} className="size-28" resizeMode="contain" />
      <Text className="text-ink text-[22px] font-extrabold mt-5">FIXO</Text>
      <View className="absolute bottom-24">
        <View className="size-8 rounded-full border-[3px] border-primary" style={{ borderTopColor: 'transparent' }} />
      </View>
    </SafeAreaView>
  )
}
