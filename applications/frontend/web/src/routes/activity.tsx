// Activity — chronological cross-booking feed, matching the reference: a
// category-colored table, a Journey-Timeline squeeze panel for booking/
// service/invoice/feedback events, a compact Progress-timeline dialog for
// payment events (same category-based split established on Notifications),
// and an "Activity insights" sidebar.
import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity as ActivityIcon,
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  CreditCard,
  Download,
  FileQuestion,
  FileText,
  FilterX,
  Hash,
  ListChecks,
  MapPin,
  Pencil,
  Receipt,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Truck,
  User,
  Wrench,
  X,
  XCircle,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type ActivityEvent, type BookingHistoryRow, type BookingRating, type TimelineEvent } from "@/lib/api-client";
import { fmtDate, fmtDateTime, fmtMoney, humanize } from "@/lib/format";
import { toast } from "sonner";

const title = "Activity — FIXO";
const description = "A chronological log of your journey across every booking.";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ActivityPage,
});

const PAGE_SIZE = 6;
type Category = "Booking" | "Payment" | "Service" | "Invoice" | "Feedback";
const CATEGORIES: Category[] = ["Booking", "Payment", "Service", "Invoice", "Feedback"];
const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
] as const;

// Real backend event codes (see notify()/add_timeline() call sites across
// bookings/payments/tracking/invoices/ratings services) mapped to a friendly
// label, category chip and icon — a disclosed presentation layer over real
// event strings, never an invented event.
const EVENT_META: Record<string, { category: Category; label: string; icon: typeof Calendar }> = {
  CREATED: { category: "Booking", label: "Booking Created", icon: Calendar },
  PAYMENT_AUTHORIZED: { category: "Payment", label: "Payment Authorized", icon: CreditCard },
  PAYMENT_FAILED: { category: "Payment", label: "Payment Failed", icon: CreditCard },
  PROVIDER_ASSIGNED: { category: "Service", label: "Provider Assigned", icon: User },
  ON_THE_WAY: { category: "Service", label: "Provider On The Way", icon: Truck },
  ARRIVED: { category: "Service", label: "Provider Arrived", icon: MapPin },
  ARRIVAL_VERIFIED: { category: "Service", label: "Arrival Verified", icon: CheckCircle2 },
  STARTED: { category: "Service", label: "Service Started", icon: Wrench },
  SERVICE_COMPLETED: { category: "Service", label: "Service Completed", icon: CheckCircle2 },
  CANCELLED: { category: "Booking", label: "Booking Cancelled", icon: XCircle },
  CHANGE_PROPOSED: { category: "Booking", label: "Change Proposed", icon: Pencil },
  CHANGE_APPROVED: { category: "Booking", label: "Change Approved", icon: CheckCircle2 },
  CHANGE_REJECTED: { category: "Booking", label: "Change Rejected", icon: XCircle },
  INVOICE_READY: { category: "Invoice", label: "Invoice Ready", icon: FileText },
  REVIEW_SUBMITTED: { category: "Feedback", label: "Review Submitted", icon: Star },
  // Client-synthesized only when a CLOSED booking genuinely has no rating yet — never a real DB row.
  REVIEW_PENDING: { category: "Feedback", label: "Review Pending", icon: Star },
};
// The customer never actually completes every step in order, so this is used
// only to predict a plausible *next* milestone for the payment dialog's
// progress line — always labeled "Upcoming", never asserted as having happened.
const IDEAL_SEQUENCE = ["CREATED", "PAYMENT_AUTHORIZED", "PROVIDER_ASSIGNED", "SERVICE_COMPLETED", "INVOICE_READY", "REVIEW_SUBMITTED"];

function metaFor(event: string) {
  return EVENT_META[event] ?? { category: "Booking" as Category, label: humanize(event), icon: ActivityIcon };
}

function categoryStyle(c: Category) {
  switch (c) {
    case "Booking": return "bg-primary/10 text-primary";
    case "Payment": return "bg-success/15 text-success";
    case "Service": return "bg-sky-500/15 text-sky-600";
    case "Invoice": return "bg-amber-500/15 text-amber-600";
    case "Feedback": return "bg-purple-500/15 text-purple-600";
  }
}

function statusFor(ev: MergedEvent): { label: string; style: string } {
  if (ev.pending) return { label: "Pending", style: "bg-amber-500/15 text-amber-600" };
  if (ev.event === "PAYMENT_FAILED" || ev.event === "CHANGE_REJECTED" || ev.event === "CANCELLED") {
    return { label: "Failed", style: "bg-destructive/15 text-destructive" };
  }
  return { label: "Completed", style: "bg-success/15 text-success" };
}

function parseGatewayRef(detail?: string | null): string | null {
  const m = /ref[=:]\s*(\S+)/i.exec(detail ?? "");
  return m ? m[1]!.replace(/[.,]$/, "") : null;
}

interface MergedEvent extends ActivityEvent {
  pending?: boolean;
}

function ActivityPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);
  const [bookings, setBookings] = useState<BookingHistoryRow[] | null>(null);
  const [ratings, setRatings] = useState<BookingRating[] | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [range, setRange] = useState<string>("30");
  const [page, setPage] = useState(1);
  const [timelineView, setTimelineView] = useState(false);
  const [selected, setSelected] = useState<MergedEvent | null>(null);

  const load = useCallback(async () => {
    try {
      setEvents(await fixoSdk.activityFeed(undefined, 100, 0));
    } catch {
      setEvents((prev) => prev ?? []);
    }
    try {
      setBookings(await fixoSdk.bookingHistory(undefined, 100, 0));
    } catch {
      setBookings((prev) => prev ?? []);
    }
    try {
      setRatings(await fixoSdk.listMyRatings());
    } catch {
      setRatings((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    if (access_token && !loading) void load();
  }, [access_token, loading, load]);

  const bookingByNumber = useMemo(() => new Map((bookings ?? []).map((b) => [b.booking_number, b])), [bookings]);

  // Real, disclosed synthetic row: a CLOSED booking with no RATINGS row yet.
  // Never a fabricated database event — just an honest prompt derived from
  // the absence of one.
  const pendingReviews: MergedEvent[] = useMemo(() => {
    if (!bookings || !ratings) return [];
    const rated = new Set(ratings.map((r) => r.booking_id));
    return bookings
      .filter((b) => b.status === "CLOSED" && !rated.has(b.booking_id))
      .map((b) => ({
        booking_id: b.booking_id,
        booking_number: b.booking_number,
        service_name: b.service_name ?? null,
        event: "REVIEW_PENDING",
        detail: "Please share your feedback",
        created_at: b.completed_at ?? b.created_at,
        pending: true,
      }));
  }, [bookings, ratings]);

  const merged: MergedEvent[] = useMemo(
    () => [...(events ?? []), ...pendingReviews].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [events, pendingReviews],
  );

  const filtered = useMemo(() => {
    let list = merged;
    if (categoryFilter !== "all") list = list.filter((e) => metaFor(e.event).category === categoryFilter);
    if (range !== "all") {
      const cutoff = Date.now() - Number(range) * 24 * 60 * 60 * 1000;
      list = list.filter((e) => new Date(e.created_at).getTime() >= cutoff);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        [e.booking_number, e.service_name ?? "", e.detail ?? "", metaFor(e.event).label].some((f) => f.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [merged, categoryFilter, range, search]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const dataLoaded = events !== null && bookings !== null && ratings !== null;
  const totalEvents = events?.length ?? 0;
  const bookingEvents = (events ?? []).filter((e) => e.event === "CREATED").length;
  const paymentEvents = (events ?? []).filter((e) => metaFor(e.event).category === "Payment").length;
  const thisWeek = (events ?? []).filter((e) => Date.now() - new Date(e.created_at).getTime() <= 7 * 24 * 60 * 60 * 1000).length;

  function exportCsv() {
    const rows = [
      ["Event", "Booking", "Category", "Details", "Date", "Status"],
      ...filtered.map((e) => {
        const meta = metaFor(e.event);
        const st = statusFor(e);
        return [meta.label, e.booking_number, meta.category, (e.detail ?? "").replace(/"/g, "'"), fmtDateTime(e.created_at), st.label];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fixo-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Activity exported");
  }

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const hasActiveFilters = search.trim() !== "" || categoryFilter !== "all";

  const dialogOpen = !!selected && metaFor(selected.event).category === "Payment";
  const panelOpen = !!selected && metaFor(selected.event).category !== "Payment";

  return (
    <PageShell title="Activity" subtitle="A chronological log of your journey" userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ActivityIcon} label="Total Events" hint="All activity recorded" value={dataLoaded ? String(totalEvents) : "—"} />
        <MetricCard icon={Calendar} label="Booking Events" hint="Bookings created" value={dataLoaded ? String(bookingEvents) : "—"} />
        <MetricCard icon={CreditCard} label="Payment Actions" hint="Payments & authorizations" value={dataLoaded ? String(paymentEvents) : "—"} tone="success" />
        <MetricCard icon={TrendingUp} label="This Week" hint="Events this week" value={dataLoaded ? String(thisWeek) : "—"} tone="amber" tintValue />
      </div>

      <div className="mt-6 flex items-start gap-6">
        <div className="min-w-0 flex-1">
          <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[180px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search activity..."
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Events" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={range} onValueChange={setRange}>
                <SelectTrigger className="w-[150px]"><Calendar className="mr-1 size-4" /><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RANGES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <button onClick={exportCsv} className="flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium hover:bg-muted">
                <Download className="size-4" /> Export
              </button>
              <button
                onClick={() => setTimelineView((v) => !v)}
                className={`flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold ${timelineView ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"}`}
              >
                <TrendingUp className="size-4" /> View timeline
              </button>
            </div>

            <div className="mt-4">
              {!dataLoaded ? (
                <div className="h-64 animate-pulse rounded-3xl bg-muted/60" />
              ) : filtered.length === 0 ? (
                hasActiveFilters ? (
                  <EmptyState compact icon={FilterX} title="No matching activity" description="Try adjusting your search or filters." actionLabel="Clear Filters" onAction={() => { setSearch(""); setCategoryFilter("all"); }} />
                ) : (
                  <EmptyState compact icon={FileQuestion} title="No activity yet" description="Booking events — confirmations, payments, updates — will show up here." actionLabel="Browse Services" actionTo="/services" />
                )
              ) : timelineView ? (
                <ol className="space-y-0">
                  {paged.map((ev, i) => {
                    const meta = metaFor(ev.event);
                    const st = statusFor(ev);
                    return (
                      <li key={`${ev.booking_id}-${ev.event}-${ev.created_at}-${i}`} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${categoryStyle(meta.category)}`}>
                            <meta.icon className="size-4" />
                          </span>
                          {i < paged.length - 1 && <span className="w-px flex-1 bg-border" />}
                        </div>
                        <button onClick={() => setSelected(ev)} className="flex-1 pb-6 text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{meta.label}</p>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${categoryStyle(meta.category)}`}>{meta.category}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${st.style}`}>{st.label}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{ev.booking_number}{ev.service_name ? ` · ${ev.service_name}` : ""}</p>
                          <p className="text-sm text-muted-foreground">{ev.detail ?? "—"}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{fmtDateTime(ev.created_at)}</p>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="py-3 font-semibold">Event</th>
                        <th className="px-4 py-3 font-semibold">Booking</th>
                        <th className="px-4 py-3 font-semibold">Category</th>
                        <th className="px-4 py-3 font-semibold">Details</th>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((ev, i) => {
                        const meta = metaFor(ev.event);
                        const st = statusFor(ev);
                        return (
                          <tr
                            key={`${ev.booking_id}-${ev.event}-${ev.created_at}-${i}`}
                            onClick={() => setSelected(ev)}
                            className={`cursor-pointer border-b border-border last:border-0 hover:bg-muted/40 ${selected === ev ? "bg-primary/5" : ""}`}
                          >
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <span className={`flex size-9 items-center justify-center rounded-xl ${categoryStyle(meta.category)}`}>
                                  <meta.icon className="size-4" />
                                </span>
                                <span className="font-semibold">{meta.label}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {ev.booking_number}
                              {ev.service_name && <span className="block text-xs">{ev.service_name}</span>}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${categoryStyle(meta.category)}`}>{meta.category}</span>
                            </td>
                            <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">{ev.detail ?? "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{fmtDateTime(ev.created_at)}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.style}`}>{st.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {dataLoaded && filtered.length > 0 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} events
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40">‹</button>
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{page}</span>
                    <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40">›</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {panelOpen && selected ? (
          <JourneyPanel event={selected} booking={bookingByNumber.get(selected.booking_number)} onClose={() => setSelected(null)} />
        ) : !dialogOpen ? (
          <InsightsSidebar events={merged} bookingByNumber={bookingByNumber} onOpenTimeline={() => setTimelineView(true)} />
        ) : null}
      </div>

      <PaymentDialog
        event={dialogOpen ? selected : null}
        booking={selected ? bookingByNumber.get(selected.booking_number) : undefined}
        open={dialogOpen}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </PageShell>
  );
}

function Field({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {
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

function InsightsSidebar({
  events,
  bookingByNumber,
  onOpenTimeline,
}: {
  events: MergedEvent[];
  bookingByNumber: Map<string, BookingHistoryRow>;
  onOpenTimeline: () => void;
}) {
  const navigate = useNavigate();
  const mostRecent = events.find((e) => !e.pending);
  const lastPayment = events.find((e) => metaFor(e.event).category === "Payment");
  const lastCompleted = events.find((e) => e.event === "SERVICE_COMPLETED");
  const lastPaymentBooking = lastPayment ? bookingByNumber.get(lastPayment.booking_number) : undefined;
  const lastCompletedBooking = lastCompleted ? bookingByNumber.get(lastCompleted.booking_number) : undefined;

  return (
    <div className="w-[320px] shrink-0 space-y-4 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
      <h3 className="flex items-center gap-2 text-lg font-semibold">
        <Sparkles className="size-5 text-primary" /> Activity insights
      </h3>

      {mostRecent && (
        <div className="rounded-2xl border border-border p-4">
          <p className="flex items-center gap-2 text-sm font-semibold"><Calendar className="size-4 text-primary" /> Most recent booking</p>
          <p className="mt-2 font-semibold text-primary">{mostRecent.booking_number}</p>
          <p className="text-sm text-muted-foreground">{mostRecent.service_name ?? "Service"}</p>
          <p className="text-xs text-muted-foreground">{fmtDate(mostRecent.created_at)}</p>
          <button onClick={() => navigate({ to: "/bookings" })} className="mt-3 flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-muted">
            View booking <span aria-hidden>→</span>
          </button>
        </div>
      )}

      {lastPayment && (
        <div className="rounded-2xl border border-border p-4">
          <p className="flex items-center gap-2 text-sm font-semibold"><CreditCard className="size-4 text-primary" /> Last payment</p>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-bold">{lastPaymentBooking ? fmtMoney(lastPaymentBooking.agreed_amount, lastPaymentBooking.currency) : "—"}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${lastPayment.event === "PAYMENT_FAILED" ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"}`}>
              {lastPayment.event === "PAYMENT_FAILED" ? "Failed" : "Authorized"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{fmtDate(lastPayment.created_at)}</p>
          <button onClick={() => navigate({ to: "/payments" })} className="mt-3 flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-muted">
            View payment <span aria-hidden>→</span>
          </button>
        </div>
      )}

      {lastCompleted && (
        <div className="rounded-2xl border border-border p-4">
          <p className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="size-4 text-primary" /> Latest completed service</p>
          <p className="mt-2 font-semibold">{lastCompleted.service_name ?? "Service"}</p>
          <p className="text-sm text-muted-foreground">{lastCompletedBooking?.provider_name ? `with ${lastCompletedBooking.provider_name}` : ""}</p>
          <p className="text-xs text-muted-foreground">{fmtDate(lastCompleted.created_at)}</p>
          <button onClick={() => navigate({ to: "/bookings" })} className="mt-3 flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-muted">
            View details <span aria-hidden>→</span>
          </button>
        </div>
      )}

      <div className="rounded-2xl bg-primary/5 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold"><Clock className="size-4 text-primary" /> Explore your journey</p>
        <p className="mt-1 text-xs text-muted-foreground">View full timeline of your activity.</p>
        <button onClick={onOpenTimeline} className="mt-2 flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          Open timeline <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}

function JourneyPanel({ event, booking, onClose }: { event: MergedEvent; booking: BookingHistoryRow | undefined; onClose: () => void }) {
  const navigate = useNavigate();
  const meta = metaFor(event.event);
  const st = statusFor(event);
  const [timeline, setTimeline] = useState<TimelineEvent[] | null>(null);

  useEffect(() => {
    setTimeline(null);
    if (event.booking_id) {
      void fixoSdk.bookingTimeline(event.booking_id).then(setTimeline).catch(() => setTimeline([]));
    } else {
      setTimeline([]);
    }
  }, [event.booking_id]);

  // Every real event that already happened gets ticked; anything in the
  // standard journey not reached yet stays an honest hollow "Pending" step —
  // the full checklist is always shown so progress reads at a glance.
  const fullSteps = IDEAL_SEQUENCE.map((code) => {
    const real = (timeline ?? []).find((t) => t.event === code);
    return { code, meta: metaFor(code), done: !!real, at: real?.created_at ?? null };
  });

  return (
    <div className="w-[380px] shrink-0 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className={`flex size-11 items-center justify-center rounded-2xl ${categoryStyle(meta.category)}`}>
            <meta.icon className="size-5" />
          </span>
          <div>
            <p className="text-lg font-semibold">{meta.label}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${categoryStyle(meta.category)}`}>{meta.category}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.style}`}>{st.label}</span>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Field icon={Calendar} label="Date & Time" value={fmtDateTime(event.created_at)} />
        <Field icon={Hash} label="Booking" value={`${event.booking_number}${event.service_name ? ` · ${event.service_name}` : ""}`} />
        {booking?.provider_name && <Field icon={User} label="Provider" value={booking.provider_name} />}
        {booking && (
          <Field icon={CreditCard} label="Payment" value={fmtMoney(booking.agreed_amount, booking.currency)} />
        )}
        {meta.category === "Payment" && (
          <Field icon={ListChecks} label="Payment Status" value={event.event === "PAYMENT_FAILED" ? "Failed" : "Authorized"} />
        )}
      </div>

      <div className="mt-5">
        <h4 className="mb-3 text-sm font-semibold">Journey Timeline</h4>
        {timeline === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ol className="space-y-3">
            {fullSteps.map((s) => (
              <li key={s.code} className="flex items-start gap-3">
                <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${s.done ? "bg-success text-white" : "border-2 border-border text-muted-foreground"}`}>
                  {s.done ? <Check className="size-3" /> : <Circle className="size-2 fill-current" />}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${s.done ? "" : "text-muted-foreground"}`}>{s.meta.label}</p>
                    <span className={`text-xs font-semibold ${s.done ? "text-success" : "text-muted-foreground"}`}>{s.done ? "Completed" : "Pending"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{s.at ? fmtDateTime(s.at) : "Not yet reached"}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="mt-5">
        <h4 className="mb-2 text-sm font-semibold">Description</h4>
        <p className="text-sm text-muted-foreground">{event.detail ?? "No additional details for this event."}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button onClick={() => navigate({ to: "/bookings" })} className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">
          <Calendar className="size-4" /> View booking
        </button>
        {meta.category === "Invoice" ? (
          <button onClick={() => navigate({ to: "/invoices" })} className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">
            <Download className="size-4" /> Download invoice
          </button>
        ) : event.pending ? (
          <button
            onClick={() => { toast.info("Opening Feedback — find this booking to leave your review."); navigate({ to: "/feedback" }); }}
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Star className="size-4" /> Leave review
          </button>
        ) : (
          <button onClick={() => navigate({ to: "/feedback" })} className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">
            <Star className="size-4" /> Leave review
          </button>
        )}
      </div>
    </div>
  );
}


function PaymentDialog({
  event,
  booking,
  open,
  onOpenChange,
}: {
  event: MergedEvent | null;
  booking: BookingHistoryRow | undefined;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState<TimelineEvent[] | null>(null);

  useEffect(() => {
    setTimeline(null);
    if (open && event?.booking_id) {
      void fixoSdk.bookingTimeline(event.booking_id).then(setTimeline).catch(() => setTimeline([]));
    }
  }, [open, event?.booking_id]);

  if (!event) return null;
  const meta = metaFor(event.event);
  const st = statusFor(event);
  const gatewayRef = parseGatewayRef(event.detail);
  const doneEvents = new Set((timeline ?? []).map((t) => t.event));
  const nextStep = IDEAL_SEQUENCE.find((e) => !doneEvents.has(e));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Activity details</DialogTitle>
          <p className="text-sm text-muted-foreground">Detailed information about this activity</p>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-4">
            <div className="flex items-center gap-3">
              <span className={`flex size-11 items-center justify-center rounded-2xl ${categoryStyle(meta.category)}`}>
                <meta.icon className="size-5" />
              </span>
              <div>
                <p className="font-semibold">{meta.label}</p>
                <p className="text-xs text-muted-foreground">{event.detail}</p>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.style}`}>{st.label}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <Field icon={ActivityIcon} label="Event Type" value={meta.label} />
            <Field icon={Hash} label="Booking Reference" value={event.booking_number} />
            <Field icon={Wrench} label="Service" value={event.service_name ?? "—"} />
            <Field icon={Receipt} label="Payment Reference" value={gatewayRef ?? "—"} />
            <Field icon={CreditCard} label="Amount" value={booking ? fmtMoney(booking.agreed_amount, booking.currency) : "—"} />
            <Field icon={Clock} label="Date & Time" value={fmtDateTime(event.created_at)} />
          </div>

          <div className="flex items-center gap-1">
            <Field icon={CheckCircle2} label="Status" value={st.label} />
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Progress timeline</h4>
            {timeline === null ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="flex items-start gap-1">
                {timeline.slice(0, 3).map((t, i) => {
                  const tMeta = metaFor(t.event);
                  const isLast = i === Math.min(timeline.length, 3) - 1 && !nextStep;
                  return (
                    <div key={i} className="flex min-w-0 flex-1 flex-col items-center text-center">
                      <div className="flex w-full items-center">
                        <div className={`h-px flex-1 ${i === 0 ? "opacity-0" : "bg-success/40"}`} />
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-white">
                          <Check className="size-4" />
                        </span>
                        <div className={`h-px flex-1 ${isLast ? "opacity-0" : "bg-success/40"}`} />
                      </div>
                      <p className="mt-2 text-xs font-medium">{tMeta.label}</p>
                      <p className="text-[11px] text-muted-foreground">{fmtDate(t.created_at)}</p>
                    </div>
                  );
                })}
                {nextStep && (
                  <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                    <div className="flex w-full items-center">
                      <div className="h-px flex-1 bg-border" />
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border text-muted-foreground">
                        <Circle className="size-2 fill-current" />
                      </span>
                      <div className="h-px flex-1 opacity-0" />
                    </div>
                    <p className="mt-2 text-xs font-medium">Next Step:<br />{metaFor(nextStep).label}</p>
                    <p className="text-[11px] text-muted-foreground">Upcoming</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {event.event === "PAYMENT_FAILED"
              ? "This payment attempt failed — you can retry it from your booking."
              : "Your payment has been authorized successfully. We'll keep this booking updated as it progresses."}
          </div>

          <div className="flex gap-2">
            <button onClick={() => onOpenChange(false)} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted">Close</button>
            <button onClick={() => navigate({ to: "/bookings" })} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted">
              <Calendar className="size-4" /> View booking
            </button>
            <button
              onClick={() => navigate({ to: "/payments" })}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              <CreditCard className="size-4" /> View payment
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
