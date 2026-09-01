import { Text, View } from 'react-native'
import type { Booking } from '../data/mock'

const STYLES: Record<Booking['status'], { bg: string; text: string }> = {
  upcoming: { bg: 'rgba(114,16,255,0.08)', text: '#7210FF' },
  completed: { bg: 'rgba(0,184,148,0.1)', text: '#00B894' },
  cancelled: { bg: 'rgba(255,107,107,0.1)', text: '#FF6B6B' },
}

const LABELS: Record<Booking['status'], string> = {
  upcoming: 'Upcoming',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function StatusBadge({ status }: { status: Booking['status'] }) {
  const s = STYLES[status]
  return (
    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: s.bg }}>
      <Text className="text-[12px] font-semibold" style={{ color: s.text }}>
        {LABELS[status]}
      </Text>
    </View>
  )
}
