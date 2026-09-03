import { Pressable, Share, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import { GiftIcon } from '../../components/icons'
import { useAuth } from '../../lib/auth-context'

// There's no backend referral/contacts system (no invite tracking, no
// phone-contacts access) — this shares a real message via the device's
// native share sheet instead of a list of fabricated "friends".
export default function InviteFriends() {
  const { customer } = useAuth()

  async function share() {
    try {
      await Share.share({ message: `${customer?.full_name ?? 'A friend'} is inviting you to try FIXO — book trusted handyman services in a few taps.` })
    } catch {
      // user dismissed the share sheet
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Invite Friends" back="/(tabs)/profile" />
      <View className="flex-1 items-center px-8 pt-16">
        <View className="items-center justify-center size-24 rounded-full bg-primary/8 mb-6">
          <GiftIcon size={44} color="#7210FF" />
        </View>
        <Text className="text-[20px] font-bold text-ink text-center">Share FIXO with your friends</Text>
        <Text className="text-[14px] text-muted text-center mt-2">
          Know someone who needs a trusted handyman? Send them a link to get started.
        </Text>
        <Pressable onPress={share} className="mt-8 w-full items-center rounded-full bg-primary py-4">
          <Text className="text-white font-bold text-[15px]">Share FIXO</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
