import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg'

type IconProps = { size?: number; color?: string }
type FillableIconProps = IconProps & { filled?: boolean }

export function HomeIcon({ size = 24, color = '#0B111F', filled = false }: FillableIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-8.5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
        fillOpacity={filled ? 0.12 : 0}
      />
    </Svg>
  )
}

export function GridIcon({ size = 24, color = '#0B111F', filled = false }: FillableIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {[[3, 3], [13, 3], [3, 13], [13, 13]].map(([x, y]) => (
        <Rect key={`${x}-${y}`} x={x} y={y} width={8} height={8} rx={2.5} stroke={color} strokeWidth={1.8} fill={filled ? color : 'none'} fillOpacity={filled ? 0.12 : 0} />
      ))}
    </Svg>
  )
}

export function BookingsIcon({ size = 24, color = '#0B111F', filled = false }: FillableIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4.5} y={3.5} width={15} height={17} rx={2.5} stroke={color} strokeWidth={1.8} fill={filled ? color : 'none'} fillOpacity={filled ? 0.12 : 0} />
      <Path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

export function CalendarIcon({ size = 24, color = '#0B111F', filled = false }: FillableIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3.5} y={5} width={17} height={15} rx={2.5} stroke={color} strokeWidth={1.8} fill={filled ? color : 'none'} fillOpacity={filled ? 0.12 : 0} />
      <Path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

export function ChatBubbleIcon({ size = 24, color = '#0B111F', filled = false }: FillableIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
        fillOpacity={filled ? 0.12 : 0}
      />
    </Svg>
  )
}

export function UserIcon({ size = 24, color = '#0B111F', filled = false }: FillableIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.5} stroke={color} strokeWidth={1.8} fill={filled ? color : 'none'} fillOpacity={filled ? 0.12 : 0} />
      <Path d="M4.5 20c1-3.8 4.2-6 7.5-6s6.5 2.2 7.5 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

export function SearchIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={6.5} stroke={color} strokeWidth={1.8} />
      <Path d="M20 20l-4.3-4.3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

export function FilterIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M7 12h10M10 18h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

export function BellIcon({ size = 24, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M10 19a2 2 0 0 0 4 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

export function BookmarkIcon({ size = 20, color = '#0B111F', filled = false }: FillableIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <Path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  )
}

export function SlidersIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h10M17 7h3M4 17h3M10 17h10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={14} cy={7} r={2.2} fill="white" stroke={color} strokeWidth={1.8} />
      <Circle cx={7} cy={17} r={2.2} fill="white" stroke={color} strokeWidth={1.8} />
    </Svg>
  )
}

export function CameraIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
      <Circle cx={12} cy={13} r={3.4} stroke={color} strokeWidth={1.7} />
    </Svg>
  )
}

export function ThumbsUpIcon({ size = 16, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 20H4.5A1.5 1.5 0 0 1 3 18.5v-7A1.5 1.5 0 0 1 4.5 10H7m0 10V10m0 10 3.5 1.2c.6.2 1.2.3 1.9.3H17a2 2 0 0 0 2-1.7l1-6.5A1.5 1.5 0 0 0 18.5 11H14l.7-4.2a1.7 1.7 0 0 0-3.3-.7L9 10.5"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export function PayPalIcon({ size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 5h5.5c2.5 0 4 1.3 3.6 3.5-.5 3-2.7 4.5-5.6 4.5H9.8l-1 5H6l2-13Z" fill="#003087" />
      <Path d="M9.5 8h5c2.2 0 3.5 1.1 3.2 3.2-.4 2.6-2.4 4-5 4h-2l-.9 4.8H7.5l2-12Z" fill="#009cde" />
    </Svg>
  )
}

export function MastercardIcon({ size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={9} cy={12} r={6} fill="#EB001B" />
      <Circle cx={15} cy={12} r={6} fill="#F79E1B" fillOpacity={0.9} />
    </Svg>
  )
}

export function WalletIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={6} width={18} height={13} rx={2.5} stroke={color} strokeWidth={1.8} />
      <Path d="M3 10h18" stroke={color} strokeWidth={1.8} />
      <Circle cx={16.5} cy={14} r={1.3} fill={color} />
    </Svg>
  )
}

export function ImageIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4.5} width={18} height={15} rx={2.5} stroke={color} strokeWidth={1.7} />
      <Circle cx={8.5} cy={9.5} r={1.7} stroke={color} strokeWidth={1.7} />
      <Path d="M4 17l5-5 3.5 3.5L16 12l4 5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function CopyIcon({ size = 16, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={8.5} y={8.5} width={12} height={12} rx={2} stroke={color} strokeWidth={1.7} />
      <Path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 6v9A1.5 1.5 0 0 0 5 16.5h2.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  )
}

export function ShareIcon({ size = 16, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M12 15V3m0 0L7 8m5-5 5 5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function DownloadIcon({ size = 16, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4M12 3v12m0 0-5-5m5 5 5-5" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function PrintIcon({ size = 16, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={6} y={8.5} width={12} height={7} rx={1} stroke={color} strokeWidth={1.7} />
      <Path d="M6 9V4.5h12V9M8 15v4.5h8V15" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
      <Circle cx={15.5} cy={11} r={0.8} fill={color} />
    </Svg>
  )
}

export function HeartIcon({ size = 24, color = '#0B111F', filled = false }: FillableIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20s-7-4.4-9.5-9A5 5 0 0 1 12 6.5 5 5 0 0 1 21.5 11c-2.5 4.6-9.5 9-9.5 9Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
      />
    </Svg>
  )
}

export function StarIcon({ size = 16, filled = true, color = '#0B111F' }: FillableIconProps) {
  const starColor = filled ? '#FFB800' : color
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#FFB800' : 'none'}>
      <Path
        d="M12 2.5l2.9 6 6.6.7-4.9 4.5 1.3 6.5L12 16.9 6.1 20.2l1.3-6.5-4.9-4.5 6.6-.7 2.9-6Z"
        stroke={starColor}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function LocationIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Circle cx={12} cy={9.5} r={2.5} stroke={color} strokeWidth={1.8} />
    </Svg>
  )
}

export function TagIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11.6 3.4 20 11.8a2 2 0 0 1 0 2.8l-5.4 5.4a2 2 0 0 1-2.8 0L3.4 11.6V4a.6.6 0 0 1 .6-.6h7.6Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Circle cx={8} cy={8} r={1.4} fill={color} />
    </Svg>
  )
}

export function CreditCardIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={2.5} y={5.5} width={19} height={13} rx={2.5} stroke={color} strokeWidth={1.8} />
      <Path d="M2.5 9.5h19" stroke={color} strokeWidth={1.8} />
    </Svg>
  )
}

export function PlusIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v16M4 12h16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

export function MinusIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12h16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

export function CheckCircleIcon({ size = 24, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} stroke={color} strokeWidth={1.8} />
      <Path d="M8 12.3l2.6 2.6L16.3 9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function ChevronRightIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 5l7 7-7 7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function ChevronDownIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 9l7 7 7-7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function PhoneIcon({ size = 24, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a1 1 0 0 1-1.1 1A16 16 0 0 1 4 5.1 1 1 0 0 1 5 4Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function VideoIcon({ size = 24, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={2.5} y={6} width={13} height={12} rx={2.5} stroke={color} strokeWidth={1.8} />
      <Path d="M15.5 10.5 21 7.5v9l-5.5-3Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  )
}

export function MicIcon({ size = 24, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={9} y={3} width={6} height={11} rx={3} stroke={color} strokeWidth={1.8} />
      <Path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

export function MoreHorizontalIcon({ size = 24, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx={5} cy={12} r={1.8} />
      <Circle cx={12} cy={12} r={1.8} />
      <Circle cx={19} cy={12} r={1.8} />
    </Svg>
  )
}

export function EditIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20l.7-3.5L16 5.2a1.5 1.5 0 0 1 2.1 0l.7.7a1.5 1.5 0 0 1 0 2.1L7.5 19.3 4 20Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function GlobeIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
      <Path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" stroke={color} strokeWidth={1.8} />
    </Svg>
  )
}

export function ShieldIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5l7.5 3v6c0 5-3.2 8.5-7.5 10-4.3-1.5-7.5-5-7.5-10v-6l7.5-3Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function GiftIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={9.5} width={18} height={11} rx={1.5} stroke={color} strokeWidth={1.8} />
      <Path d="M3 13h18M12 9.5V21" stroke={color} strokeWidth={1.8} />
      <Path d="M12 9.5c-3 0-4-1.3-4-2.8A2.2 2.2 0 0 1 10.2 4.5c1.6 0 1.8 2.5 1.8 5Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M12 9.5c3 0 4-1.3 4-2.8A2.2 2.2 0 0 0 13.8 4.5c-1.6 0-1.8 2.5-1.8 5Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  )
}

export function HelpCircleIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} stroke={color} strokeWidth={1.8} />
      <Path d="M9.5 9.3a2.5 2.5 0 1 1 3.7 2.2c-.8.5-1.2.9-1.2 1.9" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={12} cy={17} r={1} fill={color} />
    </Svg>
  )
}

export function LogoutIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M15 16l4-4-4-4M19 12H9" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function SendIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 20l17-8L4 4l2 8-2 8Zm2-8h10" stroke={color} strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  )
}

export function CalendarEmptyIllustration({ size = 160 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <Circle cx={80} cy={80} r={78} fill="#7210FF" fillOpacity={0.06} />
      <Rect x={35} y={45} width={90} height={80} rx={10} fill="white" stroke="#7210FF" strokeWidth={3} />
      <Rect x={35} y={45} width={90} height={24} rx={10} fill="#7210FF" />
      <Circle cx={60} cy={57} r={3} fill="white" />
      <Circle cx={100} cy={57} r={3} fill="white" />
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <Rect key={`${row}-${col}`} x={48 + col * 18} y={82 + row * 16} width={10} height={10} rx={2} fill="#7210FF" fillOpacity={(row + col) % 3 === 0 ? 0.9 : 0.15} />
        )),
      )}
    </Svg>
  )
}

export function FingerprintIcon({ size = 160 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <Defs>
        <LinearGradient id="fpGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#A970FF" />
          <Stop offset="1" stopColor="#7210FF" />
        </LinearGradient>
      </Defs>
      {[
        'M100 30c-27 0-42 14-48 24',
        'M60 45c-10 12-16 26-16 44v10',
        'M148 45c10 13 16 30 16 48',
        'M76 34c8-4 16-6 24-6s16 2 24 6',
        'M50 130c-4-12-6-26-6-38',
        'M156 92c0 30-6 48-16 62',
        'M70 165c-10-14-18-32-18-55',
        'M100 55c-25 0-42 18-42 45 0 30 10 55 26 72',
        'M100 55c25 0 42 18 42 45 0 14-2 26-6 36',
        'M100 78c-16 0-26 12-26 28 0 26 8 46 20 60',
        'M100 78c16 0 26 12 26 28 0 10-1 19-3 27',
        'M100 100c-8 0-13 6-13 15 0 18 6 32 16 44',
      ].map((d, i) => (
        <Path key={i} d={d} stroke="url(#fpGrad)" strokeWidth={7} strokeLinecap="round" />
      ))}
    </Svg>
  )
}

export function ArrowLeftIcon({ size = 24, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12H4M4 12L10 6M4 12L10 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function ClockIcon({ size = 24, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
      <Path d="M12 7v5l3.5 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function XCircleIcon({ size = 24, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
      <Path d="M9.5 9.5l5 5M14.5 9.5l-5 5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

export function FileTextIcon({ size = 24, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M14 3v4h4M8 12h8M8 15.5h8M8 8.5h3" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  )
}

export function HistoryIcon({ size = 24, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 3-6.7" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M3 4v4h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 8v4.5l3 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function AwardIcon({ size = 24, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={5.5} stroke={color} strokeWidth={1.8} />
      <Path d="M9 12.5L7.5 21l4.5-2.5 4.5 2.5-1.5-8.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function ArrowUpRightIcon({ size = 24, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 17L17 7M17 7H9M17 7V15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function ArrowDownLeftIcon({ size = 24, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 7L7 17M7 17H15M7 17V9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function MailIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={2.5} y={4.5} width={19} height={15} rx={3} stroke={color} strokeWidth={1.7} />
      <Path d="M4 7l8 6 8-6" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function LockIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={10.5} width={16} height={10} rx={2.5} stroke={color} strokeWidth={1.7} />
      <Path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  )
}

export function EyeIcon({ size = 20, color = '#0B111F', off = false }: IconProps & { off?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.7} />
      {off && <Path d="M3 3l18 18" stroke={color} strokeWidth={1.7} strokeLinecap="round" />}
    </Svg>
  )
}

export function ChatIcon({ size = 24, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12a8 8 0 1 1 3.2 6.4L4 20l1.3-3.6A7.96 7.96 0 0 1 4 12Z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
      <Circle cx={8.5} cy={12} r={1} fill={color} />
      <Circle cx={12} cy={12} r={1} fill={color} />
      <Circle cx={15.5} cy={12} r={1} fill={color} />
    </Svg>
  )
}

export function MessageIcon(props: IconProps) {
  return <MailIcon {...props} />
}

export function ShieldCheckIcon({ size = 40, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5l7.5 3v6c0 5-3.2 8.5-7.5 10-4.3-1.5-7.5-5-7.5-10v-6l7.5-3Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M8.5 12.2l2.4 2.4 4.6-4.8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function BackspaceIcon({ size = 20, color = '#0B111F' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6.5-6.3a1 1 0 0 1 0-1.4L9 5Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M12 10l5 5m0-5l-5 5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  )
}

export function FacebookIcon({ size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={12} fill="#1877F2" />
      <Path
        d="M13.6 21.5v-7.3h2.4l.4-2.9h-2.8v-1.8c0-.8.2-1.4 1.4-1.4h1.5V5.6c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8.2v2.9h2.4v7.3h3Z"
        fill="#fff"
      />
    </Svg>
  )
}

export function GoogleIcon({ size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21.6 12.2c0-.7-.06-1.4-.19-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.4h3.2c1.9-1.7 3-4.3 3-7.2Z" fill="#4285F4" />
      <Path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" fill="#34A853" />
      <Path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z" fill="#FBBC05" />
      <Path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 3 14.7 2 12 2A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.8 9.4 6 12 6Z" fill="#EA4335" />
    </Svg>
  )
}

export function AppleIcon({ size = 20 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M16.7 12.7c0-2 1.6-3 1.7-3.1-.9-1.3-2.4-1.5-2.9-1.5-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.7-.7-1.4 0-2.6.8-3.3 2-1.4 2.5-.4 6.1 1 8.1.7 1 1.5 2.1 2.6 2 1-.1 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.6 1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3-.1 0-2.1-.8-2.4-3.1ZM14.4 6.4c.6-.7 1-1.7.9-2.7-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.6-1 2.6 1 .1 2-.5 2.7-1.2Z"
        fill="#000"
      />
    </Svg>
  )
}
