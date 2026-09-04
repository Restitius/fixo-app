import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fmtMoney } from "@/lib/format";
import { availability, bookings } from "@/lib/mock-data";

const title = "Job Calendar — FIXO Provider";
const description = "Week and month view of confirmed jobs, blocked time and working hours.";

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

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weekDates = ["2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05", "2026-09-06"];

function CalendarPage() {
  const [view, setView] = useState<"WEEK" | "MONTH">("WEEK");

  return (
    <ProviderPage title="Calendar" subtitle="Your scheduled jobs, blocked slots and working hours.">
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button className="flex size-10 items-center justify-center rounded-xl bg-card shadow-[var(--shadow-xs)] hover:bg-muted">
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-semibold">31 Aug – 6 Sep 2026</span>
          <button className="flex size-10 items-center justify-center rounded-xl bg-card shadow-[var(--shadow-xs)] hover:bg-muted">
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="flex rounded-xl bg-card p-1 shadow-[var(--shadow-xs)]">
          {(["WEEK", "MONTH"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                view === v ? "text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
              style={view === v ? { backgroundImage: "var(--gradient-primary)" } : undefined}
            >
              {v === "WEEK" ? "Week" : "Month"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 pb-6 lg:grid-cols-[1fr_300px]">
        {view === "WEEK" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
            {weekDates.map((d, i) => {
              const dayBookings = bookings.filter((b) => b.date === d);
              return (
                <div key={d} className="min-h-44 rounded-2xl bg-card p-3 shadow-[var(--shadow-card)]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{days[i]}</p>
                  <p className="text-lg font-bold">{d.slice(8)}</p>
                  <div className="mt-2 space-y-2">
                    {dayBookings.map((b) => (
                      <div key={b.id} className="rounded-xl bg-primary/10 p-2">
                        <p className="text-xs font-bold text-primary">{b.time}</p>
                        <p className="truncate text-xs font-medium">{b.service}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{b.customer}</p>
                      </div>
                    ))}
                    {dayBookings.length === 0 && <p className="text-xs text-muted-foreground">No jobs</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {days.map((d) => (
                <span key={d} className="py-2">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }, (_, i) => {
                const dayNum = i - 1;
                const iso = dayNum >= 1 && dayNum <= 30 ? `2026-09-${String(dayNum).padStart(2, "0")}` : "";
                const count = bookings.filter((b) => b.date === iso).length;
                return (
                  <div
                    key={i}
                    className={`flex aspect-square flex-col items-center justify-center rounded-xl text-sm ${
                      dayNum < 1 || dayNum > 30 ? "text-muted-foreground/30" : count ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"
                    }`}
                  >
                    {dayNum >= 1 && dayNum <= 30 ? dayNum : ""}
                    {count > 0 && <span className="mt-0.5 size-1.5 rounded-full bg-primary" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Panel title="Upcoming">
            <div className="space-y-3">
              {bookings.slice(0, 4).map((b) => (
                <div key={b.id} className="rounded-2xl bg-muted/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{b.service}</p>
                    <StatusPill status={b.stage} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {b.date} · {b.time} · {fmtMoney(b.price)}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Working hours">
            <ul className="space-y-2 text-sm">
              {availability.map((d) => (
                <li key={d.day} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{d.day}</span>
                  <span className="font-semibold">{d.available ? `${d.from}–${d.to}` : "Off"}</span>
                </li>
              ))}
            </ul>
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold hover:bg-muted">
              <CalendarDays className="size-4 text-primary" /> Block time off
            </button>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}
