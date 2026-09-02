import { useState } from 'react'
import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../../components/ScreenHeader'
import TextField from '../../../components/TextField'
import Button from '../../../components/Button'
import { CreditCardIcon, LockIcon } from '../../../components/icons'

export default function AddCard() {
  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')

  function handleSubmit() {
    router.replace('/profile/payment')
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Add New Card" back="/profile/payment" />

      <View className="flex-1 px-6 pt-4">
        <View className="rounded-3xl p-6 bg-primary">
          <CreditCardIcon size={32} color="#fff" />
          <Text className="text-[18px] tracking-[3px] font-semibold text-white mt-8">{number || '•••• •••• •••• ••••'}</Text>
          <View className="flex-row justify-between mt-4">
            <Text className="text-[12px] text-white/80">{name || 'CARD HOLDER'}</Text>
            <Text className="text-[12px] text-white/80">{expiry || 'MM/YY'}</Text>
          </View>
        </View>

        <View className="flex-col gap-4 mt-7">
          <TextField
            icon={<CreditCardIcon size={20} color="#6C7585" />}
            placeholder="Card Number"
            value={number}
            onChangeText={setNumber}
            maxLength={19}
            keyboardType="number-pad"
          />
          <TextField icon={<CreditCardIcon size={20} color="#6C7585" />} placeholder="Cardholder Name" value={name} onChangeText={setName} />
          <View className="flex-row gap-4">
            <View className="flex-1">
              <TextField icon={<CreditCardIcon size={20} color="#6C7585" />} placeholder="MM/YY" value={expiry} onChangeText={setExpiry} />
            </View>
            <View className="flex-1">
              <TextField icon={<LockIcon size={20} color="#6C7585" />} placeholder="CVV" isPassword value={cvv} onChangeText={setCvv} keyboardType="number-pad" />
            </View>
          </View>
        </View>

        <View className="flex-1" />

        <View className="pb-6 pt-6">
          <Button onPress={handleSubmit}>Save Card</Button>
        </View>
      </View>
    </SafeAreaView>
  )
}
