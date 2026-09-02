import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import { CheckCircleIcon } from '../../components/icons'
import { LANGUAGES } from '../../data/mock'

export default function Language() {
  const [selected, setSelected] = useState(LANGUAGES[0])

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Language" back="/(tabs)/profile" />
      <ScrollView>
        <View className="flex-col px-6 mt-2">
          {LANGUAGES.map((l, i) => (
            <Pressable
              key={l}
              onPress={() => setSelected(l)}
              className={`flex-row items-center justify-between py-4 ${i === LANGUAGES.length - 1 ? '' : 'border-b border-hairline'}`}
            >
              <Text className="text-[14px] font-medium text-ink">{l}</Text>
              {selected === l && <CheckCircleIcon size={20} color="#7210FF" />}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
