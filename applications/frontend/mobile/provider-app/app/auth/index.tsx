// Mirrors user-app's own auth/index.tsx ("Let's In") layout: ScreenHeader
// back button, icon-in-circle, big centered title, then a stacked set of
// actions lower on the screen. User-app's social-login buttons here are
// decorative only (no real backend behind Facebook/Google/Apple) — rather
// than copy non-functional buttons, this uses the same visual slot for the
// two real actions a provider actually has.
import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Button from '../../components/Button'
import ScreenHeader from '../../components/ScreenHeader'
import { BriefcaseIcon } from '../../components/icons'

export default function Welcome() {
  const { t } = useTranslation('auth')
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader onBack={() => router.replace('/onboarding')} />

      <View className="px-10 pt-4 items-center">
        <View className="size-40 rounded-full bg-primary/8 items-center justify-center">
          <BriefcaseIcon size={64} color="#7210FF" />
        </View>
      </View>

      <Text className="text-[28px] font-extrabold text-center text-ink mt-4">{t('welcome.title')}</Text>
      <Text className="text-[15px] text-center text-muted mt-3 px-8">{t('welcome.subtitle')}</Text>

      <View className="flex-1 justify-end px-6 pb-10 gap-3">
        <Button onPress={() => router.push('/auth/sign-up')}>{t('welcome.getStarted')}</Button>
        <Text onPress={() => router.push('/auth/sign-in')} className="text-center text-primary font-semibold text-[15px] py-3">
          {t('welcome.haveAccount')}
        </Text>
      </View>
    </SafeAreaView>
  )
}
