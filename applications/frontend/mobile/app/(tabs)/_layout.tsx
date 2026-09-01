import { Slot } from 'expo-router'
import { View } from 'react-native'
import BottomNav from '../../components/BottomNav'

export default function TabsLayout() {
  return (
    <View className="flex-1 bg-white">
      <View className="flex-1">
        <Slot />
      </View>
      <BottomNav />
    </View>
  )
}
