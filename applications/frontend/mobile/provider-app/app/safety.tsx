// Safety — real /providers/me/safety/* endpoints, ported from web-
// provider's now-real safety.tsx. Create + list + escalate; resolution is
// platform-side. Reads the ?urgent=1 param Support's "Report unsafe site"
// button passes, mirroring web's validateSearch pre-fill.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import Button from '../components/Button'
import Select from '../components/Select'
import StatusBadge from '../components/StatusBadge'
import { CenterModal } from '../components/Sheet'
import { ShieldIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { safetyApi, type SafetyCategory, type SafetyReport, type SafetySeverity } from '../lib/api-client'
import { fmtDateTime, humanize } from '../lib/format'

const fieldCls = 'rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink'
const CATEGORIES: SafetyCategory[] = ['UNSAFE_CUSTOMER', 'PROPERTY_HAZARD', 'INJURY', 'HARASSMENT', 'OTHER']
const SEVERITIES: SafetySeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export default function Safety() {
  const { access_token, loading: authLoading } = useAuth()
  const { urgent } = useLocalSearchParams<{ urgent?: string }>()
  const [reports, setReports] = useState<SafetyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<SafetyCategory>(urgent === '1' ? 'UNSAFE_CUSTOMER' : 'OTHER')
  const [severity, setSeverity] = useState<SafetySeverity>(urgent === '1' ? 'HIGH' : 'LOW')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openReport, setOpenReport] = useState<SafetyReport | null>(null)

  function load() {
    return safetyApi.listReports(undefined, undefined, 50, 0).then(setReports)
  }

  useEffect(() => {
    if (authLoading || !access_token) return
    load().finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  async function submit() {
    setError(null)
    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters')
      return
    }
    setSubmitting(true)
    try {
      await safetyApi.createReport({ category, severity, description: description.trim() })
      setDescription('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit report')
    } finally {
      setSubmitting(false)
    }
  }

  async function escalate() {
    if (!openReport) return
    try {
      await safetyApi.escalate(openReport.report_id)
      await load()
      setOpenReport(null)
    } catch {
      // leave the modal open; the user can retry
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Safety" back="/(tabs)/profile" />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className="text-[15px] font-bold text-ink mt-2 mb-3">Your reports</Text>
        {!loading && reports.length === 0 && <Text className="text-[13px] text-muted">No safety reports yet.</Text>}
        <View style={{ gap: 8 }}>
          {reports.map((r) => (
            <Pressable key={r.report_id} onPress={() => setOpenReport(r)} className="rounded-2xl bg-[#f5f5f5] p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] font-semibold text-ink">{r.report_number}</Text>
                <View className="flex-row" style={{ gap: 6 }}>
                  <StatusBadge label={r.severity} tone={r.severity === 'CRITICAL' || r.severity === 'HIGH' ? 'destructive' : 'amber'} />
                  <StatusBadge label={r.status} tone={r.status === 'ESCALATED' ? 'primary' : 'muted'} />
                </View>
              </View>
              <Text className="text-[11px] text-muted mt-1">
                {humanize(r.category)} · {fmtDateTime(r.created_at)}
              </Text>
              <Text numberOfLines={2} className="text-[13px] text-muted mt-2">
                {r.description}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-[15px] font-bold text-ink mt-7 mb-3">New safety report</Text>
        <View style={{ gap: 12 }}>
          <Select value={humanize(category)} onChange={(v) => setCategory(v.toUpperCase().replace(/ /g, '_') as SafetyCategory)} options={CATEGORIES.map(humanize)} />
          <Select value={humanize(severity)} onChange={(v) => setSeverity(v.toUpperCase() as SafetySeverity)} options={SEVERITIES.map(humanize)} />
          <TextInput className={fieldCls} value={description} onChangeText={setDescription} placeholder="Describe what happened (min 10 characters)" placeholderTextColor="#9e9e9e" multiline numberOfLines={5} />
        </View>
        {error && (
          <Text className="text-[13px] mt-3" style={{ color: '#DC2626' }}>
            {error}
          </Text>
        )}
        <View className="mt-4 flex-row items-center justify-center gap-2">
          <View className="flex-1">
            <Button onPress={() => void submit()} loading={submitting}>
              Submit report
            </Button>
          </View>
        </View>
        <Text className="text-[12px] text-muted mt-3">Reports are reviewed by the FIXO safety team. You can escalate an open report if it needs urgent attention.</Text>
      </ScrollView>

      <CenterModal open={!!openReport}>
        {openReport && (
          <>
            <ShieldIcon size={28} color="#7210FF" />
            <Text className="text-[18px] font-bold text-ink mt-3">{openReport.report_number}</Text>
            <View className="flex-row mt-2" style={{ gap: 6 }}>
              <StatusBadge label={openReport.severity} tone={openReport.severity === 'CRITICAL' || openReport.severity === 'HIGH' ? 'destructive' : 'amber'} />
              <StatusBadge label={openReport.status} tone={openReport.status === 'ESCALATED' ? 'primary' : 'muted'} />
            </View>
            <Text className="text-[13px] text-muted mt-3 text-center">{openReport.description}</Text>
            <View className="flex-row gap-3 w-full mt-6">
              <View className="flex-1">
                <Button variant="outline" onPress={() => setOpenReport(null)}>
                  Close
                </Button>
              </View>
              {(openReport.status === 'OPEN' || openReport.status === 'UNDER_REVIEW') && (
                <View className="flex-1">
                  <Button onPress={() => void escalate()}>Escalate</Button>
                </View>
              )}
            </View>
          </>
        )}
      </CenterModal>
    </SafeAreaView>
  )
}
