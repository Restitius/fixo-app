// Provider onboarding wizard — the real 7-step catalogue (PERSONAL_INFO,
// BUSINESS_INFO, IDENTITY_VERIFICATION, SERVICE_CONFIGURATION,
// SERVICE_AREAS, PAYMENT_INFORMATION, AGREEMENTS), ported step-for-step
// from web-provider's already-verified onboarding.tsx. Onboarding itself
// has no data store — /providers/onboarding/steps/{code} just tracks
// progress; each step's real data lives in the domain it curates
// (profile, business, verification, services+pricing, areas, payout
// methods), reusing the exact same onboardingApi methods the standalone
// Profile-hub screens already use.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native'
import { Redirect, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import ScreenHeader from '../components/ScreenHeader'
import Button from '../components/Button'
import Field from '../components/Field'
import Select from '../components/Select'
import Checkbox from '../components/Checkbox'
import StatusBadge from '../components/StatusBadge'
import { CameraIcon, CheckCircleIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { humanize } from '../lib/format'
import {
  onboardingApi,
  type AreaSettings,
  type CatalogServiceOption,
  type PayoutMethod,
  type ProviderBusinessProfile,
  type ProviderProfile,
  type ProviderServiceConfig,
  type ServiceArea,
  type VerificationDocType,
  type VerificationDocument,
} from '../lib/api-client'

const STEP_CODES = ['PERSONAL_INFO', 'BUSINESS_INFO', 'IDENTITY_VERIFICATION', 'SERVICE_CONFIGURATION', 'SERVICE_AREAS', 'PAYMENT_INFORMATION', 'AGREEMENTS'] as const

const STEP_LABELS: Record<(typeof STEP_CODES)[number], string> = {
  PERSONAL_INFO: 'Personal information',
  BUSINESS_INFO: 'Business information',
  IDENTITY_VERIFICATION: 'Identity verification',
  SERVICE_CONFIGURATION: 'Service configuration',
  SERVICE_AREAS: 'Service areas',
  PAYMENT_INFORMATION: 'Payment information',
  AGREEMENTS: 'Agreements',
}

const AGREEMENTS = [
  'Provider Terms of Service',
  'Commission and payment agreement',
  'Code of conduct',
  'Cancellation policy',
  'Data protection and privacy policy',
  'Insurance and liability declaration',
]

const fieldCls = 'rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink'

export default function OnboardingSteps() {
  const { access_token, loading: authLoading } = useAuth()
  const [step, setStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState<Partial<ProviderProfile>>({})
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  const [business, setBusiness] = useState<Partial<ProviderBusinessProfile>>({})

  const [docTypes, setDocTypes] = useState<VerificationDocType[]>([])
  const [documents, setDocuments] = useState<VerificationDocument[]>([])
  const [docType, setDocType] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [frontUri, setFrontUri] = useState<string | null>(null)

  const [catalog, setCatalog] = useState<CatalogServiceOption[]>([])
  const [myServices, setMyServices] = useState<ProviderServiceConfig[]>([])
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set())
  const [pricingModel, setPricingModel] = useState('FIXED')
  const [baseAmount, setBaseAmount] = useState('45000')
  const [minimumCharge, setMinimumCharge] = useState('25000')

  const [areas, setAreas] = useState<ServiceArea[]>([])
  const [areaSettings, setAreaSettings] = useState<Partial<AreaSettings>>({})

  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([])
  const [methodType, setMethodType] = useState<'Mobile money' | 'Bank account'>('Mobile money')
  const [accountHolder, setAccountHolder] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [payoutProviderName, setPayoutProviderName] = useState('')

  const [agreed, setAgreed] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (authLoading || !access_token) return
    ;(async () => {
      const [status, prof, doctypes] = await Promise.all([onboardingApi.status(), onboardingApi.getProfile().catch(() => null), onboardingApi.docTypes().catch(() => [])])
      setCompletedSteps(new Set(status.steps.filter((s) => s.completed).map((s) => s.code)))
      if (status.current_step) {
        const idx = STEP_CODES.indexOf(status.current_step as (typeof STEP_CODES)[number])
        if (idx >= 0) setStep(idx)
      }
      if (prof) {
        setProfile(prof)
        setPhotoUrl(prof.profile_photo_url ?? null)
      }
      setDocTypes(doctypes)
      setLoaded(true)
    })()
  }, [authLoading, access_token])

  useEffect(() => {
    if (!loaded) return
    const code = STEP_CODES[step]!
    if (code === 'BUSINESS_INFO') {
      onboardingApi.getBusiness().then(setBusiness).catch(() => {})
    } else if (code === 'IDENTITY_VERIFICATION') {
      onboardingApi.documents().then(setDocuments).catch(() => {})
    } else if (code === 'SERVICE_CONFIGURATION') {
      Promise.all([onboardingApi.serviceCatalog(), onboardingApi.myServices()]).then(([cat, mine]) => {
        setCatalog(cat)
        setMyServices(mine)
        setSelectedServiceIds(new Set(mine.map((m) => m.service_id)))
      })
    } else if (code === 'SERVICE_AREAS') {
      Promise.all([onboardingApi.listAreas(), onboardingApi.getAreaSettings().catch(() => null)]).then(([a, s]) => {
        setAreas(a)
        if (s) setAreaSettings(s)
      })
    } else if (code === 'PAYMENT_INFORMATION') {
      onboardingApi.listPayoutMethods().then(setPayoutMethods)
    }
  }, [step, loaded])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  const code = STEP_CODES[step]!
  const total = STEP_CODES.length

  async function pickPhoto(onDone: (url: string) => void) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
    if (result.canceled || !result.assets[0]) return
    const uploaded = await onboardingApi.uploadFile({ uri: result.assets[0].uri, name: 'photo.jpg', type: 'image/jpeg' })
    onDone(uploaded.url)
  }

  async function saveCurrentStep(): Promise<boolean> {
    try {
      if (code === 'PERSONAL_INFO') {
        await onboardingApi.updateProfile({ ...profile, profile_photo_url: photoUrl ?? undefined })
      } else if (code === 'BUSINESS_INFO') {
        if (business.business_name) await onboardingApi.upsertBusiness({ ...business, business_name: business.business_name })
      } else if (code === 'IDENTITY_VERIFICATION') {
        const selectedName = docType || docTypes[0]?.name
        if (selectedName && frontUri) {
          const front = await onboardingApi.uploadFile({ uri: frontUri, name: 'document.jpg', type: 'image/jpeg' })
          const docTypeCode = docTypes.find((t) => t.name === selectedName)?.code ?? selectedName
          await onboardingApi.addDocument({ doc_type: docTypeCode, front_image_url: front.url, doc_number: docNumber || undefined })
        }
      } else if (code === 'SERVICE_CONFIGURATION') {
        for (const serviceId of selectedServiceIds) {
          const displayName = catalog.find((c) => c.service_id === serviceId)?.name
          await onboardingApi.configureService(serviceId, { display_name: displayName, pricing_model: pricingModel, minimum_charge: Number(minimumCharge) })
          await onboardingApi.upsertPricing(serviceId, { pricing_model: pricingModel, base_amount: Number(baseAmount) })
        }
      } else if (code === 'SERVICE_AREAS') {
        await onboardingApi.saveAreaSettings(areaSettings)
      } else if (code === 'PAYMENT_INFORMATION') {
        if (accountHolder || accountNumber || mobileNumber) {
          await onboardingApi.addPayoutMethod({
            method_type: methodType === 'Mobile money' ? 'MOBILE_MONEY' : 'BANK',
            provider_name: payoutProviderName || undefined,
            account_holder: accountHolder || undefined,
            account_number: accountNumber || undefined,
            mobile_number: mobileNumber || undefined,
            currency: 'TZS',
            is_default: payoutMethods.length === 0,
          })
        }
      }
      await onboardingApi.completeStep(code, {})
      setCompletedSteps((prev) => new Set(prev).add(code))
      return true
    } catch {
      return false
    }
  }

  async function handleNext() {
    setSaving(true)
    const ok = await saveCurrentStep()
    setSaving(false)
    if (!ok) return
    if (step === total - 1) router.replace('/(tabs)/dashboard')
    else setStep((s) => s + 1)
  }

  function toggleArea(areaId: string, isActive: boolean) {
    setAreas((prev) => prev.map((a) => (a.area_id === areaId ? { ...a, is_active: isActive } : a)))
    onboardingApi.updateArea(areaId, { is_active: isActive }).catch(() => {})
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Complete your profile" back="/(tabs)/dashboard" />
      {!loaded ? null : (
        <>
          <View className="px-6">
            <Text className="text-[13px] text-muted">
              Step {step + 1} of {total} — your progress is saved automatically.
            </Text>
            <View className="h-2 w-full rounded-full bg-[#f0f0f0] mt-2 overflow-hidden">
              <View className="h-full rounded-full bg-primary" style={{ width: `${((step + 1) / total) * 100}%` }} />
            </View>
            <View className="flex-row flex-wrap gap-2 mt-3">
              {STEP_CODES.map((c, i) => (
                <Pressable
                  key={c}
                  onPress={() => setStep(i)}
                  className="items-center justify-center rounded-full"
                  style={{ width: 26, height: 26, backgroundColor: i < step || completedSteps.has(c) ? 'rgba(0,184,148,0.15)' : i === step ? 'rgba(114,16,255,0.1)' : '#f0f0f0' }}
                >
                  {i < step || completedSteps.has(c) ? (
                    <CheckCircleIcon size={14} color="#00B894" />
                  ) : (
                    <Text className="text-[11px] font-bold" style={{ color: i === step ? '#7210FF' : '#6C7585' }}>
                      {i + 1}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
            <Text className="text-[17px] font-bold text-ink mt-5">{STEP_LABELS[code]}</Text>

            <View className="mt-4" style={{ gap: 12 }}>
              {code === 'PERSONAL_INFO' && (
                <>
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
                  <Field label="Languages (English, Swahili)">
                    <TextInput className={fieldCls} value={profile.languages ?? ''} onChangeText={(v) => setProfile((p) => ({ ...p, languages: v }))} />
                  </Field>
                  <Field label="Professional bio">
                    <TextInput className={fieldCls} value={profile.bio ?? ''} onChangeText={(v) => setProfile((p) => ({ ...p, bio: v }))} multiline numberOfLines={4} />
                  </Field>
                  <Pressable onPress={() => void pickPhoto(setPhotoUrl)} className="rounded-2xl bg-[#f5f5f5] px-4 py-6 items-center">
                    <CameraIcon size={22} color="#7210FF" />
                    <Text className="text-[13px] text-ink mt-2">{photoUrl ? 'Profile photo uploaded' : 'Upload profile photo'}</Text>
                  </Pressable>
                </>
              )}

              {code === 'BUSINESS_INFO' && (
                <>
                  <Text className="text-[12px] text-muted">Optional — skip if you operate as an individual.</Text>
                  <Field label="Business name">
                    <TextInput className={fieldCls} value={business.business_name ?? ''} onChangeText={(v) => setBusiness((b) => ({ ...b, business_name: v }))} />
                  </Field>
                  <Field label="Registration number">
                    <TextInput className={fieldCls} value={business.registration_number ?? ''} onChangeText={(v) => setBusiness((b) => ({ ...b, registration_number: v }))} />
                  </Field>
                  <Field label="Business email">
                    <TextInput className={fieldCls} value={business.business_email ?? ''} onChangeText={(v) => setBusiness((b) => ({ ...b, business_email: v }))} />
                  </Field>
                  <Field label="Business phone">
                    <TextInput className={fieldCls} value={business.business_phone ?? ''} onChangeText={(v) => setBusiness((b) => ({ ...b, business_phone: v }))} />
                  </Field>
                  <Field label="Business address">
                    <TextInput className={fieldCls} value={business.address ?? ''} onChangeText={(v) => setBusiness((b) => ({ ...b, address: v }))} />
                  </Field>
                </>
              )}

              {code === 'IDENTITY_VERIFICATION' && (
                <>
                  {documents.map((d) => (
                    <View key={d.doc_id} className="flex-row items-center justify-between rounded-xl bg-[#f5f5f5] px-4 py-3">
                      <Text className="text-[13px] font-semibold text-ink">{docTypes.find((t) => t.code === d.doc_type)?.name ?? humanize(d.doc_type)}</Text>
                      <StatusBadge status={d.status} />
                    </View>
                  ))}
                  <Select value={docType || (docTypes[0]?.name ?? '')} onChange={setDocType} options={docTypes.map((t) => t.name)} />
                  <Field label="ID number">
                    <TextInput className={fieldCls} value={docNumber} onChangeText={setDocNumber} />
                  </Field>
                  <Pressable
                    onPress={async () => {
                      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
                      if (!perm.granted) return
                      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
                      if (!result.canceled && result.assets[0]) setFrontUri(result.assets[0].uri)
                    }}
                    className="rounded-2xl bg-[#f5f5f5] px-4 py-6 items-center"
                  >
                    <CameraIcon size={22} color="#7210FF" />
                    <Text className="text-[13px] text-ink mt-2">{frontUri ? 'ID photo selected' : 'Upload ID (front)'}</Text>
                  </Pressable>
                  <Text className="text-[12px] text-muted">Verification usually takes 24–48 hours. You can continue onboarding while we review your documents.</Text>
                </>
              )}

              {code === 'SERVICE_CONFIGURATION' && (
                <>
                  <View className="flex-row flex-wrap gap-2">
                    {catalog.map((s) => {
                      const selected = selectedServiceIds.has(s.service_id)
                      return (
                        <Pressable
                          key={s.service_id}
                          onPress={() =>
                            setSelectedServiceIds((prev) => {
                              const next = new Set(prev)
                              if (next.has(s.service_id)) next.delete(s.service_id)
                              else next.add(s.service_id)
                              return next
                            })
                          }
                          className="rounded-full px-3 py-2"
                          style={{ backgroundColor: selected ? 'rgba(114,16,255,0.1)' : '#f0f0f0' }}
                        >
                          <Text className="text-[12px] font-medium" style={{ color: selected ? '#7210FF' : '#0B111F' }}>
                            {s.name}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                  {myServices.length > 0 && <Text className="text-[12px] text-muted">Already configured: {myServices.map((s) => s.display_name || s.service_id).join(', ')}</Text>}
                  <Select value={pricingModel.replace(/_/g, ' ')} onChange={(v) => setPricingModel(v.replace(/ /g, '_'))} options={['FIXED', 'STARTING', 'HOURLY', 'INSPECTION_THEN_QUOTE', 'CUSTOM_QUOTATION'].map((o) => o.replace(/_/g, ' '))} />
                  <Field label="Base price (TZS)">
                    <TextInput className={fieldCls} keyboardType="numeric" value={baseAmount} onChangeText={setBaseAmount} />
                  </Field>
                  <Field label="Minimum charge (TZS)">
                    <TextInput className={fieldCls} keyboardType="numeric" value={minimumCharge} onChangeText={setMinimumCharge} />
                  </Field>
                  <Text className="text-[12px] text-muted">Applies to every service selected above. Set different pricing per service later from Pricing in your profile.</Text>
                </>
              )}

              {code === 'SERVICE_AREAS' && (
                <>
                  {areas.map((a) => (
                    <View key={a.area_id} className="flex-row items-center justify-between rounded-2xl bg-[#f5f5f5] p-4">
                      <View className="flex-1">
                        <Text className="text-[13px] font-semibold text-ink">{a.label || `${a.city ?? ''} ${a.region ?? ''}`.trim() || humanize(a.area_type)}</Text>
                        <Text className="text-[12px] text-muted">{a.area_type === 'RADIUS' ? `${a.radius_km ?? '—'} km radius` : [a.city, a.region].filter(Boolean).join(', ')}</Text>
                      </View>
                      <Switch value={a.is_active} onValueChange={(v) => toggleArea(a.area_id, v)} trackColor={{ false: '#e0e0e0', true: '#7210FF' }} thumbColor="#ffffff" />
                    </View>
                  ))}
                  {areas.length === 0 && <Text className="text-[12px] text-muted">No service areas added yet — add them from Service Areas in your profile after onboarding, or set your travel policy below.</Text>}
                  <Field label="Maximum travel distance (km)">
                    <TextInput
                      className={fieldCls}
                      keyboardType="numeric"
                      value={areaSettings.max_travel_km != null ? String(areaSettings.max_travel_km) : ''}
                      onChangeText={(v) => setAreaSettings((s) => ({ ...s, max_travel_km: v ? Number(v) : undefined }))}
                    />
                  </Field>
                  <Field label="Travel fee (TZS)">
                    <TextInput
                      className={fieldCls}
                      keyboardType="numeric"
                      value={areaSettings.travel_fee != null ? String(areaSettings.travel_fee) : ''}
                      onChangeText={(v) => setAreaSettings((s) => ({ ...s, travel_fee: v ? Number(v) : undefined }))}
                    />
                  </Field>
                </>
              )}

              {code === 'PAYMENT_INFORMATION' && (
                <>
                  {payoutMethods.map((m) => (
                    <View key={m.method_id} className="flex-row items-center justify-between rounded-xl bg-[#f5f5f5] px-4 py-3">
                      <Text className="text-[13px] font-semibold text-ink">{humanize(m.method_type)}</Text>
                      <Text className="text-[12px] text-muted">{m.mobile_number || m.account_number || m.provider_name}</Text>
                    </View>
                  ))}
                  <Select value={methodType} onChange={(v) => setMethodType(v as 'Mobile money' | 'Bank account')} options={['Mobile money', 'Bank account']} />
                  {methodType === 'Mobile money' ? (
                    <>
                      <Field label="Mobile money provider (M-Pesa, Tigo Pesa…)">
                        <TextInput className={fieldCls} value={payoutProviderName} onChangeText={setPayoutProviderName} />
                      </Field>
                      <Field label="Mobile number">
                        <TextInput className={fieldCls} value={mobileNumber} onChangeText={setMobileNumber} keyboardType="phone-pad" />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="Account holder name">
                        <TextInput className={fieldCls} value={accountHolder} onChangeText={setAccountHolder} />
                      </Field>
                      <Field label="Bank / provider">
                        <TextInput className={fieldCls} value={payoutProviderName} onChangeText={setPayoutProviderName} />
                      </Field>
                      <Field label="Account number">
                        <TextInput className={fieldCls} value={accountNumber} onChangeText={setAccountNumber} />
                      </Field>
                    </>
                  )}
                </>
              )}

              {code === 'AGREEMENTS' &&
                AGREEMENTS.map((t) => (
                  <View key={t} className="rounded-2xl bg-[#f5f5f5] p-4">
                    <Checkbox
                      checked={agreed.has(t)}
                      onChange={(v) =>
                        setAgreed((prev) => {
                          const next = new Set(prev)
                          if (v) next.add(t)
                          else next.delete(t)
                          return next
                        })
                      }
                      label={`I have read and accept the ${t}.`}
                    />
                  </View>
                ))}
            </View>

            <View className="flex-row items-center justify-between gap-3 mt-7">
              <Pressable onPress={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="rounded-xl border border-hairline px-5 py-2.5" style={{ opacity: step === 0 ? 0.4 : 1 }}>
                <Text className="text-[13px] font-semibold text-ink">Back</Text>
              </Pressable>
              <View className="flex-1 ml-3">
                <Button onPress={() => void handleNext()} loading={saving} disabled={code === 'AGREEMENTS' && agreed.size < AGREEMENTS.length}>
                  {step === total - 1 ? 'Submit for review' : 'Save & continue'}
                </Button>
              </View>
            </View>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  )
}
