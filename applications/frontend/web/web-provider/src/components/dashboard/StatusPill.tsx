// Small status chip used across every provider list module.
export type PillTone = "primary" | "success" | "amber" | "destructive" | "muted";

const TONES: Record<PillTone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  amber: "bg-amber-500/15 text-amber-600",
  destructive: "bg-destructive/15 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

const STATUS_TONES: Record<string, PillTone> = {
  VERIFIED: "success",
  PAID: "success",
  ACCEPTED: "success",
  APPROVED: "success",
  ACTIVE: "success",
  COMPLETED: "success",
  WORK_COMPLETED: "success",
  AUTHORIZED: "primary",
  CONFIRMED: "primary",
  SUBMITTED: "primary",
  VIEWED: "primary",
  PROCESSING: "primary",
  ISSUED: "primary",
  TRAVELING: "primary",
  ARRIVED: "primary",
  WORK_STARTED: "primary",
  PREPARING: "amber",
  PENDING: "amber",
  UNDER_REVIEW: "amber",
  MORE_INFO_REQUIRED: "amber",
  DRAFT: "muted",
  NOT_SUBMITTED: "muted",
  PAUSED: "muted",
  EXPIRED: "muted",
  WITHDRAWN: "muted",
  CUSTOMER_CONFIRMATION: "amber",
  REJECTED: "destructive",
  FAILED: "destructive",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export function humanizeStatus(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join(" ");
}

export function StatusPill({ status, tone, label }: { status?: string; tone?: PillTone; label?: string }) {
  const resolved = tone ?? (status ? (STATUS_TONES[status.toUpperCase()] ?? "muted") : "muted");
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${TONES[resolved]}`}>
      {label ?? (status ? humanizeStatus(status) : "")}
    </span>
  );
}
