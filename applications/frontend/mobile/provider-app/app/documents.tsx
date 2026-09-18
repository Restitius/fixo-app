// Documents & Compliance — real /providers/verification/* endpoints,
// ported from web-provider's documents.tsx. Uses expo-image-picker for
// real on-device photo capture/selection against the shared /uploads
// endpoint (the web version used a browser file input for the same call).
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import ScreenHeader from '../components/ScreenHeader'
import MetricCard from '../components/MetricCard'
import StatusBadge from '../components/StatusBadge'
import Button from '../components/Button'
import Select from '../components/Select'
import Sheet from '../components/Sheet'
import { CameraIcon, ShieldCheckIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { onboardingApi, type VerificationDocType, type VerificationDocument, type VerificationStatus } from '../lib/api-client'
import { fmtDate, humanize } from '../lib/format'

export default function Documents() {
  const { access_token, loading: authLoading } = useAuth()
  const [docTypes, setDocTypes] = useState<VerificationDocType[]>([])
  const [documents, setDocuments] = useState<VerificationDocument[]>([])
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function load() {
    return Promise.all([onboardingApi.docTypes(), onboardingApi.documents(), onboardingApi.verificationStatus()]).then(([dt, docs, st]) => {
      setDocTypes(dt)
      setDocuments(docs)
      setStatus(st)
    })
  }

  useEffect(() => {
    if (authLoading || !access_token) return
    load().finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  async function withdraw(docId: string) {
    await onboardingApi.withdrawDocument(docId)
    await load()
  }

  async function submitForReview() {
    setSubmitting(true)
    try {
      await onboardingApi.submitVerification()
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  const verified = documents.filter((d) => d.status === 'VERIFIED').length
  const missing = status?.required_missing.length ?? 0

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader
        title="Documents"
        back="/(tabs)/profile"
        right={
          <Pressable onPress={() => setShowAdd(true)}>
            <CameraIcon size={20} color="#7210FF" />
          </Pressable>
        }
      />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && (
          <>
            <View className="flex-row mt-2" style={{ gap: 10 }}>
              <View className="flex-1">
                <MetricCard icon={ShieldCheckIcon} label="Verified" value={String(verified)} hint="Approved" tone="success" tintValue />
              </View>
              <View className="flex-1">
                <MetricCard icon={ShieldCheckIcon} label="Missing" value={String(missing)} hint="Required" tone="destructive" tintValue />
              </View>
            </View>

            <Text className="text-[15px] font-bold text-ink mt-6">Review status</Text>
            <Text className="text-[13px] text-ink mt-1">
              Status: <Text className="font-semibold">{status?.verification_status ?? 'NOT_SUBMITTED'}</Text>
            </Text>
            {status && status.required_missing.length > 0 && (
              <Text className="text-[12px] text-muted mt-1">
                Still needed: {status.required_missing.map((code) => docTypes.find((t) => t.code === code)?.name ?? humanize(code)).join(', ')}
              </Text>
            )}
            <View className="mt-3">
              <Button onPress={() => void submitForReview()} loading={submitting} disabled={missing > 0}>
                Submit for review
              </Button>
            </View>

            <Text className="text-[15px] font-bold text-ink mt-7">All documents</Text>
            <View className="mt-3" style={{ gap: 8 }}>
              {documents.length === 0 && <Text className="text-[13px] text-muted">No documents uploaded yet.</Text>}
              {documents.map((d) => (
                <View key={d.doc_id} className="rounded-2xl bg-[#f5f5f5] p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[13px] font-semibold text-ink">{docTypes.find((t) => t.code === d.doc_type)?.name ?? d.doc_type}</Text>
                    <StatusBadge status={d.status} />
                  </View>
                  <Text className="text-[12px] text-muted mt-0.5">{d.doc_number ?? '—'}</Text>
                  {d.status !== 'VERIFIED' && (
                    <Pressable onPress={() => void withdraw(d.doc_id)} className="mt-2 self-start">
                      <Text className="text-[12px] font-semibold" style={{ color: '#DC2626' }}>
                        Withdraw
                      </Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>

            <Text className="text-[15px] font-bold text-ink mt-7 mb-2">Document types</Text>
            <View style={{ gap: 4 }}>
              {docTypes.map((t) => (
                <View key={t.code} className="flex-row items-center justify-between py-1">
                  <Text className="text-[13px] text-muted">{t.name}</Text>
                  {t.is_required && (
                    <Text className="text-[11px] font-semibold" style={{ color: '#DC2626' }}>
                      Required
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Sheet open={showAdd} onClose={() => setShowAdd(false)}>
        <UploadForm
          docTypes={docTypes}
          onSaved={async () => {
            setShowAdd(false)
            await load()
          }}
        />
      </Sheet>
    </SafeAreaView>
  )
}

function UploadForm({ docTypes, onSaved }: { docTypes: VerificationDocType[]; onSaved: () => void }) {
  const [docType, setDocType] = useState(docTypes[0]?.name ?? '')
  const [docNumber, setDocNumber] = useState('')
  const [frontUri, setFrontUri] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pickFront() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      setError('Photo library permission is required')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
    if (!result.canceled && result.assets[0]) setFrontUri(result.assets[0].uri)
  }

  async function save() {
    setError(null)
    if (!docType || !frontUri) {
      setError('Select a document type and choose a front image')
      return
    }
    setSaving(true)
    try {
      const front = await onboardingApi.uploadFile({ uri: frontUri, name: 'document.jpg', type: 'image/jpeg' })
      const code = docTypes.find((t) => t.name === docType)?.code ?? docType
      await onboardingApi.addDocument({
        doc_type: code,
        front_image_url: front.url,
        doc_number: docNumber || undefined,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload document')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View>
      <Text className="text-[18px] font-bold text-ink">Upload document</Text>
      <View className="mt-4" style={{ gap: 12 }}>
        <Select value={docType} onChange={setDocType} options={docTypes.map((t) => t.name)} />
        <TextInput className="rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink" placeholder="Document number (optional)" value={docNumber} onChangeText={setDocNumber} />
        <Pressable onPress={() => void pickFront()} className="rounded-2xl bg-[#f5f5f5] px-4 py-3.5 flex-row items-center gap-2">
          <CameraIcon size={18} color="#7210FF" />
          <Text className="text-[14px] text-ink">{frontUri ? 'Photo selected' : 'Choose front image'}</Text>
        </Pressable>
      </View>
      {error && (
        <Text className="text-[13px] mt-3" style={{ color: '#DC2626' }}>
          {error}
        </Text>
      )}
      <View className="mt-5">
        <Button onPress={() => void save()} loading={saving}>
          Upload
        </Button>
      </View>
    </View>
  )
}
