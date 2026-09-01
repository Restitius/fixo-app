// Shared metric card for list/ledger pages (Bookings, Payments, Invoices,
// Wallet, History, Loyalty, ...) — icon on the left, label/value/hint
// stacked to its right. The value is always rendered in the primary color
// regardless of the icon's tone, matching the reference design exactly.
// Distinct from StatCard (the delta/caption card used on the home dashboard).
import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "success" | "amber" | "destructive";

const ICON_TONE: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  amber: "bg-amber-500/15 text-amber-600",
  destructive: "bg-destructive/15 text-destructive",
};

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  tone?: Tone;
  /** Gradient "hero" variant (e.g. a wallet balance card) — white text on the brand gradient. */
  hero?: boolean;
}

export function MetricCard({ icon: Icon, label, value, hint, tone = "primary", hero = false }: MetricCardProps) {
  return (
    <div
      className={`flex items-center gap-4 rounded-3xl p-5 shadow-[var(--shadow-card)] ${hero ? "text-primary-foreground" : "bg-card"}`}
      style={hero ? { backgroundImage: "var(--gradient-primary)" } : undefined}
    >
      <span
        className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${hero ? "bg-white/15" : ICON_TONE[tone]}`}
      >
        <Icon className="size-6" />
      </span>
      <div className="min-w-0">
        <p className={`text-sm ${hero ? "text-primary-foreground/90" : "text-foreground"}`}>{label}</p>
        <p className={`text-2xl font-bold tracking-tight ${hero ? "text-primary-foreground" : "text-primary"}`}>{value}</p>
        <p className={`text-sm ${hero ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{hint}</p>
      </div>
    </div>
  );
}
