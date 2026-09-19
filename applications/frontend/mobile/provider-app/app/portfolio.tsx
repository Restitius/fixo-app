// Portfolio — real /providers/me/portfolio/* CRUD, ported from
// web-provider's now-real portfolio.tsx. Uses expo-image-picker for
// before/after photo capture, same pattern as documents.tsx's upload.
import { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import ScreenHeader from '../components/ScreenHeader'
import Button from '../components/Button'
import Field from '../components/Field'
import StatusBadge from '../components/StatusBadge'
import Sheet, { CenterModal } from '../components/Sheet'
import Checkbox from '../components/Checkbox'
import { CameraIcon, ImageIcon, PlusIcon, StarIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { onboardingApi, portfolioApi, type PortfolioItem } from '../lib/api-client'
import { fmtDate } from '../lib/format'

const fieldCls = 'rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink'

export default function Portfolio() {
  const { access_token, loading: authLoading } = useAuth()
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<PortfolioItem | 'new' | null>(null)
  const [removing, setRemoving] = useState<PortfolioItem | null>(null)
  const [busy, setBusy] = useState(false)

  function load() {
    return portfolioApi.list(undefined, 50, 0).then(setItems)
  }

  useEffect(() => {
    if (authLoading || !access_token) return
    load().finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  async function confirmRemove() {
    if (!removing) return
    setBusy(true)
    try {
      await portfolioApi.remove(removing.id)
      setItems((prev) => prev.filter((i) => i.id !== removing.id))
      setRemoving(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader
        title="Portfolio"
        back="/(tabs)/profile"
        right={
          <Pressable onPress={() => setEditing('new')}>
            <PlusIcon size={20} color="#7210FF" />
          </Pressable>
        }
      />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && items.length === 0 && <Text className="text-[13px] text-muted mt-4">No projects yet. Tap + to add your first one.</Text>}
        <View className="mt-2" style={{ gap: 12 }}>
          {items.map((p) => (
            <Pressable key={p.id} onPress={() => setEditing(p)} className="rounded-2xl overflow-hidden bg-[#f5f5f5]">
              {p.after_image_url ? (
                <Image source={{ uri: p.after_image_url }} style={{ width: '100%', height: 140 }} resizeMode="cover" />
              ) : (
                <View className="items-center justify-center" style={{ height: 140, backgroundColor: 'rgba(114,16,255,0.15)' }}>
                  <ImageIcon size={28} color="#7210FF" />
                </View>
              )}
              <View className="p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[14px] font-semibold text-ink flex-1" numberOfLines={1}>
                    {p.title}
                  </Text>
                  {p.is_featured && <StarIcon size={16} color="#F59E0B" />}
                </View>
                <Text className="text-[12px] text-muted mt-0.5">
                  {p.service_category || '—'} {p.completed_on ? `· ${fmtDate(p.completed_on)}` : ''}
                </Text>
                <View className="flex-row items-center justify-between mt-2">
                  <StatusBadge label={p.status} tone={p.status === 'published' ? 'success' : p.status === 'archived' ? 'destructive' : 'muted'} />
                  <Pressable onPress={() => setRemoving(p)}>
                    <Text className="text-[12px] font-semibold" style={{ color: '#DC2626' }}>
                      Remove
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Sheet open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <EditForm
            item={editing === 'new' ? null : editing}
            onSaved={async () => {
              setEditing(null)
              await load()
            }}
          />
        )}
      </Sheet>

      <CenterModal open={!!removing}>
        <Text className="text-[18px] font-bold text-ink">Remove project?</Text>
        <Text className="text-[14px] text-muted mt-2 text-center">This project will no longer be shown on your public profile.</Text>
        <View className="flex-row gap-3 w-full mt-6">
          <View className="flex-1">
            <Button variant="outline" onPress={() => setRemoving(null)}>
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={() => void confirmRemove()} loading={busy}>
              Remove
            </Button>
          </View>
        </View>
      </CenterModal>
    </SafeAreaView>
  )
}

function EditForm({ item, onSaved }: { item: PortfolioItem | null; onSaved: () => void }) {
  const [title, setTitle] = useState(item?.title ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [category, setCategory] = useState(item?.service_category ?? '')
  const [beforeUrl, setBeforeUrl] = useState(item?.before_image_url ?? '')
  const [afterUrl, setAfterUrl] = useState(item?.after_image_url ?? '')
  const [isFeatured, setIsFeatured] = useState(item?.is_featured ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pick(onDone: (url: string) => void) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
    if (result.canceled || !result.assets[0]) return
    const uploaded = await onboardingApi.uploadFile({ uri: result.assets[0].uri, name: 'photo.jpg', type: 'image/jpeg' })
    onDone(uploaded.url)
  }

  async function save() {
    setError(null)
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    setSaving(true)
    try {
      const data = {
        title: title.trim(),
        description: description || undefined,
        service_category: category || undefined,
        before_image_url: beforeUrl || undefined,
        after_image_url: afterUrl || undefined,
        is_featured: isFeatured,
      }
      if (item) await portfolioApi.update(item.id, data)
      else await portfolioApi.create(data)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save project')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View>
      <Text className="text-[18px] font-bold text-ink">{item ? 'Edit project' : 'Add project'}</Text>
      <View className="mt-4" style={{ gap: 12 }}>
        <Field label="Title">
          <TextInput className={fieldCls} value={title} onChangeText={setTitle} />
        </Field>
        <Field label="Service category">
          <TextInput className={fieldCls} value={category} onChangeText={setCategory} />
        </Field>
        <Field label="Description">
          <TextInput className={fieldCls} value={description} onChangeText={setDescription} multiline numberOfLines={3} />
        </Field>
        <View className="flex-row" style={{ gap: 10 }}>
          <Pressable onPress={() => void pick(setBeforeUrl)} className="flex-1 rounded-2xl bg-[#f5f5f5] px-4 py-6 items-center">
            <CameraIcon size={20} color="#7210FF" />
            <Text className="text-[12px] text-ink mt-2">{beforeUrl ? 'Before — uploaded' : 'Before photo'}</Text>
          </Pressable>
          <Pressable onPress={() => void pick(setAfterUrl)} className="flex-1 rounded-2xl bg-[#f5f5f5] px-4 py-6 items-center">
            <CameraIcon size={20} color="#7210FF" />
            <Text className="text-[12px] text-ink mt-2">{afterUrl ? 'After — uploaded' : 'After photo'}</Text>
          </Pressable>
        </View>
        <Checkbox checked={isFeatured} onChange={setIsFeatured} label="Feature this project" />
      </View>
      {error && (
        <Text className="text-[13px] mt-3" style={{ color: '#DC2626' }}>
          {error}
        </Text>
      )}
      <View className="mt-5">
        <Button onPress={() => void save()} loading={saving}>
          Save
        </Button>
      </View>
    </View>
  )
}
