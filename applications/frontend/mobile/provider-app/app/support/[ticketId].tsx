// Support ticket thread — real /providers/me/support/tickets/{id}/messages,
// structurally mirrored on app/messages/[bookingId].tsx so both chat-style
// threads in this app match. Respects the real "closed tickets reject new
// messages" (409) constraint by disabling the composer when status is
// CLOSED, rather than letting a doomed send silently fail.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeftIcon, SendIcon } from '../../components/icons'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../lib/auth-context'
import { supportApi, type SupportMessage } from '../../lib/api-client'
import { fmtDateTime } from '../../lib/format'

export default function SupportThread() {
  const { access_token, loading: authLoading } = useAuth()
  const { ticketId = '', subject = '', status = '' } = useLocalSearchParams<{ ticketId: string; subject?: string; status?: string }>()
  const [messages, setMessages] = useState<SupportMessage[] | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const closed = status === 'CLOSED'

  useEffect(() => {
    if (authLoading || !access_token || !ticketId) return
    supportApi
      .listMessages(ticketId, 100, 0)
      .then(setMessages)
      .catch(() => setMessages([]))
  }, [authLoading, access_token, ticketId])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  async function send() {
    if (!text.trim() || sending || closed) return
    setSending(true)
    const body = text.trim()
    setText('')
    try {
      const sent = await supportApi.addMessage(ticketId, body)
      setMessages((prev) => [...(prev ?? []), sent])
    } catch {
      // leave the composer cleared; the message just won't appear
    } finally {
      setSending(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-3 px-6 pt-3 pb-3 border-b border-hairline shrink-0">
        <Pressable onPress={() => router.replace('/support' as any)} className="items-center justify-center size-7 shrink-0">
          <ArrowLeftIcon color="#0B111F" />
        </Pressable>
        <Text numberOfLines={1} className="font-bold text-ink text-[16px] flex-1">
          {subject || 'Ticket'}
        </Text>
        {!!status && <StatusBadge label={status} tone={closed ? 'muted' : 'amber'} />}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 12 }}>
        {messages === null ? (
          <Text className="text-center text-muted text-[13px]">Loading…</Text>
        ) : messages.length === 0 ? (
          <Text className="text-center text-muted text-[13px] py-8">No messages yet.</Text>
        ) : (
          messages.map((m) => (
            <View key={m.message_id} className={`flex-row ${m.sender === 'PROVIDER' ? 'justify-end' : 'justify-start'}`}>
              <View className={`rounded-2xl px-4 py-2.5 ${m.sender === 'PROVIDER' ? 'bg-primary rounded-br-md' : 'bg-[#f5f5f5] rounded-bl-md'}`} style={{ maxWidth: '75%' }}>
                <Text className={`text-[14px] ${m.sender === 'PROVIDER' ? 'text-white' : 'text-ink'}`}>{m.body}</Text>
                <Text className={`text-[10px] mt-1 ${m.sender === 'PROVIDER' ? 'text-white/70' : 'text-muted'}`}>{fmtDateTime(m.created_at)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View className="flex-row items-center gap-3 px-6 py-3 border-t border-hairline shrink-0">
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => void send()}
          editable={!closed}
          placeholder={closed ? 'This ticket is closed' : 'Write a message…'}
          placeholderTextColor="#9e9e9e"
          className="flex-1 rounded-full bg-[#f5f5f5] px-5 py-3 text-[14px] text-ink"
          style={{ opacity: closed ? 0.5 : 1 }}
        />
        <Pressable onPress={() => void send()} disabled={closed || !text.trim() || sending} className="items-center justify-center size-11 rounded-full bg-primary shrink-0" style={{ opacity: closed || !text.trim() || sending ? 0.5 : 1 }}>
          <SendIcon size={16} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
