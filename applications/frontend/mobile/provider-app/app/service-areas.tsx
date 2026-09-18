// Service Areas — real LOCATION/RADIUS coverage entries + travel policy,
// ported from web-provider's service-areas.tsx.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import Button from '../components/Button'
import Field from '../components/Field'
import Select from '../components/Select'
import Sheet from '../components/Sheet'
import { LocationIcon, PlusIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { onboardingApi, type AreaSettings, type ServiceArea } from '../lib/api-client'

const fieldCls = 'rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink'

export default function ServiceAreas() {
  const { access_token, loading: authLoading } = useAuth()
  const [areas, setAreas] = useState<ServiceArea[]>([])
  const [settings, setSettings] = useState<Partial<AreaSettings>>({ currency: 'TZS' })
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  function load() {
    return Promise.all([onboardingApi.listAreas(), onboardingApi.getAreaSettings().catch(() => null)]).then(([a, s]) => {
      setAreas(a)
      if (s) setSettings(s)
    })
  }

  useEffect(() => {
    if (authLoading || !access_token) return
    load().finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  async function toggleActive(area: ServiceArea) {
    const updated = await onboardingApi.updateArea(area.area_id, { is_active: !area.is_active })
    setAreas((prev) => prev.map((a) => (a.area_id === area.area_id ? updated : a)))
  }

  async function remove(areaId: string) {
    await onboardingApi.removeArea(areaId)
    setAreas((prev) => prev.filter((a) => a.area_id !== areaId))
  }

  async function saveSettings() {
    setSavingSettings(true)
    try {
      const saved = await onboardingApi.saveAreaSettings(settings)
      setSettings(saved)
    } finally {
      setSavingSettings(false)
    }
  }

  function describe(a: ServiceArea) {
    if (a.area_type === 'RADIUS') return `Within ${a.radius_km ?? '—'} km`
    return [a.district, a.city, a.region, a.country].filter(Boolean).join(', ') || '—'
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader
        title="Service areas"
        back="/(tabs)/profile"
        right={
          <Pressable onPress={() => setShowAdd(true)}>
            <PlusIcon size={20} color="#7210FF" />
          </Pressable>
        }
      />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && areas.length === 0 && <Text className="text-[13px] text-muted mt-4">No service areas yet. Add one to start receiving matched requests.</Text>}

        <View className="mt-3" style={{ gap: 10 }}>
          {areas.map((a) => (
            <View key={a.area_id} className="flex-row items-center gap-3 rounded-2xl bg-[#f5f5f5] p-4">
              <View className="items-center justify-center rounded-2xl bg-primary/10" style={{ width: 40, height: 40 }}>
                <LocationIcon size={18} color="#7210FF" />
              </View>
              <View className="flex-1 min-w-0">
                <Text numberOfLines={1} className="text-[13px] font-semibold text-ink">
                  {a.label || describe(a)}
                </Text>
                <Text numberOfLines={1} className="text-[11px] text-muted">
                  {a.area_type === 'RADIUS' ? 'Radius' : 'Location'} · {describe(a)}
                </Text>
              </View>
              <Switch value={a.is_active} onValueChange={() => void toggleActive(a)} trackColor={{ false: '#e0e0e0', true: '#7210FF' }} thumbColor="#ffffff" />
              <Pressable onPress={() => void remove(a.area_id)}>
                <Text className="text-[12px] font-semibold" style={{ color: '#DC2626' }}>
                  Remove
                </Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Text className="text-[15px] font-bold text-ink mt-7">Travel policy</Text>
        <View className="mt-3" style={{ gap: 10 }}>
          <Field label="Maximum travel distance (km)">
            <TextInput className={fieldCls} keyboardType="numeric" value={settings.max_travel_km != null ? String(settings.max_travel_km) : ''} onChangeText={(v) => setSettings((s) => ({ ...s, max_travel_km: v ? Number(v) : undefined }))} />
          </Field>
          <Field label="Free travel radius (km)">
            <TextInput className={fieldCls} keyboardType="numeric" value={settings.free_travel_radius_km != null ? String(settings.free_travel_radius_km) : ''} onChangeText={(v) => setSettings((s) => ({ ...s, free_travel_radius_km: v ? Number(v) : undefined }))} />
          </Field>
          <Field label="Travel fee beyond free radius">
            <TextInput className={fieldCls} keyboardType="numeric" value={settings.travel_fee != null ? String(settings.travel_fee) : ''} onChangeText={(v) => setSettings((s) => ({ ...s, travel_fee: v ? Number(v) : undefined }))} />
          </Field>
          <Button onPress={() => void saveSettings()} loading={savingSettings}>
            Save travel policy
          </Button>
        </View>
      </ScrollView>

      <Sheet open={showAdd} onClose={() => setShowAdd(false)}>
        <AddAreaForm
          onSaved={async () => {
            setShowAdd(false)
            await load()
          }}
        />
      </Sheet>
    </SafeAreaView>
  )
}

function AddAreaForm({ onSaved }: { onSaved: () => void }) {
  const [areaType, setAreaType] = useState<'Location' | 'Radius'>('Location')
  const [country, setCountry] = useState('Tanzania')
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [centerLat, setCenterLat] = useState('')
  const [centerLng, setCenterLng] = useState('')
  const [radiusKm, setRadiusKm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setError(null)
    if (areaType === 'Location' && !country && !region && !city) {
      setError('Provide at least a country, region or city')
      return
    }
    if (areaType === 'Radius' && (!centerLat || !centerLng || !radiusKm)) {
      setError('Radius areas require a center point and a radius')
      return
    }
    setSaving(true)
    try {
      await onboardingApi.addArea({
        area_type: areaType === 'Location' ? 'LOCATION' : 'RADIUS',
        ...(areaType === 'Location'
          ? { country: country || undefined, region: region || undefined, city: city || undefined, district: district || undefined }
          : { center_latitude: Number(centerLat), center_longitude: Number(centerLng), radius_km: Number(radiusKm) }),
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add area')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View>
      <Text className="text-[18px] font-bold text-ink">Add service area</Text>
      <View className="mt-4" style={{ gap: 12 }}>
        <Select value={areaType} onChange={(v) => setAreaType(v as 'Location' | 'Radius')} options={['Location', 'Radius']} />
        {areaType === 'Location' ? (
          <>
            <Field label="Country">
              <TextInput className={fieldCls} value={country} onChangeText={setCountry} />
            </Field>
            <Field label="Region">
              <TextInput className={fieldCls} value={region} onChangeText={setRegion} />
            </Field>
            <Field label="City">
              <TextInput className={fieldCls} value={city} onChangeText={setCity} />
            </Field>
            <Field label="District">
              <TextInput className={fieldCls} value={district} onChangeText={setDistrict} />
            </Field>
          </>
        ) : (
          <>
            <Field label="Center latitude">
              <TextInput className={fieldCls} keyboardType="numeric" value={centerLat} onChangeText={setCenterLat} />
            </Field>
            <Field label="Center longitude">
              <TextInput className={fieldCls} keyboardType="numeric" value={centerLng} onChangeText={setCenterLng} />
            </Field>
            <Field label="Radius (km)">
              <TextInput className={fieldCls} keyboardType="numeric" value={radiusKm} onChangeText={setRadiusKm} />
            </Field>
          </>
        )}
      </View>
      {error && (
        <Text className="text-[13px] mt-3" style={{ color: '#DC2626' }}>
          {error}
        </Text>
      )}
      <View className="mt-5">
        <Button onPress={() => void save()} loading={saving}>
          Add area
        </Button>
      </View>
    </View>
  )
}
