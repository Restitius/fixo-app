import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from '../../../components/Avatar'
import { providerById } from '../../../data/mock'
import { MicIcon, PhoneIcon, VideoIcon } from '../../../components/icons'

export default function CallScreen() {
  const { providerId = '' } = useLocalSearchParams<{ providerId: string }>()
  const provider = providerById(providerId)
  const [seconds, setSeconds] = useState(0)
  const [muted, setMuted] = useState(false)
  const [speaker, setSpeaker] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  if (!provider) return null

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']} style={{ backgroundColor: '#4A1FA8' }}>
      <View className="flex-1 items-center justify-center px-8">
        <Avatar label={provider.avatar} size={120} />
        <Text className="text-[22px] font-bold text-white mt-6">{provider.name}</Text>
        <Text className="text-[15px] text-white/80 mt-1">
          {mm}:{ss}
        </Text>
      </View>

      <View className="flex-row items-center justify-center gap-6 pb-10">
        <Pressable
          onPress={() => setMuted((m) => !m)}
          className={`items-center justify-center size-14 rounded-full ${muted ? 'bg-white' : 'bg-white/15'}`}
        >
          <MicIcon color={muted ? '#7210FF' : '#fff'} />
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          className="items-center justify-center size-16 rounded-full bg-[#FF6B6B]"
          style={{ transform: [{ rotate: '135deg' }] }}
        >
          <PhoneIcon size={24} color="#fff" />
        </Pressable>
        <Pressable
          onPress={() => setSpeaker((s) => !s)}
          className={`items-center justify-center size-14 rounded-full ${speaker ? 'bg-white' : 'bg-white/15'}`}
        >
          <VideoIcon color={speaker ? '#7210FF' : '#fff'} />
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
