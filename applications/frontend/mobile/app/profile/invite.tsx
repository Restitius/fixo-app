import { Pressable, Share, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import { GiftIcon } from '../../components/icons'
import { useAuth } from '../../lib/auth-context'

// There's no backend referral/contacts system (no invite tracking, no
// phone-contacts access) — this shares a real message via the device's
// native share sheet instead of a list of fabricated "friends".
export default function InviteFriends() {
  const { t } = useTranslation('profile')
  const { customer } = useAuth()

  async function share() {
    try {
      await Share.share({ message: t('invite.shareMessage', { name: customer?.full_name ?? t('invite.aFriend') }) })
    } catch {
      // user dismissed the share sheet
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title={t('invite.title')} back="/(tabs)/profile" />
      <View className="flex-1 items-center px-8 pt-16">
        <View className="items-center justify-center size-24 rounded-full bg-primary/8 mb-6">
          <GiftIcon size={44} color="#7210FF" />
        </View>
        <Text className="text-[20px] font-bold text-ink text-center">{t('invite.heading')}</Text>
        <Text className="text-[14px] text-muted text-center mt-2">
          {t('invite.body')}
        </Text>
        <Pressable onPress={share} className="mt-8 w-full items-center rounded-full bg-primary py-4">
          <Text className="text-white font-bold text-[15px]">{t('invite.shareCta')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
