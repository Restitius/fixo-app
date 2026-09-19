import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import { CheckCircleIcon, GlobeIcon } from '../../components/icons'
import { useAuth, ApiError } from '../../lib/auth-context'
import { LANGUAGE_NAMES, setLanguage, type LanguageCode } from '../../lib/language'
import { SUPPORTED_LANGUAGES } from '../../lib/i18n'

export default function Language() {
  const { t, i18n } = useTranslation('profile')
  const { customer, updateProfile } = useAuth()
  const current = (customer?.preferred_language as LanguageCode | undefined) ?? (i18n.language as LanguageCode)
  const [saving, setSaving] = useState<LanguageCode | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function select(code: LanguageCode) {
    if (code === current || saving) return
    setError(null)
    setSaving(code)
    try {
      // Switches the UI immediately (and reloads if an RTL flip is needed —
      // setLanguage handles that); persists to the account in the background.
      const reloading = await setLanguage(code, { persistExplicit: true })
      await updateProfile({ preferred_language: code })
      if (!reloading) router.back()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('language.error'))
    } finally {
      setSaving(null)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title={t('language.title')} back="/(tabs)/profile" />
      <View className="px-6 mt-6 gap-3">
        {SUPPORTED_LANGUAGES.map((code) => {
          const active = code === current
          return (
            <Pressable
              key={code}
              onPress={() => select(code)}
              className="flex-row items-center gap-4 rounded-2xl bg-[#f5f5f5] px-5 py-4"
            >
              <GlobeIcon size={20} color="#6C7585" />
              <Text className="flex-1 text-[15px] font-medium text-ink">{LANGUAGE_NAMES[code]}</Text>
              {saving === code ? (
                <Text className="text-[12px] text-muted">{t('language.saving')}</Text>
              ) : active ? (
                <CheckCircleIcon size={20} color="#7210FF" />
              ) : null}
            </Pressable>
          )
        })}
        {error && <Text className="text-center text-[13px] text-red-500">{error}</Text>}
      </View>
    </SafeAreaView>
  )
}
