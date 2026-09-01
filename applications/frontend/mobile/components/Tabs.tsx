import { Pressable, Text, View } from 'react-native'

export default function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <View className="flex-row gap-2 px-6">
      {tabs.map((t) => {
        const isActive = t.id === active
        return (
          <Pressable
            key={t.id}
            onPress={() => onChange(t.id)}
            className={`flex-1 rounded-full py-2.5 items-center ${isActive ? 'bg-primary' : 'bg-[#f5f5f5]'}`}
          >
            <Text className={`text-[14px] font-semibold ${isActive ? 'text-white' : 'text-muted'}`}>{t.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
