import { useState, type ReactNode } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from '../../components/Avatar'
import Button from '../../components/Button'
import { CenterModal } from '../../components/Sheet'
import { USER } from '../../data/mock'
import {
  BellIcon,
  ChevronRightIcon,
  CreditCardIcon,
  EditIcon,
  GiftIcon,
  GlobeIcon,
  HelpCircleIcon,
  LogoutIcon,
  ShieldIcon,
} from '../../components/icons'

const MENU: { icon: (p: { size?: number; color?: string }) => ReactNode; label: string; to: string }[] = [
  { icon: EditIcon, label: 'Edit Profile', to: '/profile/edit' },
  { icon: BellIcon, label: 'Notification Settings', to: '/profile/notifications' },
  { icon: CreditCardIcon, label: 'Payment Methods', to: '/profile/payment' },
  { icon: ShieldIcon, label: 'Security', to: '/profile/security' },
  { icon: GlobeIcon, label: 'Language', to: '/profile/language' },
  { icon: ShieldIcon, label: 'Privacy Policy', to: '/profile/privacy' },
  { icon: GiftIcon, label: 'Invite Friends', to: '/profile/invite' },
  { icon: HelpCircleIcon, label: 'Help Center', to: '/profile/help' },
]

export default function ProfileHub() {
  const [showLogout, setShowLogout] = useState(false)

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <Text className="text-[22px] font-extrabold text-ink px-6 pt-2">Profile & Settings</Text>

        <View className="flex-row items-center gap-4 px-6 mt-5">
          <Avatar label={USER.avatar} size={64} />
          <View className="flex-1">
            <Text numberOfLines={1} className="font-bold text-ink">
              {USER.name}
            </Text>
            <Text numberOfLines={1} className="text-[13px] text-muted">
              {USER.email}
            </Text>
          </View>
        </View>

        <View className="mt-6 px-6">
          {MENU.map(({ icon: Icon, label, to }) => (
            <Pressable key={to} onPress={() => router.push(to as any)} className="flex-row items-center gap-4 py-3.5 border-b border-hairline">
              <View className="items-center justify-center size-10 rounded-full bg-primary/8 shrink-0">
                <Icon size={20} color="#7210FF" />
              </View>
              <Text className="flex-1 text-[14px] font-medium text-ink">{label}</Text>
              <ChevronRightIcon size={16} color="#6C7585" />
            </Pressable>
          ))}

          <Pressable onPress={() => setShowLogout(true)} className="flex-row items-center gap-4 py-3.5">
            <View className="items-center justify-center size-10 rounded-full bg-[#FF6B6B]/10 shrink-0">
              <LogoutIcon size={20} color="#FF6B6B" />
            </View>
            <Text className="flex-1 text-[14px] font-medium" style={{ color: '#FF6B6B' }}>
              Log Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <CenterModal open={showLogout}>
        <View className="size-16 rounded-full bg-[#FF6B6B]/10 items-center justify-center mb-5">
          <LogoutIcon size={28} color="#FF6B6B" />
        </View>
        <Text className="text-[18px] font-bold text-ink">Log out of your account?</Text>
        <Text className="text-[14px] text-muted mt-2 text-center">You'll need to sign in again to access your bookings.</Text>
        <View className="flex-row gap-3 w-full mt-6">
          <View className="flex-1">
            <Button variant="outline" onPress={() => setShowLogout(false)}>
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button
              onPress={() => {
                setShowLogout(false)
                router.replace('/auth/sign-in')
              }}
            >
              Log Out
            </Button>
          </View>
        </View>
      </CenterModal>
    </SafeAreaView>
  )
}
