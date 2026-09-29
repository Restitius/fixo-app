// Actions a customer can take on one booking, driven by its real status: share the arrival
// code, follow the provider, approve extra work, confirm the finished job and pay, reschedule,
// cancel, or rate. Used inside the booking details dialog.
import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, KeyRound, Loader2, MapPinned, Star, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  bookingApi,
  type BookingRow,
  type CancellationPreview,
  type ChangeRequestRow,
  type TrackingSnapshot,
} from "@/lib/api-client";
import { fmtMoney, humanize } from "@/lib/format";

const MAX_RESCHEDULES = 2;
const MOVABLE = ["CONFIRMED", "PAYMENT_AUTHORIZED"];
const CANCELLABLE = ["CONFIRMED", "PAYMENT_AUTHORIZED", "PAYMENT_FAILED"];
const SHOW_CODE = ["PAYMENT_AUTHORIZED", "ON_THE_WAY", "ARRIVED"];
const WINDOWS = ["MORNING", "AFTERNOON", "EVENING"] as const;

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Please try again.";
}

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

interface Props {
  booking: BookingRow;
  /** Called after any change so the parent can reload the booking and its list. */
  onChanged: () => void;
}

export function BookingActions({ booking, onChanged }: Props) {
  const { status } = booking;
  const [mode, setMode] = useState<"cancel" | "reschedule" | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(tomorrow());
  const [timeWindow, setTimeWindow] = useState<(typeof WINDOWS)[number]>("MORNING");
  const [preview, setPreview] = useState<CancellationPreview | null>(null);
  const [tracking, setTracking] = useState<TrackingSnapshot | null>(null);
  const [changes, setChanges] = useState<ChangeRequestRow[]>([]);

  const bookingId = booking.booking_id;

  // Follow the provider while they are on the way.
  useEffect(() => {
    if (status !== "ON_THE_WAY") {
      setTracking(null);
      return;
    }
    let live = true;
    const poll = () => bookingApi.tracking(bookingId).then((t) => live && setTracking(t)).catch(() => undefined);
    void poll();
    const timer = setInterval(poll, 15000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [bookingId, status]);

  // Extra work proposed by the provider while the job is under way.
  const loadChanges = useCallback(() => {
    if (!["PAYMENT_AUTHORIZED", "ON_THE_WAY", "ARRIVED", "IN_PROGRESS", "COMPLETION_REQUESTED"].includes(status)) {
      setChanges([]);
      return;
    }
    bookingApi
      .listChangeRequests(bookingId)
      .then((rows) => setChanges(rows.filter((c) => c.status === "PROPOSED" && c.requested_by === "PROVIDER")))
      .catch(() => setChanges([]));
  }, [bookingId, status]);
  useEffect(loadChanges, [loadChanges]);

  async function run(key: string, action: () => Promise<unknown>, success: string) {
    setBusy(key);
    try {
      await action();
      toast.success(success);
      setMode(null);
      setReason("");
      loadChanges();
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function startCancel() {
    setMode("cancel");
    setPreview(null);
    try {
      setPreview(await bookingApi.cancelPreview(bookingId));
    } catch {
      setPreview(null);
    }
  }

  const reschedulesLeft = MAX_RESCHEDULES - (booking.reschedule_count ?? 0);
  const canMove = MOVABLE.includes(status) && reschedulesLeft > 0;
  const canCancel = CANCELLABLE.includes(status);
  const cards: React.ReactNode[] = [];

  if (SHOW_CODE.includes(status) && booking.arrival_code) {
    cards.push(
      <Card key="code" icon={KeyRound} title="Your arrival code">
        <p className="text-3xl font-bold tracking-[0.3em]">{booking.arrival_code}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Give this code to your provider when they arrive. They can only start the job with it.
        </p>
      </Card>,
    );
  }

  if (status === "ON_THE_WAY") {
    const position = tracking?.latest_position;
    const eta = position?.eta_minutes;
    cards.push(
      <Card key="track" icon={MapPinned} title="Your provider is on the way">
        <p className="text-sm">
          {!position
            ? "Waiting for the provider's first location update."
            : eta != null
              ? `Arriving in about ${eta} min.`
              : "Your provider is on the move — an ETA isn't available yet."}
        </p>
        {position?.recorded_at && (
          <p className="mt-1 text-xs text-muted-foreground">
            Last update {new Date(position.recorded_at).toLocaleTimeString()}
          </p>
        )}
      </Card>,
    );
  }

  if (status === "ARRIVED") {
    cards.push(
      <Card key="arrived" icon={MapPinned} title="Your provider has arrived">
        <p className="text-sm">Share the arrival code above so they can start the job.</p>
      </Card>,
    );
  }

  for (const change of changes) {
    const parsedValue = Number(change.proposed_value);
    const extra = change.additional_price ?? (Number.isFinite(parsedValue) ? parsedValue : 0);
    cards.push(
      <Card key={change.change_id} icon={CheckCircle2} title="Your provider proposed a change">
        <p className="text-sm">{change.new_work || change.reason || `${humanize(change.change_type)} change`}</p>
        {change.change_type === "PRICE" && (
          <p className="mt-1 text-sm font-semibold">
            New total {fmtMoney(Number(change.proposed_value) || extra, change.currency ?? booking.currency)}
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <Btn
            variant="outline"
            busy={busy === `decline-${change.change_id}`}
            onClick={() =>
              void run(`decline-${change.change_id}`, () => bookingApi.decideChangeRequest(bookingId, change.change_id, "DECLINED"), "Change declined")
            }
          >
            Decline
          </Btn>
          <Btn
            busy={busy === `approve-${change.change_id}`}
            onClick={() =>
              void run(`approve-${change.change_id}`, () => bookingApi.decideChangeRequest(bookingId, change.change_id, "APPROVED"), "Change approved")
            }
          >
            Approve
          </Btn>
        </div>
      </Card>,
    );
  }

  if (status === "COMPLETION_REQUESTED") {
    cards.push(
      <Card key="confirm" icon={CheckCircle2} title="Is the job finished?">
        <p className="text-sm">Your provider says the work is done. Confirming lets us issue your invoice.</p>
        <div className="mt-3">
          <Btn busy={busy === "confirm"} onClick={() => void run("confirm", () => bookingApi.confirmCompletion(bookingId), "Job confirmed")}>
            Confirm job is complete
          </Btn>
        </div>
      </Card>,
    );
  }

  if (status === "CUSTOMER_CONFIRMED") {
    cards.push(
      <Card key="pay" icon={CheckCircle2} title="Pay for the job">
        <p className="text-sm">Amount due: {fmtMoney(booking.agreed_amount, booking.currency)}</p>
        <div className="mt-3">
          <Btn busy={busy === "pay"} onClick={() => void run("pay", () => bookingApi.captureFinalPayment(bookingId), "Payment complete")}>
            Pay now
          </Btn>
        </div>
      </Card>,
    );
  }

  if (status === "CLOSED") {
    cards.push(
      <Card key="rate" icon={Star} title="How did it go?">
        <p className="text-sm">Rate your provider to help other customers.</p>
        <div className="mt-3">
          <Link
            to="/feedback"
            className="inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            Rate provider
          </Link>
        </div>
      </Card>,
    );
  }

  if (canMove || canCancel) {
    cards.push(
      <div key="manage" className="flex gap-2">
        {canMove && (
          <Btn variant="outline" onClick={() => setMode(mode === "reschedule" ? null : "reschedule")}>
            <CalendarClock className="mr-1.5 size-4" /> Reschedule
          </Btn>
        )}
        {canCancel && (
          <Btn variant="danger" onClick={() => (mode === "cancel" ? setMode(null) : void startCancel())}>
            <XCircle className="mr-1.5 size-4" /> Cancel booking
          </Btn>
        )}
      </div>,
    );
  }

  if (mode === "reschedule") {
    cards.push(
      <Card key="reschedule" icon={CalendarClock} title="Choose a new time">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-muted-foreground">
            Date
            <input
              type="date"
              min={tomorrow()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            Time
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value as (typeof WINDOWS)[number])}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {WINDOWS.map((w) => (
                <option key={w} value={w}>
                  {humanize(w)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          You can move a booking {reschedulesLeft} more {reschedulesLeft === 1 ? "time" : "times"}. Your provider is notified.
        </p>
        <div className="mt-3">
          <Btn
            busy={busy === "reschedule"}
            disabled={!date}
            onClick={() =>
              void run("reschedule", () => bookingApi.reschedule(bookingId, { scheduled_date: date, time_window: timeWindow }), "Booking rescheduled")
            }
          >
            Confirm new time
          </Btn>
        </div>
      </Card>,
    );
  }

  if (mode === "cancel") {
    cards.push(
      <Card key="cancel" icon={XCircle} title="Cancel this booking?">
        {preview ? (
          <p className="text-sm">
            {preview.explanation}. You would be refunded{" "}
            <strong>{fmtMoney(preview.refund, booking.currency)}</strong>
            {preview.fee > 0 && <> after a {fmtMoney(preview.fee, booking.currency)} fee</>}.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Checking the cancellation terms…</p>
        )}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are you cancelling?"
          maxLength={500}
          rows={2}
          className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="mt-3 flex gap-2">
          <Btn variant="outline" onClick={() => setMode(null)}>
            Keep booking
          </Btn>
          <Btn
            variant="danger"
            busy={busy === "cancel"}
            disabled={reason.trim().length < 3}
            onClick={() => void run("cancel", () => bookingApi.cancelBooking(bookingId, reason.trim()), "Booking cancelled")}
          >
            Cancel booking
          </Btn>
        </div>
      </Card>,
    );
  }

  if (cards.length === 0) return null;
  return <div className="space-y-3">{cards}</div>;
}

function Card({ icon: Icon, title, children }: { icon: typeof KeyRound; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-primary/5 p-4 shadow-[var(--shadow-xs)]">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-primary" /> {title}
      </p>
      {children}
    </div>
  );
}

function Btn({
  children,
  onClick,
  busy = false,
  disabled = false,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
  variant?: "primary" | "outline" | "danger";
}) {
  const styles =
    variant === "primary"
      ? "text-primary-foreground shadow-[var(--shadow-glow)]"
      : variant === "danger"
        ? "border border-destructive/40 text-destructive hover:bg-destructive/10"
        : "border border-border hover:bg-muted";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className={`inline-flex flex-1 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
      style={variant === "primary" ? { backgroundImage: "var(--gradient-primary)" } : undefined}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : children}
    </button>
  );
}
