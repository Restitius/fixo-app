// Booking History — past bookings with expandable timelines.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Calendar, Clock, ChevronDown, ChevronUp, History as HistoryIcon } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type BookingHistoryRow, type TimelineEvent } from "@/lib/api-client";
import { fmtDate, fmtDateTime, fmtMoney, humanize } from "@/lib/format";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

const STATUS_FILTERS = ["", "PAID", "CLOSED", "CANCELLED"];

function statusColor(status: string): string {
  const s = status.toUpperCase();
  if (["PAID", "CLOSED", "COMPLETED"].includes(s)) return "bg-success/15 text-success";
  if (["CANCELLED", "FAILED", "DISPUTED"].includes(s)) return "bg-destructive/15 text-destructive";
  return "bg-amber-500/15 text-amber-600";
}

function HistoryPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [rows, setRows] = useState<BookingHistoryRow[]>([]);
  const [status, setStatus] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<Record<string, TimelineEvent[]>>({});

  const load = useCallback(async (st: string) => {
    try {
      const list = await fixoSdk.bookingHistory(st || undefined, 100, 0);
      setRows(list);
      setOpenId(null);
      setTimeline({});
    } catch {
      // toast emitted by client
    }
  }, []);

  useEffect(() => {
    if (access_token && !loading) void load(status);
  }, [access_token, loading, status, load]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const toggle = async (id: string) => {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (!timeline[id]) {
      try {
        const evts = await fixoSdk.bookingTimeline(id);
        setTimeline((prev) => ({ ...prev, [id]: evts }));
      } catch {
        // toast emitted by client
      }
    }
  };

  return (
    <PageShell
      title="Booking History"
      subtitle="Every job you have booked, in one place"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6 inline-flex flex-wrap gap-1.5 rounded-2xl bg-card p-1.5 shadow-[var(--shadow-card)]">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              status === s ? "text-primary-foreground" : "text-foreground/70 hover:text-foreground"
            }`}
            style={status === s ? { backgroundImage: "var(--gradient-primary)" } : undefined}
          >
            {s === "" ? "All" : humanize(s)}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {rows.length === 0 ? (
          <div className="rounded-3xl bg-card p-10 text-center shadow-[var(--shadow-card)]">
            <HistoryIcon className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No bookings yet</p>
            <p className="text-sm text-muted-foreground">Completed and paid jobs will appear here.</p>
          </div>
        ) : (
          rows.map((b) => (
            <div key={b.booking_id} className="rounded-3xl bg-card shadow-[var(--shadow-card)]">
              <button
                onClick={() => void toggle(b.booking_id)}
                className="flex w-full flex-col gap-3 p-5 text-left sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{b.service_name ?? "Service"}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(b.status)}`}>
                      {humanize(b.status)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{b.booking_number}</p>
                  {b.provider_name && (
                    <p className="mt-0.5 text-sm text-muted-foreground">Provider · {b.provider_name}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-4" /> {fmtDate(b.scheduled_date)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-4" /> {b.time_window ?? "—"}
                    </span>
                    {b.completed_at && (
                      <span className="inline-flex items-center gap-1.5">
                        <HistoryIcon className="size-4" /> done {fmtDate(b.completed_at)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold">{fmtMoney(b.agreed_amount, b.currency)}</p>
                    <p className="text-xs text-muted-foreground">{fmtDateTime(b.created_at)}</p>
                  </div>
                  {openId === b.booking_id ? (
                    <ChevronUp className="size-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {openId === b.booking_id &&
                (() => {
                  const evts = timeline[b.booking_id];
                  return (
                    <div className="border-t border-border px-5 py-4">
                      <h4 className="mb-3 text-sm font-semibold">Timeline</h4>
                      {evts?.length ? (
                        <ol className="space-y-3">
                          {evts.map((ev, idx) => (
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
                      ) : (
                        <p className="text-sm text-muted-foreground">No events recorded.</p>
                      )}
                    </div>
                  );
                })()}
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}