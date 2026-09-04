import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionTo?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionTo,
  compact = false,
}: EmptyStateProps) {
  const button = actionLabel ? (
    <button
      onClick={onAction}
      className="mt-5 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
      style={{ backgroundImage: "var(--gradient-primary)" }}
    >
      {actionLabel}
    </button>
  ) : null;

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 text-center animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500 ${
        compact ? "px-6 py-10" : "px-6 py-16"
      }`}
    >
      <span className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-9" strokeWidth={1.5} />
      </span>
      <h3 className="mt-5 text-lg font-bold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{description}</p>
      {actionTo && actionLabel ? (
        <Link
          to={actionTo}
          className="mt-5 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          {actionLabel}
        </Link>
      ) : (
        button
      )}
    </div>
  );
}
