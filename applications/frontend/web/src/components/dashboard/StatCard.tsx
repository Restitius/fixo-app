import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  caption: string;
  delta: string;
  deltaPositive?: boolean;
  highlight?: boolean;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  caption,
  delta,
  deltaPositive = true,
  highlight = false,
}: StatCardProps) {
  return (
    <div
      className={
        highlight
          ? "rounded-3xl p-6 text-primary-foreground shadow-[var(--shadow-card)]"
          : "rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]"
      }
      style={highlight ? { backgroundImage: "var(--gradient-primary)" } : undefined}
    >
      <div className="flex items-start justify-between">
        <span
          className={
            highlight
              ? "flex size-12 items-center justify-center rounded-2xl bg-card text-primary"
              : "flex size-12 items-center justify-center rounded-2xl bg-muted text-foreground"
          }
        >
          <Icon className="size-5" />
        </span>
        <span
          className={
            deltaPositive
              ? "rounded-full bg-success-muted px-3 py-1 text-xs font-semibold text-success-foreground"
              : "rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground"
          }
        >
          {delta}
        </span>
      </div>

      <p
        className={
          highlight ? "mt-6 text-base font-semibold" : "mt-6 text-base font-semibold"
        }
      >
        {label}
      </p>
      <div className="mt-1 flex items-end gap-3">
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p
          className={
            highlight
              ? "pb-1 text-sm leading-tight text-primary-foreground/75"
              : "pb-1 text-sm leading-tight text-muted-foreground"
          }
        >
          {caption}
        </p>
      </div>
    </div>
  );
}
