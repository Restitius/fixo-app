// Shared "booking detail" drawer — used by both Payments (charge detail) and
// History (history detail). Loads the real booking + its real event timeline
// on open; lets the customer message the provider or raise a dispute, both
// wired to the real messaging/disputes domains.
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Droplets,
  Loader2,
  MapPin,
  MessageSquare,
  Printer,
  User,
  Wrench,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { bookingApi, fixoSdk, type BookingRow, type TimelineEvent } from "@/lib/api-client";
import { fmtDate, fmtDateTime, fmtMoney, humanize } from "@/lib/format";
import { toast } from "sonner";

function iconForService(name?: string) {
  const n = (name ?? "").toLowerCase();
  if (n.includes("plumb") || n.includes("leak") || n.includes("water")) return Droplets;
  return Wrench;
}

function statusStyle(status: string) {
  const s = status.toUpperCase();
  if (["PAYMENT_AUTHORIZED", "CONFIRMED", "PAID", "CLOSED", "VALID"].includes(s))
    return "bg-success/15 text-success";
  if (["CANCELLED", "FAILED", "DISPUTED"].includes(s)) return "bg-destructive/15 text-destructive";
  return "bg-amber-500/15 text-amber-600";
}

interface BookingDetailSheetProps {
  bookingId: string | null;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

export function BookingDetailSheet({ bookingId, onOpenChange, title = "Details" }: BookingDetailSheetProps) {
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[] | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [disputeBody, setDisputeBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setBooking(null);
      setTimeline(null);
      setShowMessage(false);
      setShowDispute(false);
      setMessageBody("");
      setDisputeBody("");
      return;
    }
    let cancelled = false;
    Promise.all([bookingApi.getBooking(bookingId), fixoSdk.bookingTimeline(bookingId)]).then(([b, t]) => {
      if (cancelled) return;
      setBooking(b);
      setTimeline(t);
    });
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  async function sendMessage() {
    if (!bookingId || !messageBody.trim()) return;
    setSending(true);
    try {
      await bookingApi.sendBookingMessage(bookingId, messageBody.trim());
      toast.success(`Message sent to ${booking?.provider_name ?? "provider"}`);
      setMessageBody("");
      setShowMessage(false);
    } catch {
      // toast emitted by client
    } finally {
      setSending(false);
    }
  }

  async function raiseDispute() {
    if (!bookingId || disputeBody.trim().length < 10) {
      toast.error("Describe the issue in at least 10 characters");
      return;
    }
    setSending(true);
    try {
      await bookingApi.openDispute(bookingId, "SERVICE_QUALITY", disputeBody.trim());
      toast.success("Dispute opened — our team will review it");
      setDisputeBody("");
      setShowDispute(false);
    } catch {
      // toast emitted by client
    } finally {
      setSending(false);
    }
  }

  function print() {
    window.print();
  }

  const Icon = iconForService(booking?.service_name);

  return (
    <Sheet open={!!bookingId} onOpenChange={(o) => !o && onOpenChange(false)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        {!booking ? (
          <div className="mt-8 flex justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{booking.service_name ?? "Service"}</p>
                  <p className="text-xs text-muted-foreground">{booking.booking_number}</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(booking.status)}`}>
                {humanize(booking.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-muted/40 p-4 text-sm shadow-[var(--shadow-xs)]">
              <InfoField icon={User} label="Provider" value={booking.provider_name ?? "—"} />
              <InfoField
                icon={Calendar}
                label="Service date"
                value={`${fmtDate(booking.scheduled_date)}${booking.time_window ? ` · ${humanize(booking.time_window)}` : ""}`}
              />
              <InfoField
                icon={MapPin}
                label="Location"
                value={
                  booking.address_street
                    ? `${booking.address_street}, ${booking.address_city ?? ""}`
                    : "—"
                }
              />
              <InfoField icon={Wrench} label="Request" value={booking.request_number ?? "—"} />
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-primary/5 p-4 shadow-[var(--shadow-xs)]">
              <span className="text-sm font-medium text-muted-foreground">Total amount</span>
              <span className="text-xl font-bold text-primary">
                {fmtMoney(booking.agreed_amount, booking.currency)}
              </span>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold">Timeline</h4>
              {timeline === null ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events recorded yet.</p>
              ) : (
                <ol className="space-y-3">
                  {timeline.map((ev, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{humanize(ev.event)}</p>
                        {ev.detail && <p className="text-xs text-muted-foreground">{ev.detail}</p>}
                        <p className="text-xs text-muted-foreground">{fmtDateTime(ev.created_at)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {showMessage && (
              <div className="space-y-2 rounded-2xl border border-border p-3 animate-in fade-in slide-in-from-top-1">
                <Textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder={`Message ${booking.provider_name ?? "your provider"}...`}
                  className="min-h-16"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => void sendMessage()}
                    disabled={sending}
                    className="rounded-lg px-4 py-2 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all duration-200 ease-[var(--ease-premium)] hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
                    style={{ backgroundImage: "var(--gradient-primary)" }}
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                  <button onClick={() => setShowMessage(false)} className="rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {showDispute && (
              <div className="space-y-2 rounded-2xl border border-destructive/30 p-3 animate-in fade-in slide-in-from-top-1">
                <Textarea
                  value={disputeBody}
                  onChange={(e) => setDisputeBody(e.target.value)}
                  placeholder="Describe the issue with this booking..."
                  className="min-h-16"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => void raiseDispute()}
                    disabled={sending}
                    className="rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground shadow-[var(--shadow-sm)] transition-all duration-200 ease-[var(--ease-premium)] hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {sending ? "Submitting..." : "Submit Dispute"}
                  </button>
                  <button onClick={() => setShowDispute(false)} className="rounded-lg px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={print}
                className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Printer className="size-4" /> Print
              </button>
              <button
                onClick={() => setShowMessage((v) => !v)}
                className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                <MessageSquare className="size-4" /> Message Provider
              </button>
              <button
                onClick={() => setShowDispute((v) => !v)}
                className="flex items-center gap-1.5 rounded-xl border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <AlertTriangle className="size-4" /> Raise Dispute
              </button>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="w-full rounded-xl py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all duration-200 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Done
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoField({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}
