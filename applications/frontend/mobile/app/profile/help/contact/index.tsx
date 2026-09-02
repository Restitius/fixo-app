import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../../../components/ScreenHeader'
import { ChatBubbleIcon, ChevronRightIcon, MailIcon, PhoneIcon } from '../../../../components/icons'

const OPTIONS = [
  { icon: ChatBubbleIcon, label: 'Chat with us', desc: 'Typical reply within 5 minutes', to: '/profile/help/contact/chat' },
  { icon: PhoneIcon, label: 'Call us', desc: '+1 (800) 555-0199', to: '' },
  { icon: MailIcon, label: 'Email us', desc: 'support@fixo.app', to: '' },
]

export default function ContactUs() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Contact Us" back="/profile/help" />
      <ScrollView>
        <View className="flex-col px-6 mt-2">
          {OPTIONS.map((o, i) => (
            <Pressable
              key={o.label}
              onPress={() => o.to && router.push(o.to as any)}
              className={`flex-row items-center gap-4 py-4 ${i === OPTIONS.length - 1 ? '' : 'border-b border-hairline'}`}
            >
              <View className="items-center justify-center size-11 rounded-full bg-primary/8 shrink-0">
                <o.icon size={20} color="#7210FF" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="font-semibold text-ink text-[14px]">{o.label}</Text>
                <Text className="text-[13px] text-muted mt-0.5">{o.desc}</Text>
              </View>
              {o.to ? <ChevronRightIcon size={16} color="#6C7585" /> : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
