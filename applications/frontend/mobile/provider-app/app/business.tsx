// Business profile — real GET/PUT /providers/business, ported from
// web-provider's profile.tsx Business tab.
import { useEffect, useState } from 'react'
import { ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import Button from '../components/Button'
import { useAuth } from '../lib/auth-context'
import { onboardingApi, type ProviderBusinessProfile } from '../lib/api-client'

const fieldCls = 'rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink'

export default function Business() {
  const { access_token, loading: authLoading } = useAuth()
  const [business, setBusiness] = useState<Partial<ProviderBusinessProfile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !access_token) return
    onboardingApi
      .getBusiness()
      .then(setBusiness)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  async function save() {
    setError(null)
    if (!business.business_name) {
      setError('Business name is required')
      return
    }
    setSaving(true)
    try {
      const updated = await onboardingApi.upsertBusiness({ ...business, business_name: business.business_name })
      setBusiness(updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Business profile" back="/(tabs)/profile" />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && (
          <View className="mt-2" style={{ gap: 12 }}>
            <Field label="Business name">
              <TextInput className={fieldCls} value={business.business_name ?? ''} onChangeText={(v) => setBusiness((b) => ({ ...b, business_name: v }))} />
            </Field>
            <Field label="Registration number">
              <TextInput className={fieldCls} value={business.registration_number ?? ''} onChangeText={(v) => setBusiness((b) => ({ ...b, registration_number: v }))} />
            </Field>
            <Field label="Tax (TIN) number">
              <TextInput className={fieldCls} value={business.tax_number ?? ''} onChangeText={(v) => setBusiness((b) => ({ ...b, tax_number: v }))} />
            </Field>
            <Field label="Business email">
              <TextInput className={fieldCls} value={business.business_email ?? ''} onChangeText={(v) => setBusiness((b) => ({ ...b, business_email: v }))} keyboardType="email-address" autoCapitalize="none" />
            </Field>
            <Field label="Business phone">
              <TextInput className={fieldCls} value={business.business_phone ?? ''} onChangeText={(v) => setBusiness((b) => ({ ...b, business_phone: v }))} keyboardType="phone-pad" />
            </Field>
            <Field label="Website">
              <TextInput className={fieldCls} value={business.website ?? ''} onChangeText={(v) => setBusiness((b) => ({ ...b, website: v }))} autoCapitalize="none" />
            </Field>
            <Field label="Address">
              <TextInput className={fieldCls} value={business.address ?? ''} onChangeText={(v) => setBusiness((b) => ({ ...b, address: v }))} />
            </Field>
            <Field label="Description">
              <TextInput className={fieldCls} value={business.description ?? ''} onChangeText={(v) => setBusiness((b) => ({ ...b, description: v }))} multiline numberOfLines={3} />
            </Field>

            {error && (
              <Text className="text-[13px]" style={{ color: '#DC2626' }}>
                {error}
              </Text>
            )}
            <Button onPress={() => void save()} loading={saving}>
              Save business profile
            </Button>
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
