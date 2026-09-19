import { useEffect, useRef, useState } from 'react'
import { View, Text } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import Avatar from '../../components/Avatar'
import TextField from '../../components/TextField'
import Button from '../../components/Button'
import { useAuth, ApiError } from '../../lib/auth-context'
import { initialsOf } from '../../lib/format'
import { MailIcon, EditIcon, PhoneIcon } from '../../components/icons'

export default function EditProfile() {
  const { t } = useTranslation('profile')
  const { customer, updateProfile } = useAuth()
  const [fullName, setFullName] = useState(customer?.full_name ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // customer loads asynchronously from storage, so seed the fields once it
  // actually arrives instead of only at mount (when it's still null).
  const seeded = useRef(false)
  useEffect(() => {
    if (customer && !seeded.current) {
      seeded.current = true
      setFullName(customer.full_name ?? '')
      setPhone(customer.phone ?? '')
    }
  }, [customer])

  const dirty = fullName.trim() !== (customer?.full_name ?? '') || phone.trim() !== (customer?.phone ?? '')

  async function save() {
    setError(null)
    if (fullName.trim().length < 2) {
      setError(t('editProfile.nameError'))
      return
    }
    setLoading(true)
    try {
      await updateProfile({ full_name: fullName.trim(), phone: phone.trim() })
      router.back()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('editProfile.genericError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title={t('editProfile.title')} back="/(tabs)/profile" />

      <View className="flex-1 px-6 pt-2">
        <View className="self-center">
          <Avatar label={initialsOf(fullName || '?')} size={100} />
        </View>

        <View className="flex-col gap-4 mt-7">
          <TextField icon={<EditIcon size={20} color="#6C7585" />} placeholder={t('editProfile.fullNamePlaceholder')} value={fullName} onChangeText={setFullName} />
          <TextField icon={<PhoneIcon size={20} color="#6C7585" />} placeholder={t('editProfile.phonePlaceholder')} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

          <View className="flex-row items-center gap-3 w-full rounded-2xl bg-[#f5f5f5] px-5 py-4 opacity-60">
            <MailIcon size={20} color="#6C7585" />
            <View className="flex-1">
              <Text className="text-[11px] text-muted">{t('editProfile.email')}</Text>
              <Text className="text-[15px] text-ink font-medium mt-0.5">{customer?.email ?? '—'}</Text>
            </View>
          </View>
        </View>

        {error && <Text className="text-center text-[13px] text-red-500 mt-4">{error}</Text>}
        <Text className="text-[12px] text-muted text-center mt-3">{t('editProfile.emailImmutableNotice')}</Text>

        <View className="flex-1" />

        <View className="pb-10 pt-6">
          <Button onPress={save} loading={loading} disabled={!dirty}>{t('editProfile.saveChanges')}</Button>
        </View>
      </View>
    </SafeAreaView>
  )
}
