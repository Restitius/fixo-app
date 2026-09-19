// Job calendar — wired to the real /providers/me/calendar/* endpoints.
// Event shape (source/event_id/title/start_at/end_at/status) read
// directly from provider_calendar_service.py's governed SQL this session.
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { availabilityApi, calendarApi, type CalendarEvent, type WorkingHoursRow } from "@/lib/api-client";

const title = "Job Calendar — FIXO Provider";
const description = "Month view of confirmed jobs, blocked time and working hours.";

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

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function CalendarPage() {
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [agenda, setAgenda] = useState<CalendarEvent[]>([]);
  const [hours, setHours] = useState<WorkingHoursRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const todayIso = now.toISOString().slice(0, 10);
    Promise.all([
      calendarApi.month(year, month),
      calendarApi.agenda(todayIso, 4),
      availabilityApi.listHours(),
    ])
      .then(([ev, ag, hrs]) => {
        setEvents(ev);
        setAgenda(ag);
        setHours(hrs);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load the calendar."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const day = e.start_at.slice(0, 10);
    eventsByDate.set(day, [...(eventsByDate.get(day) ?? []), e]);
  }

  if (loading) {
    return (
      <ProviderPage title="Calendar" subtitle="Your scheduled jobs, blocked slots and working hours.">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </ProviderPage>
    );
  }

  const firstOfMonth = new Date(year, month - 1, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // 0=Monday
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthLabel = firstOfMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <ProviderPage title="Calendar" subtitle="Your scheduled jobs, blocked slots and working hours.">
      <div className="mt-6 flex items-center gap-3">
        <span className="text-sm font-semibold">{monthLabel}</span>
      </div>

      <div className="mt-4 grid gap-4 pb-6 lg:grid-cols-[1fr_300px]">
        <div className="rounded-3xl bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {DAY_LABELS.map((d) => (
              <span key={d} className="py-2">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startWeekday }, (_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayEvents = eventsByDate.get(iso) ?? [];
              return (
                <div
                  key={day}
                  className={`flex aspect-square flex-col items-center justify-center rounded-xl text-sm ${
                    dayEvents.length ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted"
                  }`}
                  title={dayEvents.map((e) => e.title).join(", ")}
                >
                  {day}
                  {dayEvents.length > 0 && <span className="mt-0.5 size-1.5 rounded-full bg-primary" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Panel title="Upcoming">
            <div className="space-y-3">
              {agenda.length === 0 && <p className="text-sm text-muted-foreground">Nothing scheduled.</p>}
              {agenda.map((e) => (
                <div key={e.event_id} className="rounded-2xl bg-muted/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{e.title}</p>
                    <StatusPill status={e.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{e.start_at.replace("T", " ").slice(0, 16)}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Working hours">
            <ul className="space-y-2 text-sm">
              {DAY_NAMES.map((label, i) => {
                const h = hours.find((x) => x.day_of_week === i);
                return (
                  <li key={label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold">{h?.is_available ? `${h.start_time}–${h.end_time}` : "Off"}</span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}
