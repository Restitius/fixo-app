import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ScreenHeader from '../../components/ScreenHeader'
import Avatar from '../../components/Avatar'
import { useAuth } from '../../lib/auth-context'
import { initialsOf } from '../../lib/format'
import { MailIcon, EditIcon, PhoneIcon } from '../../components/icons'

// The backend has no endpoint to update a customer's own profile fields
// (full_name/phone/email are set at registration only), so — matching web's
// Personal Info tab exactly — this is a real, read-only display rather than
// an editable form that would silently do nothing on save.
function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3 w-full rounded-2xl bg-[#f5f5f5] px-5 py-4">
      <View className="shrink-0">{icon}</View>
      <View className="flex-1">
        <Text className="text-[11px] text-muted">{label}</Text>
        <Text className="text-[15px] text-ink font-medium mt-0.5">{value}</Text>
      </View>
    </View>
  )
}

export default function EditProfile() {
  const { customer } = useAuth()

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScreenHeader title="Personal Info" back="/(tabs)/profile" />

      <View className="flex-1 px-6 pt-2">
        <View className="self-center">
          <Avatar label={initialsOf(customer?.full_name ?? '?')} size={100} />
        </View>

        <View className="flex-col gap-4 mt-7">
          <Field icon={<EditIcon size={20} color="#6C7585" />} label="Full Name" value={customer?.full_name ?? '—'} />
          <Field icon={<MailIcon size={20} color="#6C7585" />} label="Email" value={customer?.email ?? '—'} />
          <Field icon={<PhoneIcon size={20} color="#6C7585" />} label="Phone Number" value={customer?.phone ?? '—'} />
        </View>

        <Text className="text-[12px] text-muted text-center mt-6">
          Profile details are set when you register and can't be changed from the app yet.
        </Text>
      </View>
    </SafeAreaView>
  )
}
