import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../../components/ScreenHeader'
import Button from '../../../components/Button'
import { ChevronDownIcon, SearchIcon } from '../../../components/icons'
import { FAQS } from '../../../data/mock'

export default function HelpCenter() {
  const { t } = useTranslation('profile')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(FAQS[0]!.id)

  const filtered = useMemo(() => FAQS.filter((f) => f.question.toLowerCase().includes(query.toLowerCase())), [query])

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title={t('help.title')} back="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-2">
          <View className="flex-row items-center gap-3 rounded-2xl bg-[#f5f5f5] px-4 py-3">
            <SearchIcon size={20} color="#6C7585" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('help.searchPlaceholder')}
              placeholderTextColor="#9e9e9e"
              className="flex-1 text-[14px] text-ink"
            />
          </View>

          <Text className="text-[14px] font-semibold text-ink mt-6 mb-2">{t('help.faqTitle')}</Text>
          <View className="flex-col">
            {filtered.map((f) => {
              const isOpen = open === f.id
              return (
                <View key={f.id} className="border-b border-hairline">
                  <Pressable onPress={() => setOpen(isOpen ? null : f.id)} className="w-full flex-row items-center gap-3 py-4">
                    <Text className="flex-1 text-[14px] font-medium text-ink">{f.question}</Text>
                    <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
                      <ChevronDownIcon size={16} color="#6C7585" />
                    </View>
                  </Pressable>
                  {isOpen && <Text className="text-[13px] text-muted pb-4 leading-relaxed">{f.answer}</Text>}
                </View>
              )
            })}
            {filtered.length === 0 && <Text className="text-center text-muted py-8 text-[14px]">{t('help.noFaqMatch')}</Text>}
          </View>

          <View className="mt-8">
            <Text className="text-[14px] text-muted text-center mb-3">{t('help.stillNeedHelp')}</Text>
            <Button variant="outline" onPress={() => router.push('/profile/help/contact')}>
              {t('help.contactUs')}
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
