import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { ArrowLeftIcon, ImageIcon, SendIcon } from '../../../components/icons'
import { bookingApi, type BookingMessage, type BookingRow } from '../../../lib/api-client'
import { fmtDateTime } from '../../../lib/format'

export default function ChatDetail() {
  const { t } = useTranslation('services')
  const { chatId: bookingId = '' } = useLocalSearchParams<{ chatId: string }>()
  const [booking, setBooking] = useState<BookingRow | null>(null)
  const [messages, setMessages] = useState<BookingMessage[] | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    bookingApi.getBooking(bookingId).then(setBooking).catch(() => setBooking(null))
    bookingApi.listBookingMessages(bookingId).then((r) => setMessages(r.messages)).catch(() => setMessages([]))
  }, [bookingId])

  async function send() {
    if (!text.trim() || sending) return
    setSending(true)
    const body = text.trim()
    setText('')
    try {
      const sent = await bookingApi.sendBookingMessage(bookingId, body)
      setMessages((prev) => [...(prev ?? []), { message_id: sent.message_id, from_provider: false, body, created_at: new Date().toISOString() }])
    } catch {
      // leave the composer's text cleared; the message just won't appear
    } finally {
      setSending(false)
    }
  }

  if (!booking) return null

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-3 px-6 pt-3 pb-3 border-b border-hairline shrink-0">
        <Pressable onPress={() => router.replace('/(tabs)/inbox')} className="items-center justify-center size-7 shrink-0">
          <ArrowLeftIcon color="#0B111F" />
        </Pressable>
        <Text numberOfLines={1} className="font-bold text-ink text-[18px] flex-1">
          {booking.provider_name ?? t('chat.providerFallback')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 12 }}>
        {messages === null ? (
          <Text className="text-center text-muted text-[13px]">{t('chat.loading')}</Text>
        ) : messages.length === 0 ? (
          <Text className="text-center text-muted text-[13px] py-8">{t('chat.noMessages')}</Text>
        ) : (
          messages.map((m) => (
            <View key={m.message_id} className={`flex-row ${!m.from_provider ? 'justify-end' : 'justify-start'}`}>
              <View
                className={`rounded-2xl px-4 py-2.5 ${!m.from_provider ? 'bg-primary rounded-br-md' : 'bg-[#f5f5f5] rounded-bl-md'}`}
                style={{ maxWidth: '75%' }}
              >
                <Text className={`text-[14px] ${!m.from_provider ? 'text-white' : 'text-ink'}`}>{m.body}</Text>
                <Text className={`text-[10px] mt-1 ${!m.from_provider ? 'text-white/70' : 'text-muted'}`}>{fmtDateTime(m.created_at)}</Text>
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
          placeholder={t('chat.placeholder')}
          placeholderTextColor="#9e9e9e"
          className="flex-1 rounded-full bg-[#f5f5f5] px-5 py-3 text-[14px] text-ink"
        />
        <Pressable onPress={() => void send()} disabled={!text.trim() || sending} className="items-center justify-center size-11 rounded-full bg-primary shrink-0">
          <SendIcon size={16} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
