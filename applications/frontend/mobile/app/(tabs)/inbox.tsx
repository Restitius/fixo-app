import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from '../../components/Avatar'
import Tabs from '../../components/Tabs'
import { CALLS, CHATS, providerById } from '../../data/mock'
import { PhoneIcon } from '../../components/icons'

const TABS = [
  { id: 'chats' as const, label: 'Chats' },
  { id: 'calls' as const, label: 'Calls' },
]

const CALL_COLOR: Record<string, string> = { incoming: '#00B894', outgoing: '#7210FF', missed: '#FF6B6B' }

export default function Inbox() {
  const [tab, setTab] = useState<'chats' | 'calls'>('chats')

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <Text className="text-[22px] font-extrabold text-ink px-6 pt-2">Inbox</Text>

        <View className="mt-4">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </View>

        {tab === 'chats' ? (
          <View className="mt-4 px-6">
            {CHATS.map((c) => {
              const provider = providerById(c.providerId)
              if (!provider) return null
              return (
                <Pressable key={c.id} onPress={() => router.push(`/inbox/chat/${c.id}` as any)} className="flex-row items-center gap-4 py-3.5 border-b border-hairline">
                  <Avatar label={provider.avatar} size={52} />
                  <View className="flex-1">
                    <Text numberOfLines={1} className="font-bold text-ink">
                      {provider.name}
                    </Text>
                    <Text numberOfLines={1} className="text-[13px] text-muted">
                      {c.lastMessage}
                    </Text>
                  </View>
                  <View className="items-end gap-1.5">
                    <Text className="text-[12px] text-muted">{c.time}</Text>
                    {c.unread > 0 && (
                      <View className="items-center justify-center size-5 rounded-full bg-primary">
                        <Text className="text-white text-[11px] font-bold">{c.unread}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              )
            })}
          </View>
        ) : (
          <View className="mt-4 px-6">
            {CALLS.map((c) => {
              const provider = providerById(c.providerId)
              if (!provider) return null
              return (
                <Pressable key={c.id} onPress={() => router.push(`/inbox/call/${provider.id}` as any)} className="flex-row items-center gap-4 py-3.5 border-b border-hairline">
                  <Avatar label={provider.avatar} size={52} />
                  <View className="flex-1">
                    <Text numberOfLines={1} className="font-bold text-ink">
                      {provider.name}
                    </Text>
                    <Text className="text-[13px] capitalize" style={{ color: CALL_COLOR[c.type] }}>
                      {c.type}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-[12px] text-muted">{c.time}</Text>
                    <PhoneIcon size={20} color="#7210FF" />
                  </View>
                </Pressable>
              )
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
