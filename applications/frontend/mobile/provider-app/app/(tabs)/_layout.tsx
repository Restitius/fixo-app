import { Redirect, Slot } from 'expo-router'
import { View } from 'react-native'
import BottomNav from '../../components/BottomNav'
import { useAuth } from '../../lib/auth-context'

export default function TabsLayout() {
  const { access_token, loading } = useAuth()

  if (loading) return null
  if (!access_token) return <Redirect href="/auth" />

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1">
        <Slot />
      </View>
      <BottomNav />
    </View>
  )
}
