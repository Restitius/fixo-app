import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ChevronDownIcon } from './icons'
import Sheet from './Sheet'

export default function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Pressable onPress={() => setOpen(true)} className="flex-row items-center justify-between w-full rounded-2xl bg-[#f5f5f5] px-5 py-4">
        <Text className="text-[15px] text-ink">{value}</Text>
        <ChevronDownIcon size={16} color="#0B111F" />
      </Pressable>
      <Sheet open={open} onClose={() => setOpen(false)}>
        <View className="w-10 h-1 bg-hairline rounded-full self-center mb-4" />
        {options.map((o) => (
          <Pressable
            key={o}
            onPress={() => {
              onChange(o)
              setOpen(false)
            }}
            className={`px-4 py-4 rounded-2xl ${o === value ? 'bg-primary/5' : ''}`}
          >
            <Text className={`text-[15px] ${o === value ? 'text-primary font-semibold' : 'text-ink'}`}>{o}</Text>
          </Pressable>
        ))}
      </Sheet>
    </>
  )
}
