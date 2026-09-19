import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import Button from '../../components/Button'
import Sheet from '../../components/Sheet'
import { StarIcon } from '../../components/icons'
import { fixoSdk, type BookingHistoryRow, type BookingRating } from '../../lib/api-client'
import { fmtDate } from '../../lib/format'

export default function Feedback() {
  const { t } = useTranslation('profile')
  const [completed, setCompleted] = useState<BookingHistoryRow[] | null>(null)
  const [ratings, setRatings] = useState<BookingRating[]>([])
  const [target, setTarget] = useState<BookingHistoryRow | null>(null)
  const [stars, setStars] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function refresh() {
    fixoSdk.bookingHistory('CLOSED', 100, 0).then(setCompleted).catch(() => setCompleted([]))
    fixoSdk.listMyRatings().then(setRatings).catch(() => setRatings([]))
  }

  useEffect(refresh, [])

  function openRate(b: BookingHistoryRow) {
    const existing = ratings.find((r) => r.booking_id === b.booking_id)
    setTarget(b)
    setStars(existing?.rating ?? 5)
    setComment(existing?.comment ?? '')
  }

  async function submit() {
    if (!target) return
    setSubmitting(true)
    try {
      await fixoSdk.submitRating(target.booking_id, stars, comment.trim() || undefined)
      refresh()
      setTarget(null)
    } catch {
      // apiClient throws on failure; existing rating (if any) stays shown
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title={t('feedback.title')} back="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-2">
          <Text className="text-[16px] font-bold text-ink mb-3">{t('feedback.rateCompletedJob')}</Text>
          <View className="flex-col gap-3">
            {completed === null ? (
              <View className="h-24 rounded-2xl bg-[#f5f5f5]" />
            ) : (
              <>
                {completed.map((b) => {
                  const existing = ratings.find((r) => r.booking_id === b.booking_id)
                  return (
                    <View key={b.booking_id} className="flex-row items-center gap-4 rounded-2xl border border-hairline p-4">
                      <View className="flex-1 min-w-0">
                        <Text numberOfLines={1} className="font-bold text-ink text-[14px]">
                          {b.service_name ?? t('feedback.serviceFallback')}
                        </Text>
                        <Text className="text-[12px] text-muted mt-0.5">{b.provider_name ?? '—'} · {fmtDate(b.completed_at ?? b.created_at)}</Text>
                        {existing && (
                          <View className="flex-row items-center gap-1 mt-1.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <StarIcon key={i} size={14} filled={i < existing.rating} />
                            ))}
                          </View>
                        )}
                      </View>
                      <Pressable onPress={() => openRate(b)} className="shrink-0 rounded-full border border-primary px-4 py-2">
                        <Text className="text-[12px] font-semibold text-primary">{existing ? t('feedback.edit') : t('feedback.rate')}</Text>
                      </Pressable>
                    </View>
                  )
                })}
                {completed.length === 0 && <Text className="text-center text-muted py-8 text-[14px]">{t('feedback.noCompleted')}</Text>}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <Sheet open={!!target} onClose={() => setTarget(null)}>
        <View className="w-10 h-1 bg-hairline rounded-full self-center mb-6" />
        <Text className="text-[18px] font-bold text-ink text-center">{t('feedback.rateExperience')}</Text>
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
          placeholder={t('feedback.commentPlaceholder')}
          placeholderTextColor="#9e9e9e"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="w-full rounded-2xl bg-[#f5f5f5] px-5 py-4 text-[14px] text-ink mt-6 min-h-[88px]"
        />
        <View className="mt-6">
          <Button onPress={submit} loading={submitting}>{t('feedback.submit')}</Button>
        </View>
      </Sheet>
    </SafeAreaView>
  )
}
