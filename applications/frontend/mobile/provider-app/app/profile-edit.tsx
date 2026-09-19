// Edit profile — real GET/PATCH /providers/profile, ported from
// web-provider's profile.tsx Personal tab. First/last name, email, phone
// stay read-only: the real ProfileUpdateRequest has no such fields —
// those live on the account record set at registration with no
// provider-facing update endpoint (a real gap confirmed while building
// web-provider this session).
import { useEffect, useState } from 'react'
import { ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import Button from '../components/Button'
import { useAuth } from '../lib/auth-context'
import { onboardingApi, type ProviderProfile } from '../lib/api-client'

const fieldCls = 'rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink'
const roCls = 'rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-muted'

export default function ProfileEdit() {
  const { access_token, loading: authLoading, provider } = useAuth()
  const [profile, setProfile] = useState<Partial<ProviderProfile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (authLoading || !access_token) return
    onboardingApi
      .getProfile()
      .then(setProfile)
      .finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  async function save() {
    setSaving(true)
    try {
      const updated = await onboardingApi.updateProfile(profile)
      setProfile(updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Edit profile" back="/(tabs)/profile" />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && (
          <View className="mt-2" style={{ gap: 12 }}>
            <Field label="First name">
              <Text className={roCls}>{provider?.first_name ?? '—'}</Text>
            </Field>
            <Field label="Last name">
              <Text className={roCls}>{provider?.last_name ?? '—'}</Text>
            </Field>
            <Field label="Email">
              <Text className={roCls}>{provider?.email ?? '—'}</Text>
            </Field>
            <Field label="Phone">
              <Text className={roCls}>{provider?.phone ?? '—'}</Text>
            </Field>

            <Field label="Professional title">
              <TextInput className={fieldCls} value={profile.professional_title ?? ''} onChangeText={(v) => setProfile((p) => ({ ...p, professional_title: v }))} />
            </Field>
            <Field label="Years of experience">
              <TextInput
                className={fieldCls}
                keyboardType="numeric"
                value={profile.years_experience != null ? String(profile.years_experience) : ''}
                onChangeText={(v) => setProfile((p) => ({ ...p, years_experience: v ? Number(v) : undefined }))}
              />
            </Field>
            <Field label="Bio">
              <TextInput className={fieldCls} value={profile.bio ?? ''} onChangeText={(v) => setProfile((p) => ({ ...p, bio: v }))} multiline numberOfLines={4} />
            </Field>
            <Field label="Languages (comma separated)">
              <TextInput className={fieldCls} value={profile.languages ?? ''} onChangeText={(v) => setProfile((p) => ({ ...p, languages: v }))} />
            </Field>

            <View className="mt-2">
              <Button onPress={() => void save()} loading={saving}>
                Save changes
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="text-[12px] text-muted mb-1.5 ml-1">{label}</Text>
      {children}
    </View>
  )
}
