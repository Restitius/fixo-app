import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from '../../../../components/Avatar'
import { ArrowLeftIcon, SendIcon } from '../../../../components/icons'

type Msg = { id: string; fromMe: boolean; text: string }

const INITIAL: Msg[] = [{ id: '1', fromMe: false, text: 'Hi! This is FIXO Support. How can we help you today?' }]

export default function SupportChat() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL)
  const [text, setText] = useState('')

  function send() {
    if (!text.trim()) return
    const mine = text.trim()
    setMessages((m) => [...m, { id: `${m.length}`, fromMe: true, text: mine }])
    setText('')
    setTimeout(() => {
      setMessages((m) => [...m, { id: `${m.length}`, fromMe: false, text: 'Thanks for reaching out! A support agent will follow up shortly.' }])
    }, 900)
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center gap-3 px-6 pt-3 pb-3 border-b border-hairline shrink-0">
        <Pressable onPress={() => router.replace('/profile/help/contact')} className="items-center justify-center size-7">
          <ArrowLeftIcon color="#0B111F" />
        </Pressable>
        <Avatar label="CS" size={40} />
        <View className="flex-1 min-w-0">
          <Text numberOfLines={1} className="font-bold text-ink text-[15px]">
            FIXO Support
          </Text>
          <Text className="text-[12px]" style={{ color: '#00B894' }}>
            Online
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, gap: 12 }}>
        {messages.map((m) => (
          <View key={m.id} className={`flex-row ${m.fromMe ? 'justify-end' : 'justify-start'}`}>
            <View
              className={`rounded-2xl px-4 py-2.5 ${m.fromMe ? 'bg-primary rounded-br-md' : 'bg-[#f5f5f5] rounded-bl-md'}`}
              style={{ maxWidth: '75%' }}
            >
              <Text className={`text-[14px] ${m.fromMe ? 'text-white' : 'text-ink'}`}>{m.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="flex-row items-center gap-3 px-6 py-3 border-t border-hairline shrink-0">
        <TextInput
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
          placeholder="Describe your issue..."
          placeholderTextColor="#9e9e9e"
          className="flex-1 rounded-full bg-[#f5f5f5] px-5 py-3 text-[14px] text-ink"
        />
        <Pressable onPress={send} className="items-center justify-center size-11 rounded-full bg-primary shrink-0">
          <SendIcon size={16} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
