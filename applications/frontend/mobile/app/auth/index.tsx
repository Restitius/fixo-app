import { Text, View } from 'react-native'
import { Link, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Button from '../../components/Button'
import ScreenHeader from '../../components/ScreenHeader'
import { AppleIcon, FacebookIcon, GoogleIcon } from '../../components/icons'

function SocialButtonFull({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View className="w-full flex-row items-center justify-center gap-3 rounded-full border border-hairline py-4">
      {icon}
      <Text className="text-[16px] font-medium text-ink">{label}</Text>
    </View>
  )
}

export default function LetsIn() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader onBack={() => router.replace('/onboarding')} />

      <View className="px-10 pt-4 items-center">
        <View className="size-40 rounded-full bg-primary/8 items-center justify-center">
          <Text style={{ fontSize: 64 }}>👋</Text>
        </View>
      </View>

      <Text className="text-[28px] font-extrabold text-center text-ink mt-4">Let's you in</Text>

      <View className="flex-1 justify-center px-6 mt-6 gap-3">
        <SocialButtonFull icon={<FacebookIcon />} label="Continue with Facebook" />
        <SocialButtonFull icon={<GoogleIcon />} label="Continue with Google" />
        <SocialButtonFull icon={<AppleIcon />} label="Continue with Apple" />

        <View className="flex-row items-center gap-3 my-3">
          <View className="h-px flex-1 bg-hairline" />
          <Text className="text-[14px] text-muted">or</Text>
          <View className="h-px flex-1 bg-hairline" />
        </View>

        <Button onPress={() => router.push('/auth/sign-in')}>Sign in with password</Button>

        <Text className="text-center text-[14px] text-muted pb-6 pt-2">
          Don't have an account? <Link href="/auth/sign-up" className="text-primary font-semibold">Sign up</Link>
        </Text>
      </View>
    </SafeAreaView>
  )
}
