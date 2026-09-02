// Promotions — active offers, code validation, and a promotion-details side
// panel that squeezes the page layout (no dark overlay), matching the
// pattern established on the Invoices page.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Hash,
  History,
  Info,
  ListChecks,
  MapPin,
  Percent,
  Share2,
  Tag,
  Ticket,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type Promotion, type PromotionValidation } from "@/lib/api-client";
import { fmtDate, fmtMoney } from "@/lib/format";
import { toast } from "sonner";

const title = "Promotions — FIXO";
const description = "Deals and discounts on your next service.";

export const Route = createFileRoute("/promotions")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PromotionsPage,
});

// The backend never records per-customer redemption history (PROMOTIONS.used_count
// is a single global counter with no customer/date/amount trail), so "Recent
// redemptions" is a local, honest ledger of promotions this browser has actually
// applied via the real /promotions/{id}/use call — never invented example rows.
const LEDGER_PREFIX = "fixo.promo_redemptions.";
const EXPIRING_SOON_DAYS = 7;
const ROW_TONES = [
  "bg-primary/10 text-primary",
  "bg-success/15 text-success",
  "bg-sky-500/15 text-sky-600",
];

interface RedemptionEntry {
  promo_id: string;
  code: string;
  savings: number;
  currency: string;
  at: string;
}

function ledgerKey(customerId?: string) {
  return `${LEDGER_PREFIX}${customerId ?? "anon"}`;
}

function loadLedger(customerId?: string): RedemptionEntry[] {
  try {
    const raw = localStorage.getItem(ledgerKey(customerId));
    return raw ? (JSON.parse(raw) as RedemptionEntry[]) : [];
  } catch {
    return [];
  }
}

function appendLedger(customerId: string | undefined, entry: RedemptionEntry): RedemptionEntry[] {
  const next = [entry, ...loadLedger(customerId)].slice(0, 50);
  try {
    localStorage.setItem(ledgerKey(customerId), JSON.stringify(next));
  } catch {
    // storage unavailable — the ledger just won't persist across reloads
  }
  return next;
}

const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/plumb|leak|pipe|water/i, "Plumbing"],
  [/clean/i, "Cleaning"],
  [/paint/i, "Painting"],
  [/\bac\b|air.?con|cooling/i, "AC & Cooling"],
  [/electr/i, "Electrical"],
  [/mov/i, "Moving"],
];

// The schema has no category column, so this is a disclosed label derived
// from the promotion's own real name/description/code text — never a
// fabricated fact independent of the underlying data.
function inferCategory(p: Promotion): string {
  const text = `${p.name} ${p.description ?? ""} ${p.code}`;
  for (const [re, label] of CATEGORY_KEYWORDS) {
    if (re.test(text)) return label;
  }
  return "General Services";
}

function discountLabel(p: Promotion): string {
  if (p.description) return p.description;
  return p.discount_type === "PERCENT" ? `${p.discount_value}% off` : `${fmtMoney(p.discount_value)} off`;
}

function isExpiringSoon(p: Promotion): boolean {
  const ms = new Date(p.valid_until).getTime() - Date.now();
  return ms > 0 && ms <= EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000;
}

function isPromoActive(p: Promotion): boolean {
  const now = Date.now();
  return now >= new Date(p.valid_from).getTime() && now <= new Date(p.valid_until).getTime();
}

function maxSavingsLabel(p: Promotion): string {
  return p.max_discount != null ? fmtMoney(p.max_discount) : "No cap";
}

function minOrderLabel(p: Promotion): string {
  return p.min_amount && p.min_amount > 0 ? fmtMoney(p.min_amount) : "No minimum";
}

function usageLimitLabel(p: Promotion): string {
  if (p.usage_limit == null) return "Unlimited";
  return `${p.used_count ?? 0} of ${p.usage_limit} used`;
}

function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function Field({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function PromotionsPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [promos, setPromos] = useState<Promotion[] | null>(null);
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("40000");
  const [result, setResult] = useState<PromotionValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [ledger, setLedger] = useState<RedemptionEntry[]>([]);
  const [selected, setSelected] = useState<Promotion | null>(null);
  const [showAllPromos, setShowAllPromos] = useState(false);
  const [showAllRedemptions, setShowAllRedemptions] = useState(false);

  const load = useCallback(() => {
    void fixoSdk
      .listPromotions(50, 0)
      .then(setPromos)
      .catch(() => setPromos((prev) => prev ?? []));
  }, []);

  useEffect(() => {
    if (access_token && !loading) load();
  }, [access_token, loading, load]);

  useEffect(() => {
    if (customer?.customer_id) setLedger(loadLedger(customer.customer_id));
  }, [customer?.customer_id]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const doValidate = async () => {
    if (!code.trim()) {
      toast.error("Enter a promotion code");
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter an order amount");
      return;
    }
    setValidating(true);
    try {
      const res = await fixoSdk.validatePromotion(code.trim(), amt);
      setResult(res);
      toast.success(`${res.code} applies — save ${fmtMoney(res.discount_amount)}`);
    } catch {
      setResult(null);
    } finally {
      setValidating(false);
    }
  };

  async function useThisPromotion(p: Promotion) {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter an order amount above so we can calculate real savings.");
      return;
    }
    setApplying(true);
    try {
      const validated = await fixoSdk.validatePromotion(p.code, amt);
      await fixoSdk.usePromotion(p.promo_id);
      const entry: RedemptionEntry = {
        promo_id: p.promo_id,
        code: p.code,
        savings: validated.discount_amount,
        currency: "TZS",
        at: new Date().toISOString(),
      };
      setLedger(appendLedger(customer?.customer_id, entry));
      toast.success(`${p.code} applied — saved ${fmtMoney(validated.discount_amount)}`);
      setResult(null);
      setCode("");
      load();
    } catch {
      // toast emitted by client
    } finally {
      setApplying(false);
    }
  }

  async function shareCode(p: Promotion) {
    const text = `Use promo code ${p.code} on FIXO — ${discountLabel(p)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "FIXO Promotion", text });
      } catch {
        // user cancelled the share sheet
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Promo code copied to clipboard");
    }
  }

  const activeCount = promos?.length ?? 0;
  const totalSavings = ledger.reduce((s, r) => s + r.savings, 0);
  const usedThisMonth = ledger.filter((r) => isThisMonth(r.at)).length;
  const expiringSoon = (promos ?? []).filter(isExpiringSoon).length;

  const visiblePromos = showAllPromos ? promos ?? [] : (promos ?? []).slice(0, 3);
  const visibleRedemptions = showAllRedemptions ? ledger : ledger.slice(0, 5);
  const selectedRecentUse = selected ? ledger.filter((r) => r.promo_id === selected.promo_id).slice(0, 3) : [];

  return (
    <PageShell
      title="Promotions"
      subtitle="Deals and discounts on your next service"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Ticket} label="Active Promotions" hint="Currently available" value={String(activeCount)} />
        <MetricCard icon={Wallet} label="Total Savings" hint="Across all redemptions" value={fmtMoney(totalSavings)} />
        <MetricCard icon={Calendar} label="Used This Month" hint="Applied on bookings" value={String(usedThisMonth)} />
        <MetricCard icon={Clock} label="Expiring Soon" hint="Within 7 days" value={String(expiringSoon)} />
      </div>

      <div className="mt-6 flex items-start gap-6">
        {/* Main column — squeezes left when the details panel is open */}
        <div className="min-w-0 flex-1">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Promo code card */}
            <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Ticket className="size-5 text-primary" /> Promo code
              </h3>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Enter promo code</Label>
                  <div className="relative">
                    <Input
                      id="code"
                      placeholder="e.g. WELCOME10"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="pr-10"
                    />
                    <Ticket className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amt">Order amount (TZS)</Label>
                  <Input id="amt" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <Button
                  className="w-full"
                  disabled={validating}
                  onClick={() => void doValidate()}
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  Validate code
                </Button>

                {result && (
                  <div className="flex items-start gap-3 rounded-2xl bg-success/10 p-4 text-success">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                    <div>
                      <p className="font-semibold">{result.name}</p>
                      <p className="text-sm">
                        Save {fmtMoney(result.discount_amount)}
                        {result.discount_type === "PERCENT" ? ` (${result.discount_value}%)` : ""}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  Promo codes apply only to eligible services and cannot be combined with other offers.
                </div>
              </div>
            </div>

            {/* Available promotions card */}
            <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Tag className="size-5 text-primary" /> Available promotions
              </h3>
              <p className="text-sm text-muted-foreground">Choose a promotion to apply to your booking.</p>

              {promos === null ? (
                <div className="mt-4 h-40 animate-pulse rounded-2xl bg-muted/60" />
              ) : promos.length === 0 ? (
                <div className="mt-4">
                  <EmptyState compact icon={Ticket} title="No active promotions" description="Check back soon — new deals show up here." />
                </div>
              ) : (
                <>
                  <div className="mt-4 space-y-3">
                    {visiblePromos.map((p, i) => (
                      <div key={p.promo_id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                        <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${ROW_TONES[i % ROW_TONES.length]}`}>
                          <Zap className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-primary">{p.code}</p>
                          <p className="truncate text-sm text-muted-foreground">{discountLabel(p)}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="size-3" /> Expires {fmtDate(p.valid_until)}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setSelected(p)}>
                          {selected?.promo_id === p.promo_id ? "Details" : "Use now"}
                        </Button>
                      </div>
                    ))}
                  </div>
                  {promos.length > 3 && (
                    <button
                      onClick={() => setShowAllPromos((v) => !v)}
                      className="mt-4 flex w-full items-center justify-end gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      {showAllPromos ? "Show less" : "View all promotions"} <span aria-hidden>›</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Recent redemptions */}
          <div className="mt-6 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <History className="size-5 text-primary" /> Recent redemptions
              </h3>
              {ledger.length > 5 && (
                <button onClick={() => setShowAllRedemptions((v) => !v)} className="text-sm font-semibold text-primary hover:underline">
                  {showAllRedemptions ? "Show less" : "View all"}
                </button>
              )}
            </div>

            {ledger.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  compact
                  icon={History}
                  title="No redemptions yet"
                  description="Promotions you actually apply will show up here with the real savings amount."
                />
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 font-semibold">Promo code</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Savings</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRedemptions.map((r, i) => (
                      <tr key={`${r.promo_id}-${r.at}-${i}`} className="border-b border-border last:border-0">
                        <td className="py-3 font-semibold text-primary">{r.code}</td>
                        <td className="px-4 py-3 text-muted-foreground">{fmtDate(r.at)}</td>
                        <td className="px-4 py-3 font-semibold">{fmtMoney(r.savings, r.currency)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                            <CheckCircle2 className="size-3" /> Applied
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Promotion details panel — in normal flow, no overlay, squeezes the column above */}
        {selected && (
          <div className="w-[380px] shrink-0 animate-in fade-in slide-in-from-right-4 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Promotion details</h3>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Zap className="size-5" />
                  </span>
                  <div>
                    <p className="text-lg font-semibold">{selected.code}</p>
                    <p className="text-sm text-muted-foreground">{discountLabel(selected)}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isPromoActive(selected) ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isPromoActive(selected) ? "Active" : "Expired"}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-primary/5 p-3 text-sm font-medium text-primary">
                <Ticket className="size-4 shrink-0" /> Max savings: {maxSavingsLabel(selected)}
              </div>

              <div className="space-y-3 text-sm">
                <Field icon={Hash} label="Promo code" value={selected.code} />
                <Field icon={BadgePercent} label="Category" value={inferCategory(selected)} />
                <Field icon={Calendar} label="Validity" value={`${fmtDate(selected.valid_from)} – ${fmtDate(selected.valid_until)}`} />
                <Field icon={Percent} label="Minimum order" value={minOrderLabel(selected)} />
                <Field icon={ListChecks} label="Usage limit" value={usageLimitLabel(selected)} />
                <Field icon={MapPin} label="Eligible areas" value="All areas" />
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold">Conditions</h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>
                    •{" "}
                    {inferCategory(selected) === "General Services"
                      ? "Valid only on eligible services."
                      : `Valid only on eligible ${inferCategory(selected).toLowerCase()} services.`}
                  </li>
                  <li>• Cannot be combined with other promo codes.</li>
                  <li>• Applied immediately when you use this promotion.</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold">Recent use</h4>
                {selectedRecentUse.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No redemptions yet for this code.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="py-1.5 font-semibold">Booking reference</th>
                        <th className="py-1.5 font-semibold">Date</th>
                        <th className="py-1.5 font-semibold">Savings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecentUse.map((r, i) => (
                        <tr key={`${r.at}-${i}`}>
                          <td className="py-1.5 text-muted-foreground">—</td>
                          <td className="py-1.5 text-muted-foreground">{fmtDate(r.at)}</td>
                          <td className="py-1.5 font-semibold">{fmtMoney(r.savings, r.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => void shareCode(selected)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted"
                >
                  <Share2 className="size-4" /> Share code
                </button>
                <button
                  onClick={() =>
                    toast.info("Full terms will be listed here soon — see the conditions above in the meantime.")
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted"
                >
                  <FileText className="size-4" /> View terms
                </button>
              </div>

              <button
                disabled={applying}
                onClick={() => void useThisPromotion(selected)}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                Use this promotion
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
