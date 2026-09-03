import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from '../../../../components/Avatar'
import { ArrowLeftIcon, SendIcon } from '../../../../components/icons'
import { fixoSdk, type SupportTicket, type TicketMessage } from '../../../../lib/api-client'

// Real support tickets — the first message opens a real ticket
// (GENERAL/MEDIUM, matching web's contact-support default), subsequent
// messages append to it via the real ticket-messages endpoint.
export default function SupportChat() {
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fixoSdk.listTickets(1, 0).then((tickets) => {
      const open = tickets.find((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED')
      if (open) {
        setTicket(open)
        fixoSdk.listTicketMessages(open.ticket_id).then(setMessages).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  async function send() {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    setText('')
    try {
      let active = ticket
      if (!active) {
        active = await fixoSdk.createTicket('Support request from mobile app', 'GENERAL', 'MEDIUM')
        setTicket(active)
      }
      const sent = await fixoSdk.addTicketMessage(active.ticket_id, body)
      setMessages((prev) => [...prev, sent])
    } catch {
      // leave the composer's text cleared; the message just won't appear
    } finally {
      setSending(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-3 px-6 pt-3 pb-3 border-b border-hairline shrink-0">
        <Pressable onPress={() => router.replace('/profile/help/contact')} className="items-center justify-center size-7">
          <ArrowLeftIcon color="#0B111F" />
        </Pressable>
        <Avatar label="CS" size={40} />
        <View className="flex-1 min-w-0">
          <Text numberOfLines={1} className="font-bold text-ink text-[15px]">FIXO Support</Text>
          <Text className="text-[12px] text-muted">{ticket ? `Ticket ${ticket.ticket_number}` : 'Send a message to open a ticket'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 12 }}>
        {messages.length === 0 && (
          <View className="items-center py-8">
            <Text className="text-[13px] text-muted text-center">Describe your issue below and our support team will reply here.</Text>
          </View>
        )}
        {messages.map((m) => (
          <View key={m.message_id} className={`flex-row ${m.sender === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}>
            <View className={`rounded-2xl px-4 py-2.5 ${m.sender === 'CUSTOMER' ? 'bg-primary rounded-br-md' : 'bg-[#f5f5f5] rounded-bl-md'}`} style={{ maxWidth: '75%' }}>
              <Text className={`text-[14px] ${m.sender === 'CUSTOMER' ? 'text-white' : 'text-ink'}`}>{m.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="flex-row items-center gap-3 px-6 py-3 border-t border-hairline shrink-0">
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => void send()}
          placeholder="Describe your issue..."
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
