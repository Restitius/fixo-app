import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../../components/ScreenHeader'
import Button from '../../../components/Button'
import { BackspaceIcon } from '../../../components/icons'

const LENGTH = 4
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', 'back']

export default function OtpVerify() {
  const [digits, setDigits] = useState<string[]>([])
  const [seconds, setSeconds] = useState(55)

  useEffect(() => {
    if (seconds <= 0) return
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [seconds])

  function press(key: string) {
    if (key === 'back') return setDigits((d) => d.slice(0, -1))
    if (key === '*') return
    setDigits((d) => (d.length < LENGTH ? [...d, key] : d))
  }

  const complete = digits.length === LENGTH

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title="Forgot Password" back="/auth/forgot-password" />

      <View className="flex-1 px-6 pt-10">
        <Text className="text-center text-[16px] text-ink">Code has been send to +1 111 ******99</Text>

        <View className="flex-row justify-center gap-4 mt-8">
          {Array.from({ length: LENGTH }).map((_, i) => {
            const filled = digits[i] !== undefined
            const active = i === digits.length
            return (
              <View
                key={i}
                className={`size-16 rounded-2xl items-center justify-center ${active ? 'border-2 border-primary bg-primary/5' : 'bg-[#f5f5f5]'}`}
              >
                <Text className={`text-[22px] font-bold ${active ? 'text-primary' : 'text-ink'}`}>{digits[i] ?? ''}</Text>
              </View>
            )
          })}
        </View>

        <Text className="text-center text-[14px] text-muted mt-6">
          Resend code in{' '}
          <Text onPress={() => seconds === 0 && setSeconds(55)} className="text-primary font-semibold">
            {seconds}
          </Text>{' '}
          s
        </Text>

        <View className="mt-8">
          <Button disabled={!complete} onPress={() => router.push('/auth/forgot-password/new-password')}>
            Verify
          </Button>
        </View>
      </View>

      <View className="bg-[#f7f7f7] rounded-t-[32px] px-6 pt-6 pb-8">
        <View className="flex-row flex-wrap">
          {KEYS.map((key) => (
            <Pressable key={key} onPress={() => press(key)} className="w-1/3 h-16 items-center justify-center">
              {key === 'back' ? <BackspaceIcon size={24} color="#0B111F" /> : <Text className="text-[24px] font-medium text-ink">{key}</Text>}
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  )
}
