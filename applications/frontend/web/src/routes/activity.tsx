// Activity — chronological feed across all bookings.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Activity as ActivityIcon, Wrench } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type ActivityEvent } from "@/lib/api-client";
import { fmtDateTime, humanize, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  const load = useCallback(async () => {
    try {
      setEvents(await fixoSdk.activityFeed(undefined, 100, 0));
    } catch {
      // toast emitted by client
    }
  }, []);

  useEffect(() => {
    if (access_token && !loading) void load();
  }, [access_token, loading, load]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  return (
    <PageShell
      title="Activity"
      subtitle="A chronological log of your journey"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6">
        {events.length === 0 ? (
          <div className="rounded-3xl bg-card p-10 text-center shadow-[var(--shadow-card)]">
            <ActivityIcon className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No activity yet</p>
            <p className="text-sm text-muted-foreground">Booking events will show up here.</p>
          </div>
        ) : (
          <ol className="space-y-3">
            {events.map((ev, idx) => (
              <li
                key={idx}
                className="flex items-start gap-4 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Wrench className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{humanize(ev.event)}</p>
                    <span className="text-xs text-muted-foreground">{timeAgo(ev.created_at)}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {ev.booking_number}
                    {ev.service_name ? ` · ${ev.service_name}` : ""}
                  </p>
                  {ev.detail && <p className="mt-1 text-sm text-muted-foreground">{ev.detail}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(ev.created_at)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </PageShell>
  );
}