import type { ReactNode } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'

export default function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/50" onPress={onClose} />
        <View className="bg-white rounded-t-[28px] max-h-[85%]">
          <ScrollView className="px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

export function CenterModal({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <Modal visible={open} transparent animationType="fade">
      <View className="flex-1 items-center justify-center px-8">
        <View className="absolute inset-0 bg-black/50" />
        <View className="relative bg-white rounded-[28px] w-full items-center" style={{ maxHeight: '85%' }}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 32, paddingVertical: 40, alignItems: 'center' }}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  )
}
