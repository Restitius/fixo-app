import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import Avatar from '../../components/Avatar'
import ProviderCard from '../../components/ProviderCard'
import { BellIcon, BookmarkIcon, SearchIcon, SlidersIcon } from '../../components/icons'
import { useAuth } from '../../lib/auth-context'
import { bookingApi, fixoSdk, type CatalogCategory, type Promotion, type ProviderListing } from '../../lib/api-client'
import { colorForSeed, emojiForCategory, COLOR_PALETTE } from '../../lib/category-visuals'
import { fmtMoney, initialsOf } from '../../lib/format'

function discountLabel(p: Promotion) {
  return p.discount_type === 'PERCENT' ? `${p.discount_value}%` : fmtMoney(p.discount_value)
}

function greetingKey() {
  const h = new Date().getHours()
  if (h < 12) return 'home.greetingMorning'
  if (h < 18) return 'home.greetingAfternoon'
  return 'home.greetingEvening'
}

export default function Home() {
  const { t } = useTranslation('tabs')
  const { customer } = useAuth()
  const [categories, setCategories] = useState<CatalogCategory[] | null>(null)
  const [popular, setPopular] = useState<{ provider: ProviderListing; categoryIcon: string }[] | null>(null)
  const [offers, setOffers] = useState<Promotion[] | null>(null)
  const [offerIndex, setOfferIndex] = useState(0)

  useEffect(() => {
    fixoSdk.listPromotions(10, 0).then(setOffers).catch(() => setOffers([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    bookingApi.catalogCategories().then((cats) => {
      if (cancelled) return
      setCategories(cats)

      // No single "top providers across categories" endpoint exists — fetch
      // real providers per category (top few, by job volume) and merge.
      const topCats = [...cats].sort((a, b) => (b.total_jobs ?? 0) - (a.total_jobs ?? 0)).slice(0, 4)
      Promise.all(
        topCats.map((c) =>
          bookingApi
            .listProvidersByCategory(c.category_id)
            .then((rows) => rows.map((provider) => ({ provider, categoryIcon: c.icon })))
            .catch(() => []),
        ),
      ).then((groups) => {
        if (cancelled) return
        // A provider can offer services in more than one category, so dedupe
        // before rendering (duplicate keys would otherwise break the list).
        const seen = new Set<string>()
        const merged = groups
          .flat()
          .filter(({ provider }) => (seen.has(provider.provider_id) ? false : (seen.add(provider.provider_id), true)))
          .sort((a, b) => b.provider.rating_avg - a.provider.rating_avg)
          .slice(0, 4)
        setPopular(merged)
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  const homeCategories = useMemo(() => (categories ?? []).slice(0, 7), [categories])

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View className="flex-row items-center gap-3 px-6 pt-2">
          <Avatar label={initialsOf(customer?.full_name ?? '?')} size={48} />
          <View className="flex-1">
            <Text className="text-[13px] text-muted">{t(greetingKey())} 👋</Text>
            <Text numberOfLines={1} className="text-[16px] font-bold text-ink">
              {customer?.full_name ?? ''}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/notifications')} className="relative items-center justify-center size-11 rounded-full bg-[#f5f5f5]">
            <BellIcon size={20} color="#0B111F" />
            <View className="absolute top-2.5 right-2.5 size-2 rounded-full bg-[#FF6B6B]" />
          </Pressable>
          <Pressable onPress={() => router.push('/bookmarks')} className="items-center justify-center size-11 rounded-full bg-[#f5f5f5]">
            <BookmarkIcon size={20} color="#0B111F" />
          </Pressable>
        </View>

        <View className="flex-row items-center gap-3 mx-6 mt-5">
          <Pressable onPress={() => router.push('/search')} className="flex-1 flex-row items-center gap-3 rounded-2xl bg-[#f5f5f5] px-5 py-4">
            <SearchIcon size={20} color="#6C7585" />
            <Text className="text-[15px] text-[#9e9e9e]">{t('home.searchPlaceholder')}</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/search')} className="items-center justify-center size-[52px] rounded-2xl bg-[#f5f5f5]">
            <SlidersIcon size={20} color="#7210FF" />
          </Pressable>
        </View>

        {offers === null ? null : offers.length === 0 ? null : (
          <>
            <View className="flex-row items-center justify-between px-6 mt-7">
              <Text className="text-[17px] font-bold text-ink">{t('home.specialOffers')}</Text>
              <Pressable onPress={() => router.push('/offers')}>
                <Text className="text-[13px] font-semibold text-primary">{t('home.seeAll')}</Text>
              </Pressable>
            </View>
            {offers[offerIndex] && (
              <Pressable
                onPress={() => router.push('/offers')}
                className="mx-6 mt-3 flex-row items-center justify-between overflow-hidden rounded-3xl p-6"
                style={{ backgroundColor: COLOR_PALETTE[offerIndex % COLOR_PALETTE.length] }}
              >
                <View className="flex-1 pr-3">
                  <Text className="text-[34px] font-extrabold text-white leading-none">{t('home.offAmount', { amount: discountLabel(offers[offerIndex]) })}</Text>
                  <Text className="text-[18px] font-bold text-white mt-2">{offers[offerIndex].name}</Text>
                  <Text numberOfLines={2} className="text-[12px] text-white/90 mt-1">
                    {offers[offerIndex].description || offers[offerIndex].code}
                  </Text>
                </View>
                <Text style={{ fontSize: 56, opacity: 0.9 }}>🏷️</Text>
              </Pressable>
            )}
            <View className="flex-row items-center justify-center gap-1.5 mt-3">
              {offers.map((o, i) => (
                <Pressable key={o.promo_id} onPress={() => setOfferIndex(i)}>
                  <View className={`h-1.5 rounded-full ${i === offerIndex ? 'w-5 bg-primary' : 'w-1.5 bg-[#e0e0e0]'}`} />
                </Pressable>
              ))}
            </View>
          </>
        )}

        <View className="flex-row items-center justify-between px-6 mt-7">
          <Text className="text-[17px] font-bold text-ink">{t('home.services')}</Text>
          <Pressable onPress={() => router.push('/services')}>
            <Text className="text-[13px] font-semibold text-primary">{t('home.seeAll')}</Text>
          </Pressable>
        </View>
        {categories === null ? (
          <View className="px-6 mt-4">
            <View className="h-24 rounded-2xl bg-[#f5f5f5]" />
          </View>
        ) : (
          <View className="flex-row flex-wrap px-6 mt-4" style={{ rowGap: 16 }}>
            {homeCategories.map((c) => (
              <Pressable key={c.category_id} onPress={() => router.push(`/services/${c.category_id}` as any)} className="items-center gap-2" style={{ width: '25%' }}>
                <View className="items-center justify-center size-14 rounded-2xl" style={{ backgroundColor: `${colorForSeed(c.category_id)}14` }}>
                  <Text style={{ fontSize: 24 }}>{emojiForCategory(c.icon)}</Text>
                </View>
                <Text numberOfLines={1} className="text-[11px] font-medium text-ink text-center">{c.name}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => router.push('/services')} className="items-center gap-2" style={{ width: '25%' }}>
              <View className="items-center justify-center size-14 rounded-2xl bg-primary/8">
                <SlidersIcon size={20} color="#7210FF" />
              </View>
              <Text className="text-[11px] font-medium text-ink">{t('home.more')}</Text>
            </Pressable>
          </View>
        )}

        <View className="flex-row items-center justify-between px-6 mt-7">
          <Text className="text-[17px] font-bold text-ink">{t('home.mostPopular')}</Text>
          <Pressable onPress={() => router.push('/popular')}>
            <Text className="text-[13px] font-semibold text-primary">{t('home.seeAll')}</Text>
          </Pressable>
        </View>
        <View className="gap-3 px-6 mt-3">
          {popular === null ? (
            <View className="h-24 rounded-2xl bg-[#f5f5f5]" />
          ) : popular.length === 0 ? (
            <Text className="text-[13px] text-muted">{t('home.noProviders')}</Text>
          ) : (
            popular.map(({ provider, categoryIcon }) => (
              <ProviderCard key={provider.provider_id} provider={provider} emoji={emojiForCategory(categoryIcon)} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
