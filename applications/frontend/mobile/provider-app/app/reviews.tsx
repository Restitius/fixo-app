// Reviews — real /providers/me/ratings/* endpoints, ported from
// web-provider's real (post-rewrite) reviews.tsx. Read-only (no reply
// endpoint exists) and no customer name field — a neutral "Verified
// customer" label is used instead of fabricating one, matching web.
import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../components/ScreenHeader'
import MetricCard from '../components/MetricCard'
import { StarIcon } from '../components/icons'
import { useAuth } from '../lib/auth-context'
import { ratingsApi, type ProviderReview, type ReviewSummary } from '../lib/api-client'
import { fmtDate } from '../lib/format'

function Stars({ n }: { n: number }) {
  return (
    <View className="flex-row" style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} size={14} filled={i <= n} color={i <= n ? '#F59E0B' : '#E0E0E0'} />
      ))}
    </View>
  )
}

export default function Reviews() {
  const { access_token, loading: authLoading } = useAuth()
  const [reviews, setReviews] = useState<ProviderReview[]>([])
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !access_token) return
    Promise.all([ratingsApi.list(undefined, 50, 0), ratingsApi.summary()])
      .then(([r, s]) => {
        setReviews(r)
        setSummary(s)
      })
      .finally(() => setLoading(false))
  }, [authLoading, access_token])

  if (authLoading) return null
  if (!access_token) return <Redirect href="/auth" />

  const breakdown = summary
    ? [
        { stars: 5, count: summary.five_star },
        { stars: 4, count: summary.four_star },
        { stars: 3, count: summary.three_star },
        { stars: 2, count: summary.two_star },
        { stars: 1, count: summary.one_star },
      ]
    : []
  const maxBreakdown = Math.max(1, ...breakdown.map((b) => b.count))

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Reviews" back="/(tabs)/profile" />
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        {!loading && (
          <>
            <View className="mt-2">
              <MetricCard icon={StarIcon} label="Average rating" value={`${(summary?.average_rating ?? 0).toFixed(1)} / 5`} hint={`${summary?.total_count ?? 0} reviews`} />
            </View>
            <View className="flex-row mt-3" style={{ gap: 10 }}>
              <View className="flex-1">
                <MetricCard icon={StarIcon} label="5-star" value={summary && summary.total_count > 0 ? `${Math.round((summary.five_star / summary.total_count) * 100)}%` : '0%'} hint="Of all reviews" tone="success" tintValue />
              </View>
              <View className="flex-1">
                <MetricCard icon={StarIcon} label="This month" value={String(summary?.this_month ?? 0)} hint="New reviews" tone="amber" tintValue />
              </View>
            </View>

            <Text className="text-[15px] font-bold text-ink mt-7 mb-3">Rating breakdown</Text>
            <View style={{ gap: 8 }}>
              {breakdown.map((b) => (
                <View key={b.stars} className="flex-row items-center gap-3">
                  <Text className="text-[12px] text-muted" style={{ width: 40 }}>
                    {b.stars} star
                  </Text>
                  <View className="flex-1 h-2 rounded-full bg-[#f0f0f0] overflow-hidden">
                    <View className="h-full rounded-full bg-primary" style={{ width: `${(b.count / maxBreakdown) * 100}%` }} />
                  </View>
                  <Text className="text-[12px] font-semibold text-ink" style={{ width: 24, textAlign: 'right' }}>
                    {b.count}
                  </Text>
                </View>
              ))}
            </View>

            <Text className="text-[15px] font-bold text-ink mt-7 mb-3">Recent reviews</Text>
            {reviews.length === 0 && <Text className="text-[13px] text-muted">No reviews yet.</Text>}
            <View style={{ gap: 10 }}>
              {reviews.map((r) => (
                <View key={r.id} className="rounded-2xl bg-[#f5f5f5] p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[13px] font-semibold text-muted">Verified customer</Text>
                    <Stars n={r.rating} />
                  </View>
                  {!!r.title && <Text className="text-[13px] font-semibold text-ink mt-2">{r.title}</Text>}
                  <Text className="text-[13px] text-muted mt-1">{r.body}</Text>
                  <Text className="text-[11px] text-muted mt-2">{fmtDate(r.created_at)}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
