import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { ArrowLeftIcon } from './icons'

export default function ScreenHeader({
  title,
  back,
  onBack,
  right,
}: {
  title?: string
  back?: string
  onBack?: () => void
  right?: ReactNode
}) {
  function handleBack() {
    if (onBack) return onBack()
    if (back) return router.replace(back as any)
    if (router.canGoBack()) router.back()
  }

  return (
    <View className="flex-row items-center gap-4 px-6 pt-3 pb-2 shrink-0">
      <Pressable onPress={handleBack} className="items-center justify-center size-7">
        <ArrowLeftIcon color="#0B111F" />
      </Pressable>
      {title && (
        <Text numberOfLines={1} className="text-[20px] font-extrabold text-ink flex-1">
          {title}
        </Text>
      )}
      {right}
    </View>
  )
}
