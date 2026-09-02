import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeftIcon, ImageIcon, MicIcon, MoreHorizontalIcon, PhoneIcon, SendIcon } from '../../../components/icons'
import { chatById, providerById, type ChatMessage } from '../../../data/mock'

export default function ChatDetail() {
  const { chatId = '' } = useLocalSearchParams<{ chatId: string }>()
  const chat = chatById(chatId)
  const provider = chat ? providerById(chat.providerId) : undefined
  const [messages, setMessages] = useState<ChatMessage[]>(chat?.messages ?? [])
  const [text, setText] = useState('')

  if (!chat || !provider) return null

  function send() {
    if (!text.trim()) return
    setMessages((m) => [...m, { id: `local-${m.length}`, fromMe: true, text: text.trim(), time: 'Now' }])
    setText('')
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-3 px-6 pt-3 pb-3 border-b border-hairline shrink-0">
        <Pressable onPress={() => router.replace('/(tabs)/inbox')} className="items-center justify-center size-7 shrink-0">
          <ArrowLeftIcon color="#0B111F" />
        </Pressable>
        <Text numberOfLines={1} className="font-bold text-ink text-[18px] flex-1">
          {provider.name}
        </Text>
        <Pressable onPress={() => router.push(`/inbox/call/${provider.id}` as any)} className="items-center justify-center size-9 shrink-0">
          <PhoneIcon size={20} color="#0B111F" />
        </Pressable>
        <Pressable className="items-center justify-center size-9 shrink-0">
          <MoreHorizontalIcon size={20} color="#0B111F" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 12 }}>
        <View className="items-center">
          <Text className="text-[12px] text-muted bg-[#f5f5f5] rounded-full px-3 py-1">Today</Text>
        </View>
        {messages.map((m) => (
          <View key={m.id} className={`flex-row ${m.fromMe ? 'justify-end' : 'justify-start'}`}>
            <View
              className={`rounded-2xl px-4 py-2.5 ${m.fromMe ? 'bg-primary rounded-br-md' : 'bg-[#f5f5f5] rounded-bl-md'}`}
              style={{ maxWidth: '75%' }}
            >
              <Text className={`text-[14px] ${m.fromMe ? 'text-white' : 'text-ink'}`}>{m.text}</Text>
              <Text className={`text-[10px] mt-1 ${m.fromMe ? 'text-white/70' : 'text-muted'}`}>{m.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="flex-row items-center gap-3 px-6 py-3 border-t border-hairline shrink-0">
        <Pressable className="items-center justify-center size-9 shrink-0">
          <ImageIcon size={20} color="#6C7585" />
        </Pressable>
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
          placeholder="Message..."
          placeholderTextColor="#9e9e9e"
          className="flex-1 rounded-full bg-[#f5f5f5] px-5 py-3 text-[14px] text-ink"
        />
        <Pressable onPress={send} className="items-center justify-center size-11 rounded-full bg-primary shrink-0">
          {text.trim() ? <SendIcon size={16} color="#fff" /> : <MicIcon size={20} color="#fff" />}
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
