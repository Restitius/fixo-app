// Equipment — real /providers/me/equipment/* CRUD, ported from web-
// provider's now-real equipment.tsx. assigned_member_id/assign() reuse the
// same PROVIDER_TEAM_MEMBERS table/ACTIVE status Team.tsx uses. Retire is
// one-way and terminal — clears any assignment.
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
import { PlusIcon, ToolIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { equipmentApi, teamApi, type Equipment, type EquipmentCategory, type EquipmentCondition, type TeamMember } from '../lib/api-client'
import { fmtDate, humanize } from '../lib/format'

const CATEGORIES: EquipmentCategory[] = ['POWER_TOOL', 'VEHICLE', 'SAFETY_GEAR', 'DIAGNOSTIC', 'OTHER']
const CONDITIONS: EquipmentCondition[] = ['NEW', 'GOOD', 'FAIR', 'POOR']

function statusTone(s: string): 'success' | 'amber' | 'primary' | 'muted' {
  if (s === 'AVAILABLE') return 'success'
  if (s === 'IN_USE') return 'primary'
  if (s === 'MAINTENANCE') return 'amber'
  return 'muted'
}

export default function EquipmentScreen() {
  const { access_token, loading: authLoading } = useAuth()
  const [items, setItems] = useState<Equipment[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [assigning, setAssigning] = useState<Equipment | null>(null)
  const [retiring, setRetiring] = useState<Equipment | null>(null)
  const [busy, setBusy] = useState(false)

  function load() {
    return Promise.all([equipmentApi.list(undefined, undefined, 50, 0), teamApi.list('ACTIVE', undefined, 50, 0)]).then(([e, m]) => {
      setItems(e)
      setMembers(m)
    })
  }

  useEffect(() => {
    if (authLoading || !access_token) return
    load().finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  async function confirmRetire() {
    if (!retiring) return
    setBusy(true)
    try {
      await equipmentApi.retire(retiring.equipment_id)
      await load()
      setRetiring(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader
        title="Equipment"
        back="/(tabs)/profile"
        right={
          <Pressable onPress={() => setCreating(true)}>
            <PlusIcon size={20} color="#7210FF" />
          </Pressable>
        }
      />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && items.length === 0 && <Text className="text-[13px] text-muted mt-4">No equipment yet. Tap + to add one.</Text>}
        <View className="mt-2" style={{ gap: 10 }}>
          {items.map((e) => (
            <View key={e.equipment_id} className="rounded-2xl bg-[#f5f5f5] p-4">
              <View className="flex-row items-center gap-3">
                <View className="items-center justify-center rounded-2xl bg-primary/10" style={{ width: 40, height: 40 }}>
                  <ToolIcon size={18} color="#7210FF" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-[14px] font-semibold text-ink" numberOfLines={1}>
                    {e.name}
                  </Text>
                  <Text className="text-[12px] text-muted">
                    {humanize(e.category)} · {humanize(e.condition)}
                  </Text>
                </View>
                <StatusBadge label={e.status} tone={statusTone(e.status)} />
              </View>
              {e.serial_number && <Text className="text-[11px] text-muted mt-2">S/N {e.serial_number}</Text>}
              {e.purchase_date && <Text className="text-[11px] text-muted">Purchased {fmtDate(e.purchase_date)}</Text>}
              {e.status !== 'RETIRED' && (
                <View className="flex-row items-center justify-between mt-3">
                  <Pressable onPress={() => setAssigning(e)}>
                    <Text className="text-primary text-[12px] font-semibold">{e.assigned_member_name ? `Assigned: ${e.assigned_member_name}` : 'Assign to member'}</Text>
                  </Pressable>
                  {e.status !== 'MAINTENANCE' && (
                    <Pressable onPress={() => setRetiring(e)}>
                      <Text className="text-[12px] font-semibold" style={{ color: '#DC2626' }}>
                        Retire
                      </Text>
                    </Pressable>
                  )}
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

      <Sheet open={!!assigning} onClose={() => setAssigning(null)}>
        {assigning && (
          <AssignForm
            item={assigning}
            members={members}
            onSaved={async () => {
              setAssigning(null)
              await load()
            }}
          />
        )}
      </Sheet>

      <CenterModal open={!!retiring}>
        <Text className="text-[18px] font-bold text-ink">Retire {retiring?.name}?</Text>
        <Text className="text-[14px] text-muted mt-2 text-center">This can't be undone and clears any current assignment.</Text>
        <View className="flex-row gap-3 w-full mt-6">
          <View className="flex-1">
            <Button variant="outline" onPress={() => setRetiring(null)}>
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button onPress={() => void confirmRetire()} loading={busy}>
              Retire
            </Button>
          </View>
        </View>
      </CenterModal>
    </SafeAreaView>
  )
}

function CreateForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<EquipmentCategory>('OTHER')
  const [condition, setCondition] = useState<EquipmentCondition>('GOOD')
  const [serialNumber, setSerialNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setError(null)
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }
    setSaving(true)
    try {
      await equipmentApi.create({ name: name.trim(), category, condition, serial_number: serialNumber || undefined, notes: notes || undefined })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add equipment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View>
      <Text className="text-[18px] font-bold text-ink">Add equipment</Text>
      <View className="mt-4" style={{ gap: 12 }}>
        <Field label="Name">
          <TextInput className="rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink" value={name} onChangeText={setName} />
        </Field>
        <Select value={humanize(category)} onChange={(v) => setCategory(v.toUpperCase().replace(/ /g, '_') as EquipmentCategory)} options={CATEGORIES.map(humanize)} />
        <Select value={humanize(condition)} onChange={(v) => setCondition(v.toUpperCase() as EquipmentCondition)} options={CONDITIONS.map(humanize)} />
        <Field label="Serial number (optional)">
          <TextInput className="rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink" value={serialNumber} onChangeText={setSerialNumber} />
        </Field>
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
        <Button onPress={() => void save()} loading={saving}>
          Save
        </Button>
      </View>
    </View>
  )
}

function AssignForm({ item, members, onSaved }: { item: Equipment; members: TeamMember[]; onSaved: () => void }) {
  const [memberName, setMemberName] = useState(item.assigned_member_name ?? 'Unassigned')
  const [saving, setSaving] = useState(false)
  const options = ['Unassigned', ...members.map((m) => m.full_name)]

  async function save() {
    setSaving(true)
    try {
      const member = members.find((m) => m.full_name === memberName)
      await equipmentApi.assign(item.equipment_id, member ? member.member_id : null)
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <View>
      <Text className="text-[18px] font-bold text-ink">Assign {item.name}</Text>
      <View className="mt-4">
        <Select value={memberName} onChange={setMemberName} options={options} />
      </View>
      <View className="mt-5">
        <Button onPress={() => void save()} loading={saving}>
          Save
        </Button>
      </View>
    </View>
  )
}
