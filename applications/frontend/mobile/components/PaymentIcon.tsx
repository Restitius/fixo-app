import { AppleIcon, CreditCardIcon, GoogleIcon, MastercardIcon, PayPalIcon, WalletIcon } from './icons'

export default function PaymentIcon({ icon, size = 20, color = '#0B111F' }: { icon: string; size?: number; color?: string }) {
  switch (icon) {
    case 'paypal':
      return <PayPalIcon size={size} />
    case 'googlepay':
      return <GoogleIcon size={size} />
    case 'applepay':
      return <AppleIcon size={size} />
    case 'mastercard':
      return <MastercardIcon size={size} />
    case 'cash':
      return <WalletIcon size={size} color={color} />
    default:
      return <CreditCardIcon size={size} color={color} />
  }
}
