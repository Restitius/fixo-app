import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import ProviderCard from '../components/ProviderCard'
import Button from '../components/Button'
import Sheet from '../components/Sheet'
import { BookmarkIcon } from '../components/icons'
import { favoritesApi, type FavoriteProvider } from '../lib/api-client'

export default function Bookmarks() {
  const [bookmarked, setBookmarked] = useState<FavoriteProvider[] | null>(null)
  const [toRemove, setToRemove] = useState<FavoriteProvider | null>(null)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    favoritesApi.list(1, 50).then(setBookmarked).catch(() => setBookmarked([]))
  }, [])

  async function confirmRemove() {
    if (!toRemove) return
    setRemoving(true)
    try {
      await favoritesApi.toggle(toRemove.provider_id)
      setBookmarked((prev) => (prev ?? []).filter((p) => p.provider_id !== toRemove.provider_id))
      setToRemove(null)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="My Bookmark" back="/(tabs)/home" />

      {bookmarked === null ? (
        <View className="px-6 mt-4">
          <View className="h-24 rounded-2xl bg-[#f5f5f5]" />
        </View>
      ) : bookmarked.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <BookmarkIcon size={64} color="#e0e0e0" />
          <Text className="text-[16px] font-semibold text-ink mt-4">No bookmarks yet</Text>
          <Text className="text-[14px] text-muted mt-1 text-center">Providers you save will show up here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="flex-col gap-3 px-6 mt-2">
            {bookmarked.map((p) => (
              <ProviderCard key={p.provider_id} provider={p} saved onToggleSave={() => setToRemove(p)} />
            ))}
          </View>
        </ScrollView>
      )}

      <Sheet open={!!toRemove} onClose={() => setToRemove(null)}>
        <View className="w-10 h-1 bg-hairline rounded-full self-center mb-6" />
        <Text className="text-[18px] font-bold text-ink text-center">Remove bookmark?</Text>
        <Text className="text-[14px] text-muted text-center mt-2">
          {toRemove?.display_name} will be removed from your bookmarks.
        </Text>
        <View className="flex-row gap-3 mt-6">
          <View className="flex-1">
            <Button variant="outline" onPress={() => setToRemove(null)}>
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button loading={removing} onPress={confirmRemove}>
              Remove
            </Button>
          </View>
        </View>
      </Sheet>
    </SafeAreaView>
  )
}
