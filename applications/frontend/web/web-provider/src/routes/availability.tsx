// Availability — wired to the real /providers/availability/* endpoints.
// The mock version's "Capacity" panel (max jobs/day, buffer minutes,
// advance booking window) is dropped: AvailabilitySettingsRequest has no
// such fields anywhere in the real schema — keeping it would mean saving
// values nowhere real ever reads. "Auto-accept repeat customers" /
// "Pause new bookings" toggles are dropped for the same reason; only
// accepts_emergency/accepts_same_day/accepts_holidays are real.
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarOff, Clock, Loader2, Sun, Zap } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { useProviderAuth } from "@/lib/provider-auth";
import { availabilityApi, type AvailabilitySettings, type TimeOffRow, type WorkingHoursRow } from "@/lib/api-client";

const title = "Availability — FIXO Provider";
const description = "Set weekly working hours, emergency availability and time off.";

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

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const field = "h-10 w-28 rounded-xl border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30";

function AvailabilityPage() {
  const { online, setOnline } = useProviderAuth();
  const [hours, setHours] = useState<Record<number, WorkingHoursRow>>({});
  const [settings, setSettings] = useState<Partial<AvailabilitySettings>>({});
  const [timeOff, setTimeOff] = useState<TimeOffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      availabilityApi.listHours(),
      availabilityApi.getSettings().catch(() => null),
      availabilityApi.listTimeOff().catch(() => []),
    ])
      .then(([hrs, s, off]) => {
        const byDay: Record<number, WorkingHoursRow> = {};
        for (const h of hrs) byDay[h.day_of_week] = h;
        setHours(byDay);
        if (s) setSettings(s);
        setTimeOff(off);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load availability."))
      .finally(() => setLoading(false));
  }, []);

  function updateDay(day: number, patch: Partial<WorkingHoursRow>) {
    setHours((prev) => ({
      ...prev,
      [day]: { day_of_week: day, is_available: true, start_time: "08:00", end_time: "18:00", ...prev[day], ...patch },
    }));
  }

  async function saveSchedule() {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(hours).map(([day, h]) =>
          availabilityApi.setDay(Number(day), {
            is_available: h.is_available,
            start_time: h.start_time ?? undefined,
            end_time: h.end_time ?? undefined,
          }),
        ),
      );
      toast.success("Schedule saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save schedule.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSetting(key: keyof AvailabilitySettings, value: boolean) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    try {
      await availabilityApi.saveSettings({ [key]: value });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save this setting.");
      setSettings((prev) => ({ ...prev, [key]: !value }));
    }
  }

  if (loading) {
    return (
      <ProviderPage title="Availability" subtitle="Control when you can be booked.">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </ProviderPage>
    );
  }

  return (
    <ProviderPage title="Availability" subtitle="Control when you can be booked.">
      <div className="mt-6 grid gap-4 pb-6 lg:grid-cols-[1fr_340px]">
        <Panel title="Weekly working hours">
          <div className="space-y-3">
            {DAY_LABELS.map((label, i) => {
              const h = hours[i];
              const isAvailable = h?.is_available ?? false;
              return (
                <div key={label} className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/50 p-4">
                  <label className="flex w-36 items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => updateDay(i, { is_available: e.target.checked })}
                      className="size-4 accent-[var(--primary)]"
                    />
                    {label}
                  </label>
                  {isAvailable ? (
                    <div className="flex items-center gap-2">
                      <input
                        className={field}
                        value={h?.start_time ?? "08:00"}
                        onChange={(e) => updateDay(i, { start_time: e.target.value })}
                      />
                      <span className="text-muted-foreground">to</span>
                      <input
                        className={field}
                        value={h?.end_time ?? "18:00"}
                        onChange={(e) => updateDay(i, { end_time: e.target.value })}
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Not available</span>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={saveSchedule}
            disabled={saving}
            className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {saving ? "Saving…" : "Save schedule"}
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
              <Toggle icon={Zap} label="Accept emergency jobs" checked={!!settings.accepts_emergency} onChange={(v) => toggleSetting("accepts_emergency", v)} />
              <Toggle icon={Clock} label="Accept same-day jobs" checked={!!settings.accepts_same_day} onChange={(v) => toggleSetting("accepts_same_day", v)} />
              <Toggle icon={Sun} label="Accept holiday jobs" checked={!!settings.accepts_holidays} onChange={(v) => toggleSetting("accepts_holidays", v)} />
            </div>
          </Panel>

          <Panel title="Time off">
            {timeOff.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming leave scheduled.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {timeOff.map((t) => (
                  <li key={t.time_off_id} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                    <span>{t.reason || "Unavailable"}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.starts_at.slice(0, 10)} – {t.ends_at.slice(0, 10)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => toast.info("Add a date range via the API for now — a dedicated picker is a follow-up.")}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold hover:bg-muted"
            >
              <CalendarOff className="size-4 text-primary" /> Schedule time off
            </button>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}

function Toggle({ icon: Icon, label, checked, onChange }: { icon: typeof Zap; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
      <span className="flex items-center gap-2">
        <Icon className="size-4 text-primary" /> {label}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--primary)]" />
    </label>
  );
}
