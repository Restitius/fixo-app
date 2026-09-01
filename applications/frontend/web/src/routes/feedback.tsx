// Feedback — rate providers for your completed (CLOSED) bookings.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { MessageSquareHeart, Send, Star } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
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

function FeedbackPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [rows, setRows] = useState<BookingHistoryRow[] | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await fixoSdk.bookingHistory("CLOSED", 50, 0));
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

  return (
    <PageShell
      title="Feedback"
      subtitle="Rate providers for your completed jobs"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6">
        {rows === null ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={MessageSquareHeart}
            title="Nothing to rate yet"
            description="Once a booking is completed and closed, you'll be able to rate your provider here."
            actionLabel="View My Bookings"
            actionTo="/bookings"
          />
        ) : (
          <div className="space-y-4">
            {rows.map((b, i) => (
              <RatingCard key={b.booking_id} booking={b} delay={i * 60} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function RatingCard({ booking, delay }: { booking: BookingHistoryRow; delay: number }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<number | null>(null);

  async function submit() {
    if (rating === 0) {
      toast.error("Pick a star rating first");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fixoSdk.submitRating(booking.booking_id, rating, comment.trim() || undefined);
      setSubmitted(res.rating);
      toast.success("Thanks for your feedback!");
    } catch {
      // toast emitted by client
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">{booking.service_name ?? "Service"}</h3>
          <p className="text-sm text-muted-foreground">
            {booking.booking_number} · {booking.provider_name ?? "Provider"} · {fmtDate(booking.completed_at ?? booking.created_at)}
          </p>
        </div>
      </div>

      {submitted !== null ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-success/10 p-4 text-success">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={`size-5 ${n <= submitted ? "fill-current" : ""}`} />
            ))}
          </div>
          <span className="text-sm font-medium">You rated this {submitted}/5</span>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                aria-label={`${n} star`}
              >
                <Star
                  className={`size-7 transition-colors ${
                    n <= (hover || rating) ? "fill-current text-[#FFB800]" : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share more about your experience (optional)"
            className="min-h-20 rounded-2xl"
            maxLength={500}
          />
          <button
            onClick={() => void submit()}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Send className="size-4" /> {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      )}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-4">
      {[0, 1].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-3xl bg-muted/60" />
      ))}
    </div>
  );
}
