import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import Button from '../../components/Button'
import { BackspaceIcon } from '../../components/icons'

const LENGTH = 4
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', 'back']

export default function CreatePin() {
  const [digits, setDigits] = useState<string[]>([])

  function press(key: string) {
    if (key === 'back') return setDigits((d) => d.slice(0, -1))
    if (key === '*') return
    setDigits((d) => (d.length < LENGTH ? [...d, key] : d))
  }

  const complete = digits.length === LENGTH

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title="Create New PIN" back="/auth/fill-profile" />

      <View className="flex-1 px-6 pt-10">
        <Text className="text-center text-[16px] text-ink">Add a PIN number to make your account more secure.</Text>

        <View className="flex-row justify-center gap-4 mt-10">
          {Array.from({ length: LENGTH }).map((_, i) => {
            const isLast = i === digits.length - 1
            const hasDigit = digits[i] !== undefined
            return (
              <View key={i} className={`size-16 rounded-2xl items-center justify-center ${isLast ? 'border-2 border-primary bg-primary/5' : 'bg-[#f5f5f5]'}`}>
                <Text className={`text-[22px] font-bold ${isLast ? 'text-primary' : 'text-ink'}`}>{hasDigit ? (isLast ? digits[i] : '●') : ''}</Text>
              </View>
            )
          })}
        </View>

        <View className="mt-10">
          <Button disabled={!complete} onPress={() => router.push('/auth/set-fingerprint')}>
            Continue
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
