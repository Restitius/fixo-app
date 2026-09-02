import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import Button from '../../components/Button'
import Sheet from '../../components/Sheet'
import { ArrowDownLeftIcon, ArrowUpRightIcon, WalletIcon } from '../../components/icons'
import { WALLET, WALLET_TRANSACTIONS, type WalletTxn } from '../../data/mock'

export default function Wallet() {
  const [balance, setBalance] = useState(WALLET.balance)
  const [txns, setTxns] = useState<WalletTxn[]>(WALLET_TRANSACTIONS)
  const [sheet, setSheet] = useState<'topup' | 'withdraw' | null>(null)
  const [amount, setAmount] = useState('')

  function submit() {
    const value = Number(amount)
    if (!value || value <= 0 || !sheet) return
    const nextBalance = sheet === 'topup' ? balance + value : Math.max(0, balance - value)
    setBalance(nextBalance)
    setTxns((prev) => [
      {
        id: `local-${prev.length}`,
        entryType: sheet === 'topup' ? 'credit' : 'debit',
        amount: value,
        runningBalance: nextBalance,
        note: sheet === 'topup' ? 'Wallet top-up' : 'Wallet withdrawal',
        date: 'Just now',
      },
      ...prev,
    ])
    setAmount('')
    setSheet(null)
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Wallet" back="/(tabs)/profile" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-6 pt-2">
          <View className="rounded-3xl p-6 bg-primary">
            <View className="flex-row items-center gap-2">
              <WalletIcon size={18} color="#fff" />
              <Text className="text-[13px] text-white/80">Available Balance</Text>
            </View>
            <Text className="text-[32px] font-extrabold text-white mt-2">${balance.toFixed(2)}</Text>
            <View className="flex-row gap-3 mt-5">
              <Pressable onPress={() => setSheet('topup')} className="flex-1 items-center rounded-xl bg-white/15 py-3">
                <Text className="text-[14px] font-bold text-white">Top Up</Text>
              </Pressable>
              <Pressable onPress={() => setSheet('withdraw')} className="flex-1 items-center rounded-xl bg-white/15 py-3">
                <Text className="text-[14px] font-bold text-white">Withdraw</Text>
              </Pressable>
            </View>
          </View>

          <Text className="text-[16px] font-bold text-ink mt-7 mb-3">Recent Transactions</Text>
          <View className="flex-col gap-3">
            {txns.map((t) => (
              <View key={t.id} className="flex-row items-center gap-4 rounded-2xl border border-hairline p-4">
                <View className={`items-center justify-center size-11 rounded-full shrink-0 ${t.entryType === 'credit' ? 'bg-[#00B894]/10' : 'bg-[#FF6B6B]/10'}`}>
                  {t.entryType === 'credit' ? (
                    <ArrowDownLeftIcon size={18} color="#00B894" />
                  ) : (
                    <ArrowUpRightIcon size={18} color="#FF6B6B" />
                  )}
                </View>
                <View className="flex-1 min-w-0">
                  <Text numberOfLines={1} className="font-semibold text-ink text-[14px]">
                    {t.note}
                  </Text>
                  <Text className="text-[12px] text-muted mt-0.5">{t.date}</Text>
                </View>
                <View className="items-end shrink-0">
                  <Text className={`font-bold text-[14px] ${t.entryType === 'credit' ? 'text-[#00B894]' : 'text-ink'}`}>
                    {t.entryType === 'credit' ? '+' : '-'}${t.amount.toFixed(2)}
                  </Text>
                  <Text className="text-[11px] text-muted mt-0.5">Bal ${t.runningBalance.toFixed(2)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Sheet open={sheet !== null} onClose={() => setSheet(null)}>
        <View className="w-10 h-1 bg-hairline rounded-full self-center mb-6" />
        <Text className="text-[18px] font-bold text-ink text-center">{sheet === 'topup' ? 'Top Up Wallet' : 'Withdraw Funds'}</Text>
        <View className="flex-row items-center gap-3 rounded-2xl bg-[#f5f5f5] px-5 py-4 mt-5">
          <Text className="text-[15px] text-muted">$</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#9e9e9e"
            className="flex-1 text-[15px] text-ink"
          />
        </View>
        <View className="mt-6">
          <Button onPress={submit} disabled={!Number(amount)}>
            {sheet === 'topup' ? 'Top Up' : 'Withdraw'}
          </Button>
        </View>
      </Sheet>
    </SafeAreaView>
  )
}
