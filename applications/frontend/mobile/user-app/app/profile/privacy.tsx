import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'

export default function PrivacyPolicy() {
  const { t } = useTranslation('profile')
  const SECTIONS = [
    { title: t('privacy.section1Title'), body: t('privacy.section1Body') },
    { title: t('privacy.section2Title'), body: t('privacy.section2Body') },
    { title: t('privacy.section3Title'), body: t('privacy.section3Body') },
    { title: t('privacy.section4Title'), body: t('privacy.section4Body') },
    { title: t('privacy.section5Title'), body: t('privacy.section5Body') },
  ]

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title={t('privacy.title')} back="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-2">
          <Text className="text-[13px] text-muted mb-6">{t('privacy.lastUpdated')}</Text>
          <View className="flex-col gap-6">
            {SECTIONS.map((s) => (
              <View key={s.title}>
                <Text className="font-bold text-ink text-[15px] mb-1.5">{s.title}</Text>
                <Text className="text-[14px] text-muted leading-relaxed">{s.body}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
