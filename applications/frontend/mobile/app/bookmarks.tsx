import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import ProviderCard from '../components/ProviderCard'
import Button from '../components/Button'
import Sheet from '../components/Sheet'
import { BookmarkIcon } from '../components/icons'
import { PROVIDERS } from '../data/mock'

export default function Bookmarks() {
  const [saved, setSaved] = useState(PROVIDERS.slice(0, 4).map((p) => p.id))
  const [toRemove, setToRemove] = useState<string | null>(null)

  const bookmarked = PROVIDERS.filter((p) => saved.includes(p.id))
  const target = PROVIDERS.find((p) => p.id === toRemove)

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="My Bookmark" back="/(tabs)/home" />

      {bookmarked.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <BookmarkIcon size={64} color="#e0e0e0" />
          <Text className="text-[16px] font-semibold text-ink mt-4">No bookmarks yet</Text>
          <Text className="text-[14px] text-muted mt-1 text-center">Services you save will show up here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="flex-col gap-3 px-6 mt-2">
            {bookmarked.map((p) => (
              <ProviderCard key={p.id} provider={p} saved onToggleSave={() => setToRemove(p.id)} />
            ))}
          </View>
        </ScrollView>
      )}

      <Sheet open={!!target} onClose={() => setToRemove(null)}>
        <View className="w-10 h-1 bg-hairline rounded-full self-center mb-6" />
        <Text className="text-[18px] font-bold text-ink text-center">Remove bookmark?</Text>
        <Text className="text-[14px] text-muted text-center mt-2">
          {target?.title} will be removed from your bookmarks.
        </Text>
        <View className="flex-row gap-3 mt-6">
          <View className="flex-1">
            <Button variant="outline" onPress={() => setToRemove(null)}>
              Cancel
            </Button>
          </View>
          <View className="flex-1">
            <Button
              onPress={() => {
                setSaved((s) => s.filter((id) => id !== toRemove))
                setToRemove(null)
              }}
            >
              Remove
            </Button>
          </View>
        </View>
      </Sheet>
    </SafeAreaView>
  )
}
