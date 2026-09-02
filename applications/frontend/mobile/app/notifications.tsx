import { ScrollView, View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import { BellIcon } from '../components/icons'
import { NOTIFICATIONS } from '../data/mock'

export default function Notifications() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Notifications" back="/(tabs)/home" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="flex-col px-6 mt-2">
          {NOTIFICATIONS.map((n, i) => (
            <View
              key={n.id}
              className={`flex-row gap-4 py-4 ${i === NOTIFICATIONS.length - 1 ? '' : 'border-b border-hairline'}`}
            >
              <View
                className={`items-center justify-center size-11 rounded-full shrink-0 ${n.read ? 'bg-[#f5f5f5]' : 'bg-primary/8'}`}
              >
                <BellIcon size={20} color={n.read ? '#6C7585' : '#7210FF'} />
              </View>
              <View className="flex-1 min-w-0">
                <View className="flex-row items-start justify-between gap-2">
                  <Text className="font-bold text-ink text-[15px] flex-1">{n.title}</Text>
                  {!n.read && <View className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                </View>
                <Text className="text-[13px] text-muted mt-0.5">{n.body}</Text>
                <Text className="text-[12px] text-[#bdbdbd] mt-1">{n.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
