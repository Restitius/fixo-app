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
import { useTranslation } from "react-i18next";

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
  { id: "bookings", labelKey: "bookings", icon: ClipboardList },
  { id: "payments", labelKey: "payments", icon: Receipt },
  { id: "wallet", labelKey: "wallet", icon: WalletIcon },
  { id: "loyalty", labelKey: "loyalty", icon: Sparkles },
  { id: "invoices", labelKey: "invoices", icon: FileText },
] as const;
type CategoryId = (typeof CATEGORIES)[number]["id"];

const PAGE_SIZE = 8;

function HistoryPage() {
  const { t } = useTranslation("bookings");
  const { access_token, loading, logout, customer } = useAuth();
  const navigate = useNavigate();
  const { category } = Route.useSearch();
  const active: CategoryId = category ?? "bookings";

  function setCategory(id: CategoryId) {
    navigate({ to: "/history", search: { category: id } });
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t("loading")}</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  return (
    <PageShell
      title={t("history.pageTitle")}
      subtitle={t("history.pageSubtitle")}
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6 flex items-center gap-3 rounded-3xl bg-card p-4 shadow-[var(--shadow-card)]">
        <span className="text-sm font-medium text-muted-foreground">{t("history.viewing")}</span>
        <Select value={active} onValueChange={(v) => setCategory(v as CategoryId)}>
          <SelectTrigger className="h-11 w-[200px] rounded-xl border-0 bg-muted">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  <c.icon className="size-4" /> {t(`history.categories.${c.labelKey}`)}
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
  const { t } = useTranslation("bookings");
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
          { value: "all", label: t("history.bookingsSection.allStatuses") },
          { value: "PAID", label: t("history.bookingsSection.statusPaid") },
          { value: "CLOSED", label: t("history.bookingsSection.statusClosed") },
          { value: "CANCELLED", label: t("history.bookingsSection.statusCancelled") },
        ]
      : [
          { value: "all", label: t("history.bookingsSection.allStatuses") },
          { value: "PAYMENT_AUTHORIZED", label: t("history.bookingsSection.statusAuthorized") },
          { value: "PAID", label: t("history.bookingsSection.statusPaid") },
        ];

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all";

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {mode === "bookings" ? (
          <>
            <MetricCard icon={Calendar} label={t("history.bookingsSection.totalBookings")} hint={t("history.bookingsSection.totalBookingsHint")} value={String(total)} />
            <MetricCard icon={CheckCircle2} label={t("history.bookingsSection.paidJobs")} hint={t("history.bookingsSection.paidJobsHint")} value={String(paid)} tone="success" />
            <MetricCard icon={XCircle} label={t("history.bookingsSection.cancelled")} hint={t("history.bookingsSection.cancelledHint")} value={String(cancelled)} tone="destructive" />
          </>
        ) : (
          <>
            <MetricCard icon={Receipt} label={t("history.bookingsSection.totalCharged")} hint={t("history.bookingsSection.totalChargedHint")} value={fmtMoney(totalCharged, rows?.[0]?.currency ?? "TZS")} />
            <MetricCard icon={Clock} label={t("history.bookingsSection.pendingAuthorizations")} hint={t("history.bookingsSection.pendingAuthorizationsHint")} value={String(authorized)} tone="amber" />
            <MetricCard icon={CheckCircle2} label={t("history.bookingsSection.fullyPaid")} hint={t("history.bookingsSection.fullyPaidHint")} value={String(paid)} tone="success" />
          </>
        )}
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={mode === "bookings" ? t("history.bookingsSection.searchBookings") : t("history.bookingsSection.searchCharges")}
        filters={[{ value: statusFilter, onChange: (v) => { setStatusFilter(v); setPage(1); }, placeholder: t("history.bookingsSection.statusPlaceholder"), options: statusOptions }]}
      />

      {rows === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState icon={FilterX} title={t("history.bookingsSection.emptyMatchingTitle")} description={t("history.bookingsSection.emptyMatchingDescription")} actionLabel={t("history.bookingsSection.clearFilters")} onAction={() => { setSearch(""); setStatusFilter("all"); }} />
          ) : (
            <EmptyState
              icon={mode === "bookings" ? HistoryIcon : Receipt}
              title={mode === "bookings" ? t("history.bookingsSection.noBookingsTitle") : t("history.bookingsSection.noChargesTitle")}
              description={mode === "bookings" ? t("history.bookingsSection.noBookingsDescription") : t("history.bookingsSection.noChargesDescription")}
              actionLabel={t("history.bookingsSection.browseServices")}
              actionTo="/services"
            />
          )}
        </div>
      ) : (
        <TableCard className="grow">
          <TableScroll minWidth={760}>
            <TableHead columns={[t("history.bookingsSection.columns.service"), t("history.bookingsSection.columns.bookingId"), t("history.bookingsSection.columns.date"), t("history.bookingsSection.columns.provider"), t("history.bookingsSection.columns.status"), t("history.bookingsSection.columns.amount")]} />
            <tbody>
              {paged.map((b) => (
                <tr key={b.booking_id} onClick={() => setOpenId(b.booking_id)} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-6 py-4 font-semibold">{b.service_name ?? t("history.bookingsSection.serviceFallback")}</td>
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
            itemLabel={mode === "bookings" ? t("history.bookingsSection.itemLabelBookings") : t("history.bookingsSection.itemLabelCharges")}
          />
        </TableCard>
      )}

      <BookingDetailSheet bookingId={openId} onOpenChange={(o) => !o && setOpenId(null)} title={t("history.detailSheetTitle")} />
    </>
  );
}

// ---- Wallet -----------------------------------------------------------------

function WalletSection() {
  const { t } = useTranslation("bookings");
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
        <MetricCard icon={ArrowDownLeft} label={t("history.walletSection.totalCredited")} hint={t("history.walletSection.totalCreditedHint")} value={fmtMoney(credits, currency)} tone="success" />
        <MetricCard icon={ArrowUpRight} label={t("history.walletSection.totalDebited")} hint={t("history.walletSection.totalDebitedHint")} value={fmtMoney(debits, currency)} tone="destructive" />
        <MetricCard icon={WalletIcon} label={t("history.walletSection.currentBalance")} hint={t("history.walletSection.currentBalanceHint")} value={fmtMoney(balance, currency)} />
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={t("history.walletSection.searchPlaceholder")}
        filters={[{ value: typeFilter, onChange: (v) => { setTypeFilter(v); setPage(1); }, placeholder: t("history.walletSection.typePlaceholder"), options: [{ value: "all", label: t("history.walletSection.allTypes") }, { value: "CREDIT", label: t("history.walletSection.credit") }, { value: "DEBIT", label: t("history.walletSection.debit") }] }]}
      />

      {rows === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState icon={FilterX} title={t("history.walletSection.emptyMatchingTitle")} description={t("history.walletSection.emptyMatchingDescription")} actionLabel={t("history.walletSection.clearFilters")} onAction={() => { setSearch(""); setTypeFilter("all"); }} />
          ) : (
            <EmptyState icon={WalletIcon} title={t("history.walletSection.emptyTitle")} description={t("history.walletSection.emptyDescription")} actionLabel={t("history.walletSection.goToWallet")} actionTo="/wallet" />
          )}
        </div>
      ) : (
        <TableCard className="grow">
          <TableScroll minWidth={640}>
            <TableHead columns={[t("history.walletSection.columns.type"), t("history.walletSection.columns.date"), t("history.walletSection.columns.amount"), t("history.walletSection.columns.balanceAfter")]} />
            <tbody>
              {paged.map((tx, i) => (
                <tr key={tx.entry_id ?? i} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-6 py-4 font-semibold">{humanize(tx.entry_type)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtDate(tx.created_at)}</td>
                  <td className={`px-4 py-4 font-semibold ${tx.entry_type === "CREDIT" ? "text-success" : "text-destructive"}`}>
                    {tx.entry_type === "CREDIT" ? "+" : "−"}
                    {fmtMoney(tx.amount, tx.currency)}
                  </td>
                  <td className="px-4 py-4">{fmtMoney(tx.running_balance, tx.currency)}</td>
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
            itemLabel={t("history.walletSection.itemLabel")}
          />
        </TableCard>
      )}
    </>
  );
}

// ---- Loyalty ----------------------------------------------------------------

function LoyaltySection() {
  const { t } = useTranslation("bookings");
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
        <MetricCard icon={ArrowDownLeft} label={t("history.loyaltySection.pointsEarned")} hint={t("history.loyaltySection.pointsEarnedHint")} value={fmtPoints(earned)} tone="success" />
        <MetricCard icon={ArrowUpRight} label={t("history.loyaltySection.pointsSpent")} hint={t("history.loyaltySection.pointsSpentHint")} value={fmtPoints(spent)} tone="destructive" />
        <MetricCard icon={Award} label={t("history.loyaltySection.currentBalance")} hint={t("history.loyaltySection.currentBalanceHint")} value={fmtPoints(balance)} />
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={t("history.loyaltySection.searchPlaceholder")}
        filters={[{ value: typeFilter, onChange: (v) => { setTypeFilter(v); setPage(1); }, placeholder: t("history.loyaltySection.typePlaceholder"), options: [{ value: "all", label: t("history.loyaltySection.all") }, { value: "earned", label: t("history.loyaltySection.earned") }, { value: "spent", label: t("history.loyaltySection.spent") }] }]}
      />

      {rows === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState icon={FilterX} title={t("history.loyaltySection.emptyMatchingTitle")} description={t("history.loyaltySection.emptyMatchingDescription")} actionLabel={t("history.loyaltySection.clearFilters")} onAction={() => { setSearch(""); setTypeFilter("all"); }} />
          ) : (
            <EmptyState icon={Award} title={t("history.loyaltySection.emptyTitle")} description={t("history.loyaltySection.emptyDescription")} actionLabel={t("history.loyaltySection.goToLoyalty")} actionTo="/loyalty" />
          )}
        </div>
      ) : (
        <TableCard className="grow">
          <TableScroll minWidth={640}>
            <TableHead columns={[t("history.loyaltySection.columns.activity"), t("history.loyaltySection.columns.date"), t("history.loyaltySection.columns.points"), t("history.loyaltySection.columns.balanceAfter")]} />
            <tbody>
              {paged.map((tx, i) => (
                <tr key={tx.txn_id ?? i} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-6 py-4 font-semibold">{humanize(tx.activity)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtDate(tx.created_at)}</td>
                  <td className={`px-4 py-4 font-semibold ${tx.points > 0 ? "text-success" : "text-destructive"}`}>
                    {tx.points > 0 ? "+" : "−"}
                    {fmtPoints(Math.abs(tx.points))}
                  </td>
                  <td className="px-4 py-4">{fmtPoints(tx.running_total)}</td>
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
            itemLabel={t("history.loyaltySection.itemLabel")}
          />
        </TableCard>
      )}
    </>
  );
}

// ---- Invoices ----------------------------------------------------------------

function InvoicesSection() {
  const { t } = useTranslation("bookings");
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
        <MetricCard icon={FileText} label={t("history.invoicesSection.totalInvoices")} hint={t("history.invoicesSection.totalInvoicesHint")} value={String(total)} />
        <MetricCard icon={CheckCircle2} label={t("history.invoicesSection.paid")} hint={t("history.invoicesSection.paidHint")} value={String(paid)} tone="success" />
        <MetricCard icon={Receipt} label={t("history.invoicesSection.outstanding")} hint={t("history.invoicesSection.outstandingHint")} value={fmtMoney(outstanding, rows?.[0]?.currency ?? "TZS")} tone="amber" />
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={t("history.invoicesSection.searchPlaceholder")}
        filters={[{ value: statusFilter, onChange: (v) => { setStatusFilter(v); setPage(1); }, placeholder: t("history.invoicesSection.statusPlaceholder"), options: [{ value: "all", label: t("history.invoicesSection.allStatuses") }, { value: "ISSUED", label: t("history.invoicesSection.issued") }, { value: "PAID", label: t("history.invoicesSection.paidStatus") }] }]}
      />

      {rows === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState icon={FilterX} title={t("history.invoicesSection.emptyMatchingTitle")} description={t("history.invoicesSection.emptyMatchingDescription")} actionLabel={t("history.invoicesSection.clearFilters")} onAction={() => { setSearch(""); setStatusFilter("all"); }} />
          ) : (
            <EmptyState icon={FileText} title={t("history.invoicesSection.emptyTitle")} description={t("history.invoicesSection.emptyDescription")} actionLabel={t("history.invoicesSection.goToInvoices")} actionTo="/invoices" />
          )}
        </div>
      ) : (
        <TableCard className="grow">
          <TableScroll minWidth={700}>
            <TableHead columns={[t("history.invoicesSection.columns.invoiceNumber"), t("history.invoicesSection.columns.booking"), t("history.invoicesSection.columns.date"), t("history.invoicesSection.columns.status"), t("history.invoicesSection.columns.amount")]} />
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
            itemLabel={t("history.invoicesSection.itemLabel")}
          />
        </TableCard>
      )}
    </>
  );
}
