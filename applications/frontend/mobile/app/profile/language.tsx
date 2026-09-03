import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import { CheckCircleIcon, GlobeIcon } from '../../components/icons'
import { useAuth, ApiError } from '../../lib/auth-context'

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'sw', name: 'Swahili' },
]

export default function Language() {
  const { customer, updateProfile } = useAuth()
  const current = customer?.preferred_language ?? 'en'
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function select(code: string) {
    if (code === current || saving) return
    setError(null)
    setSaving(code)
    try {
      await updateProfile({ preferred_language: code })
      router.back()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your language')
    } finally {
      setSaving(null)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Language" back="/(tabs)/profile" />
      <View className="px-6 mt-6 gap-3">
        {LANGUAGES.map((lang) => {
          const active = lang.code === current
          return (
            <Pressable
              key={lang.code}
              onPress={() => select(lang.code)}
              className="flex-row items-center gap-4 rounded-2xl bg-[#f5f5f5] px-5 py-4"
            >
              <GlobeIcon size={20} color="#6C7585" />
              <Text className="flex-1 text-[15px] font-medium text-ink">{lang.name}</Text>
              {saving === lang.code ? (
                <Text className="text-[12px] text-muted">Saving…</Text>
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
