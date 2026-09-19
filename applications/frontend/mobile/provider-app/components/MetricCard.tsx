// Native port of web-provider's MetricCard.tsx — icon on the left, label/
// value/hint stacked to its right, same tone system and layout intent.
import type { ComponentType } from 'react'
import { Text, View } from 'react-native'
import type { IconProps } from './icons'

type Tone = 'primary' | 'success' | 'amber' | 'destructive'

const ICON_TONE: Record<Tone, { bg: string; text: string }> = {
  primary: { bg: 'rgba(114,16,255,0.1)', text: '#7210FF' },
  success: { bg: 'rgba(0,184,148,0.15)', text: '#00B894' },
  amber: { bg: 'rgba(245,158,11,0.15)', text: '#B45309' },
  destructive: { bg: 'rgba(255,107,107,0.15)', text: '#DC2626' },
}

interface MetricCardProps {
  icon: ComponentType<IconProps>
  label: string
  value: string
  hint: string
  tone?: Tone
  tintValue?: boolean
}

export default function MetricCard({ icon: Icon, label, value, hint, tone = 'primary', tintValue = false }: MetricCardProps) {
  const t = ICON_TONE[tone]
  return (
    <View
      className="flex-1 flex-row items-center gap-4 rounded-3xl bg-white p-5"
      style={{ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}
    >
      <View className="items-center justify-center rounded-2xl" style={{ width: 48, height: 48, backgroundColor: t.bg }}>
        <Icon size={22} color={t.text} />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-[13px] text-ink">{label}</Text>
        <Text className="text-[22px] font-bold" style={{ color: tintValue ? t.text : '#7210FF' }}>
          {value}
        </Text>
        <Text className="text-[13px] text-muted">{hint}</Text>
      </View>
    </View>
  )
}
