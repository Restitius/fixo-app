import { useState, type ReactNode } from 'react'
import { Pressable, TextInput, View, type TextInputProps } from 'react-native'
import { EyeIcon } from './icons'

type Props = TextInputProps & {
  icon: ReactNode
  isPassword?: boolean
}

export default function TextField({ icon, isPassword = false, ...rest }: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <View className="flex-row items-center gap-3 w-full rounded-2xl bg-[#f5f5f5] px-5 py-4">
      <View className="shrink-0">{icon}</View>
      <TextInput
        secureTextEntry={isPassword && !visible}
        placeholderTextColor="#9e9e9e"
        className="flex-1 text-[16px] text-ink font-sans"
        {...rest}
      />
      {isPassword && (
        <Pressable onPress={() => setVisible((v) => !v)} className="shrink-0">
          <EyeIcon size={20} color="#6C7585" off={!visible} />
        </Pressable>
      )}
    </View>
  )
}
