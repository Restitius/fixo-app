// "Booking details" modal for the My Bookings page — centered dialog with a
// horizontal progress stepper built from the booking's real event timeline.
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  Check,
  CreditCard,
  Droplets,
  Loader2,
  MapPin,
  RefreshCw,
  Wrench,
} from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { bookingApi, fixoSdk, type BookingRow, type TimelineEvent } from "@/lib/api-client";
import { fmtDate, humanize } from "@/lib/format";

function iconForService(name?: string) {
  const n = (name ?? "").toLowerCase();
  if (n.includes("plumb") || n.includes("leak") || n.includes("water")) return Droplets;
  return Wrench;
}

function statusStyle(status: string) {
  const s = status.toUpperCase();
  if (["PAYMENT_AUTHORIZED", "CONFIRMED", "PAID", "CLOSED"].includes(s)) return "bg-success/15 text-success";
  if (["CANCELLED", "FAILED", "DISPUTED"].includes(s)) return "bg-destructive/15 text-destructive";
  return "bg-amber-500/15 text-amber-600";
}

interface BookingDetailsDialogProps {
  bookingId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function BookingDetailsDialog({ bookingId, onOpenChange }: BookingDetailsDialogProps) {
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[] | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setBooking(null);
      setTimeline(null);
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

  const Icon = iconForService(booking?.service_name);

  return (
    <Dialog open={!!bookingId} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Booking details</DialogTitle>
        </DialogHeader>

        {!booking ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-4 shadow-[var(--shadow-xs)]">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">{booking.service_name ?? "Service"}</p>
                  <p className="text-xs text-muted-foreground">{booking.booking_number}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(booking.status)}`}>
                  {humanize(booking.status)}
                </span>
                <p className="mt-1 font-bold">{booking.currency} {booking.agreed_amount.toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <Field icon={Wrench} label="Provider" value={booking.provider_name ?? "—"} />
              <Field
                icon={MapPin}
                label="Location"
                value={booking.address_street ? `${booking.address_street}, ${booking.address_city ?? ""}` : "—"}
              />
              <Field icon={Calendar} label="Service date" value={fmtDate(booking.scheduled_date)} />
              <Field icon={CreditCard} label="Payment status" value={humanize(booking.payment?.status ?? booking.status)} />
              <Field icon={Calendar} label="Time slot" value={booking.time_window ? humanize(booking.time_window) : "—"} />
              <Field icon={CreditCard} label="Payment method" value={booking.payment?.gateway_ref ? "Mock Gateway" : "—"} />
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold">Timeline</h4>
              {timeline === null ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                <div className="flex items-start gap-1 overflow-x-auto pb-1">
                  {timeline.map((ev, idx) => (
                    <div key={idx} className="flex min-w-[100px] flex-1 flex-col items-center text-center">
                      <div className="flex w-full items-center">
                        <div className={`h-px flex-1 ${idx === 0 ? "opacity-0" : "bg-primary/30"}`} />
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
                          <Check className="size-4" />
                        </span>
                        <div className={`h-px flex-1 ${idx === timeline.length - 1 ? "opacity-0" : "bg-primary/30"}`} />
                      </div>
                      <p className="mt-2 text-xs font-medium">{humanize(ev.event)}</p>
                      <p className="text-[11px] text-muted-foreground">{fmtDate(ev.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-primary/5 p-4 shadow-[var(--shadow-xs)]">
              <div className="flex items-center gap-2">
                <RefreshCw className="size-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Need the service again?</p>
                  <p className="text-xs text-muted-foreground">Rebook a similar job in a few taps.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-xl border border-border py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                Close
              </button>
              <button
                onClick={() => navigate({ to: "/services" })}
                className="flex-1 rounded-xl py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all duration-200 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                Rebook Service
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}
