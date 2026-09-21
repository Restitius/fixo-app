// Team — real /providers/me/team/* CRUD, ported from web-provider's now-
// real team.tsx. Same honest scope: only the real member roster (no jobs/
// rating fields, no job-assignment or equipment panels — those need
// entirely different, unexplored backend domains).
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import Button from '../components/Button'
import Field from '../components/Field'
import Select from '../components/Select'
import StatusBadge from '../components/StatusBadge'
import Sheet, { CenterModal } from '../components/Sheet'
import { PlusIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { teamApi, type TeamMember, type TeamRole } from '../lib/api-client'
import { humanize } from '../lib/format'

const fieldCls = 'rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink'

const ROLES: { role: TeamRole; description: string }[] = [
  { role: 'OWNER', description: 'Full account access' },
  { role: 'MANAGER', description: 'Manage jobs, team and pricing' },
  { role: 'DISPATCHER', description: 'Requests, bookings and assignment' },
  { role: 'TECHNICIAN', description: 'Assigned jobs only' },
  { role: 'OTHER', description: 'Custom / unlisted role' },
]

export default function Team() {
  const { access_token, loading: authLoading } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TeamMember | 'new' | null>(null)
  const [deactivating, setDeactivating] = useState<TeamMember | null>(null)
  const [busy, setBusy] = useState(false)

  function load() {
    return teamApi.list(undefined, undefined, 50, 0).then(setMembers)
  }

  useEffect(() => {
    if (authLoading || !access_token) return
    load().finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  async function confirmDeactivate() {
    if (!deactivating) return
    setBusy(true)
    try {
      await teamApi.deactivate(deactivating.member_id)
      await load()
      setDeactivating(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader
        title="Team"
        back="/(tabs)/profile"
        right={
          <Pressable onPress={() => setEditing('new')}>
            <PlusIcon size={20} color="#7210FF" />
          </Pressable>
        }
      />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && members.length === 0 && <Text className="text-[13px] text-muted mt-4">No team members yet. Tap + to add one.</Text>}
        <View className="mt-2" style={{ gap: 10 }}>
          {members.map((m) => (
            <View key={m.member_id} className="rounded-2xl bg-[#f5f5f5] p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-[14px] font-semibold text-ink">{m.full_name}</Text>
                <StatusBadge label={m.status} tone={m.status === 'ACTIVE' ? 'success' : 'muted'} />
              </View>
              <Text className="text-[12px] text-muted mt-0.5">
                {humanize(m.role)} · {m.phone}
              </Text>
              <View className="flex-row gap-4 mt-2">
                <Pressable onPress={() => setEditing(m)}>
                  <Text className="text-primary text-[12px] font-semibold">Edit</Text>
                </Pressable>
                {m.status === 'ACTIVE' && (
                  <Pressable onPress={() => setDeactivating(m)}>
                    <Text className="text-[12px] font-semibold" style={{ color: '#DC2626' }}>
                      Deactivate
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>

        <Text className="text-[15px] font-bold text-ink mt-7 mb-2">Roles</Text>
        <View style={{ gap: 6 }}>
          {ROLES.map((r) => (
            <Text key={r.role} className="text-[13px] text-muted">
              <Text className="font-semibold text-ink">{humanize(r.role)}</Text> — {r.description}
            </Text>
          ))}
        </View>
      </ScrollView>

      <Sheet open={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <EditForm
            member={editing === 'new' ? null : editing}
            onSaved={async () => {
              setEditing(null)
              await load()
            }}
          />
        )}
      </Sheet>

      <CenterModal open={!!deactivating}>
        <Text className="text-[18px] font-bold text-ink">Deactivate {deactivating?.full_name}?</Text>
        <Text className="text-[14px] text-muted mt-2 text-center">This can't be undone from here.</Text>
        <View className="flex-row gap-3 w-full mt-6">
          <View className="flex-1">
            <Button variant="outline" onPress={() => setDeactivating(null)}>
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={() => void confirmDeactivate()} loading={busy}>
              Deactivate
            </Button>
          </View>
        </View>
      </CenterModal>
    </SafeAreaView>
  )
}

function EditForm({ member, onSaved }: { member: TeamMember | null; onSaved: () => void }) {
  const [fullName, setFullName] = useState(member?.full_name ?? '')
  const [phone, setPhone] = useState(member?.phone ?? '')
  const [email, setEmail] = useState(member?.email ?? '')
  const [role, setRole] = useState<TeamRole>(member?.role ?? 'TECHNICIAN')
  const [notes, setNotes] = useState(member?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setError(null)
    if (fullName.trim().length < 2) {
      setError('Full name must be at least 2 characters')
      return
    }
    if (!phone.trim()) {
      setError('Phone is required')
      return
    }
    setSaving(true)
    try {
      const data = { full_name: fullName.trim(), phone: phone.trim(), email: email || undefined, role, notes: notes || undefined }
      if (member) await teamApi.update(member.member_id, data)
      else await teamApi.create(data)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save team member')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View>
      <Text className="text-[18px] font-bold text-ink">{member ? 'Edit team member' : 'Add team member'}</Text>
      <View className="mt-4" style={{ gap: 12 }}>
        <Field label="Full name">
          <TextInput className={fieldCls} value={fullName} onChangeText={setFullName} />
        </Field>
        <Field label="Phone">
          <TextInput className={fieldCls} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </Field>
        <Field label="Email (optional)">
          <TextInput className={fieldCls} value={email ?? ''} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </Field>
        <Select value={humanize(role)} onChange={(v) => setRole(v.toUpperCase().replace(/ /g, '_') as TeamRole)} options={ROLES.map((r) => humanize(r.role))} />
        <Field label="Notes (optional)">
          <TextInput className={fieldCls} value={notes ?? ''} onChangeText={setNotes} multiline numberOfLines={2} />
        </Field>
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
