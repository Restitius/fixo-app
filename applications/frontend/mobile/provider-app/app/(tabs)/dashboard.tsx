// Placeholder — built out fully in Sub-phase M-C against GET /providers/dashboard.
import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../lib/auth-context'

export default function Dashboard() {
  const { provider, logout } = useAuth()
  return (
    <SafeAreaView className="flex-1 bg-app-bg px-6 pt-4">
      <Text className="text-[22px] font-extrabold text-ink">Dashboard</Text>
      <Text className="text-muted mt-2">Signed in as {provider?.display_name}</Text>
      <Text className="text-primary mt-8 font-semibold" onPress={() => void logout()}>
        Sign out
      </Text>
    </SafeAreaView>
  )
}
