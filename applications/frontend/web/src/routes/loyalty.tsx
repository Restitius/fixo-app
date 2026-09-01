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

export const Route = createFileRoute("/loyalty")({
  component: LoyaltyPage,
});

// The backend's `tier` column is a static default ("SILVER") — nothing ever
// recalculates it from points. This ladder is a disclosed, client-defined
// progression used only to show "points to next tier"; it doesn't override
// or contradict any real backend rule because none exists.
const TIER_LADDER = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 1000 },
  { name: "Gold", min: 3000 },
  { name: "Platinum", min: 6000 },
] as const;

const TIER_BENEFITS: Record<string, string[]> = {
  Bronze: ["Earn 1 point per TZS 1,000 spent", "Standard booking priority"],
  Silver: ["Earn 1 point per TZS 1,000 spent", "Priority customer support"],
  Gold: ["10% bonus points on every booking", "Priority provider matching"],
  Platinum: ["20% bonus points on every booking", "Dedicated support line", "Free priority booking add-on"],
};

// A disclosed, hardcoded reward catalog — there's no backend rewards-catalog
// domain, so this is product config (like a price list), not user data.
// Redeeming spends real points via the real loyalty API.
const REWARD_CATALOG = [
  { id: "discount-5000", icon: Ticket, label: "TZS 5,000 off", cost: 3000, activity: "REWARD_DISCOUNT_5000" },
  { id: "priority-booking", icon: Crown, label: "Priority booking", cost: 2000, activity: "REWARD_PRIORITY_BOOKING" },
  { id: "free-inspection", icon: Stethoscope, label: "Free inspection", cost: 1500, activity: "REWARD_FREE_INSPECTION" },
] as const;

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
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const tier = account?.tier ?? "SILVER";
  const balance = account?.points_balance ?? 0;
  const curIdx = tierIndex(tier);
  const nextTier = TIER_LADDER[curIdx + 1];
  const progressPct = nextTier
    ? Math.min(100, Math.round(((balance - TIER_LADDER[curIdx].min) / (nextTier.min - TIER_LADDER[curIdx].min)) * 100))
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
    <PageShell title="Loyalty" subtitle="Rewards for recurring customers" userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Star} label="Points Balance" hint="Available now" value={fmtPoints(balance)} tintValue />
        <MetricCard icon={Award} label="Tier Status" hint={nextTier ? `${fmtPoints(nextTier.min - balance)} pts to ${nextTier.name}` : "Top tier"} value={humanize(tier)} tone="primary" tintValue />
        <MetricCard icon={TrendingUp} label="Earned This Month" hint={`From ${earnedThisMonthCount} ${earnedThisMonthCount === 1 ? "activity" : "activities"}`} value={fmtPoints(earnedThisMonth)} tone="success" tintValue />
        <MetricCard icon={Gift} label="Redeemed" hint={`${redeemedCount} reward${redeemedCount === 1 ? "" : "s"} used`} value={fmtPoints(redeemedTotal)} tone="amber" tintValue />
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
                <p className="text-sm opacity-80">Current tier</p>
                <p className="text-2xl font-bold">{humanize(tier)} tier</p>
              </div>
            </div>
            <div className="relative mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-90">{nextTier ? `Progress to ${nextTier.name}` : "You've reached the top tier"}</span>
              </div>
              <Progress value={progressPct} className="mt-2 bg-white/25 [&>div]:bg-white" />
              <p className="mt-2 text-sm opacity-90">
                {fmtPoints(balance)} / {fmtPoints(nextTier ? nextTier.min : balance)} pts
              </p>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-semibold">Quick actions</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowEarn(true)}
                className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                <Sparkles className="size-4" /> Earn points
              </button>
              <button
                onClick={() => setShowRedeem(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-primary py-3 text-sm font-semibold text-primary hover:bg-primary/5"
              >
                <Gift className="size-4" /> Redeem reward
              </button>
            </div>
            <button
              onClick={() => setShowRules((v) => !v)}
              className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-primary hover:underline"
            >
              <FileText className="size-4" /> View rules
            </button>
            {showRules && (
              <ul className="mt-2 space-y-1 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                {(TIER_BENEFITS[humanize(tier)] ?? []).map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
              100 points = TZS 1,000 reward credit
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent points activity</h3>
              <button
                onClick={() => navigate({ to: "/history", search: { category: "loyalty" } })}
                className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                View all <ChevronRight className="size-3.5" />
              </button>
            </div>

            {txns === null ? (
              <div className="mt-4 h-40 animate-pulse rounded-2xl bg-muted/60" />
            ) : txns.length === 0 ? (
              <div className="mt-6 flex flex-col items-center py-6 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Award className="size-7" strokeWidth={1.5} />
                </span>
                <p className="mt-3 font-semibold">No points activity yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Book a service to start earning loyalty points.</p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 font-semibold">Activity</th>
                      <th className="pb-2 font-semibold">Date</th>
                      <th className="pb-2 font-semibold">Points</th>
                      <th className="pb-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.slice(0, 4).map((t, i) => {
                      const { icon: Icon, className } = activityIcon(t.activity);
                      return (
                        <tr key={t.txn_id ?? i} onClick={() => setSelectedTxn(t)} className="cursor-pointer border-t border-border hover:bg-muted/40">
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${className}`}>
                                <Icon className="size-4" />
                              </span>
                              <span className="font-medium">{humanize(t.activity)}</span>
                            </div>
                          </td>
                          <td className="py-3 text-muted-foreground">{fmtDate(t.created_at)}</td>
                          <td className={`py-3 font-semibold ${t.points > 0 ? "text-success" : "text-destructive"}`}>
                            {t.points > 0 ? "+" : "−"}
                            {fmtPoints(Math.abs(t.points))}
                          </td>
                          <td className="py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                t.points > 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                              }`}
                            >
                              {t.points > 0 ? "Earned" : "Redeemed"}
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
              <h3 className="text-lg font-semibold">Available rewards</h3>
              <button onClick={() => setShowRedeem(true)} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                View all rewards <ChevronRight className="size-3.5" />
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
                      <p className="text-sm font-medium">{r.label}</p>
                      <p className="text-xs text-muted-foreground">Min. {fmtPoints(r.cost)} pts</p>
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
  const [points, setPoints] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const n = Number(points);
    if (!n || n <= 0) {
      toast.error("Enter points first");
      return;
    }
    setBusy(true);
    try {
      const row = await fixoSdk.loyaltyEarn(n);
      toast.success(`Earned ${fmtPoints(row.points)} pts — balance ${fmtPoints(row.running_total)}`);
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
          <DialogTitle>Earn points</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label htmlFor="earn-pts">Points</Label>
          <Input id="earn-pts" type="number" min="1" inputMode="numeric" placeholder="e.g. 100" value={points} onChange={(e) => setPoints(e.target.value)} />
          <button
            onClick={() => void submit()}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Plus className="size-4" /> {busy ? "Adding..." : "Add points"}
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
  const [selected, setSelected] = useState<(typeof REWARD_CATALOG)[number]>(REWARD_CATALOG[1]);
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);

  const remaining = balance - selected.cost;

  async function redeem() {
    if (balance < selected.cost) {
      toast.error("Not enough points for this reward");
      return;
    }
    if (!consent) {
      toast.error("Please confirm you understand points will be deducted");
      return;
    }
    setBusy(true);
    try {
      await fixoSdk.loyaltySpend(selected.cost, selected.activity);
      toast.success(`${selected.label} redeemed!`);
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
          <DialogTitle>Redeem reward</DialogTitle>
        </DialogHeader>
        <p className="-mt-3 text-sm text-muted-foreground">Use your points for available benefits</p>

        <div className="rounded-2xl bg-primary/5 p-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xl font-bold text-primary">
            <Star className="size-5 fill-current" /> {fmtPoints(balance)} pts
          </p>
          <p className="text-sm text-muted-foreground">Current balance</p>
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
                <p className="mt-2 text-sm font-medium">{r.label}</p>
                <p className="text-xs text-muted-foreground">{fmtPoints(r.cost)} pts</p>
                {disabled && <p className="mt-1 text-[10px] font-medium text-destructive">Not enough points</p>}
              </button>
            );
          })}
        </div>

        <div className="space-y-2 rounded-2xl bg-muted/50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Selected reward</span>
            <span className="font-medium">{selected.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Points required</span>
            <span className="font-medium">{fmtPoints(selected.cost)} pts</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Remaining points after redemption</span>
            <span className="font-semibold text-primary">{fmtPoints(Math.max(0, remaining))} pts</span>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} />
          I understand points will be deducted immediately
        </label>

        <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
          Redeemed rewards apply instantly to your account.
        </div>

        <div className="flex gap-2">
          <button onClick={() => onOpenChange(false)} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={() => void redeem()}
            disabled={busy || balance < selected.cost}
            className="flex-1 rounded-xl py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {busy ? "Redeeming..." : "Redeem now"}
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
  async function share() {
    if (!txn) return;
    const text = `${humanize(txn.activity)} — ${txn.points > 0 ? "+" : "−"}${fmtPoints(Math.abs(txn.points))} pts${
      txn.reference_id ? ` (ref ${txn.reference_id})` : ""
    }`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "FIXO Loyalty", text });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    }
  }

  return (
    <Sheet open={!!txn} onOpenChange={(o) => !o && onOpenChange(false)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Loyalty details</SheetTitle>
        </SheetHeader>
        {txn && (
          <div className="mt-4 space-y-5">
            <div className="rounded-2xl p-4 text-primary-foreground" style={{ backgroundImage: "var(--gradient-primary)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{humanize(tier)} tier</p>
                  <p className="text-sm opacity-90">{fmtPoints(balance)} pts</p>
                </div>
                {nextTier && <p className="text-xs opacity-80">{fmtPoints(nextTier.min - balance)} pts to {nextTier.name}</p>}
              </div>
              <Progress value={progressPct} className="mt-3 bg-white/25 [&>div]:bg-white" />
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Member since</span>
                <span className="font-medium">{memberSince ? fmtDate(memberSince) : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tier benefits</span>
                <span className="font-medium">{humanize(tier)} benefits</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reward conversion</span>
                <span className="font-medium">100 pts = TZS 1,000</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Next reward milestone</span>
                <span className="font-medium">{nextTier ? `${fmtPoints(nextTier.min)} pts (${nextTier.name} tier)` : "Top tier reached"}</span>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold">Selected activity</h4>
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
                  {txn.points > 0 ? "Earned" : "Redeemed"}
                </span>
              </div>
              <div className="mt-3 space-y-2 rounded-2xl bg-muted/50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference code</span>
                  <span className="font-medium">{txn.reference_id ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{txn.points > 0 ? "Points earned" : "Points spent"}</span>
                  <span className={`font-semibold ${txn.points > 0 ? "text-success" : "text-destructive"}`}>
                    {txn.points > 0 ? "+" : "−"}
                    {fmtPoints(Math.abs(txn.points))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance after</span>
                  <span className="font-medium">{fmtPoints(txn.running_total)} pts</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold">Timeline</h4>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" />
                </span>
                <div>
                  <p className="text-sm font-medium">{humanize(txn.activity)} recorded</p>
                  <p className="text-xs text-muted-foreground">{fmtDateTime(txn.created_at)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">
                <FileText className="size-4" /> View rules
              </button>
              <button onClick={() => void share()} className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">
                <Send className="size-4" /> Share
              </button>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Done
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
