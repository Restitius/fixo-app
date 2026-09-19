// Support — real /providers/me/support/* tickets, ported from web-
// provider's now-real support.tsx. Real category/priority vocabularies
// (not the invented Payment/Dispute/Verification/Safety categories a mock
// would show). Creating a ticket is two real calls: create (subject/
// category/priority only) then an optional first message, since the real
// CreateTicketRequest has no description field of its own.
import { useEffect, useState } from 'react'
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import Button from '../components/Button'
import Field from '../components/Field'
import Select from '../components/Select'
import StatusBadge from '../components/StatusBadge'
import { PhoneIcon, ShieldIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { supportApi, type SupportTicket, type TicketCategory, type TicketPriority } from '../lib/api-client'
import { fmtDateTime, humanize } from '../lib/format'

const fieldCls = 'rounded-2xl bg-[#f5f5f5] px-4 py-3.5 text-[15px] text-ink'
const CATEGORIES: TicketCategory[] = ['GENERAL', 'BILLING', 'ACCOUNT', 'TECHNICAL', 'BOOKING', 'PAYOUT', 'OTHER']
const PRIORITIES: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export default function Support() {
  const { access_token, loading: authLoading } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState<TicketCategory>('GENERAL')
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM')
  const [firstMessage, setFirstMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function load() {
    return supportApi.listTickets(50, 0).then(setTickets)
  }

  useEffect(() => {
    if (authLoading || !access_token) return
    load().finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  async function submitTicket() {
    setError(null)
    if (subject.trim().length < 3) {
      setError('Subject must be at least 3 characters')
      return
    }
    setSubmitting(true)
    try {
      const ticket = await supportApi.createTicket({ subject: subject.trim(), category, priority })
      if (firstMessage.trim()) await supportApi.addMessage(ticket.ticket_id, firstMessage.trim())
      setSubject('')
      setFirstMessage('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit ticket')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Support" back="/(tabs)/profile" />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-row" style={{ gap: 10 }}>
          <Pressable onPress={() => router.push('/safety?urgent=1' as any)} className="flex-1 rounded-2xl bg-[#f5f5f5] p-4">
            <ShieldIcon size={20} color="#7210FF" />
            <Text className="text-[13px] font-semibold text-ink mt-2">Report unsafe site</Text>
            <Text className="text-[11px] text-muted mt-0.5">Opens a real safety report</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('tel:+255800110220')} className="flex-1 rounded-2xl bg-[#f5f5f5] p-4">
            <PhoneIcon size={20} color="#7210FF" />
            <Text className="text-[13px] font-semibold text-ink mt-2">Call hotline</Text>
            <Text className="text-[11px] text-muted mt-0.5">+255 800 110 220</Text>
          </Pressable>
        </View>

        <Text className="text-[15px] font-bold text-ink mt-7 mb-3">Your tickets</Text>
        {!loading && tickets.length === 0 && <Text className="text-[13px] text-muted">No tickets yet.</Text>}
        <View style={{ gap: 8 }}>
          {tickets.map((t) => (
            <Pressable key={t.ticket_id} onPress={() => router.push({ pathname: '/support/[ticketId]', params: { ticketId: t.ticket_id, subject: t.subject, status: t.status } } as any)} className="rounded-2xl bg-[#f5f5f5] p-3.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px] font-semibold text-ink flex-1" numberOfLines={1}>
                  {t.subject}
                </Text>
                <StatusBadge label={t.status} tone={t.status === 'CLOSED' ? 'muted' : 'amber'} />
              </View>
              <Text className="text-[11px] text-muted mt-1">
                {t.ticket_number} · {humanize(t.category)} · {fmtDateTime(t.updated_at)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-[15px] font-bold text-ink mt-7 mb-3">New support ticket</Text>
        <View style={{ gap: 12 }}>
          <Select value={humanize(category)} onChange={(v) => setCategory(v.toUpperCase().replace(/ /g, '_') as TicketCategory)} options={CATEGORIES.map(humanize)} />
          <Select value={humanize(priority)} onChange={(v) => setPriority(v.toUpperCase() as TicketPriority)} options={PRIORITIES.map(humanize)} />
          <Field label="Subject">
            <TextInput className={fieldCls} value={subject} onChangeText={setSubject} />
          </Field>
          <Field label="Describe the issue (optional)">
            <TextInput className={fieldCls} value={firstMessage} onChangeText={setFirstMessage} multiline numberOfLines={4} />
          </Field>
        </View>
        {error && (
          <Text className="text-[13px] mt-3" style={{ color: '#DC2626' }}>
            {error}
          </Text>
        )}
        <View className="mt-4">
          <Button onPress={() => void submitTicket()} loading={submitting}>
            Submit ticket
          </Button>
        </View>

        <Text className="text-[15px] font-bold text-ink mt-7 mb-2">Contact</Text>
        <Text className="text-[13px] text-muted">providers@fixo.co.tz</Text>
        <Text className="text-[13px] text-muted mt-1">+255 800 110 220 · 24/7 for active jobs</Text>
      </ScrollView>
    </SafeAreaView>
  )
}
