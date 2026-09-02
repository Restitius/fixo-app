import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import Avatar from '../../components/Avatar'
import { CONTACTS, INITIALLY_INVITED } from '../../data/mock'

export default function InviteFriends() {
  const [invited, setInvited] = useState<Set<string>>(new Set(INITIALLY_INVITED))

  function toggle(id: string) {
    setInvited((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Invite Friends" back="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-col px-6 mt-2">
          {CONTACTS.map((c, i) => {
            const isInvited = invited.has(c.id)
            return (
              <View
                key={c.id}
                className={`flex-row items-center gap-4 py-3.5 ${i === CONTACTS.length - 1 ? '' : 'border-b border-hairline'}`}
              >
                <Avatar label={c.name} size={52} />
                <View className="flex-1 min-w-0">
                  <Text numberOfLines={1} className="font-bold text-ink">
                    {c.name}
                  </Text>
                  <Text className="text-[13px] text-muted">{c.phone}</Text>
                </View>
                <Pressable
                  onPress={() => toggle(c.id)}
                  className={`shrink-0 rounded-full px-5 py-2 ${isInvited ? 'border border-primary' : 'bg-primary'}`}
                >
                  <Text className={`text-[13px] font-semibold ${isInvited ? 'text-primary' : 'text-white'}`}>
                    {isInvited ? 'Invited' : 'Invite'}
                  </Text>
                </Pressable>
              </View>
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
