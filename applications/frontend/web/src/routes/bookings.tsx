import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarX,
  CheckCircle2,
  Clock,
  CreditCard,
  Droplets,
  FilterX,
  TrendingUp,
  Wrench,
  XCircle,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { BookingDetailsDialog } from "@/components/dashboard/BookingDetailsDialog";
import { TableFilterBar, TableCard, TableScroll, TableHead, TablePagination } from "@/components/dashboard/DataTable";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type BookingHistoryRow } from "@/lib/api-client";
import { fmtDate, fmtMoney, humanize } from "@/lib/format";

const title = "My Bookings — FIXO";
const description = "View and manage your handyman bookings, appointments and service history.";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookingsPage,
});

const TABS = ["Upcoming", "Completed", "Cancelled"] as const;

const UPCOMING_STATUSES = ["CONFIRMED", "PAYMENT_AUTHORIZED", "PROVIDER_SELECTED", "QUOTE_ACCEPTED"];
const COMPLETED_STATUSES = ["PAID", "CLOSED"];
const SPENT_STATUSES = ["PAYMENT_AUTHORIZED", "PAID", "CLOSED"];

function statusLabel(status: string) {
  return humanize(status);
}

function statusStyle(status: string) {
  const s = status.toUpperCase();
  if (COMPLETED_STATUSES.includes(s)) return "bg-muted text-muted-foreground";
  if (s === "CANCELLED") return "bg-destructive/12 text-destructive";
  if (UPCOMING_STATUSES.includes(s)) return "bg-success-muted text-success-foreground";
  return "bg-[oklch(0.85_0.14_80)] text-[oklch(0.42_0.12_70)]";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = ["#7210FF", "#00B894", "#0984E3", "#E17055", "#FDCB6E", "#A29BFE", "#FF6B35"];
function avatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function BookingsPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [rows, setRows] = useState<BookingHistoryRow[] | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Upcoming");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [openBookingId, setOpenBookingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  const load = useCallback(() => {
    void fixoSdk.bookingHistory(undefined, 100, 0).then(setRows).catch(() => setRows([]));
  }, []);

  useEffect(() => {
    if (access_token && !loading) load();
  }, [access_token, loading, load]);

  const services = useMemo(
    () => Array.from(new Set((rows ?? []).map((b) => b.service_name).filter(Boolean))) as string[],
    [rows],
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const filtered = (rows ?? []).filter((b) => {
    const matchesTab =
      activeTab === "Upcoming"
        ? UPCOMING_STATUSES.includes(b.status)
        : activeTab === "Completed"
          ? COMPLETED_STATUSES.includes(b.status)
          : b.status === "CANCELLED";
    const matchesSearch =
      !search ||
      [b.service_name, b.booking_number, b.provider_name].some((f) =>
        (f ?? "").toLowerCase().includes(search.toLowerCase()),
      );
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    const matchesService = serviceFilter === "all" || b.service_name === serviceFilter;
    return matchesTab && matchesSearch && matchesStatus && matchesService;
  });

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all" || serviceFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setServiceFilter("all");
    setPage(1);
  }

  const upcomingCount = (rows ?? []).filter((b) => UPCOMING_STATUSES.includes(b.status)).length;
  const now = new Date();
  const completedThisMonth = (rows ?? []).filter((b) => {
    if (!COMPLETED_STATUSES.includes(b.status) || !b.completed_at) return false;
    const d = new Date(b.completed_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const pendingPayments = (rows ?? []).filter((b) => b.status === "CONFIRMED");
  const totalSpent = (rows ?? []).filter((b) => SPENT_STATUSES.includes(b.status)).reduce((s, b) => s + b.agreed_amount, 0);
  const currency = rows?.[0]?.currency ?? "TZS";

  const STATS = [
    { icon: Calendar, tone: "primary" as const, value: String(upcomingCount), label: "Upcoming Bookings", hint: "Scheduled ahead" },
    { icon: CheckCircle2, tone: "success" as const, value: String(completedThisMonth), label: "Completed This Month", hint: "This calendar month" },
    { icon: CreditCard, tone: "amber" as const, value: fmtMoney(pendingPayments.reduce((s, b) => s + b.agreed_amount, 0), currency), label: "Pending Payments", hint: "Awaiting authorization" },
    { icon: TrendingUp, tone: "primary" as const, value: fmtMoney(totalSpent, currency), label: "Total Spent", hint: "All time" },
  ];

  const emptyStateFor: Record<(typeof TABS)[number], { icon: typeof CalendarX; title: string; description: string; actionLabel: string; actionTo: string }> = {
    Upcoming: {
      icon: CalendarX,
      title: "No upcoming bookings",
      description: "You don't have any appointments scheduled yet. Book a service to see it here.",
      actionLabel: "Book a Service",
      actionTo: "/services",
    },
    Completed: {
      icon: CheckCircle2,
      title: "No completed bookings yet",
      description: "Jobs marked as finished will show up here.",
      actionLabel: "Browse Services",
      actionTo: "/services",
    },
    Cancelled: {
      icon: XCircle,
      title: "No cancelled bookings",
      description: "Bookings you cancel will appear here for your records.",
      actionLabel: "View Upcoming",
      actionTo: "/bookings",
    },
  };

  return (
    <PageShell title="My Bookings" subtitle="Track your appointments and service history" userName={customer?.full_name} onLogout={logout}>
      {/* Tabs */}
      <div className="mt-6 inline-flex rounded-2xl bg-card p-1.5 shadow-[var(--shadow-card)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab ? "text-primary-foreground" : "text-foreground/70 hover:text-foreground"
            }`}
            style={activeTab === tab ? { backgroundImage: "var(--gradient-primary)" } : undefined}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => (
          <MetricCard key={s.label} icon={s.icon} label={s.label} value={s.value} hint={s.hint} tone={s.tone} />
        ))}
      </div>

      {/* Filter bar */}
      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search bookings..."
        filters={[
          {
            value: statusFilter,
            onChange: (v) => { setStatusFilter(v); setPage(1); },
            placeholder: "Status",
            options: [
              { value: "all", label: "All Statuses" },
              ...Array.from(new Set((rows ?? []).map((b) => b.status))).map((s) => ({ value: s, label: statusLabel(s) })),
            ],
          },
          {
            value: serviceFilter,
            onChange: (v) => { setServiceFilter(v); setPage(1); },
            placeholder: "Service",
            options: [{ value: "all", label: "All Services" }, ...services.map((s) => ({ value: s, label: s }))],
          },
        ]}
      />

      {/* Table */}
      {rows === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState
              icon={FilterX}
              title="No matching bookings"
              description="Try adjusting your search or filters to find what you're looking for."
              actionLabel="Clear Filters"
              onAction={clearFilters}
            />
          ) : (
            <EmptyState {...emptyStateFor[activeTab]} />
          )}
        </div>
      ) : (
        <TableCard className="grow">
        <TableScroll minWidth={860}>
          <TableHead columns={["Service", "Booking ID", "Schedule", "Provider", "Status", "Amount"]} />
          <tbody>
                {paged.map((b) => (
                  <tr
                    key={b.booking_id}
                    onClick={() => setOpenBookingId(b.booking_id)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          {(b.service_name ?? "").toLowerCase().includes("plumb") || (b.service_name ?? "").toLowerCase().includes("leak") ? (
                            <Droplets className="size-5" />
                          ) : (
                            <Wrench className="size-5" />
                          )}
                        </span>
                        <p className="font-semibold">{b.service_name ?? "Service"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-primary">{b.booking_number}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        {fmtDate(b.scheduled_date)}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="size-3.5" />
                        {b.time_window ? humanize(b.time_window) : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {b.provider_name ? (
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex size-8 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: avatarColor(b.provider_name) }}
                          >
                            {initials(b.provider_name)}
                          </span>
                          <p className="font-medium">{b.provider_name}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(b.status)}`}>
                        {statusLabel(b.status)}
                      </span>
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
          itemLabel="bookings"
        />
        </TableCard>
      )}

      <BookingDetailsDialog bookingId={openBookingId} onOpenChange={(o) => !o && setOpenBookingId(null)} />
    </PageShell>
  );
}
