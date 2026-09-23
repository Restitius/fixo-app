// Notifications feed — real /providers/me/notifications endpoints, ported
// from web-provider's notifications.tsx "Feed" panel (the mobile screen
// skips its two side panels — delivery-channel toggles and account
// activity — since those are settings-adjacent supplementary panels, not
// the core screen itself; the feed is the genuinely missing piece).
import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import { BellIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { fixoSdk, type ProviderNotificationRow } from '../lib/api-client'
import { humanize } from '../lib/format'

export default function Notifications() {
  const { access_token, loading: authLoading } = useAuth()
  const [items, setItems] = useState<ProviderNotificationRow[]>([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  function load() {
    return fixoSdk.notifications('all', 50, 0).then(setItems)
  }

  useEffect(() => {
    if (authLoading || !access_token) return
    load().finally(() => setLoading(false))
  }, [authLoading, access_token])

  const filters = useMemo(() => ['ALL', ...Array.from(new Set(items.map((n) => n.category))).sort()], [items])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  const rows = items.filter((n) => filter === 'ALL' || n.category === filter)
  const unread = items.filter((n) => !n.is_read).length

  async function markAllRead() {
    await Promise.all(items.filter((n) => !n.is_read).map((n) => fixoSdk.markNotificationRead(n.id)))
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    try {
      await fixoSdk.markNotificationRead(id)
    } catch {
      // leave the optimistic read state — a retry on next load will reconcile
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader
        title="Notifications"
        back="/(tabs)/dashboard"
        right={
          unread > 0 ? (
            <Pressable onPress={() => void markAllRead()}>
              <Text className="text-primary font-semibold text-[13px]">Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-row flex-wrap gap-2 px-6 mt-1">
          {filters.map((f) => {
            const selected = filter === f
            return (
              <Pressable key={f} onPress={() => setFilter(f)} className="rounded-full px-3 py-2" style={{ backgroundColor: selected ? 'rgba(114,16,255,0.1)' : '#f0f0f0' }}>
                <Text className="text-[12px] font-medium" style={{ color: selected ? '#7210FF' : '#0B111F' }}>
                  {f === 'ALL' ? 'All' : humanize(f)}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <View className="mx-4 mt-4 rounded-[28px] bg-[#2f69d9] p-4" style={{ gap: 14 }}>
          {!loading && rows.length === 0 && (
            <View className="min-h-[280px] items-center justify-center rounded-[22px] bg-white px-7 py-8">
              <View className="relative h-20 w-28 items-center justify-center">
                <View className="absolute h-[1px] w-28 bg-[#dceaff]" />
                <View className="absolute size-16 rounded-full bg-[#f4f8ff]" />
                <BellIcon size={38} color="#2468C7" />
              </View>
              <Text className="mt-3 text-center text-[15px] font-bold text-ink">Your inbox is empty</Text>
              <Text className="mt-1 text-center text-[13px] leading-5 text-muted">Job, quote, payment and account updates will appear here.</Text>
              <Pressable onPress={() => void load()} className="mt-6 min-w-[190px] rounded-full bg-[#2476f2] px-6 py-3">
                <Text className="text-center text-[13px] font-bold text-white">Refresh notifications</Text>
              </Pressable>
            </View>
          )}
          {rows.map((n) => (
            <View key={n.id} className="relative min-h-[270px] items-center rounded-[22px] bg-white px-6 py-6" style={{ shadowColor: '#0A2D69', shadowOpacity: 0.2, shadowRadius: 14, elevation: 5 }}>
              {!n.is_read && <View className="absolute right-4 top-4 size-2.5 rounded-full bg-[#2476f2]" />}
              <View className="relative h-20 w-28 items-center justify-center">
                <View className="absolute h-[1px] w-28 bg-[#dceaff]" />
                <View className="absolute size-16 rounded-full bg-[#f4f8ff]" />
                <BellIcon size={38} color="#2468C7" />
              </View>
              <Text numberOfLines={2} className="mt-3 text-center text-[15px] font-bold text-ink">{n.title}</Text>
              <Text numberOfLines={3} className="mt-1 text-center text-[13px] leading-5 text-muted">{n.body}</Text>
              <Text className="mt-2 text-center text-[11px] text-[#9aa7ba]">{new Date(n.created_at).toLocaleDateString()}</Text>
              <Pressable disabled={n.is_read} onPress={() => void markRead(n.id)} className={`mt-auto min-w-[180px] rounded-full px-6 py-3 ${n.is_read ? 'bg-[#e8f0fb]' : 'bg-[#2476f2]'}`}>
                <Text className={`text-center text-[13px] font-bold ${n.is_read ? 'text-[#2468c7]' : 'text-white'}`}>{n.is_read ? 'Read' : 'Mark as read'}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
