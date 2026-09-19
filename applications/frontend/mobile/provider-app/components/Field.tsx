// Persistent field label — used instead of placeholder-only text so a
// filled-in value (especially a bare number) still has a legible label
// once typed. Extracted from business.tsx/profile-edit.tsx's identical
// local helper so every form can share it.
import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

export default function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View>
      <Text className="text-[12px] text-muted mb-1.5 ml-1">{label}</Text>
      {children}
    </View>
  )
}
