import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import { CheckCircleIcon, GlobeIcon } from '../../components/icons'
import { useAuth } from '../../lib/auth-context'

const LANGUAGE_NAMES: Record<string, string> = { en: 'English', sw: 'Swahili' }

// Matches web's Personal Info tab: preferred_language is set at registration
// with no update endpoint, so this shows the real value rather than a
// language switcher that couldn't actually change anything server-side.
export default function Language() {
  const { customer } = useAuth()
  const code = customer?.preferred_language ?? 'en'
  const name = LANGUAGE_NAMES[code] ?? code

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Language" back="/(tabs)/profile" />
      <View className="px-6 mt-6">
        <View className="flex-row items-center gap-4 rounded-2xl bg-[#f5f5f5] px-5 py-4">
          <GlobeIcon size={20} color="#6C7585" />
          <Text className="flex-1 text-[15px] font-medium text-ink">{name}</Text>
          <CheckCircleIcon size={20} color="#7210FF" />
        </View>
        <Text className="text-[12px] text-muted text-center mt-4">
          Your preferred language is set when you register and can't be changed from the app yet.
        </Text>
      </View>
    </SafeAreaView>
  )
}
