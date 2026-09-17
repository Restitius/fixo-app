import { Switch } from 'react-native'

export default function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Switch
      value={checked}
      onValueChange={onChange}
      trackColor={{ false: '#e0e0e0', true: '#7210FF' }}
      thumbColor="#ffffff"
    />
  )
}
