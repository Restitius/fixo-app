// Profile hub — same menu-list pattern as user-app's own profile tab
// (avatar+name header, icon+label+chevron rows, logout confirm modal).
// Every remaining web-provider page (business, pricing, services,
// service-areas, documents, settings, plus wallet/payouts/invoices
// already built) lives here as a sub-screen, matching how user-app's own
// Profile tab hosts many sub-screens instead of giving each a top-level tab.
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Avatar from '../../components/Avatar'
import Button from '../../components/Button'
import { CenterModal } from '../../components/Sheet'
import { useAuth } from '../../lib/auth-context'
import { initialsOf } from '../../lib/format'
import {
  AwardIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChevronRightIcon,
  FileTextIcon,
  HistoryIcon,
  LocationIcon,
  LogoutIcon,
  SettingsIcon,
  ShieldCheckIcon,
  StarIcon,
  TagIcon,
  UserIcon,
  WalletIcon,
} from '../../components/icons'

const MENU = [
  { icon: UserIcon, label: 'Edit profile', to: '/profile-edit' },
  { icon: BriefcaseIcon, label: 'Business profile', to: '/business' },
  { icon: TagIcon, label: 'Pricing', to: '/pricing' },
  { icon: BriefcaseIcon, label: 'My services', to: '/services' },
  { icon: LocationIcon, label: 'Service areas', to: '/service-areas' },
  { icon: ShieldCheckIcon, label: 'Documents', to: '/documents' },
  { icon: StarIcon, label: 'Reviews', to: '/reviews' },
  { icon: AwardIcon, label: 'Performance', to: '/performance' },
  { icon: HistoryIcon, label: 'Earnings', to: '/earnings' },
  { icon: WalletIcon, label: 'Wallet', to: '/wallet' },
  { icon: WalletIcon, label: 'Payouts', to: '/payouts' },
  { icon: FileTextIcon, label: 'Invoices', to: '/invoices' },
  { icon: CalendarIcon, label: 'Availability', to: '/availability' },
  { icon: SettingsIcon, label: 'Settings', to: '/settings' },
] as const

export default function Profile() {
  const { provider, logout } = useAuth()
  const [showLogout, setShowLogout] = useState(false)

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <Text className="text-[22px] font-extrabold text-ink px-6 pt-2">Profile</Text>

        <View className="flex-row items-center gap-4 px-6 mt-5">
          <Avatar label={initialsOf(provider?.display_name ?? '?')} size={64} />
          <View className="flex-1">
            <Text numberOfLines={1} className="font-bold text-ink">
              {provider?.display_name ?? '—'}
            </Text>
            <Text numberOfLines={1} className="text-[13px] text-muted">
              {provider?.email ?? ''}
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
            <View className="items-center justify-center size-10 rounded-full shrink-0" style={{ backgroundColor: 'rgba(255,107,107,0.1)' }}>
              <LogoutIcon size={20} color="#FF6B6B" />
            </View>
            <Text className="flex-1 text-[14px] font-medium" style={{ color: '#FF6B6B' }}>
              Log out
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <CenterModal open={showLogout}>
        <View className="size-16 rounded-full items-center justify-center mb-5" style={{ backgroundColor: 'rgba(255,107,107,0.1)' }}>
          <LogoutIcon size={28} color="#FF6B6B" />
        </View>
        <Text className="text-[18px] font-bold text-ink">Log out?</Text>
        <Text className="text-[14px] text-muted mt-2 text-center">You'll need to sign in again to continue.</Text>
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
              Log out
            </Button>
          </View>
        </View>
      </CenterModal>
    </SafeAreaView>
  )
}
