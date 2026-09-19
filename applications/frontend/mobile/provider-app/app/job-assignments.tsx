// Job Assignments — real /providers/me/job-assignments/* endpoints, ported
// from web-provider's now-real job-assignments.tsx. Both booking and
// member must belong to the calling provider, and the member must be
// ACTIVE — same PROVIDER_TEAM_MEMBERS table/status Team.tsx uses.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import Button from '../components/Button'
import Field from '../components/Field'
import Select from '../components/Select'
import StatusBadge from '../components/StatusBadge'
import Sheet from '../components/Sheet'
import { PlusIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { bookingsApi, jobAssignmentsApi, teamApi, type BookingFeedRow, type JobAssignment, type JobAssignmentStatus, type TeamMember } from '../lib/api-client'
import { fmtDateTime } from '../lib/format'

function statusTone(s: JobAssignmentStatus): 'success' | 'amber' | 'primary' | 'muted' {
  if (s === 'COMPLETED') return 'success'
  if (s === 'CANCELLED') return 'muted'
  if (s === 'IN_PROGRESS' || s === 'ACKNOWLEDGED') return 'primary'
  return 'amber'
}

export default function JobAssignments() {
  const { access_token, loading: authLoading } = useAuth()
  const [assignments, setAssignments] = useState<JobAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  function load() {
    return jobAssignmentsApi.list(undefined, undefined, 50, 0).then(setAssignments)
  }

  useEffect(() => {
    if (authLoading || !access_token) return
    load().finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  async function nextStatus(a: JobAssignment) {
    const order: JobAssignmentStatus[] = ['ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED']
    const idx = order.indexOf(a.status)
    if (idx === -1 || idx === order.length - 1) return
    try {
      await jobAssignmentsApi.update(a.assignment_id, { status: order[idx + 1] })
      await load()
    } catch {
      // leave the list as-is; the user can retry
    }
  }

  async function cancel(a: JobAssignment) {
    try {
      await jobAssignmentsApi.cancel(a.assignment_id)
      await load()
    } catch {
      // leave the list as-is; the user can retry
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader
        title="Job Assignments"
        back="/(tabs)/profile"
        right={
          <Pressable onPress={() => setCreating(true)}>
            <PlusIcon size={20} color="#7210FF" />
          </Pressable>
        }
      />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && assignments.length === 0 && <Text className="text-[13px] text-muted mt-4">No job assignments yet. Tap + to assign a booking.</Text>}
        <View className="mt-2" style={{ gap: 10 }}>
          {assignments.map((a) => (
            <View key={a.assignment_id} className="rounded-2xl bg-[#f5f5f5] p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-[14px] font-semibold text-ink">#{a.booking_number}</Text>
                <StatusBadge label={a.status} tone={statusTone(a.status)} />
              </View>
              <Text className="text-[12px] text-muted mt-0.5">
                {a.member_name} · {fmtDateTime(a.assigned_at)}
              </Text>
              {a.status !== 'COMPLETED' && a.status !== 'CANCELLED' && (
                <View className="flex-row gap-4 mt-2">
                  <Pressable onPress={() => void nextStatus(a)}>
                    <Text className="text-primary text-[12px] font-semibold">Advance status</Text>
                  </Pressable>
                  <Pressable onPress={() => void cancel(a)}>
                    <Text className="text-[12px] font-semibold" style={{ color: '#DC2626' }}>
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <Sheet open={creating} onClose={() => setCreating(false)}>
        <CreateForm
          onSaved={async () => {
            setCreating(false)
            await load()
          }}
        />
      </Sheet>
    </SafeAreaView>
  )
}

function CreateForm({ onSaved }: { onSaved: () => void }) {
  const [bookings, setBookings] = useState<BookingFeedRow[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [bookingLabel, setBookingLabel] = useState('')
  const [memberName, setMemberName] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    bookingsApi.feed(undefined, 50, 0).then(setBookings)
    teamApi.list('ACTIVE', undefined, 50, 0).then(setMembers)
  }, [])

  async function save() {
    setError(null)
    const booking = bookings.find((b) => `${b.booking_number} · ${b.service_name}` === (bookingLabel || `${bookings[0]?.booking_number} · ${bookings[0]?.service_name}`))
    const member = members.find((m) => m.full_name === (memberName || members[0]?.full_name))
    if (!booking || !member) {
      setError('Select a booking and a team member')
      return
    }
    setSaving(true)
    try {
      await jobAssignmentsApi.create({ booking_id: booking.booking_id, member_id: member.member_id, notes: notes || undefined })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create assignment')
    } finally {
      setSaving(false)
    }
  }

  const bookingOptions = bookings.map((b) => `${b.booking_number} · ${b.service_name}`)
  const memberOptions = members.map((m) => m.full_name)

  return (
    <View>
      <Text className="text-[18px] font-bold text-ink">Assign a booking</Text>
      <Text className="text-[12px] text-muted mt-1">Only your active team members can be assigned.</Text>
      <View className="mt-4" style={{ gap: 12 }}>
        {bookings.length === 0 ? (
          <Text className="text-[13px] text-muted">No bookings yet.</Text>
        ) : (
          <Select value={bookingLabel || bookingOptions[0]!} onChange={setBookingLabel} options={bookingOptions} />
        )}
        {members.length === 0 ? (
          <Text className="text-[13px] text-muted">No active team members yet — add one from Team first.</Text>
        ) : (
          <Select value={memberName || memberOptions[0]!} onChange={setMemberName} options={memberOptions} />
        )}
        <Field label="Notes (optional)">
          <TextInput className="rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink" value={notes} onChangeText={setNotes} multiline numberOfLines={2} />
        </Field>
      </View>
      {error && (
        <Text className="text-[13px] mt-3" style={{ color: '#DC2626' }}>
          {error}
        </Text>
      )}
      <View className="mt-5">
        <Button onPress={() => void save()} loading={saving} disabled={bookings.length === 0 || members.length === 0}>
          Assign
        </Button>
      </View>
    </View>
  )
}
