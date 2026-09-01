import { useState } from 'react'
import { Text, View, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import TextField from '../../components/TextField'
import Button from '../../components/Button'
import Avatar from '../../components/Avatar'
import { EditIcon, MailIcon, LocationIcon, CalendarIcon } from '../../components/icons'

export default function FillProfile() {
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title="Fill Your Profile" back="/auth/sign-up" />

      <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="self-center relative">
          <Avatar label={name || '?'} size={110} />
          <View className="absolute bottom-0 right-0 items-center justify-center size-8 rounded-full bg-primary">
            <EditIcon size={16} color="#ffffff" />
          </View>
        </View>

        <View className="gap-4 mt-8">
          <TextField icon={<EditIcon color="#6C7585" />} placeholder="Full Name" value={name} onChangeText={setName} />
          <TextField icon={<EditIcon color="#6C7585" />} placeholder="Nickname" value={nickname} onChangeText={setNickname} />
          <TextField icon={<CalendarIcon size={20} color="#6C7585" />} placeholder="Date of Birth" />
          <TextField icon={<MailIcon color="#6C7585" />} placeholder="Email" keyboardType="email-address" />
          <TextField icon={<EditIcon color="#6C7585" />} placeholder="Phone Number" keyboardType="phone-pad" />
          <TextField icon={<LocationIcon color="#6C7585" />} placeholder="Address" />
        </View>

        <View className="mt-8">
          <Button onPress={() => router.push('/auth/create-pin')}>Continue</Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
