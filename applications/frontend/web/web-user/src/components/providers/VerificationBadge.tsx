import { BadgeCheck, ShieldQuestion } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Shows a provider's real verification state; never implies "verified" by default. */
export function VerificationBadge({
  verified,
  compact = false,
}: {
  verified?: boolean | null | undefined;
  compact?: boolean;
}) {
  const { t } = useTranslation("booking");
  const label = verified
    ? t("provider.verified", { defaultValue: "Verified" })
    : t("provider.notVerified", { defaultValue: "Not yet verified" });
  const Icon = verified ? BadgeCheck : ShieldQuestion;
  return (
    <span
      data-testid={verified ? "provider-verified" : "provider-unverified"}
      title={label}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        verified ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      }`}
    >
      <Icon className="size-3.5" />
      {!compact && label}
    </span>
  );
}
