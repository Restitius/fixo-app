// History — a unified, filterable history feed across bookings, payments,
// wallet, loyalty and invoices. Each category pulls real data from its own
// domain and renders as a table (search + status filter + pagination),
// matching My Bookings. Row click on Bookings/Payments opens the shared
// booking detail drawer (with a real event timeline, messaging and disputes).
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  FilterX,
  History as HistoryIcon,
  Receipt,
  Sparkles,
  Wallet as WalletIcon,
  XCircle,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { BookingDetailSheet } from "@/components/dashboard/BookingDetailSheet";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TableFilterBar, TableCard, TableScroll, TableHead, TablePagination } from "@/components/dashboard/DataTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import {
  fixoSdk,
  type BookingHistoryRow,
  type InvoiceRow,
  type LoyaltyTxn,
  type WalletTxn,
} from "@/lib/api-client";
import { fmtDate, fmtMoney, fmtPoints, humanize } from "@/lib/format";

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

const PAGE_SIZE = 8;

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
      <div className="mt-6 flex items-center gap-3 rounded-3xl bg-card p-4 shadow-[var(--shadow-card)]">
        <span className="text-sm font-medium text-muted-foreground">Viewing</span>
        <Select value={active} onValueChange={(v) => setCategory(v as CategoryId)}>
          <SelectTrigger className="h-11 w-[200px] rounded-xl border-0 bg-muted">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  <c.icon className="size-4" /> {c.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

function statusColor(status: string) {
  const s = status.toUpperCase();
  if (["PAID", "CLOSED", "COMPLETED"].includes(s)) return "bg-success/15 text-success";
  if (["CANCELLED", "FAILED", "DISPUTED"].includes(s)) return "bg-destructive/15 text-destructive";
  return "bg-amber-500/15 text-amber-600";
}

// ---- Bookings / Payments (same data source, different framing) ------------

function BookingsSection({ mode }: { mode: "bookings" | "payments" }) {
  const [rows, setRows] = useState<BookingHistoryRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    void fixoSdk.bookingHistory(undefined, 100, 0).then(setRows).catch(() => setRows([]));
  }, []);
  useEffect(() => load(), [load]);
  useEffect(() => {
    setStatusFilter("all");
    setSearch("");
    setPage(1);
  }, [mode]);

  const filtered = useMemo(
    () =>
      (rows ?? []).filter((r) => {
        const matchesStatus = statusFilter === "all" || r.status === statusFilter;
        const matchesSearch =
          !search || [r.service_name, r.booking_number, r.provider_name].some((f) => (f ?? "").toLowerCase().includes(search.toLowerCase()));
        return matchesStatus && matchesSearch;
      }),
    [rows, statusFilter, search],
  );

  const total = rows?.length ?? 0;
  const paid = (rows ?? []).filter((r) => ["PAID", "CLOSED"].includes(r.status)).length;
  const cancelled = (rows ?? []).filter((r) => r.status === "CANCELLED").length;
  const authorized = (rows ?? []).filter((r) => r.status === "PAYMENT_AUTHORIZED").length;
  const totalCharged = (rows ?? []).reduce((s, r) => s + r.agreed_amount, 0);

  const statusOptions =
    mode === "bookings"
      ? [
          { value: "all", label: "All Statuses" },
          { value: "PAID", label: "Paid" },
          { value: "CLOSED", label: "Closed" },
          { value: "CANCELLED", label: "Cancelled" },
        ]
      : [
          { value: "all", label: "All Statuses" },
          { value: "PAYMENT_AUTHORIZED", label: "Authorized" },
          { value: "PAID", label: "Paid" },
        ];

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all";

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {mode === "bookings" ? (
          <>
            <MetricCard icon={Calendar} label="Total Bookings" hint="All time" value={String(total)} />
            <MetricCard icon={CheckCircle2} label="Paid Jobs" hint="Completed" value={String(paid)} tone="success" />
            <MetricCard icon={XCircle} label="Cancelled" hint="All time" value={String(cancelled)} tone="destructive" />
          </>
        ) : (
          <>
            <MetricCard icon={Receipt} label="Total Charged" hint="All time" value={fmtMoney(totalCharged, rows?.[0]?.currency ?? "TZS")} />
            <MetricCard icon={Clock} label="Pending Authorizations" hint="Awaiting capture" value={String(authorized)} tone="amber" />
            <MetricCard icon={CheckCircle2} label="Fully Paid" hint="Completed" value={String(paid)} tone="success" />
          </>
        )}
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={mode === "bookings" ? "Search bookings..." : "Search charges..."}
        filters={[{ value: statusFilter, onChange: (v) => { setStatusFilter(v); setPage(1); }, placeholder: "Status", options: statusOptions }]}
      />

      {rows === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState icon={FilterX} title="No matching results" description="Try adjusting your search or filters." actionLabel="Clear Filters" onAction={() => { setSearch(""); setStatusFilter("all"); }} />
          ) : (
            <EmptyState
              icon={mode === "bookings" ? HistoryIcon : Receipt}
              title={mode === "bookings" ? "No bookings yet" : "No charges yet"}
              description={mode === "bookings" ? "Completed and paid jobs will appear here." : "Charges from your bookings will show up here."}
              actionLabel="Browse Services"
              actionTo="/services"
            />
          )}
        </div>
      ) : (
        <TableCard className="grow">
          <TableScroll minWidth={760}>
            <TableHead columns={["Service", "Booking ID", "Date", "Provider", "Status", "Amount"]} />
            <tbody>
              {paged.map((b) => (
                <tr key={b.booking_id} onClick={() => setOpenId(b.booking_id)} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-6 py-4 font-semibold">{b.service_name ?? "Service"}</td>
                  <td className="px-4 py-4 text-primary font-semibold">{b.booking_number}</td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtDate(b.scheduled_date)}</td>
                  <td className="px-4 py-4">{b.provider_name ?? "—"}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(b.status)}`}>{humanize(b.status)}</span>
                  </td>
                  <td className="px-4 py-4 font-semibold">{fmtMoney(b.agreed_amount, b.currency)}</td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
          <TablePagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            from={(page - 1) * PAGE_SIZE + 1}
            to={Math.min(page * PAGE_SIZE, filtered.length)}
            total={filtered.length}
            itemLabel={mode === "bookings" ? "bookings" : "charges"}
          />
        </TableCard>
      )}

      <BookingDetailSheet bookingId={openId} onOpenChange={(o) => !o && setOpenId(null)} title="History details" />
    </>
  );
}

// ---- Wallet -----------------------------------------------------------------

function WalletSection() {
  const [rows, setRows] = useState<WalletTxn[] | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    void fixoSdk.walletTransactions(100, 0).then(setRows).catch(() => setRows([]));
  }, []);

  const filtered = useMemo(
    () =>
      (rows ?? []).filter((r) => {
        const matchesType = typeFilter === "all" || r.entry_type === typeFilter;
        const matchesSearch = !search || humanize(r.entry_type).toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
      }),
    [rows, typeFilter, search],
  );
  const credits = (rows ?? []).filter((r) => r.entry_type === "CREDIT").reduce((s, r) => s + r.amount, 0);
  const debits = (rows ?? []).filter((r) => r.entry_type === "DEBIT").reduce((s, r) => s + r.amount, 0);
  const balance = rows?.[0]?.running_balance ?? 0;
  const currency = rows?.[0]?.currency ?? "TZS";

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const hasActiveFilters = search.trim() !== "" || typeFilter !== "all";

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard icon={ArrowDownLeft} label="Total Credited" hint="All time" value={fmtMoney(credits, currency)} tone="success" />
        <MetricCard icon={ArrowUpRight} label="Total Debited" hint="All time" value={fmtMoney(debits, currency)} tone="destructive" />
        <MetricCard icon={WalletIcon} label="Current Balance" hint="Right now" value={fmtMoney(balance, currency)} />
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search transactions..."
        filters={[{ value: typeFilter, onChange: (v) => { setTypeFilter(v); setPage(1); }, placeholder: "Type", options: [{ value: "all", label: "All Types" }, { value: "CREDIT", label: "Credit" }, { value: "DEBIT", label: "Debit" }] }]}
      />

      {rows === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState icon={FilterX} title="No matching transactions" description="Try adjusting your search or filters." actionLabel="Clear Filters" onAction={() => { setSearch(""); setTypeFilter("all"); }} />
          ) : (
            <EmptyState icon={WalletIcon} title="No wallet activity yet" description="Credits, debits and holds will appear here." actionLabel="Go to Wallet" actionTo="/wallet" />
          )}
        </div>
      ) : (
        <TableCard className="grow">
          <TableScroll minWidth={640}>
            <TableHead columns={["Type", "Date", "Amount", "Balance After"]} />
            <tbody>
              {paged.map((t, i) => (
                <tr key={t.entry_id ?? i} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-6 py-4 font-semibold">{humanize(t.entry_type)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtDate(t.created_at)}</td>
                  <td className={`px-4 py-4 font-semibold ${t.entry_type === "CREDIT" ? "text-success" : "text-destructive"}`}>
                    {t.entry_type === "CREDIT" ? "+" : "−"}
                    {fmtMoney(t.amount, t.currency)}
                  </td>
                  <td className="px-4 py-4">{fmtMoney(t.running_balance, t.currency)}</td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
          <TablePagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            from={(page - 1) * PAGE_SIZE + 1}
            to={Math.min(page * PAGE_SIZE, filtered.length)}
            total={filtered.length}
            itemLabel="transactions"
          />
        </TableCard>
      )}
    </>
  );
}

// ---- Loyalty ----------------------------------------------------------------

function LoyaltySection() {
  const [rows, setRows] = useState<LoyaltyTxn[] | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    void fixoSdk.loyaltyTransactions(100, 0).then(setRows).catch(() => setRows([]));
  }, []);

  const filtered = useMemo(
    () =>
      (rows ?? []).filter((r) => {
        const matchesType = typeFilter === "all" || (typeFilter === "earned" ? r.points > 0 : r.points < 0);
        const matchesSearch = !search || humanize(r.activity).toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
      }),
    [rows, typeFilter, search],
  );
  const earned = (rows ?? []).filter((r) => r.points > 0).reduce((s, r) => s + r.points, 0);
  const spent = (rows ?? []).filter((r) => r.points < 0).reduce((s, r) => s + Math.abs(r.points), 0);
  const balance = rows?.[0]?.running_total ?? 0;

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const hasActiveFilters = search.trim() !== "" || typeFilter !== "all";

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard icon={ArrowDownLeft} label="Points Earned" hint="All time" value={fmtPoints(earned)} tone="success" />
        <MetricCard icon={ArrowUpRight} label="Points Spent" hint="All time" value={fmtPoints(spent)} tone="destructive" />
        <MetricCard icon={Award} label="Current Balance" hint="Right now" value={fmtPoints(balance)} />
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search activity..."
        filters={[{ value: typeFilter, onChange: (v) => { setTypeFilter(v); setPage(1); }, placeholder: "Type", options: [{ value: "all", label: "All" }, { value: "earned", label: "Earned" }, { value: "spent", label: "Spent" }] }]}
      />

      {rows === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState icon={FilterX} title="No matching activity" description="Try adjusting your search or filters." actionLabel="Clear Filters" onAction={() => { setSearch(""); setTypeFilter("all"); }} />
          ) : (
            <EmptyState icon={Award} title="No loyalty activity yet" description="Book a service to start earning loyalty points." actionLabel="Go to Loyalty" actionTo="/loyalty" />
          )}
        </div>
      ) : (
        <TableCard className="grow">
          <TableScroll minWidth={640}>
            <TableHead columns={["Activity", "Date", "Points", "Balance After"]} />
            <tbody>
              {paged.map((t, i) => (
                <tr key={t.txn_id ?? i} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-6 py-4 font-semibold">{humanize(t.activity)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtDate(t.created_at)}</td>
                  <td className={`px-4 py-4 font-semibold ${t.points > 0 ? "text-success" : "text-destructive"}`}>
                    {t.points > 0 ? "+" : "−"}
                    {fmtPoints(Math.abs(t.points))}
                  </td>
                  <td className="px-4 py-4">{fmtPoints(t.running_total)}</td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
          <TablePagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            from={(page - 1) * PAGE_SIZE + 1}
            to={Math.min(page * PAGE_SIZE, filtered.length)}
            total={filtered.length}
            itemLabel="entries"
          />
        </TableCard>
      )}
    </>
  );
}

// ---- Invoices ----------------------------------------------------------------

function InvoicesSection() {
  const [rows, setRows] = useState<InvoiceRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    void fixoSdk.listInvoices(50, 0).then(setRows).catch(() => setRows([]));
  }, []);

  const filtered = useMemo(
    () =>
      (rows ?? []).filter((r) => {
        const matchesStatus = statusFilter === "all" || r.status === statusFilter;
        const matchesSearch = !search || [r.invoice_number, r.booking_number].some((f) => f.toLowerCase().includes(search.toLowerCase()));
        return matchesStatus && matchesSearch;
      }),
    [rows, statusFilter, search],
  );
  const total = rows?.length ?? 0;
  const paid = (rows ?? []).filter((r) => r.status === "PAID").length;
  const outstanding = (rows ?? []).filter((r) => r.status === "ISSUED").reduce((s, r) => s + r.total_amount, 0);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all";

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard icon={FileText} label="Total Invoices" hint="All time" value={String(total)} />
        <MetricCard icon={CheckCircle2} label="Paid" hint="Completed" value={String(paid)} tone="success" />
        <MetricCard icon={Receipt} label="Outstanding" hint="Awaiting payment" value={fmtMoney(outstanding, rows?.[0]?.currency ?? "TZS")} tone="amber" />
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search invoices..."
        filters={[{ value: statusFilter, onChange: (v) => { setStatusFilter(v); setPage(1); }, placeholder: "Status", options: [{ value: "all", label: "All Statuses" }, { value: "ISSUED", label: "Issued" }, { value: "PAID", label: "Paid" }] }]}
      />

      {rows === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState icon={FilterX} title="No matching invoices" description="Try adjusting your search or filters." actionLabel="Clear Filters" onAction={() => { setSearch(""); setStatusFilter("all"); }} />
          ) : (
            <EmptyState icon={FileText} title="No invoices yet" description="An invoice is issued once a booking is completed and confirmed." actionLabel="Go to Invoices" actionTo="/invoices" />
          )}
        </div>
      ) : (
        <TableCard className="grow">
          <TableScroll minWidth={700}>
            <TableHead columns={["Invoice #", "Booking", "Date", "Status", "Amount"]} />
            <tbody>
              {paged.map((inv) => (
                <tr key={inv.invoice_id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-6 py-4 font-semibold text-primary">{inv.invoice_number}</td>
                  <td className="px-4 py-4 text-muted-foreground">{inv.booking_number}</td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtDate(inv.created_at)}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(inv.status)}`}>{humanize(inv.status)}</span>
                  </td>
                  <td className="px-4 py-4 font-semibold">{fmtMoney(inv.total_amount, inv.currency)}</td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
          <TablePagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            from={(page - 1) * PAGE_SIZE + 1}
            to={Math.min(page * PAGE_SIZE, filtered.length)}
            total={filtered.length}
            itemLabel="invoices"
          />
        </TableCard>
      )}
    </>
  );
}
