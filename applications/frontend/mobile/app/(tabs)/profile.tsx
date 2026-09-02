import { useState, type ReactNode } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from '../../components/Avatar'
import Button from '../../components/Button'
import { CenterModal } from '../../components/Sheet'
import { useAuth } from '../../lib/auth-context'
import {
  AwardIcon,
  BellIcon,
  ChevronRightIcon,
  CreditCardIcon,
  EditIcon,
  FileTextIcon,
  GiftIcon,
  GlobeIcon,
  HelpCircleIcon,
  HistoryIcon,
  LogoutIcon,
  ShieldIcon,
  StarIcon,
  TagIcon,
  WalletIcon,
} from '../../components/icons'

const MENU: { icon: (p: { size?: number; color?: string }) => ReactNode; label: string; to: string }[] = [
  { icon: EditIcon, label: 'Edit Profile', to: '/profile/edit' },
  { icon: BellIcon, label: 'Notification Settings', to: '/profile/notifications' },
  { icon: WalletIcon, label: 'Wallet', to: '/profile/wallet' },
  { icon: CreditCardIcon, label: 'Payment Methods', to: '/profile/payment' },
  { icon: FileTextIcon, label: 'Invoices', to: '/profile/invoices' },
  { icon: HistoryIcon, label: 'History', to: '/profile/history' },
  { icon: AwardIcon, label: 'Loyalty & Rewards', to: '/profile/loyalty' },
  { icon: TagIcon, label: 'Promotions', to: '/profile/promotions' },
  { icon: HistoryIcon, label: 'Activity', to: '/profile/activity' },
  { icon: StarIcon, label: 'Feedback', to: '/profile/feedback' },
  { icon: ShieldIcon, label: 'Security', to: '/profile/security' },
  { icon: GlobeIcon, label: 'Language', to: '/profile/language' },
  { icon: ShieldIcon, label: 'Privacy Policy', to: '/profile/privacy' },
  { icon: GiftIcon, label: 'Invite Friends', to: '/profile/invite' },
  { icon: HelpCircleIcon, label: 'Help Center', to: '/profile/help' },
]

export default function ProfileHub() {
  const { customer, logout } = useAuth()
  const [showLogout, setShowLogout] = useState(false)
  const initials = (customer?.full_name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <Text className="text-[22px] font-extrabold text-ink px-6 pt-2">Profile & Settings</Text>

        <View className="flex-row items-center gap-4 px-6 mt-5">
          <Avatar label={initials} size={64} />
          <View className="flex-1">
            <Text numberOfLines={1} className="font-bold text-ink">
              {customer?.full_name ?? '—'}
            </Text>
            <Text numberOfLines={1} className="text-[13px] text-muted">
              {customer?.email ?? ''}
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
                void logout()
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
