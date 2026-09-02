import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'We collect information you provide directly, such as your name, contact details, address, and payment information, in order to connect you with service providers.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'Your information is used to process bookings, facilitate communication with providers, send booking updates, and improve our services.',
  },
  {
    title: '3. Sharing Your Information',
    body: 'We share limited booking details with the service provider you book, such as your name, address, and contact number, so they can complete the service.',
  },
  {
    title: '4. Data Security',
    body: 'We use industry-standard encryption to protect your data, including payment information, which is processed through secure, PCI-compliant providers.',
  },
  {
    title: '5. Your Choices',
    body: 'You can update or delete your account information at any time from Profile & Settings. You may also opt out of promotional notifications.',
  },
]

export default function PrivacyPolicy() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Privacy Policy" back="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-2">
          <Text className="text-[13px] text-muted mb-6">Last updated: August 1, 2026</Text>
          <View className="flex-col gap-6">
            {SECTIONS.map((s) => (
              <View key={s.title}>
                <Text className="font-bold text-ink text-[15px] mb-1.5">{s.title}</Text>
                <Text className="text-[14px] text-muted leading-relaxed">{s.body}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
