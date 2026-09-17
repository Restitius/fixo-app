import { Text, View } from 'react-native'
import { Link, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Button from '../../components/Button'
import ScreenHeader from '../../components/ScreenHeader'
import { AppleIcon, FacebookIcon, GoogleIcon } from '../../components/icons'

function SocialButtonFull({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="w-full flex-row items-center justify-center gap-3 rounded-full border border-hairline py-4">
      {icon}
      <Text className="text-[16px] font-medium text-ink">{label}</Text>
    </View>
  )
}

export default function LetsIn() {
  const { t } = useTranslation('auth')
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader onBack={() => router.replace('/onboarding')} />

      <View className="px-10 pt-4 items-center">
        <View className="size-40 rounded-full bg-primary/8 items-center justify-center">
          <Text style={{ fontSize: 64 }}>👋</Text>
        </View>
      </View>

      <Text className="text-[28px] font-extrabold text-center text-ink mt-4">{t('letsIn.title')}</Text>

      <View className="flex-1 justify-center px-6 mt-6 gap-3">
        <SocialButtonFull icon={<FacebookIcon />} label={t('letsIn.facebook')} />
        <SocialButtonFull icon={<GoogleIcon />} label={t('letsIn.google')} />
        <SocialButtonFull icon={<AppleIcon />} label={t('letsIn.apple')} />

        <View className="flex-row items-center gap-3 my-3">
          <View className="h-px flex-1 bg-hairline" />
          <Text className="text-[14px] text-muted">{t('letsIn.or')}</Text>
          <View className="h-px flex-1 bg-hairline" />
        </View>

        <Button onPress={() => router.push('/auth/sign-in')}>{t('letsIn.signInWithPassword')}</Button>

        <Text className="text-center text-[14px] text-muted pb-6 pt-2">
          {t('letsIn.noAccount')} <Link href="/auth/sign-up" className="text-primary font-semibold">{t('letsIn.signUpCta')}</Link>
        </Text>
      </View>
    </SafeAreaView>
  )
}
