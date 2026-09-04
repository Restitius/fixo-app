// Loyalty — points balance, tier progress, rewards catalog, and points ledger.
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Award,
  Check,
  ChevronRight,
  Crown,
  FileText,
  Gift,
  Info,
  Plus,
  Send,
  Sparkles,
  Star,
  Stethoscope,
  Ticket,
  TrendingUp,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type LoyaltyAccount, type LoyaltyTxn } from "@/lib/api-client";
import { fmtDate, fmtDateTime, fmtPoints, humanize } from "@/lib/format";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

export const Route = createFileRoute("/loyalty")({
  component: LoyaltyPage,
});

// The backend's `tier` column is a static default ("SILVER") — nothing ever
// recalculates it from points. This ladder is a disclosed, client-defined
// progression used only to show "points to next tier"; it doesn't override
// or contradict any real backend rule because none exists.
// Tier names (Bronze/Silver/Gold/Platinum) are treated like account data —
// the same enum-style values shown untranslated on the Profile page — so
// they stay in English here too and are only interpolated into translated
// sentences, never routed through t() themselves.
const TIER_LADDER = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 1000 },
  { name: "Gold", min: 3000 },
  { name: "Platinum", min: 6000 },
] as const;

function tierBenefits(tierLabel: string, t: TFunction): string[] {
  const result = t(`loyalty.tierBenefits.${tierLabel}`, { returnObjects: true, defaultValue: [] });
  return Array.isArray(result) ? (result as string[]) : [];
}

// A disclosed, hardcoded reward catalog — there's no backend rewards-catalog
// domain, so this is product config (like a price list), not user data.
// Redeeming spends real points via the real loyalty API. Labels are looked
// up from the "rewards" namespace by labelKey at render time.
const REWARD_CATALOG = [
  { id: "discount-5000", icon: Ticket, labelKey: "discount5000", labelOptions: { amount: "5,000" } as Record<string, unknown> | undefined, cost: 3000, activity: "REWARD_DISCOUNT_5000" },
  { id: "priority-booking", icon: Crown, labelKey: "priorityBooking", labelOptions: undefined as Record<string, unknown> | undefined, cost: 2000, activity: "REWARD_PRIORITY_BOOKING" },
  { id: "free-inspection", icon: Stethoscope, labelKey: "freeInspection", labelOptions: undefined as Record<string, unknown> | undefined, cost: 1500, activity: "REWARD_FREE_INSPECTION" },
] as const;

function rewardLabel(r: (typeof REWARD_CATALOG)[number], t: TFunction): string {
  return r.labelOptions ? t(`loyalty.rewardCatalog.${r.labelKey}`, r.labelOptions) : t(`loyalty.rewardCatalog.${r.labelKey}`);
}

function tierIndex(tierName: string) {
  const i = TIER_LADDER.findIndex((t) => t.name.toLowerCase() === tierName.toLowerCase());
  return i === -1 ? 0 : i;
}

function activityIcon(activity: string) {
  const a = activity.toUpperCase();
  if (a.includes("REFERRAL")) return { icon: Users, className: "bg-success/15 text-success" };
  if (a.includes("REWARD") || a.includes("VOUCHER") || a.includes("REDEEM")) return { icon: Ticket, className: "bg-amber-500/15 text-amber-600" };
  if (a.includes("AC") || a.includes("MAINTENANCE")) return { icon: Sparkles, className: "bg-primary/10 text-primary" };
  return { icon: Wrench, className: "bg-primary/10 text-primary" };
}

function LoyaltyPage() {
  const { t } = useTranslation("rewards");
  const { access_token, loading, logout, customer } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [txns, setTxns] = useState<LoyaltyTxn[] | null>(null);
  const [showEarn, setShowEarn] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<LoyaltyTxn | null>(null);

  const load = useCallback(async () => {
    try {
      const [acc, list] = await Promise.all([fixoSdk.loyaltyAccount(), fixoSdk.loyaltyTransactions(100, 0)]);
      setAccount(acc);
      setTxns(list);
    } catch {
      setTxns((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    if (access_token && !loading) void load();
  }, [access_token, loading, load]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t("loyalty.loading")}</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const tier = account?.tier ?? "SILVER";
  const balance = account?.points_balance ?? 0;
  const curIdx = tierIndex(tier);
  const nextTier = TIER_LADDER[curIdx + 1];
  const progressPct = nextTier
    ? Math.min(100, Math.round(((balance - TIER_LADDER[curIdx]!.min) / (nextTier.min - TIER_LADDER[curIdx]!.min)) * 100))
    : 100;

  const now = new Date();
  const earnedThisMonth = (txns ?? [])
    .filter((t) => t.points > 0 && new Date(t.created_at).getMonth() === now.getMonth() && new Date(t.created_at).getFullYear() === now.getFullYear())
    .reduce((s, t) => s + t.points, 0);
  const earnedThisMonthCount = (txns ?? []).filter(
    (t) => t.points > 0 && new Date(t.created_at).getMonth() === now.getMonth() && new Date(t.created_at).getFullYear() === now.getFullYear(),
  ).length;
  const redeemedTotal = (txns ?? []).filter((t) => t.points < 0).reduce((s, t) => s + Math.abs(t.points), 0);
  const redeemedCount = (txns ?? []).filter((t) => t.points < 0).length;
  const memberSince = (txns ?? []).length > 0 ? txns![txns!.length - 1]!.created_at : null;

  return (
    <PageShell title={t("loyalty.page.title")} subtitle={t("loyalty.page.subtitle")} userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Star} label={t("loyalty.metrics.pointsBalance")} hint={t("loyalty.metrics.availableNow")} value={fmtPoints(balance)} tintValue />
        <MetricCard
          icon={Award}
          label={t("loyalty.metrics.tierStatus")}
          hint={nextTier ? t("loyalty.metrics.ptsToTier", { points: fmtPoints(nextTier.min - balance), tier: nextTier.name }) : t("loyalty.metrics.topTier")}
          value={humanize(tier)}
          tone="primary"
          tintValue
        />
        <MetricCard
          icon={TrendingUp}
          label={t("loyalty.metrics.earnedThisMonth")}
          hint={t("loyalty.metrics.fromActivities", { count: earnedThisMonthCount })}
          value={fmtPoints(earnedThisMonth)}
          tone="success"
          tintValue
        />
        <MetricCard
          icon={Gift}
          label={t("loyalty.metrics.redeemed")}
          hint={t("loyalty.metrics.rewardsUsed", { count: redeemedCount })}
          value={fmtPoints(redeemedTotal)}
          tone="amber"
          tintValue
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Tier + quick actions card */}
        <div className="overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]">
          <div className="relative overflow-hidden p-6 text-primary-foreground" style={{ backgroundImage: "var(--gradient-primary)" }}>
            <Trophy className="absolute -right-4 -top-4 size-32 text-white/10" />
            <div className="relative flex items-center gap-3">
              <span className="flex size-14 items-center justify-center rounded-full bg-white/15">
                <Award className="size-7" />
              </span>
              <div>
                <p className="text-sm opacity-80">{t("loyalty.tierCard.currentTier")}</p>
                <p className="text-2xl font-bold">{t("loyalty.tierCard.tierName", { tier: humanize(tier) })}</p>
              </div>
            </div>
            <div className="relative mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-90">
                  {nextTier ? t("loyalty.tierCard.progressToTier", { tier: nextTier.name }) : t("loyalty.tierCard.reachedTopTier")}
                </span>
              </div>
              <Progress value={progressPct} className="mt-2 bg-white/25 [&>div]:bg-white" />
              <p className="mt-2 text-sm opacity-90">
                {t("loyalty.tierCard.ptsOfPts", { balance: fmtPoints(balance), target: fmtPoints(nextTier ? nextTier.min : balance) })}
              </p>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-semibold">{t("loyalty.tierCard.quickActions")}</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowEarn(true)}
                className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                <Sparkles className="size-4" /> {t("loyalty.tierCard.earnPoints")}
              </button>
              <button
                onClick={() => setShowRedeem(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-primary py-3 text-sm font-semibold text-primary hover:bg-primary/5"
              >
                <Gift className="size-4" /> {t("loyalty.tierCard.redeemReward")}
              </button>
            </div>
            <button
              onClick={() => setShowRules((v) => !v)}
              className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-primary hover:underline"
            >
              <FileText className="size-4" /> {t("loyalty.tierCard.viewRules")}
            </button>
            {showRules && (
              <ul className="mt-2 space-y-1 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                {tierBenefits(humanize(tier), t).map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
              {t("loyalty.tierCard.conversionNote")}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t("loyalty.activity.recentActivity")}</h3>
              <button
                onClick={() => navigate({ to: "/history", search: { category: "loyalty" } })}
                className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                {t("loyalty.activity.viewAll")} <ChevronRight className="size-3.5" />
              </button>
            </div>

            {txns === null ? (
              <div className="mt-4 h-40 animate-pulse rounded-2xl bg-muted/60" />
            ) : txns.length === 0 ? (
              <div className="mt-6 flex flex-col items-center py-6 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Award className="size-7" strokeWidth={1.5} />
                </span>
                <p className="mt-3 font-semibold">{t("loyalty.activity.noActivityYet")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("loyalty.activity.noActivityHint")}</p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 font-semibold">{t("loyalty.activity.columnActivity")}</th>
                      <th className="pb-2 font-semibold">{t("loyalty.activity.columnDate")}</th>
                      <th className="pb-2 font-semibold">{t("loyalty.activity.columnPoints")}</th>
                      <th className="pb-2 font-semibold">{t("loyalty.activity.columnStatus")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.slice(0, 4).map((t2, i) => {
                      const { icon: Icon, className } = activityIcon(t2.activity);
                      return (
                        <tr key={t2.txn_id ?? i} onClick={() => setSelectedTxn(t2)} className="cursor-pointer border-t border-border hover:bg-muted/40">
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${className}`}>
                                <Icon className="size-4" />
                              </span>
                              <span className="font-medium">{humanize(t2.activity)}</span>
                            </div>
                          </td>
                          <td className="py-3 text-muted-foreground">{fmtDate(t2.created_at)}</td>
                          <td className={`py-3 font-semibold ${t2.points > 0 ? "text-success" : "text-destructive"}`}>
                            {t2.points > 0 ? "+" : "−"}
                            {fmtPoints(Math.abs(t2.points))}
                          </td>
                          <td className="py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                t2.points > 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                              }`}
                            >
                              {t2.points > 0 ? t("loyalty.activity.earned") : t("loyalty.activity.redeemed")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t("loyalty.rewards.availableRewards")}</h3>
              <button onClick={() => setShowRedeem(true)} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                {t("loyalty.rewards.viewAllRewards")} <ChevronRight className="size-3.5" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {REWARD_CATALOG.slice(0, 2).map((r) => (
                <button
                  key={r.id}
                  onClick={() => setShowRedeem(true)}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-border p-4 text-left hover:bg-muted/40"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <r.icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{rewardLabel(r, t)}</p>
                      <p className="text-xs text-muted-foreground">{t("loyalty.rewards.minPts", { points: fmtPoints(r.cost) })}</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <EarnPointsDialog open={showEarn} onOpenChange={setShowEarn} onEarned={load} />
      <RedeemRewardDialog open={showRedeem} onOpenChange={setShowRedeem} balance={balance} onRedeemed={load} />
      <ActivityDetailSheet
        txn={selectedTxn}
        tier={tier}
        balance={balance}
        nextTier={nextTier}
        progressPct={progressPct}
        memberSince={memberSince}
        onOpenChange={(o) => !o && setSelectedTxn(null)}
      />
    </PageShell>
  );
}

function EarnPointsDialog({ open, onOpenChange, onEarned }: { open: boolean; onOpenChange: (v: boolean) => void; onEarned: () => void }) {
  const { t } = useTranslation("rewards");
  const [points, setPoints] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const n = Number(points);
    if (!n || n <= 0) {
      toast.error(t("loyalty.earnDialog.enterPointsFirst"));
      return;
    }
    setBusy(true);
    try {
      const row = await fixoSdk.loyaltyEarn(n);
      toast.success(t("loyalty.earnDialog.earnedToast", { points: fmtPoints(row.points), balance: fmtPoints(row.running_total) }));
      setPoints("");
      onOpenChange(false);
      onEarned();
    } catch {
      // toast emitted by client
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("loyalty.earnDialog.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label htmlFor="earn-pts">{t("loyalty.earnDialog.pointsLabel")}</Label>
          <Input id="earn-pts" type="number" min="1" inputMode="numeric" placeholder={t("loyalty.earnDialog.placeholder")} value={points} onChange={(e) => setPoints(e.target.value)} />
          <button
            onClick={() => void submit()}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Plus className="size-4" /> {busy ? t("loyalty.earnDialog.adding") : t("loyalty.earnDialog.addPoints")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RedeemRewardDialog({
  open,
  onOpenChange,
  balance,
  onRedeemed,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  balance: number;
  onRedeemed: () => void;
}) {
  const { t } = useTranslation("rewards");
  const [selected, setSelected] = useState<(typeof REWARD_CATALOG)[number]>(REWARD_CATALOG[1]);
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);

  const remaining = balance - selected.cost;

  async function redeem() {
    if (balance < selected.cost) {
      toast.error(t("loyalty.redeemDialog.notEnoughPoints"));
      return;
    }
    if (!consent) {
      toast.error(t("loyalty.redeemDialog.confirmDeduction"));
      return;
    }
    setBusy(true);
    try {
      await fixoSdk.loyaltySpend(selected.cost, selected.activity);
      toast.success(t("loyalty.redeemDialog.redeemedToast", { reward: rewardLabel(selected, t) }));
      onOpenChange(false);
      onRedeemed();
    } catch {
      // toast emitted by client
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("loyalty.redeemDialog.title")}</DialogTitle>
        </DialogHeader>
        <p className="-mt-3 text-sm text-muted-foreground">{t("loyalty.redeemDialog.subtitle")}</p>

        <div className="rounded-2xl bg-primary/5 p-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xl font-bold text-primary">
            <Star className="size-5 fill-current" /> {t("loyalty.ptsValue", { points: fmtPoints(balance) })}
          </p>
          <p className="text-sm text-muted-foreground">{t("loyalty.redeemDialog.currentBalance")}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {REWARD_CATALOG.map((r) => {
            const disabled = balance < r.cost;
            const isSelected = selected.id === r.id;
            return (
              <button
                key={r.id}
                disabled={disabled}
                onClick={() => setSelected(r)}
                className={`relative rounded-2xl border p-4 text-center disabled:opacity-50 ${
                  isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                }`}
              >
                {isSelected && (
                  <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                )}
                <span className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <r.icon className="size-5" />
                </span>
                <p className="mt-2 text-sm font-medium">{rewardLabel(r, t)}</p>
                <p className="text-xs text-muted-foreground">{t("loyalty.ptsValue", { points: fmtPoints(r.cost) })}</p>
                {disabled && <p className="mt-1 text-[10px] font-medium text-destructive">{t("loyalty.redeemDialog.notEnoughPointsBadge")}</p>}
              </button>
            );
          })}
        </div>

        <div className="space-y-2 rounded-2xl bg-muted/50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("loyalty.redeemDialog.selectedReward")}</span>
            <span className="font-medium">{rewardLabel(selected, t)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("loyalty.redeemDialog.pointsRequired")}</span>
            <span className="font-medium">{t("loyalty.ptsValue", { points: fmtPoints(selected.cost) })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("loyalty.redeemDialog.remainingAfter")}</span>
            <span className="font-semibold text-primary">{t("loyalty.ptsValue", { points: fmtPoints(Math.max(0, remaining)) })}</span>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} />
          {t("loyalty.redeemDialog.consentLabel")}
        </label>

        <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
          {t("loyalty.redeemDialog.instantNote")}
        </div>

        <div className="flex gap-2">
          <button onClick={() => onOpenChange(false)} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted">
            {t("loyalty.redeemDialog.cancel")}
          </button>
          <button
            onClick={() => void redeem()}
            disabled={busy || balance < selected.cost}
            className="flex-1 rounded-xl py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {busy ? t("loyalty.redeemDialog.redeeming") : t("loyalty.redeemDialog.redeemNow")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ActivityDetailSheet({
  txn,
  tier,
  balance,
  nextTier,
  progressPct,
  memberSince,
  onOpenChange,
}: {
  txn: LoyaltyTxn | null;
  tier: string;
  balance: number;
  nextTier: (typeof TIER_LADDER)[number] | undefined;
  progressPct: number;
  memberSince: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation("rewards");

  async function share() {
    if (!txn) return;
    const activity = humanize(txn.activity);
    const sign = txn.points > 0 ? "+" : "−";
    const points = fmtPoints(Math.abs(txn.points));
    const text = txn.reference_id
      ? t("loyalty.share.messageWithRef", { activity, sign, points, ref: txn.reference_id })
      : t("loyalty.share.message", { activity, sign, points });
    if (navigator.share) {
      try {
        await navigator.share({ title: t("loyalty.share.title"), text });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success(t("loyalty.detailSheet.copiedToClipboard"));
    }
  }

  return (
    <Sheet open={!!txn} onOpenChange={(o) => !o && onOpenChange(false)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("loyalty.detailSheet.title")}</SheetTitle>
        </SheetHeader>
        {txn && (
          <div className="mt-4 space-y-5">
            <div className="rounded-2xl p-4 text-primary-foreground" style={{ backgroundImage: "var(--gradient-primary)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{t("loyalty.tierCard.tierName", { tier: humanize(tier) })}</p>
                  <p className="text-sm opacity-90">{t("loyalty.ptsValue", { points: fmtPoints(balance) })}</p>
                </div>
                {nextTier && (
                  <p className="text-xs opacity-80">{t("loyalty.metrics.ptsToTier", { points: fmtPoints(nextTier.min - balance), tier: nextTier.name })}</p>
                )}
              </div>
              <Progress value={progressPct} className="mt-3 bg-white/25 [&>div]:bg-white" />
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("loyalty.detailSheet.memberSince")}</span>
                <span className="font-medium">{memberSince ? fmtDate(memberSince) : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("loyalty.detailSheet.tierBenefits")}</span>
                <span className="font-medium">{t("loyalty.detailSheet.benefitsValue", { tier: humanize(tier) })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("loyalty.detailSheet.rewardConversion")}</span>
                <span className="font-medium">{t("loyalty.detailSheet.conversionValue")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("loyalty.detailSheet.nextMilestone")}</span>
                <span className="font-medium">
                  {nextTier ? t("loyalty.detailSheet.milestoneValue", { points: fmtPoints(nextTier.min), tier: nextTier.name }) : t("loyalty.detailSheet.topTierReached")}
                </span>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold">{t("loyalty.detailSheet.selectedActivity")}</h4>
              <div className="flex items-center justify-between rounded-2xl border border-border p-3">
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const { icon: Icon, className } = activityIcon(txn.activity);
                    return (
                      <span className={`flex size-9 items-center justify-center rounded-full ${className}`}>
                        <Icon className="size-4" />
                      </span>
                    );
                  })()}
                  <div>
                    <p className="text-sm font-medium">{humanize(txn.activity)}</p>
                    <p className="text-xs text-muted-foreground">{fmtDateTime(txn.created_at)}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${txn.points > 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                  {txn.points > 0 ? t("loyalty.activity.earned") : t("loyalty.activity.redeemed")}
                </span>
              </div>
              <div className="mt-3 space-y-2 rounded-2xl bg-muted/50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("loyalty.detailSheet.referenceCode")}</span>
                  <span className="font-medium">{txn.reference_id ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{txn.points > 0 ? t("loyalty.detailSheet.pointsEarned") : t("loyalty.detailSheet.pointsSpent")}</span>
                  <span className={`font-semibold ${txn.points > 0 ? "text-success" : "text-destructive"}`}>
                    {txn.points > 0 ? "+" : "−"}
                    {fmtPoints(Math.abs(txn.points))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("loyalty.detailSheet.balanceAfter")}</span>
                  <span className="font-medium">{t("loyalty.ptsValue", { points: fmtPoints(txn.running_total) })}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold">{t("loyalty.detailSheet.timeline")}</h4>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success text-white">
                  <Check className="size-3" />
                </span>
                <div>
                  <p className="text-sm font-medium">{t("loyalty.detailSheet.recorded", { activity: humanize(txn.activity) })}</p>
                  <p className="text-xs text-muted-foreground">{fmtDateTime(txn.created_at)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">
                <FileText className="size-4" /> {t("loyalty.detailSheet.viewRules")}
              </button>
              <button onClick={() => void share()} className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">
                <Send className="size-4" /> {t("loyalty.detailSheet.share")}
              </button>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              {t("loyalty.detailSheet.done")}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
