import { useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import TextField from '../../components/TextField'
import Button from '../../components/Button'
import Avatar from '../../components/Avatar'
import { EditIcon, LocationIcon, MailIcon } from '../../components/icons'
import { USER } from '../../data/mock'

export default function EditProfile() {
  const [name, setName] = useState(USER.name)
  const [email, setEmail] = useState(USER.email)
  const [phone, setPhone] = useState(USER.phone)
  const [address, setAddress] = useState(USER.address)
  const [saved, setSaved] = useState(false)

  function handleSubmit() {
    setSaved(true)
    setTimeout(() => router.replace('/(tabs)/profile'), 900)
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Edit Profile" back="/(tabs)/profile" />

      <View className="flex-1 px-6 pt-2">
        <View className="relative self-center">
          <Avatar label={name} size={100} />
          <View className="absolute bottom-0 right-0 items-center justify-center size-8 rounded-full bg-primary">
            <EditIcon size={16} color="#fff" />
          </View>
        </View>

        <View className="flex-col gap-4 mt-7">
          <TextField icon={<EditIcon size={20} color="#6C7585" />} placeholder="Full Name" value={name} onChangeText={setName} />
          <TextField icon={<MailIcon size={20} color="#6C7585" />} keyboardType="email-address" placeholder="Email" value={email} onChangeText={setEmail} />
          <TextField icon={<EditIcon size={20} color="#6C7585" />} placeholder="Phone Number" value={phone} onChangeText={setPhone} />
          <TextField icon={<LocationIcon size={20} color="#6C7585" />} placeholder="Address" value={address} onChangeText={setAddress} />
        </View>

        <View className="flex-1" />

        <View className="pb-6 pt-6">
          <Button onPress={handleSubmit}>{saved ? 'Saved!' : 'Save Changes'}</Button>
        </View>
      </View>
    </SafeAreaView>
  )
}
