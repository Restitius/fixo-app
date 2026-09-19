import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import Button from '../../components/Button'
import { CenterModal } from '../../components/Sheet'
import { FingerprintIcon, ShieldCheckIcon } from '../../components/icons'

export default function SetFingerprint() {
  const { t } = useTranslation('auth')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => router.replace('/(tabs)/home'), 2000)
    return () => clearTimeout(t)
  }, [success])

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title={t('setFingerprint.title')} back="/auth/create-pin" />

      <View className="flex-1 px-6 pt-6">
        <Text className="text-center text-[16px] text-ink">{t('setFingerprint.subtitle')}</Text>

        <View className="flex-1 items-center justify-center">
          <FingerprintIcon size={220} />
        </View>

        <Text className="text-center text-[14px] text-muted pb-6">
          {t('setFingerprint.instructions')}
        </Text>

        <View className="flex-row gap-3 pb-10">
          <View className="flex-1">
            <Button variant="outline" onPress={() => router.replace('/(tabs)/home')}>
              {t('setFingerprint.skip')}
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={() => setSuccess(true)}>{t('setFingerprint.continue')}</Button>
          </View>
        </View>
      </View>

      <CenterModal open={success}>
        <View className="size-24 rounded-full bg-primary items-center justify-center mb-6">
          <ShieldCheckIcon size={44} color="#ffffff" />
        </View>
        <Text className="text-primary text-[22px] font-bold">{t('setFingerprint.successTitle')}</Text>
        <Text className="text-[15px] text-ink mt-3 text-center">
          {t('setFingerprint.successBody')}
        </Text>
      </CenterModal>
    </SafeAreaView>
  )
}
