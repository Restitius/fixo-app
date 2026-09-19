// Settings — real preferences/security/privacy/closure endpoints, ported
// from web-provider's settings.tsx. No 2FA toggle or per-session listing
// (no such fields/endpoints exist — only revoke-all-sessions is real).
import { useEffect, useState } from 'react'
import { ScrollView, Switch, Text, TextInput, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import Button from '../components/Button'
import Field from '../components/Field'
import Select from '../components/Select'
import { useAuth } from '../lib/auth-context'
import { settingsApi, type ProviderConsent } from '../lib/api-client'

const fieldCls = 'rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink'

const CONSENT_LABELS: Record<ProviderConsent['kind'], string> = {
  MARKETING: 'Allow marketing emails',
  ANALYTICS: 'Share usage analytics',
  COMMUNICATION: 'Product & service updates',
}

export default function Settings() {
  const { access_token, loading: authLoading, logout } = useAuth()
  const [language, setLanguage] = useState('English')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [consents, setConsents] = useState<Record<ProviderConsent['kind'], boolean>>({ MARKETING: false, ANALYTICS: false, COMMUNICATION: false })
  const [confirmClose, setConfirmClose] = useState('')
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (authLoading || !access_token) return
    Promise.all([settingsApi.listPreferences(), settingsApi.listConsents()])
      .then(([prefs, c]) => {
        const lang = prefs.find((p) => p.key === 'language')
        if (lang) setLanguage(lang.value)
        const next = { MARKETING: false, ANALYTICS: false, COMMUNICATION: false } as Record<ProviderConsent['kind'], boolean>
        for (const item of c) next[item.kind] = item.consented
        setConsents(next)
      })
      .catch(() => {})
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  async function savePreferences() {
    setSavingPrefs(true)
    try {
      await settingsApi.setPreference('language', language)
    } finally {
      setSavingPrefs(false)
    }
  }

  async function changePassword() {
    if (newPassword.length < 8) return
    setChangingPassword(true)
    try {
      await settingsApi.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
    } finally {
      setChangingPassword(false)
    }
  }

  async function toggleConsent(kind: ProviderConsent['kind']) {
    const next = !consents[kind]
    setConsents((prev) => ({ ...prev, [kind]: next }))
    try {
      await settingsApi.setConsent(kind, next)
    } catch {
      setConsents((prev) => ({ ...prev, [kind]: !next }))
    }
  }

  async function closeAccount() {
    setClosing(true)
    try {
      await settingsApi.scheduleClosure()
    } finally {
      setClosing(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Settings" back="/(tabs)/profile" />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-[15px] font-bold text-ink mt-2">Preferences</Text>
        <View className="mt-3" style={{ gap: 10 }}>
          <Select value={language} onChange={setLanguage} options={['English', 'Swahili']} />
          <Button onPress={() => void savePreferences()} loading={savingPrefs} variant="outline">
            Save preferences
          </Button>
        </View>

        <Text className="text-[15px] font-bold text-ink mt-7">Security</Text>
        <View className="mt-3" style={{ gap: 10 }}>
          <Field label="Current password">
            <TextInput className={fieldCls} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
          </Field>
          <Field label="New password">
            <TextInput className={fieldCls} secureTextEntry value={newPassword} onChangeText={setNewPassword} />
          </Field>
          <Button onPress={() => void changePassword()} loading={changingPassword} disabled={!currentPassword || !newPassword}>
            Update password
          </Button>
        </View>

        <Text className="text-[15px] font-bold text-ink mt-7">Privacy</Text>
        <View className="mt-3" style={{ gap: 8 }}>
          {(Object.keys(CONSENT_LABELS) as ProviderConsent['kind'][]).map((kind) => (
            <View key={kind} className="flex-row items-center justify-between rounded-xl bg-[#f5f5f5] px-4 py-3.5">
              <Text className="text-[13px] text-ink flex-1">{CONSENT_LABELS[kind]}</Text>
              <Switch value={consents[kind]} onValueChange={() => void toggleConsent(kind)} trackColor={{ false: '#e0e0e0', true: '#7210FF' }} thumbColor="#ffffff" />
            </View>
          ))}
          <Button onPress={() => void settingsApi.requestExport()} variant="outline">
            Request my data export
          </Button>
        </View>

        <Text className="text-[15px] font-bold text-ink mt-7">Sign out</Text>
        <View className="mt-3">
          <Button onPress={() => void logout()} variant="outline">
            Sign out of this device
          </Button>
        </View>

        <Text className="text-[15px] font-bold mt-7" style={{ color: '#DC2626' }}>
          Close account
        </Text>
        <Text className="text-[12px] text-muted mt-1">Closing your account schedules its permanent closure. This cannot be undone once processed.</Text>
        <View className="mt-3" style={{ gap: 10 }}>
          <Field label="Type CLOSE to confirm">
            <TextInput className={fieldCls} value={confirmClose} onChangeText={setConfirmClose} autoCapitalize="characters" />
          </Field>
          <Button onPress={() => void closeAccount()} loading={closing} disabled={confirmClose !== 'CLOSE'}>
            Close my account
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
