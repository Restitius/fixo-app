import { Pressable, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

export default function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <Pressable onPress={() => onChange(!checked)} className="flex-row items-center gap-2.5">
      <View
        className={`items-center justify-center size-5 rounded-md border-2 ${checked ? 'bg-primary border-primary' : 'border-primary bg-white'}`}
      >
        {checked && (
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M4 12.5l5 5L20 6" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        )}
      </View>
      <Text className="text-[14px] text-ink font-sans">{label}</Text>
    </Pressable>
  )
}
