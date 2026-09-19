// Message thread for one booking — real /providers/me/bookings/{id}/messages
// conversation, ported from web-provider's messages.tsx (its right-hand
// panel) and structurally mirrored on user-app's own inbox/chat/[chatId].tsx
// so both apps' chat UIs match. Web's Phone/Report buttons have no onClick
// on web either (decorative, no real action behind them) — dropped here
// too rather than fabricating functionality that doesn't exist. Same for
// the attach-image button: kept visually (matches user-app) but inert.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeftIcon, ImageIcon, SendIcon } from '../../components/icons'
import { useAuth } from '../../lib/auth-context'
import { fixoSdk, type ProviderMessage } from '../../lib/api-client'
import { fmtDateTime } from '../../lib/format'

export default function MessageThread() {
  const { access_token, loading: authLoading } = useAuth()
  const { bookingId = '', customerName = '', bookingNumber = '' } = useLocalSearchParams<{ bookingId: string; customerName?: string; bookingNumber?: string }>()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ProviderMessage[] | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (authLoading || !access_token || !bookingId) return
    fixoSdk
      .getConversation(bookingId)
      .then((conv) => {
        setConversationId(conv.conversation_id)
        return fixoSdk.listMessages(bookingId, conv.conversation_id)
      })
      .then((msgs) => setMessages(msgs ?? []))
      .catch(() => setMessages([]))
  }, [authLoading, access_token, bookingId])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  async function send() {
    if (!text.trim() || sending || !conversationId) return
    setSending(true)
    const body = text.trim()
    setText('')
    try {
      const sent = await fixoSdk.sendMessage(bookingId, conversationId, body)
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
        <Pressable onPress={() => router.replace('/messages' as any)} className="items-center justify-center size-7 shrink-0">
          <ArrowLeftIcon color="#0B111F" />
        </Pressable>
        <View className="flex-1 min-w-0">
          <Text numberOfLines={1} className="font-bold text-ink text-[16px]">
            {customerName || '—'}
          </Text>
          {!!bookingNumber && (
            <Text numberOfLines={1} className="text-[12px] text-muted">
              Booking #{bookingNumber}
            </Text>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 12 }}>
        {messages === null ? (
          <Text className="text-center text-muted text-[13px]">Loading…</Text>
        ) : messages.length === 0 ? (
          <Text className="text-center text-muted text-[13px] py-8">No messages yet. Say hello.</Text>
        ) : (
          messages.map((m) => (
            <View key={m.message_id} className={`flex-row ${m.sender_role === 'PROVIDER' ? 'justify-end' : 'justify-start'}`}>
              <View className={`rounded-2xl px-4 py-2.5 ${m.sender_role === 'PROVIDER' ? 'bg-primary rounded-br-md' : 'bg-[#f5f5f5] rounded-bl-md'}`} style={{ maxWidth: '75%' }}>
                <Text className={`text-[14px] ${m.sender_role === 'PROVIDER' ? 'text-white' : 'text-ink'}`}>{m.body}</Text>
                <Text className={`text-[10px] mt-1 ${m.sender_role === 'PROVIDER' ? 'text-white/70' : 'text-muted'}`}>{fmtDateTime(m.created_at)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View className="flex-row items-center gap-3 px-6 py-3 border-t border-hairline shrink-0">
        <Pressable className="items-center justify-center size-9 shrink-0">
          <ImageIcon size={20} color="#6C7585" />
        </Pressable>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => void send()}
          placeholder="Write a message…"
          placeholderTextColor="#9e9e9e"
          className="flex-1 rounded-full bg-[#f5f5f5] px-5 py-3 text-[14px] text-ink"
        />
        <Pressable onPress={() => void send()} disabled={!text.trim() || sending} className="items-center justify-center size-11 rounded-full bg-primary shrink-0" style={{ opacity: !text.trim() || sending ? 0.5 : 1 }}>
          <SendIcon size={16} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
