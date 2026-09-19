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

        {!loading && rows.length === 0 && (
          <View className="items-center pt-16 px-6">
            <Text className="text-[15px] text-muted">No notifications yet.</Text>
          </View>
        )}

        <View className="mt-4 px-6" style={{ gap: 8 }}>
          {rows.map((n) => (
            <Pressable key={n.id} onPress={() => !n.is_read && void markRead(n.id)} className="flex-row items-start gap-3 rounded-2xl p-4" style={{ backgroundColor: !n.is_read ? 'rgba(114,16,255,0.06)' : '#f5f5f5' }}>
              <View className="items-center justify-center rounded-xl bg-primary/10" style={{ width: 40, height: 40 }}>
                <BellIcon size={18} color="#7210FF" />
              </View>
              <View className="flex-1 min-w-0">
                <Text numberOfLines={1} className="text-[14px] font-semibold text-ink">
                  {n.title}
                </Text>
                <Text numberOfLines={2} className="text-[13px] text-muted mt-0.5">
                  {n.body}
                </Text>
                <Text className="text-[11px] text-muted mt-1">{new Date(n.created_at).toLocaleDateString()}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
