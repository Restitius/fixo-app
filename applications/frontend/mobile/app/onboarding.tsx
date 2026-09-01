import { useState } from 'react'
import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Button from '../components/Button'

const SLIDES = [
  { emoji: '🧹', color: '#7210FF', title: 'We provide professional service at a friendly price', cta: 'Next' },
  { emoji: '🔨', color: '#FF6B35', title: 'The best results and your satisfaction is our top priority', cta: 'Next' },
  { emoji: '🧽', color: '#00B894', title: "Let's make awesome changes to your home", cta: 'Get Started' },
]

export default function Onboarding() {
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]
  const isLast = index === SLIDES.length - 1

  function handleNext() {
    if (isLast) router.replace('/auth')
    else setIndex((i) => i + 1)
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="mx-6 mt-4 rounded-3xl items-center justify-center" style={{ height: 380, backgroundColor: `${slide.color}14` }}>
        <Text style={{ fontSize: 110 }}>{slide.emoji}</Text>
      </View>

      <View className="flex-1 px-6 pt-8">
        <Text className="text-[26px] leading-[32px] font-extrabold text-center text-ink">{slide.title}</Text>

        <View className="flex-1 items-center justify-center flex-row gap-2 mt-6">
          {SLIDES.map((_, i) => (
            <View key={i} className={`h-2 rounded-full ${i === index ? 'w-6 bg-primary' : 'w-2 bg-[#e0e0e0]'}`} />
          ))}
        </View>

        <View className="pb-10">
          <Button onPress={handleNext}>{slide.cta}</Button>
        </View>
      </View>
    </SafeAreaView>
  )
}
