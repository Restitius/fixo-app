// Payments — saved payment methods and charge history across bookings.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  CreditCard,
  Landmark,
  Plus,
  Receipt,
  ShieldCheck,
  Smartphone,
  Star,
  Trash2,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type BookingHistoryRow, type PaymentMethod } from "@/lib/api-client";
import { fmtDate, fmtMoney, humanize } from "@/lib/format";
import { toast } from "sonner";

const title = "Payments — FIXO";
const description = "Manage your saved payment methods and review charges from past bookings.";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PaymentsPage,
});

const METHOD_TYPES = [
  { value: "card", label: "Card", icon: CreditCard },
  { value: "mpesa", label: "Mobile Money", icon: Smartphone },
  { value: "bank", label: "Bank Account", icon: Landmark },
] as const;

function methodIcon(type: string) {
  return METHOD_TYPES.find((t) => t.value === type)?.icon ?? Banknote;
}

function statusStyle(status: string) {
  const s = status.toUpperCase();
  if (["PAYMENT_AUTHORIZED", "CONFIRMED", "COMPLETED", "PAID", "CLOSED"].includes(s))
    return "bg-success/15 text-success";
  if (["CANCELLED", "FAILED", "DISPUTED", "REFUNDED"].includes(s))
    return "bg-destructive/15 text-destructive";
  return "bg-amber-500/15 text-amber-600";
}

function PaymentsPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [charges, setCharges] = useState<BookingHistoryRow[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ type: "card", provider: "", last4: "" });

  const load = useCallback(async () => {
    try {
      const [m, c] = await Promise.all([
        fixoSdk.listPaymentMethods(),
        fixoSdk.bookingHistory(undefined, 100, 0),
      ]);
      setMethods(m);
      setCharges(c);
    } catch {
      // toast emitted by client
    }
  }, []);

  useEffect(() => {
    if (access_token && !loading) void load();
  }, [access_token, loading, load]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  async function addMethod() {
    if (!draft.last4.trim() || draft.last4.trim().length < 4) {
      toast.error("Enter at least the last 4 digits");
      return;
    }
    setSaving(true);
    try {
      const created = await fixoSdk.addPaymentMethod(
        draft.type,
        draft.provider.trim() || null,
        { last4: draft.last4.trim().slice(-4) },
        (methods ?? []).length === 0,
      );
      setMethods((prev) => [...(prev ?? []), created]);
      setDraft({ type: "card", provider: "", last4: "" });
      setShowForm(false);
      toast.success("Payment method added");
    } catch {
      // toast emitted by client
    } finally {
      setSaving(false);
    }
  }

  async function setDefault(id: string) {
    try {
      await fixoSdk.setDefaultPaymentMethod(id);
      setMethods((prev) => prev?.map((m) => ({ ...m, is_default: m.method_id === id })) ?? null);
    } catch {
      // toast emitted by client
    }
  }

  async function removeMethod(id: string) {
    try {
      await fixoSdk.removePaymentMethod(id);
      setMethods((prev) => prev?.filter((m) => m.method_id !== id) ?? null);
      toast.success("Payment method removed");
    } catch {
      // toast emitted by client
    }
  }

  return (
    <PageShell
      title="Payments"
      subtitle="Saved payment methods and charge history"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* Payment methods */}
        <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Payment methods</h3>
            <Button size="sm" onClick={() => setShowForm((v) => !v)} className="gap-2">
              <Plus className="size-4" /> Add
            </Button>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">Cards, mobile money and bank accounts.</p>

          {showForm && (
            <div className="mb-4 space-y-3 rounded-2xl border border-border p-4 animate-in fade-in slide-in-from-top-1">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={draft.type} onValueChange={(v) => setDraft((d) => ({ ...d, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHOD_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Provider (optional)</Label>
                <Input
                  placeholder="e.g. Visa, M-Pesa, CRDB"
                  value={draft.provider}
                  onChange={(e) => setDraft((d) => ({ ...d, provider: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Last 4 digits / number</Label>
                <Input
                  placeholder="e.g. 4242"
                  value={draft.last4}
                  onChange={(e) => setDraft((d) => ({ ...d, last4: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button disabled={saving} onClick={() => void addMethod()} className="flex-1">
                  {saving ? "Saving..." : "Save method"}
                </Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {methods === null ? (
            <LoadingRows />
          ) : methods.length === 0 && !showForm ? (
            <EmptyState
              icon={CreditCard}
              title="No payment methods yet"
              description="Add a card, mobile money or bank account to speed up checkout."
              actionLabel="Add Payment Method"
              onAction={() => setShowForm(true)}
              compact
            />
          ) : (
            <ul className="space-y-2.5">
              {methods.map((m, i) => {
                const Icon = methodIcon(m.type);
                const masked = (m.details_masked?.["last4"] as string | undefined) ?? "••••";
                return (
                  <li
                    key={m.method_id}
                    style={{ animationDelay: `${i * 40}ms` }}
                    className="flex animate-in fade-in slide-in-from-bottom-2 fill-mode-both items-center justify-between gap-3 rounded-2xl border border-border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {m.provider || humanize(m.type)} •••• {masked}
                          {m.is_default && (
                            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                              Default
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{humanize(m.type)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!m.is_default && (
                        <button
                          onClick={() => void setDefault(m.method_id)}
                          title="Set as default"
                          className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                        >
                          <Star className="size-4" />
                        </button>
                      )}
                      <button
                        onClick={() => void removeMethod(m.method_id)}
                        title="Remove"
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-muted/50 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0" />
            Only masked details are stored — never full card or account numbers.
          </div>
        </div>

        {/* Charge history */}
        <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold">Charge history</h3>
          <p className="mb-4 text-sm text-muted-foreground">Amounts billed across your bookings.</p>

          {charges === null ? (
            <LoadingRows />
          ) : charges.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No charges yet"
              description="Once you complete a booking and authorize payment, it will show up here."
              actionLabel="Browse Services"
              actionTo="/services"
              compact
            />
          ) : (
            <ul className="space-y-2.5">
              {charges.map((b, i) => (
                <li
                  key={b.booking_id}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="flex animate-in fade-in slide-in-from-bottom-2 fill-mode-both items-center justify-between gap-3 rounded-2xl border border-border p-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{b.service_name ?? "Service"}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle(b.status)}`}>
                        {humanize(b.status)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {b.booking_number} · {fmtDate(b.scheduled_date)}
                      {b.provider_name ? ` · ${b.provider_name}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">{fmtMoney(b.agreed_amount, b.currency)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted/60" />
      ))}
    </div>
  );
}
