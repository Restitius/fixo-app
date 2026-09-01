// History — a unified, filterable history feed across bookings, payments,
// wallet, loyalty and invoices. Each category pulls real data from its own
// domain; row click on Bookings/Payments opens the shared booking detail
// drawer (with a real event timeline, messaging and disputes).
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Award,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  History as HistoryIcon,
  Minus,
  Plus,
  Receipt,
  Sparkles,
  Wallet as WalletIcon,
  XCircle,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { BookingDetailSheet } from "@/components/dashboard/BookingDetailSheet";
import { useAuth } from "@/lib/auth-context";
import {
  fixoSdk,
  type BookingHistoryRow,
  type InvoiceRow,
  type LoyaltyTxn,
  type WalletTxn,
} from "@/lib/api-client";
import { fmtDate, fmtDateTime, fmtMoney, fmtPoints, humanize } from "@/lib/format";

const title = "History — FIXO";
const description = "Your history across bookings, payments, wallet, loyalty and invoices.";

const historySearchSchema = z.object({
  category: z.enum(["bookings", "payments", "wallet", "loyalty", "invoices"]).optional(),
});

export const Route = createFileRoute("/history")({
  validateSearch: historySearchSchema,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HistoryPage,
});

const CATEGORIES = [
  { id: "bookings", label: "Bookings", icon: ClipboardList },
  { id: "payments", label: "Payments", icon: Receipt },
  { id: "wallet", label: "Wallet", icon: WalletIcon },
  { id: "loyalty", label: "Loyalty", icon: Sparkles },
  { id: "invoices", label: "Invoices", icon: FileText },
] as const;
type CategoryId = (typeof CATEGORIES)[number]["id"];

function HistoryPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const navigate = useNavigate();
  const { category } = Route.useSearch();
  const active: CategoryId = category ?? "bookings";

  function setCategory(id: CategoryId) {
    navigate({ to: "/history", search: { category: id } });
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  return (
    <PageShell
      title="History"
      subtitle="Everything that's happened on your account, in one place"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              active === c.id ? "text-primary-foreground" : "bg-card text-foreground/80 shadow-[var(--shadow-card)] hover:bg-muted/50"
            }`}
            style={active === c.id ? { backgroundImage: "var(--gradient-primary)" } : undefined}
          >
            <c.icon className="size-4" />
            {c.label}
          </button>
        ))}
      </div>

      {active === "bookings" ? (
        <BookingsSection mode="bookings" />
      ) : active === "payments" ? (
        <BookingsSection mode="payments" />
      ) : active === "wallet" ? (
        <WalletSection />
      ) : active === "loyalty" ? (
        <LoyaltySection />
      ) : (
        <InvoicesSection />
      )}
    </PageShell>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof ClipboardList; label: string; value: string; tone?: "success" | "destructive" }) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
      <span
        className={`flex size-11 items-center justify-center rounded-2xl ${
          tone === "success" ? "bg-success/15 text-success" : tone === "destructive" ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function FilterTabs<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="mt-6 inline-flex flex-wrap gap-1.5 rounded-2xl bg-card p-1.5 shadow-[var(--shadow-card)]">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            value === o ? "text-primary-foreground" : "text-foreground/70 hover:text-foreground"
          }`}
          style={value === o ? { backgroundImage: "var(--gradient-primary)" } : undefined}
        >
          {o === "All" ? "All" : humanize(o)}
        </button>
      ))}
    </div>
  );
}

// ---- Bookings / Payments (same data source, different framing) ------------

const BOOKING_FILTERS = ["All", "PAID", "CLOSED", "CANCELLED"] as const;
const CHARGE_FILTERS = ["All", "PAYMENT_AUTHORIZED", "PAID"] as const;

function statusColor(status: string) {
  const s = status.toUpperCase();
  if (["PAID", "CLOSED", "COMPLETED"].includes(s)) return "bg-success/15 text-success";
  if (["CANCELLED", "FAILED", "DISPUTED"].includes(s)) return "bg-destructive/15 text-destructive";
  return "bg-amber-500/15 text-amber-600";
}

function BookingsSection({ mode }: { mode: "bookings" | "payments" }) {
  const [rows, setRows] = useState<BookingHistoryRow[] | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const filters = mode === "bookings" ? BOOKING_FILTERS : CHARGE_FILTERS;

  const load = useCallback(() => {
    void fixoSdk.bookingHistory(undefined, 100, 0).then(setRows);
  }, []);
  useEffect(() => load(), [load]);
  useEffect(() => setFilter("All"), [mode]);

  const filtered = (rows ?? []).filter((r) => filter === "All" || r.status === filter);

  const total = rows?.length ?? 0;
  const paid = (rows ?? []).filter((r) => ["PAID", "CLOSED"].includes(r.status)).length;
  const cancelled = (rows ?? []).filter((r) => r.status === "CANCELLED").length;
  const authorized = (rows ?? []).filter((r) => r.status === "PAYMENT_AUTHORIZED").length;
  const totalCharged = (rows ?? []).reduce((s, r) => s + r.agreed_amount, 0);

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {mode === "bookings" ? (
          <>
            <StatCard icon={Calendar} label="Total Bookings" value={String(total)} />
            <StatCard icon={CheckCircle2} label="Paid Jobs" value={String(paid)} tone="success" />
            <StatCard icon={XCircle} label="Cancelled" value={String(cancelled)} tone="destructive" />
          </>
        ) : (
          <>
            <StatCard icon={Receipt} label="Total Charged" value={fmtMoney(totalCharged, rows?.[0]?.currency ?? "TZS")} />
            <StatCard icon={Clock} label="Pending Authorizations" value={String(authorized)} />
            <StatCard icon={CheckCircle2} label="Fully Paid" value={String(paid)} tone="success" />
          </>
        )}
      </div>

      <FilterTabs options={filters} value={filter} onChange={setFilter} />

      <div className="mt-6 space-y-3">
        {rows === null ? (
          <LoadingRows />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={mode === "bookings" ? HistoryIcon : Receipt}
            title={mode === "bookings" ? "No bookings yet" : "No charges yet"}
            description={
              mode === "bookings"
                ? "Completed and paid jobs will appear here."
                : "Charges from your bookings will show up here."
            }
            actionLabel="Browse Services"
            actionTo="/services"
          />
        ) : (
          filtered.map((b, i) => (
            <button
              key={b.booking_id}
              onClick={() => setOpenId(b.booking_id)}
              style={{ animationDelay: `${i * 40}ms` }}
              className="flex w-full animate-in fade-in slide-in-from-bottom-2 fill-mode-both items-center justify-between gap-3 rounded-3xl bg-card p-5 text-left shadow-[var(--shadow-card)] transition-colors hover:bg-muted/40"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{b.service_name ?? "Service"}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(b.status)}`}>
                    {humanize(b.status)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{b.booking_number}</p>
                {b.provider_name && <p className="mt-0.5 text-sm text-muted-foreground">Provider · {b.provider_name}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-4" /> {fmtDate(b.scheduled_date)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" /> {b.time_window ?? "—"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{fmtMoney(b.agreed_amount, b.currency)}</p>
                <p className="text-xs text-muted-foreground">{fmtDateTime(b.created_at)}</p>
              </div>
            </button>
          ))
        )}
      </div>

      <BookingDetailSheet bookingId={openId} onOpenChange={(o) => !o && setOpenId(null)} title="History details" />
    </>
  );
}

// ---- Wallet -----------------------------------------------------------------

const WALLET_FILTERS = ["All", "CREDIT", "DEBIT"] as const;

function WalletSection() {
  const [rows, setRows] = useState<WalletTxn[] | null>(null);
  const [filter, setFilter] = useState<(typeof WALLET_FILTERS)[number]>("All");

  useEffect(() => {
    void fixoSdk.walletTransactions(100, 0).then(setRows);
  }, []);

  const filtered = (rows ?? []).filter((r) => filter === "All" || r.entry_type === filter);
  const credits = (rows ?? []).filter((r) => r.entry_type === "CREDIT").reduce((s, r) => s + r.amount, 0);
  const debits = (rows ?? []).filter((r) => r.entry_type === "DEBIT").reduce((s, r) => s + r.amount, 0);
  const balance = rows?.[0]?.running_balance ?? 0;
  const currency = rows?.[0]?.currency ?? "TZS";

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={ArrowDownLeft} label="Total Credited" value={fmtMoney(credits, currency)} tone="success" />
        <StatCard icon={ArrowUpRight} label="Total Debited" value={fmtMoney(debits, currency)} tone="destructive" />
        <StatCard icon={WalletIcon} label="Current Balance" value={fmtMoney(balance, currency)} />
      </div>

      <FilterTabs options={WALLET_FILTERS} value={filter} onChange={setFilter} />

      <div className="mt-6 space-y-3">
        {rows === null ? (
          <LoadingRows />
        ) : filtered.length === 0 ? (
          <EmptyState icon={WalletIcon} title="No wallet activity yet" description="Credits, debits and holds will appear here." actionLabel="Go to Wallet" actionTo="/wallet" />
        ) : (
          filtered.map((t, i) => (
            <div
              key={t.entry_id ?? i}
              style={{ animationDelay: `${i * 40}ms` }}
              className="flex animate-in fade-in slide-in-from-bottom-2 fill-mode-both items-center justify-between gap-3 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-3">
                <span className={`flex size-10 items-center justify-center rounded-full ${t.entry_type === "CREDIT" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}>
                  {t.entry_type === "CREDIT" ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}
                </span>
                <div>
                  <p className="font-medium">{humanize(t.entry_type)}</p>
                  <p className="text-xs text-muted-foreground">{fmtDateTime(t.created_at)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${t.entry_type === "CREDIT" ? "text-success" : "text-destructive"}`}>
                  {t.entry_type === "CREDIT" ? "+" : "−"}
                  {fmtMoney(t.amount, t.currency)}
                </p>
                <p className="text-xs text-muted-foreground">bal {fmtMoney(t.running_balance, t.currency)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ---- Loyalty ----------------------------------------------------------------

const LOYALTY_FILTERS = ["All", "Earned", "Spent"] as const;

function LoyaltySection() {
  const [rows, setRows] = useState<LoyaltyTxn[] | null>(null);
  const [filter, setFilter] = useState<(typeof LOYALTY_FILTERS)[number]>("All");

  useEffect(() => {
    void fixoSdk.loyaltyTransactions(100, 0).then(setRows);
  }, []);

  const filtered = (rows ?? []).filter((r) => filter === "All" || (filter === "Earned" ? r.points > 0 : r.points < 0));
  const earned = (rows ?? []).filter((r) => r.points > 0).reduce((s, r) => s + r.points, 0);
  const spent = (rows ?? []).filter((r) => r.points < 0).reduce((s, r) => s + Math.abs(r.points), 0);
  const balance = rows?.[0]?.running_total ?? 0;

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Plus} label="Points Earned" value={fmtPoints(earned)} tone="success" />
        <StatCard icon={Minus} label="Points Spent" value={fmtPoints(spent)} tone="destructive" />
        <StatCard icon={Award} label="Current Balance" value={fmtPoints(balance)} />
      </div>

      <FilterTabs options={LOYALTY_FILTERS} value={filter} onChange={setFilter} />

      <div className="mt-6 space-y-3">
        {rows === null ? (
          <LoadingRows />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Award} title="No loyalty activity yet" description="Book a service to start earning loyalty points." actionLabel="Go to Loyalty" actionTo="/loyalty" />
        ) : (
          filtered.map((t, i) => (
            <div
              key={t.txn_id ?? i}
              style={{ animationDelay: `${i * 40}ms` }}
              className="flex animate-in fade-in slide-in-from-bottom-2 fill-mode-both items-center justify-between gap-3 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center gap-3">
                <span className={`flex size-10 items-center justify-center rounded-full ${t.points > 0 ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}>
                  {t.points > 0 ? <Plus className="size-5" /> : <Minus className="size-5" />}
                </span>
                <div>
                  <p className="font-medium">{humanize(t.activity)}</p>
                  <p className="text-xs text-muted-foreground">{fmtDateTime(t.created_at)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${t.points > 0 ? "text-success" : "text-destructive"}`}>
                  {t.points > 0 ? "+" : "−"}
                  {fmtPoints(Math.abs(t.points))}
                </p>
                <p className="text-xs text-muted-foreground">balance {fmtPoints(t.running_total)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ---- Invoices ----------------------------------------------------------------

const INVOICE_FILTERS = ["All", "ISSUED", "PAID"] as const;

function InvoicesSection() {
  const [rows, setRows] = useState<InvoiceRow[] | null>(null);
  const [filter, setFilter] = useState<(typeof INVOICE_FILTERS)[number]>("All");

  useEffect(() => {
    void fixoSdk.listInvoices(100, 0).then(setRows);
  }, []);

  const filtered = (rows ?? []).filter((r) => filter === "All" || r.status === filter);
  const total = rows?.length ?? 0;
  const paid = (rows ?? []).filter((r) => r.status === "PAID").length;
  const outstanding = (rows ?? []).filter((r) => r.status === "ISSUED").reduce((s, r) => s + r.total_amount, 0);

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={FileText} label="Total Invoices" value={String(total)} />
        <StatCard icon={CheckCircle2} label="Paid" value={String(paid)} tone="success" />
        <StatCard icon={Receipt} label="Outstanding" value={fmtMoney(outstanding, rows?.[0]?.currency ?? "TZS")} />
      </div>

      <FilterTabs options={INVOICE_FILTERS} value={filter} onChange={setFilter} />

      <div className="mt-6 space-y-3">
        {rows === null ? (
          <LoadingRows />
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices yet" description="An invoice is issued once a booking is completed and confirmed." actionLabel="Go to Invoices" actionTo="/invoices" />
        ) : (
          filtered.map((inv, i) => (
            <div
              key={inv.invoice_id}
              style={{ animationDelay: `${i * 40}ms` }}
              className="flex animate-in fade-in slide-in-from-bottom-2 fill-mode-both items-center justify-between gap-3 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{inv.invoice_number}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(inv.status)}`}>{humanize(inv.status)}</span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">Booking {inv.booking_number} · {fmtDate(inv.created_at)}</p>
              </div>
              <p className="font-semibold">{fmtMoney(inv.total_amount, inv.currency)}</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-3xl bg-muted/60" />
      ))}
    </div>
  );
}
