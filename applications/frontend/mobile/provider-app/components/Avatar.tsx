import { Text, View } from 'react-native'

const PALETTE = ['#7210FF', '#00B894', '#0984E3', '#E17055', '#FDCB6E', '#A29BFE', '#FF6B35']

function colorFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export default function Avatar({ label, size = 48 }: { label: string; size?: number }) {
  return (
    <View
      style={{ width: size, height: size, backgroundColor: colorFor(label), borderRadius: size / 2 }}
      className="items-center justify-center shrink-0"
    >
      <Text style={{ fontSize: size * 0.36 }} className="text-white font-bold">
        {label.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  )
}
