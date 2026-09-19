// Status chip used across every provider list screen. Ported verbatim from
// web-provider's StatusPill.tsx — same status vocabulary and tone mapping,
// covering the real backend's status strings across services, documents,
// bookings, quotes, invoices, payouts, etc. (not the customer mobile app's
// narrow 3-value upcoming/completed/cancelled StatusBadge).
import { Text, View } from 'react-native'

export type PillTone = 'primary' | 'success' | 'amber' | 'destructive' | 'muted'

const TONES: Record<PillTone, { bg: string; text: string }> = {
  primary: { bg: 'rgba(114,16,255,0.1)', text: '#7210FF' },
  success: { bg: 'rgba(0,184,148,0.15)', text: '#00B894' },
  amber: { bg: 'rgba(245,158,11,0.15)', text: '#B45309' },
  destructive: { bg: 'rgba(255,107,107,0.15)', text: '#DC2626' },
  muted: { bg: '#f0f0f0', text: '#6C7585' },
}

const STATUS_TONES: Record<string, PillTone> = {
  VERIFIED: 'success',
  PAID: 'success',
  ACCEPTED: 'success',
  APPROVED: 'success',
  ACTIVE: 'success',
  COMPLETED: 'success',
  WORK_COMPLETED: 'success',
  AUTHORIZED: 'primary',
  CONFIRMED: 'primary',
  SUBMITTED: 'primary',
  VIEWED: 'primary',
  PROCESSING: 'primary',
  ISSUED: 'primary',
  TRAVELING: 'primary',
  ARRIVED: 'primary',
  WORK_STARTED: 'primary',
  PREPARING: 'amber',
  PENDING: 'amber',
  PENDING_APPROVAL: 'amber',
  UNDER_REVIEW: 'amber',
  MORE_INFO_REQUIRED: 'amber',
  DRAFT: 'muted',
  NOT_SUBMITTED: 'muted',
  PAUSED: 'muted',
  EXPIRED: 'muted',
  WITHDRAWN: 'muted',
  ARCHIVED: 'muted',
  CUSTOMER_CONFIRMATION: 'amber',
  REJECTED: 'destructive',
  FAILED: 'destructive',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
}

export function humanizeStatus(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(' ')
}

export default function StatusBadge({ status, tone, label }: { status?: string; tone?: PillTone; label?: string }) {
  const resolved = tone ?? (status ? STATUS_TONES[status.toUpperCase()] ?? 'muted' : 'muted')
  const { bg, text } = TONES[resolved]
  return (
    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: bg }}>
      <Text className="text-[12px] font-semibold" style={{ color: text }}>
        {label ?? (status ? humanizeStatus(status) : '')}
      </Text>
    </View>
  )
}
