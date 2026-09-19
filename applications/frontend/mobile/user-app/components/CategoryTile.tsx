import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import type { Category } from '../data/mock'

export default function CategoryTile({ category }: { category: Category }) {
  return (
    <Pressable onPress={() => router.push(`/services/${category.id}` as any)} className="items-center gap-2 shrink-0 w-[76px]">
      <View className="items-center justify-center size-16 rounded-2xl" style={{ backgroundColor: `${category.color}14` }}>
        <Text style={{ fontSize: 28 }}>{category.emoji}</Text>
      </View>
      <Text className="text-[12px] font-medium text-ink text-center leading-tight">{category.name}</Text>
    </Pressable>
  )
}
