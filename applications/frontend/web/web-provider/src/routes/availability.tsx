import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarOff, Clock, Zap } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { useProviderAuth } from "@/lib/provider-auth";
import { availability } from "@/lib/mock-data";

const title = "Availability — FIXO Provider";
const description = "Set weekly working hours, daily job capacity, emergency availability and time off.";

export const Route = createFileRoute("/availability")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AvailabilityPage,
});

const field = "h-10 w-28 rounded-xl border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30";

function AvailabilityPage() {
  const { online, setOnline } = useProviderAuth();
  const [days, setDays] = useState(availability);

  return (
    <ProviderPage title="Availability" subtitle="Control when you can be booked and how many jobs you take per day.">
      <div className="mt-6 grid gap-4 pb-6 lg:grid-cols-[1fr_340px]">
        <Panel title="Weekly working hours">
          <div className="space-y-3">
            {days.map((d, i) => (
              <div key={d.day} className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/50 p-4">
                <label className="flex w-36 items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={d.available}
                    onChange={() => setDays((p) => p.map((x, xi) => (xi === i ? { ...x, available: !x.available } : x)))}
                    className="size-4 accent-[var(--primary)]"
                  />
                  {d.day}
                </label>
                {d.available ? (
                  <div className="flex items-center gap-2">
                    <input className={field} defaultValue={d.from === "—" ? "08:00" : d.from} />
                    <span className="text-muted-foreground">to</span>
                    <input className={field} defaultValue={d.to === "—" ? "18:00" : d.to} />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Not available</span>
                )}
              </div>
            ))}
          </div>
          <button
            className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            Save schedule
          </button>
        </Panel>

        <div className="space-y-4">
          <Panel title="Availability status">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 p-4">
              <div>
                <p className="text-sm font-semibold">{online ? "Online — accepting jobs" : "Offline"}</p>
                <p className="text-xs text-muted-foreground">Toggle instantly when you finish for the day.</p>
              </div>
              <button
                onClick={() => setOnline(!online)}
                className={`h-9 w-16 rounded-full p-1 transition-colors ${online ? "bg-success" : "bg-muted-foreground/30"}`}
              >
                <span className={`block size-7 rounded-full bg-white transition-transform ${online ? "translate-x-7" : ""}`} />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <Toggle icon={Zap} label="Accept emergency jobs" defaultChecked />
              <Toggle icon={Clock} label="Auto-accept repeat customers" />
              <Toggle icon={CalendarOff} label="Pause new bookings" />
            </div>
          </Panel>

          <Panel title="Capacity">
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Maximum jobs per day</span>
              <input type="number" defaultValue={5} className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs text-muted-foreground">Buffer between jobs (minutes)</span>
              <input type="number" defaultValue={45} className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs text-muted-foreground">Advance booking window (days)</span>
              <input type="number" defaultValue={30} className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
            </label>
          </Panel>

          <Panel title="Time off">
            <p className="text-sm text-muted-foreground">No upcoming leave scheduled.</p>
            <button className="mt-3 w-full rounded-xl border border-border bg-card py-2.5 text-sm font-semibold hover:bg-muted">
              Schedule holiday
            </button>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}

function Toggle({ icon: Icon, label, defaultChecked }: { icon: typeof Zap; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
      <span className="flex items-center gap-2">
        <Icon className="size-4 text-primary" /> {label}
      </span>
      <input type="checkbox" defaultChecked={defaultChecked} className="size-4 accent-[var(--primary)]" />
    </label>
  );
}
