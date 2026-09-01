// Feedback — rate providers for completed (CLOSED) bookings, matching the
// reference: a rich rating dialog, a review-details squeeze panel, and a
// real "recent feedback" recap — all backed by the single real RATINGS row
// per booking (rating 1-5 + a comment), since that's all the schema stores.
import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Droplets,
  FileText,
  Hash,
  MessageSquare,
  MessageSquareHeart,
  Paintbrush,
  Pencil,
  Receipt,
  Send,
  Sparkles,
  Star,
  Tag,
  Truck,
  Users,
  Wind,
  Wrench,
  X,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type BookingHistoryRow, type BookingRating } from "@/lib/api-client";
import { fmtDate, fmtMoney, humanize } from "@/lib/format";
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

const TABS = ["All", "Pending", "Submitted"] as const;
type Tab = (typeof TABS)[number];

// The RATINGS table only stores one overall 1-5 rating + a single comment —
// no per-aspect scores, tags or photos. Rather than silently discard the
// richer input the reference UI asks for, real per-aspect stars and chosen
// highlight tags are encoded into the one comment field we do have and
// decoded back out for display — nothing shown is invented, it's exactly
// what the customer entered, just packed into the only column available.
const ASPECTS = [
  { key: "Q", label: "Quality", icon: Award },
  { key: "P", label: "Punctuality", icon: Clock },
  { key: "C", label: "Communication", icon: MessageSquare },
  { key: "V", label: "Value", icon: Tag },
] as const;
const HIGHLIGHT_TAGS = ["Professional", "On time", "Clean work", "Friendly"] as const;
const ENCODE_RE = /^\[\[A:([^\]]*)\]\](?:\[\[T:([^\]]*)\]\])?\s?/;

function encodeComment(aspects: Record<string, number>, tags: string[], text: string): string {
  const aspectStr = ASPECTS.map((a) => `${a.key}${aspects[a.key] ?? 0}`).join("");
  const parts = [`[[A:${aspectStr}]]`];
  if (tags.length) parts.push(`[[T:${tags.join(",")}]]`);
  const prefix = parts.join("");
  const remaining = Math.max(0, 500 - prefix.length - 1);
  return `${prefix} ${text.trim().slice(0, remaining)}`.trim();
}

function decodeComment(comment?: string | null): { aspects: Record<string, number>; tags: string[]; text: string } {
  const aspects: Record<string, number> = {};
  let tags: string[] = [];
  let text = comment ?? "";
  const m = ENCODE_RE.exec(text);
  if (m) {
    const aspectStr = m[1] ?? "";
    for (const a of ASPECTS) {
      const idx = aspectStr.indexOf(a.key);
      if (idx >= 0 && idx + 1 < aspectStr.length) aspects[a.key] = Number(aspectStr[idx + 1]) || 0;
    }
    if (m[2]) tags = m[2].split(",").filter(Boolean);
    text = text.slice(m[0].length);
  }
  return { aspects, tags, text };
}

function iconForService(name?: string | null) {
  const n = (name ?? "").toLowerCase();
  if (n.includes("plumb") || n.includes("leak") || n.includes("water")) return Droplets;
  if (n.includes("ac") || n.includes("air")) return Wind;
  if (n.includes("clean")) return Sparkles;
  if (n.includes("paint")) return Paintbrush;
  if (n.includes("mov")) return Truck;
  return Wrench;
}

function StarPicker({ value, onChange, size = "size-8" }: { value: number; onChange: (n: number) => void; size?: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => onChange(n)} aria-label={`${n} star`}>
          <Star className={`${size} transition-colors ${n <= (hover || value) ? "fill-current text-[#FFB800]" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

function Stars({ value, className = "size-4" }: { value: number; className?: string }) {
  return (
    <div className="flex text-[#FFB800]">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${className} ${n <= Math.round(value) ? "fill-current" : "text-muted-foreground"}`} />
      ))}
    </div>
  );
}

interface FeedbackRow {
  booking: BookingHistoryRow;
  rating: BookingRating | null;
}

function FeedbackPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingHistoryRow[] | null>(null);
  const [ratings, setRatings] = useState<BookingRating[] | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("All");
  const [sortOldest, setSortOldest] = useState(false);

  const [rateTarget, setRateTarget] = useState<FeedbackRow | null>(null);
  const [detailTarget, setDetailTarget] = useState<FeedbackRow | null>(null);

  const load = useCallback(async () => {
    try {
      setBookings(await fixoSdk.bookingHistory("CLOSED", 100, 0));
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

  const rows: FeedbackRow[] = useMemo(() => {
    if (!bookings || !ratings) return [];
    const byBooking = new Map(ratings.map((r) => [r.booking_id, r]));
    return bookings.map((b) => ({ booking: b, rating: byBooking.get(b.booking_id) ?? null }));
  }, [bookings, ratings]);

  const filtered = useMemo(() => {
    let list = rows.filter((r) => {
      if (tab === "Pending") return !r.rating;
      if (tab === "Submitted") return !!r.rating;
      return true;
    });
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        [r.booking.service_name, r.booking.provider_name, r.booking.booking_number].some((f) => (f ?? "").toLowerCase().includes(q)),
      );
    }
    return [...list].sort((a, b) => {
      const da = new Date(a.rating?.created_at ?? a.booking.completed_at ?? a.booking.created_at).getTime();
      const db = new Date(b.rating?.created_at ?? b.booking.completed_at ?? b.booking.created_at).getTime();
      return sortOldest ? da - db : db - da;
    });
  }, [rows, tab, search, sortOldest]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const submittedCount = rows.filter((r) => r.rating).length;
  const pendingCount = rows.filter((r) => !r.rating).length;
  const avgRating = submittedCount > 0 ? rows.reduce((s, r) => s + (r.rating?.rating ?? 0), 0) / submittedCount : 0;
  const providersRated = new Set(rows.filter((r) => r.rating).map((r) => r.booking.provider_name ?? r.rating?.provider_id)).size;
  const recentFeedback = rows.filter((r) => r.rating).slice(0, 5);
  const dataLoaded = bookings !== null && ratings !== null;

  function closeAll() {
    setRateTarget(null);
    setDetailTarget(null);
  }

  return (
    <PageShell title="Feedback" subtitle="Rate providers for your completed jobs" userName={customer?.full_name} onLogout={logout}>
      <div className="flex gap-6">
        <div className="min-w-0 flex-1">
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={MessageSquareHeart} label="Total Reviews" hint="All time reviews" value={dataLoaded ? String(submittedCount) : "—"} />
            <MetricCard icon={ClipboardList} label="Pending Reviews" hint="Bookings to rate" value={dataLoaded ? String(pendingCount) : "—"} tone="amber" tintValue />
            <MetricCard icon={Star} label="Average Rating" hint="Across all providers" value={dataLoaded ? avgRating.toFixed(1) : "—"} tone="success" tintValue />
            <MetricCard icon={Users} label="Providers Rated" hint="Distinct providers" value={dataLoaded ? String(providersRated) : "—"} />
          </div>

          <div className="mt-6 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex gap-1 rounded-xl bg-muted p-1">
                {TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      tab === t ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={tab === t ? { backgroundImage: "var(--gradient-primary)" } : undefined}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex flex-1 items-center gap-3 sm:flex-none">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search bookings, services or providers..."
                  className="h-10 w-full min-w-[180px] rounded-xl border border-border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground sm:w-64"
                />
                <button
                  onClick={() => setSortOldest((v) => !v)}
                  className="flex h-10 shrink-0 items-center gap-1 rounded-xl border border-border px-3 text-sm font-medium hover:bg-muted"
                >
                  {sortOldest ? "Oldest first" : "Newest first"}
                </button>
              </div>
            </div>

            <div className="mt-4">
              {!dataLoaded ? (
                <div className="h-64 animate-pulse rounded-3xl bg-muted/60" />
              ) : filtered.length === 0 ? (
                <EmptyState
                  compact
                  icon={MessageSquareHeart}
                  title={tab === "Pending" ? "Nothing pending" : tab === "Submitted" ? "No reviews yet" : "Nothing to rate yet"}
                  description="Once a booking is completed and closed, you'll be able to rate your provider here."
                  actionLabel="View My Bookings"
                  actionTo="/bookings"
                />
              ) : (
                <div className="divide-y divide-border">
                  {filtered.map((row) => {
                    const Icon = iconForService(row.booking.service_name);
                    const decoded = row.rating ? decodeComment(row.rating.comment) : null;
                    return (
                      <button
                        key={row.booking.booking_id}
                        onClick={() => (row.rating ? setDetailTarget(row) : setRateTarget(row))}
                        className="flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-muted/40"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{row.booking.service_name ?? "Service"}</p>
                          <p className="text-sm text-muted-foreground">{row.booking.provider_name ?? "Provider"}</p>
                          {row.rating && decoded?.text && <p className="mt-0.5 truncate text-xs text-muted-foreground">{decoded.text}</p>}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {row.rating ? <Stars value={row.rating.rating} /> : null}
                          <span className="text-xs text-muted-foreground">
                            {fmtDate(row.rating?.created_at ?? row.booking.completed_at ?? row.booking.created_at)}
                          </span>
                        </div>
                        {row.rating ? (
                          <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">Submitted</span>
                        ) : (
                          <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">Rate now</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Review details — squeeze panel, no overlay */}
        {detailTarget && (
          <ReviewDetailsPanel
            row={detailTarget}
            onClose={closeAll}
            onEdit={() => {
              setRateTarget(detailTarget);
              setDetailTarget(null);
            }}
          />
        )}

        {!detailTarget && (
          <div className="mt-6 w-[320px] shrink-0 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent feedback</h3>
              <button onClick={() => setTab("Submitted")} className="text-sm font-semibold text-primary hover:underline">
                View all
              </button>
            </div>
            {recentFeedback.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Your submitted reviews will show up here.</p>
            ) : (
              <div className="mt-4 divide-y divide-border">
                {recentFeedback.map((row) => {
                  const decoded = decodeComment(row.rating?.comment);
                  return (
                    <button key={row.booking.booking_id} onClick={() => setDetailTarget(row)} className="block w-full py-3 text-left">
                      <p className="font-semibold">{row.booking.provider_name ?? "Provider"}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Stars value={row.rating!.rating} className="size-3.5" />
                        <span className="text-xs text-muted-foreground">{fmtDate(row.rating!.created_at)}</span>
                      </div>
                      {decoded.text && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{decoded.text}</p>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <RateDialog
        row={rateTarget}
        open={!!rateTarget}
        onOpenChange={(o) => !o && setRateTarget(null)}
        onSubmitted={(rating) => {
          setRatings((prev) => {
            const next = (prev ?? []).filter((r) => r.booking_id !== rating.booking_id);
            return [rating, ...next];
          });
          setRateTarget(null);
        }}
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

function ReviewDetailsPanel({ row, onClose, onEdit }: { row: FeedbackRow; onClose: () => void; onEdit: () => void }) {
  const navigate = useNavigate();
  const rating = row.rating!;
  const decoded = decodeComment(rating.comment);
  const aspectValues = ASPECTS.map((a) => decoded.aspects[a.key] ?? 0).filter((v) => v > 0);
  const hasAspects = aspectValues.length > 0;

  return (
    <div className="mt-6 w-[380px] shrink-0 animate-in fade-in slide-in-from-right-4 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Review details</h3>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-4 space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold">{rating.rating.toFixed(1)}</p>
            <Stars value={rating.rating} className="size-4" />
          </div>
          <p className="text-sm text-muted-foreground">{fmtDate(rating.created_at)}</p>
        </div>

        {hasAspects && (
          <div className="grid grid-cols-2 gap-3">
            {ASPECTS.map((a) => {
              const v = decoded.aspects[a.key] ?? 0;
              if (!v) return null;
              return (
                <div key={a.key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{a.label}</span>
                  <Stars value={v} className="size-3.5" />
                </div>
              );
            })}
          </div>
        )}

        {decoded.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {decoded.tags.map((t) => (
              <span key={t} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {t}
              </span>
            ))}
          </div>
        )}

        <div>
          <h4 className="mb-2 text-sm font-semibold">Your review</h4>
          <p className="text-sm text-muted-foreground">{decoded.text || "No written feedback for this booking."}</p>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold">Booking information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field icon={Hash} label="Booking ID" value={row.booking.booking_number} />
            <Field icon={Wrench} label="Service" value={row.booking.service_name ?? "—"} />
            <Field icon={Calendar} label="Date & Time" value={fmtDate(row.booking.scheduled_date ?? row.booking.completed_at ?? row.booking.created_at)} />
            <Field icon={Receipt} label="Amount Paid" value={fmtMoney(row.booking.agreed_amount, row.booking.currency)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={onEdit} className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">
            <Pencil className="size-4" /> Edit review
          </button>
          <button
            onClick={() => navigate({ to: "/bookings" })}
            className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted"
          >
            <FileText className="size-4" /> View booking
          </button>
        </div>
      </div>
    </div>
  );
}

function RateDialog({
  row,
  open,
  onOpenChange,
  onSubmitted,
}: {
  row: FeedbackRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmitted: (rating: BookingRating) => void;
}) {
  const [overall, setOverall] = useState(0);
  const [aspects, setAspects] = useState<Record<string, number>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [photoNames, setPhotoNames] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!row) return;
    if (row.rating) {
      const decoded = decodeComment(row.rating.comment);
      setOverall(row.rating.rating);
      setAspects(decoded.aspects);
      setTags(decoded.tags);
      setText(decoded.text);
    } else {
      setOverall(0);
      setAspects({});
      setTags([]);
      setText("");
    }
    setPhotoNames([]);
  }, [row]);

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function submit() {
    if (!row || overall === 0) {
      toast.error("Pick a star rating first");
      return;
    }
    setSubmitting(true);
    try {
      const comment = encodeComment(aspects, tags, text);
      const res = await fixoSdk.submitRating(row.booking.booking_id, overall, comment);
      if (photoNames.length > 0) {
        toast.info("Photo attachments aren't available yet — your rating and comments were saved.");
      }
      toast.success("Thanks for your feedback!");
      onSubmitted({ ...res, booking_number: row.booking.booking_number, service_name: row.booking.service_name, provider_name: row.booking.provider_name });
    } catch {
      // toast emitted by client
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Rate your provider</DialogTitle>
          <p className="text-sm text-muted-foreground">Share your experience for this completed booking.</p>
        </DialogHeader>

        {row && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {(row.booking.provider_name ?? "P")
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <div>
                  <p className="flex items-center gap-1.5 font-semibold">
                    {row.booking.provider_name ?? "Provider"} <CheckCircle2 className="size-4 text-primary" />
                  </p>
                  <p className="text-sm text-muted-foreground">{row.booking.service_name ?? "Service"}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-sm">
                <Field icon={FileText} label="Booking code" value={row.booking.booking_number} />
                <Field
                  icon={Calendar}
                  label="Service date"
                  value={fmtDate(row.booking.scheduled_date ?? row.booking.completed_at ?? row.booking.created_at)}
                />
                <Field icon={Receipt} label="Total amount" value={fmtMoney(row.booking.agreed_amount, row.booking.currency)} />
              </div>
            </div>

            <div className="text-center">
              <p className="font-semibold">How would you rate your overall experience?</p>
              <div className="mt-3 flex justify-center">
                <StarPicker value={overall} onChange={setOverall} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Tap a star to rate</p>
            </div>

            <div>
              <p className="mb-3 font-semibold">Rate specific aspects</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {ASPECTS.map((a) => (
                  <div key={a.key} className="flex flex-col items-center gap-2 rounded-xl border border-border p-3">
                    <a.icon className="size-4 text-primary" />
                    <span className="text-xs font-medium">{a.label}</span>
                    <StarPicker size="size-3.5" value={aspects[a.key] ?? 0} onChange={(n) => setAspects((prev) => ({ ...prev, [a.key]: n }))} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 font-semibold">Share your feedback</p>
              <Textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 420))} placeholder="Tell us about your experience..." className="min-h-24" />
              <p className="mt-1 text-right text-xs text-muted-foreground">{text.length}/420</p>
            </div>

            <div>
              <p className="mb-2 font-semibold">What stood out? <span className="font-normal text-muted-foreground">(Optional)</span></p>
              <div className="flex flex-wrap gap-2">
                {HIGHLIGHT_TAGS.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${
                      tags.includes(t) ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
                    }`}
                  >
                    <span className={`flex size-3.5 items-center justify-center rounded-full border-2 ${tags.includes(t) ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                      {tags.includes(t) && <Check className="size-2.5 text-primary-foreground" />}
                    </span>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-border p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Camera className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Add photos <span className="font-normal text-muted-foreground">(optional)</span></p>
                  <p className="text-xs text-muted-foreground">{photoNames.length > 0 ? `${photoNames.length} selected` : "Upload up to 5 photos of the work"}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-xl border border-border px-3 py-2 text-sm font-medium">Choose files</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => setPhotoNames(Array.from(e.target.files ?? []).slice(0, 5).map((f) => f.name))}
              />
            </label>

            <div className="flex gap-2">
              <button onClick={() => onOpenChange(false)} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted">
                Cancel
              </button>
              <button
                onClick={() => void submit()}
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                <Send className="size-4" /> {submitting ? "Submitting..." : "Submit review"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
