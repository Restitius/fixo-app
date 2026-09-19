// Promotions — active offers, code validation, and a promotion-details side
// panel that squeezes the page layout (no dark overlay), matching the
// pattern established on the Invoices page.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

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

// Category keys are canonical, English identifiers used only to look up a
// translated label (see the "rewards" namespace, promotions.categories.*) —
// they are never rendered directly.
const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/plumb|leak|pipe|water/i, "plumbing"],
  [/clean/i, "cleaning"],
  [/paint/i, "painting"],
  [/\bac\b|air.?con|cooling/i, "acCooling"],
  [/electr/i, "electrical"],
  [/mov/i, "moving"],
];

// The schema has no category column, so this is a disclosed label derived
// from the promotion's own real name/description/code text — never a
// fabricated fact independent of the underlying data.
function inferCategoryKey(p: Promotion): string {
  const text = `${p.name} ${p.description ?? ""} ${p.code}`;
  for (const [re, key] of CATEGORY_KEYWORDS) {
    if (re.test(text)) return key;
  }
  return "general";
}

function categoryLabel(key: string, t: TFunction): string {
  return t(`promotions.categories.${key}`);
}

function discountLabel(p: Promotion, t: TFunction): string {
  if (p.description) return p.description;
  return p.discount_type === "PERCENT" ? t("promotions.discount.percentOff", { value: p.discount_value }) : t("promotions.discount.amountOff", { amount: fmtMoney(p.discount_value) });
}

function isExpiringSoon(p: Promotion): boolean {
  const ms = new Date(p.valid_until).getTime() - Date.now();
  return ms > 0 && ms <= EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000;
}

function isPromoActive(p: Promotion): boolean {
  const now = Date.now();
  return now >= new Date(p.valid_from).getTime() && now <= new Date(p.valid_until).getTime();
}

function maxSavingsLabel(p: Promotion, t: TFunction): string {
  return p.max_discount != null ? fmtMoney(p.max_discount) : t("promotions.labels.noCap");
}

function minOrderLabel(p: Promotion, t: TFunction): string {
  return p.min_amount && p.min_amount > 0 ? fmtMoney(p.min_amount) : t("promotions.labels.noMinimum");
}

function usageLimitLabel(p: Promotion, t: TFunction): string {
  if (p.usage_limit == null) return t("promotions.labels.unlimited");
  return t("promotions.labels.usageOfLimit", { used: p.used_count ?? 0, limit: p.usage_limit });
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
  const { t } = useTranslation("rewards");
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
  const conditionsRef = useRef<HTMLDivElement>(null);

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
    return <div className="flex min-h-screen items-center justify-center">{t("promotions.loading")}</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const doValidate = async () => {
    if (!code.trim()) {
      toast.error(t("promotions.promoCode.enterCodeFirst"));
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error(t("promotions.promoCode.enterAmountFirst"));
      return;
    }
    setValidating(true);
    try {
      const res = await fixoSdk.validatePromotion(code.trim(), amt);
      setResult(res);
      toast.success(t("promotions.promoCode.appliesSave", { code: res.code, amount: fmtMoney(res.discount_amount) }));
    } catch {
      setResult(null);
    } finally {
      setValidating(false);
    }
  };

  async function useThisPromotion(p: Promotion) {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error(t("promotions.toasts.enterOrderAmountToCalc"));
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
      toast.success(t("promotions.toasts.appliedSaved", { code: p.code, amount: fmtMoney(validated.discount_amount) }));
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
    const text = t("promotions.share.message", { code: p.code, discount: discountLabel(p, t) });
    if (navigator.share) {
      try {
        await navigator.share({ title: t("promotions.share.title"), text });
      } catch {
        // user cancelled the share sheet
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success(t("promotions.toasts.copiedToClipboard"));
    }
  }

  const activeCount = promos?.length ?? 0;
  const totalSavings = ledger.reduce((s, r) => s + r.savings, 0);
  const usedThisMonth = ledger.filter((r) => isThisMonth(r.at)).length;
  const expiringSoon = (promos ?? []).filter(isExpiringSoon).length;

  const visiblePromos = showAllPromos ? promos ?? [] : (promos ?? []).slice(0, 3);
  const visibleRedemptions = showAllRedemptions ? ledger : ledger.slice(0, 5);
  const selectedRecentUse = selected ? ledger.filter((r) => r.promo_id === selected.promo_id).slice(0, 3) : [];
  const selectedCategoryKey = selected ? inferCategoryKey(selected) : null;

  return (
    <PageShell
      title={t("promotions.page.title")}
      subtitle={t("promotions.page.subtitle")}
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Ticket} label={t("promotions.metrics.activePromotions")} hint={t("promotions.metrics.currentlyAvailable")} value={String(activeCount)} />
        <MetricCard icon={Wallet} label={t("promotions.metrics.totalSavings")} hint={t("promotions.metrics.acrossRedemptions")} value={fmtMoney(totalSavings)} />
        <MetricCard icon={Calendar} label={t("promotions.metrics.usedThisMonth")} hint={t("promotions.metrics.appliedOnBookings")} value={String(usedThisMonth)} />
        <MetricCard icon={Clock} label={t("promotions.metrics.expiringSoon")} hint={t("promotions.metrics.within7Days")} value={String(expiringSoon)} />
      </div>

      <div className="mt-6 flex min-h-0 flex-1 items-start gap-6">
        {/* Main column — squeezes left when the details panel is open */}
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <div className="shrink-0 grid gap-6 lg:grid-cols-2">
            {/* Promo code card */}
            <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Ticket className="size-5 text-primary" /> {t("promotions.promoCode.title")}
              </h3>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">{t("promotions.promoCode.enterCode")}</Label>
                  <div className="relative">
                    <Input
                      id="code"
                      placeholder={t("promotions.promoCode.placeholder")}
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="pr-10"
                    />
                    <Ticket className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amt">{t("promotions.promoCode.orderAmount")}</Label>
                  <Input id="amt" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <Button
                  className="w-full"
                  disabled={validating}
                  onClick={() => void doValidate()}
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  {t("promotions.promoCode.validateCode")}
                </Button>

                {result && (
                  <div className="flex items-start gap-3 rounded-2xl bg-success/10 p-4 text-success">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                    <div>
                      <p className="font-semibold">{result.name}</p>
                      <p className="text-sm">
                        {result.discount_type === "PERCENT"
                          ? t("promotions.promoCode.savePercent", { amount: fmtMoney(result.discount_amount), percent: result.discount_value })
                          : t("promotions.promoCode.save", { amount: fmtMoney(result.discount_amount) })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  {t("promotions.promoCode.disclaimer")}
                </div>
              </div>
            </div>

            {/* Available promotions card */}
            <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Tag className="size-5 text-primary" /> {t("promotions.availablePromotions.title")}
              </h3>
              <p className="text-sm text-muted-foreground">{t("promotions.availablePromotions.subtitle")}</p>

              {promos === null ? (
                <div className="mt-4 h-40 animate-pulse rounded-2xl bg-muted/60" />
              ) : promos.length === 0 ? (
                <div className="mt-4">
                  <EmptyState compact icon={Ticket} title={t("promotions.availablePromotions.noneTitle")} description={t("promotions.availablePromotions.noneDescription")} />
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
                          <p className="truncate text-sm text-muted-foreground">{discountLabel(p, t)}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="size-3" /> {t("promotions.availablePromotions.expires", { date: fmtDate(p.valid_until) })}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setSelected(p)}>
                          {selected?.promo_id === p.promo_id ? t("promotions.availablePromotions.details") : t("promotions.availablePromotions.useNow")}
                        </Button>
                      </div>
                    ))}
                  </div>
                  {promos.length > 3 && (
                    <button
                      onClick={() => setShowAllPromos((v) => !v)}
                      className="mt-4 flex w-full items-center justify-end gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      {showAllPromos ? t("promotions.availablePromotions.showLess") : t("promotions.availablePromotions.viewAll")} <span aria-hidden>›</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Recent redemptions */}
          <div className="mt-6 flex grow shrink-0 flex-col rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex shrink-0 items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <History className="size-5 text-primary" /> {t("promotions.redemptions.title")}
              </h3>
              {ledger.length > 5 && (
                <button onClick={() => setShowAllRedemptions((v) => !v)} className="text-sm font-semibold text-primary hover:underline">
                  {showAllRedemptions ? t("promotions.redemptions.showLess") : t("promotions.redemptions.viewAll")}
                </button>
              )}
            </div>

            {ledger.length === 0 ? (
              <div className="mt-4 flex flex-1 flex-col justify-center">
                <EmptyState
                  compact
                  icon={History}
                  title={t("promotions.redemptions.noneTitle")}
                  description={t("promotions.redemptions.noneDescription")}
                />
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 font-semibold">{t("promotions.redemptions.columnCode")}</th>
                      <th className="px-4 py-3 font-semibold">{t("promotions.redemptions.columnDate")}</th>
                      <th className="px-4 py-3 font-semibold">{t("promotions.redemptions.columnSavings")}</th>
                      <th className="px-4 py-3 font-semibold">{t("promotions.redemptions.columnStatus")}</th>
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
                            <CheckCircle2 className="size-3" /> {t("promotions.redemptions.applied")}
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
        {selected && selectedCategoryKey && (
          <div className="w-[380px] shrink-0 animate-in fade-in slide-in-from-right-4 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t("promotions.details.title")}</h3>
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
                    <p className="text-sm text-muted-foreground">{discountLabel(selected, t)}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isPromoActive(selected) ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isPromoActive(selected) ? t("promotions.details.active") : t("promotions.details.expired")}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-primary/5 p-3 text-sm font-medium text-primary">
                <Ticket className="size-4 shrink-0" /> {t("promotions.details.maxSavings", { amount: maxSavingsLabel(selected, t) })}
              </div>

              <div className="space-y-3 text-sm">
                <Field icon={Hash} label={t("promotions.details.promoCode")} value={selected.code} />
                <Field icon={BadgePercent} label={t("promotions.details.category")} value={categoryLabel(selectedCategoryKey, t)} />
                <Field icon={Calendar} label={t("promotions.details.validity")} value={t("promotions.details.validityRange", { from: fmtDate(selected.valid_from), to: fmtDate(selected.valid_until) })} />
                <Field icon={Percent} label={t("promotions.details.minimumOrder")} value={minOrderLabel(selected, t)} />
                <Field icon={ListChecks} label={t("promotions.details.usageLimit")} value={usageLimitLabel(selected, t)} />
                <Field icon={MapPin} label={t("promotions.details.eligibleAreas")} value={t("promotions.details.allAreas")} />
              </div>

              <div ref={conditionsRef}>
                <h4 className="mb-2 text-sm font-semibold">{t("promotions.details.conditionsTitle")}</h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>
                    •{" "}
                    {selectedCategoryKey === "general"
                      ? t("promotions.details.conditionGeneral")
                      : t("promotions.details.conditionCategory", { category: categoryLabel(selectedCategoryKey, t) })}
                  </li>
                  <li>• {t("promotions.details.conditionNoCombine")}</li>
                  <li>• {t("promotions.details.conditionAppliedImmediately")}</li>
                </ul>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold">{t("promotions.details.recentUseTitle")}</h4>
                {selectedRecentUse.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("promotions.details.noRecentUse")}</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="py-1.5 font-semibold">{t("promotions.details.columnBookingRef")}</th>
                        <th className="py-1.5 font-semibold">{t("promotions.details.columnDate")}</th>
                        <th className="py-1.5 font-semibold">{t("promotions.details.columnSavings")}</th>
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
                  <Share2 className="size-4" /> {t("promotions.details.shareCode")}
                </button>
                <button
                  onClick={() => conditionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted"
                >
                  <FileText className="size-4" /> {t("promotions.details.viewTerms")}
                </button>
              </div>

              <button
                disabled={applying}
                onClick={() => void useThisPromotion(selected)}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                {t("promotions.details.useThisPromotion")}
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
