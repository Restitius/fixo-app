import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import Button from '../../components/Button'
import Sheet from '../../components/Sheet'
import { StarIcon } from '../../components/icons'
import { BOOKINGS, providerById, ratingForBooking, RATINGS, type Rating } from '../../data/mock'

export default function Feedback() {
  const [ratings, setRatings] = useState<Rating[]>(RATINGS)
  const [target, setTarget] = useState<string | null>(null)
  const [stars, setStars] = useState(5)
  const [comment, setComment] = useState('')

  const completed = BOOKINGS.filter((b) => b.status === 'completed')

  function openRate(bookingId: string) {
    setTarget(bookingId)
    setStars(5)
    setComment('')
  }

  function submit() {
    if (!target) return
    setRatings((prev) => [
      { id: `local-${prev.length}`, bookingId: target, rating: stars, comment: comment.trim(), date: 'Just now' },
      ...prev.filter((r) => r.bookingId !== target),
    ])
    setTarget(null)
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Feedback" back="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-2">
          <Text className="text-[16px] font-bold text-ink mb-3">Rate a completed job</Text>
          <View className="flex-col gap-3">
            {completed.map((b) => {
              const provider = providerById(b.providerId)
              const existing = ratingForBooking(b.id) ?? ratings.find((r) => r.bookingId === b.id)
              if (!provider) return null
              return (
                <View key={b.id} className="flex-row items-center gap-4 rounded-2xl border border-hairline p-4">
                  <View className="flex-1 min-w-0">
                    <Text numberOfLines={1} className="font-bold text-ink text-[14px]">
                      {provider.title}
                    </Text>
                    <Text className="text-[12px] text-muted mt-0.5">{provider.name} · {b.date}</Text>
                    {existing && (
                      <View className="flex-row items-center gap-1 mt-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIcon key={i} size={14} filled={i < existing.rating} />
                        ))}
                      </View>
                    )}
                  </View>
                  <Pressable onPress={() => openRate(b.id)} className="shrink-0 rounded-full border border-primary px-4 py-2">
                    <Text className="text-[12px] font-semibold text-primary">{existing ? 'Edit' : 'Rate'}</Text>
                  </Pressable>
                </View>
              )
            })}
            {completed.length === 0 && <Text className="text-center text-muted py-8 text-[14px]">No completed bookings yet.</Text>}
          </View>
        </View>
      </ScrollView>

      <Sheet open={!!target} onClose={() => setTarget(null)}>
        <View className="w-10 h-1 bg-hairline rounded-full self-center mb-6" />
        <Text className="text-[18px] font-bold text-ink text-center">Rate your experience</Text>
        <View className="flex-row items-center justify-center gap-2 mt-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Pressable key={i} onPress={() => setStars(i + 1)} hitSlop={6}>
              <StarIcon size={32} filled={i < stars} />
            </Pressable>
          ))}
        </View>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Share more about your experience..."
          placeholderTextColor="#9e9e9e"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="w-full rounded-2xl bg-[#f5f5f5] px-5 py-4 text-[14px] text-ink mt-6 min-h-[88px]"
        />
        <View className="mt-6">
          <Button onPress={submit}>Submit Feedback</Button>
        </View>
      </Sheet>
    </SafeAreaView>
  )
}
