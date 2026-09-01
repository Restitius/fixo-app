// Feedback — rate providers for your completed (CLOSED) bookings.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FilterX, MessageSquareHeart, Send, Star } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableFilterBar, TableCard, TableScroll, TableHead, TablePagination } from "@/components/dashboard/DataTable";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type BookingHistoryRow } from "@/lib/api-client";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";

const title = "Feedback — FIXO";
const description = "Rate your providers and share feedback on completed bookings.";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: FeedbackPage,
});

const PAGE_SIZE = 8;

function FeedbackPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [rows, setRows] = useState<BookingHistoryRow[] | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [openBooking, setOpenBooking] = useState<BookingHistoryRow | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await fixoSdk.bookingHistory("CLOSED", 100, 0));
    } catch {
      // toast emitted by client
    }
  }, []);

  useEffect(() => {
    if (access_token && !loading) void load();
  }, [access_token, loading, load]);

  const filtered = useMemo(
    () =>
      (rows ?? []).filter((r) => {
        const rated = ratings[r.booking_id] !== undefined;
        const matchesStatus = statusFilter === "all" || (statusFilter === "rated" ? rated : !rated);
        const matchesSearch =
          !search || [r.service_name, r.booking_number, r.provider_name].some((f) => (f ?? "").toLowerCase().includes(search.toLowerCase()));
        return matchesStatus && matchesSearch;
      }),
    [rows, ratings, statusFilter, search],
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all";

  return (
    <PageShell
      title="Feedback"
      subtitle="Rate providers for your completed jobs"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search bookings..."
        filters={[
          {
            value: statusFilter,
            onChange: (v) => { setStatusFilter(v); setPage(1); },
            placeholder: "Rating Status",
            options: [
              { value: "all", label: "All" },
              { value: "rated", label: "Rated" },
              { value: "unrated", label: "Not Rated" },
            ],
          },
        ]}
      />

      {rows === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState icon={FilterX} title="No matching bookings" description="Try adjusting your search or filters." actionLabel="Clear Filters" onAction={() => { setSearch(""); setStatusFilter("all"); }} />
          ) : (
            <EmptyState
              icon={MessageSquareHeart}
              title="Nothing to rate yet"
              description="Once a booking is completed and closed, you'll be able to rate your provider here."
              actionLabel="View My Bookings"
              actionTo="/bookings"
            />
          )}
        </div>
      ) : (
        <TableCard>
          <TableScroll minWidth={720}>
            <TableHead columns={["Service", "Booking ID", "Date", "Provider", "Rating"]} />
            <tbody>
              {paged.map((b) => {
                const submitted = ratings[b.booking_id];
                return (
                  <tr
                    key={b.booking_id}
                    onClick={() => setOpenBooking(b)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-6 py-4 font-semibold">{b.service_name ?? "Service"}</td>
                    <td className="px-4 py-4 text-primary font-semibold">{b.booking_number}</td>
                    <td className="px-4 py-4 text-muted-foreground">{fmtDate(b.completed_at ?? b.created_at)}</td>
                    <td className="px-4 py-4">{b.provider_name ?? "—"}</td>
                    <td className="px-4 py-4">
                      {submitted ? (
                        <div className="flex text-[#FFB800]">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={`size-4 ${n <= submitted ? "fill-current" : "text-muted-foreground"}`} />
                          ))}
                        </div>
                      ) : (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Rate now</span>
                      )}
                    </td>
                  </tr>
                );
              })}
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

      <RatingSheet
        booking={openBooking}
        existingRating={openBooking ? ratings[openBooking.booking_id] : undefined}
        onOpenChange={(o) => !o && setOpenBooking(null)}
        onSubmitted={(bookingId, rating) => setRatings((prev) => ({ ...prev, [bookingId]: rating }))}
      />
    </PageShell>
  );
}

function RatingSheet({
  booking,
  existingRating,
  onOpenChange,
  onSubmitted,
}: {
  booking: BookingHistoryRow | null;
  existingRating?: number;
  onOpenChange: (open: boolean) => void;
  onSubmitted: (bookingId: string, rating: number) => void;
}) {
  const [rating, setRating] = useState(existingRating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setRating(existingRating ?? 0);
    setComment("");
  }, [booking, existingRating]);

  async function submit() {
    if (!booking || rating === 0) {
      toast.error("Pick a star rating first");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fixoSdk.submitRating(booking.booking_id, rating, comment.trim() || undefined);
      onSubmitted(booking.booking_id, res.rating);
      toast.success("Thanks for your feedback!");
      onOpenChange(false);
    } catch {
      // toast emitted by client
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={!!booking} onOpenChange={(o) => !o && onOpenChange(false)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Rate this booking</SheetTitle>
        </SheetHeader>
        {booking && (
          <div className="mt-4 space-y-4">
            <div>
              <p className="font-semibold">{booking.service_name ?? "Service"}</p>
              <p className="text-sm text-muted-foreground">
                {booking.booking_number} · {booking.provider_name ?? "Provider"} · {fmtDate(booking.completed_at ?? booking.created_at)}
              </p>
            </div>

            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)} aria-label={`${n} star`}>
                  <Star className={`size-8 transition-colors ${n <= (hover || rating) ? "fill-current text-[#FFB800]" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>

            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share more about your experience (optional)"
              className="min-h-24"
              maxLength={500}
            />

            <button
              onClick={() => void submit()}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              <Send className="size-4" /> {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
