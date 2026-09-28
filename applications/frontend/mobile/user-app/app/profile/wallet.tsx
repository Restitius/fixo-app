import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import { ArrowDownLeftIcon, ArrowUpRightIcon, WalletIcon } from '../../components/icons'
import { fixoSdk, type WalletBalance, type WalletTxn } from '../../lib/api-client'
import { fmtDateTime, fmtMoney, humanize } from '../../lib/format'

export default function Wallet() {
  const { t } = useTranslation('profile')
  const [wallet, setWallet] = useState<WalletBalance | null>(null)
  const [txns, setTxns] = useState<WalletTxn[] | null>(null)

  function refresh() {
    fixoSdk.walletBalance().then(setWallet).catch(() => setWallet(null))
    fixoSdk.walletTransactions(50, 0).then(setTxns).catch(() => setTxns([]))
  }

  useEffect(refresh, [])

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title={t('wallet.title')} back="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-2">
          <View className="rounded-3xl p-6 bg-primary">
            <View className="flex-row items-center gap-2">
              <WalletIcon size={18} color="#fff" />
              <Text className="text-[13px] text-white/80">{t('wallet.availableBalance')}</Text>
            </View>
            <Text className="text-[32px] font-extrabold text-white mt-2">{wallet ? fmtMoney(wallet.balance, wallet.currency) : '—'}</Text>
          </View>

          <Text className="text-[12px] text-muted mt-3">
            {t('wallet.creditsNote', {
              defaultValue: 'Wallet credit comes from refunds, promotions and loyalty rewards, and can be used when you pay for a booking.',
            })}
          </Text>

          <Text className="text-[16px] font-bold text-ink mt-7 mb-3">{t('wallet.recentTransactions')}</Text>
          <View className="flex-col gap-3">
            {txns === null ? (
              <View className="h-20 rounded-2xl bg-[#f5f5f5]" />
            ) : txns.length === 0 ? (
              <Text className="text-[13px] text-muted">{t('wallet.noTransactions')}</Text>
            ) : (
              txns.map((txn, i) => {
                const credit = txn.entry_type === 'CREDIT'
                return (
                  <View key={txn.entry_id ?? i} className="flex-row items-center gap-4 rounded-2xl border border-hairline p-4">
                    <View className={`items-center justify-center size-11 rounded-full shrink-0 ${credit ? 'bg-[#00B894]/10' : 'bg-[#FF6B6B]/10'}`}>
                      {credit ? <ArrowDownLeftIcon size={18} color="#00B894" /> : <ArrowUpRightIcon size={18} color="#FF6B6B" />}
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text numberOfLines={1} className="font-semibold text-ink text-[14px]">
                        {humanize(txn.entry_type)}
                      </Text>
                      <Text className="text-[12px] text-muted mt-0.5">{fmtDateTime(txn.created_at)}</Text>
                    </View>
                    <View className="items-end shrink-0">
                      <Text className={`font-bold text-[14px] ${credit ? 'text-[#00B894]' : 'text-ink'}`}>
                        {credit ? '+' : '-'}{fmtMoney(txn.amount, txn.currency)}
                      </Text>
                      <Text className="text-[11px] text-muted mt-0.5">{t('wallet.balShort', { amount: fmtMoney(txn.running_balance, txn.currency) })}</Text>
                    </View>
                  </View>
                )
              })
            )}
          </View>
        </View>
      </ScrollView>

    </SafeAreaView>
  )
}
