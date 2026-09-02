// Calendar — a real month view of the customer's own bookings by scheduled_date.
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type BookingHistoryRow } from "@/lib/api-client";
import { fmtMoney, humanize } from "@/lib/format";

const title = "Calendar — FIXO";
const description = "See your bookings laid out by date.";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CalendarPage,
});

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function CalendarPage() {
  const { access_token, loading, customer, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingHistoryRow[] | null>(null);
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date>(today);

  useEffect(() => {
    if (!(access_token && !loading)) return;
    fixoSdk.bookingHistory(undefined, 100, 0).then(setBookings).catch(() => setBookings([]));
  }, [access_token, loading]);

  const byDay = useMemo(() => {
    const map = new Map<string, BookingHistoryRow[]>();
    for (const b of bookings ?? []) {
      if (!b.scheduled_date) continue;
      const d = new Date(b.scheduled_date);
      const key = dateKey(d);
      map.set(key, [...(map.get(key) ?? []), b]);
    }
    return map;
  }, [bookings]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const monthLabel = viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const selectedBookings = byDay.get(dateKey(selected)) ?? [];

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  return (
    <PageShell title="Calendar" subtitle="Your bookings, laid out by date" userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">{monthLabel}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMonth(new Date(year, month - 1, 1))}
                className="flex size-8 items-center justify-center rounded-full bg-muted hover:bg-muted/70"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => setViewMonth(new Date(year, month + 1, 1))}
                className="flex size-8 items-center justify-center rounded-full bg-muted hover:bg-muted/70"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-y-2 text-center">
            {WEEKDAYS.map((w) => (
              <span key={w} className="text-xs font-medium text-muted-foreground">{w}</span>
            ))}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <span key={`b${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const key = dateKey(date);
              const hasBooking = byDay.has(key);
              const isSelected = dateKey(selected) === key;
              const isToday = dateKey(today) === key;
              return (
                <button key={day} onClick={() => setSelected(date)} className="flex flex-col items-center gap-1 py-1">
                  <span
                    className={`flex size-9 items-center justify-center rounded-full text-sm font-medium ${
                      isSelected
                        ? "text-primary-foreground"
                        : isToday
                          ? "border border-primary text-primary"
                          : "text-foreground"
                    }`}
                    style={isSelected ? { backgroundImage: "var(--gradient-primary)" } : undefined}
                  >
                    {day}
                  </span>
                  <span className={`size-1.5 rounded-full ${hasBooking ? "bg-primary" : "bg-transparent"}`} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">
              {selected.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            <button onClick={() => navigate({ to: "/bookings" })} className="text-sm font-semibold text-primary hover:underline">
              My Bookings
            </button>
          </div>

          {bookings === null ? (
            <div className="mt-4 h-32 animate-pulse rounded-2xl bg-muted/60" />
          ) : selectedBookings.length === 0 ? (
            <div className="mt-8 flex flex-col items-center py-6 text-center">
              <CalendarDays className="size-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">No bookings on this day.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {selectedBookings.map((b) => (
                <button
                  key={b.booking_id}
                  onClick={() => navigate({ to: "/bookings" })}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border p-4 text-left hover:bg-muted/40"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Clock className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{b.service_name ?? "Service"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {b.provider_name ?? "—"}{b.time_window ? ` · ${humanize(b.time_window)}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-primary">{fmtMoney(b.agreed_amount, b.currency)}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-primary/5 p-3 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0 text-primary" />
            Dates with a purple dot have at least one real booking scheduled.
          </div>
        </div>
      </div>
    </PageShell>
  );
}
