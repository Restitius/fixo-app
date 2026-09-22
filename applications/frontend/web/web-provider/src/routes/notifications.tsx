import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellRing, CheckCheck } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { activityApi, fixoSdk, type ActivityLogEntry, type ProviderNotificationRow } from "@/lib/api-client";

const title = "Notifications — FIXO Provider";
const description = "Job alerts, quote activity, payments, reviews and compliance reminders in one feed.";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const [items, setItems] = useState<ProviderNotificationRow[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [activity, setActivity] = useState<ActivityLogEntry[]>([]);

  const load = useCallback(() => {
    fixoSdk
      .notifications("all", 50, 0)
      .then(setItems)
      .catch(() => setItems((prev) => prev));
  }, []);

  useEffect(() => {
    load();
    activityApi.list(20, 0).then(setActivity).catch(() => setActivity([]));
  }, [load]);

  const filters = useMemo(
    () => ["ALL", ...Array.from(new Set(items.map((n) => n.category))).sort()],
    [items],
  );
  const rows = items.filter((n) => filter === "ALL" || n.category === filter);
  const unread = items.filter((n) => !n.is_read).length;

  async function markAllRead() {
    await Promise.all(items.filter((n) => !n.is_read).map((n) => fixoSdk.markNotificationRead(n.id)));
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await fixoSdk.markNotificationRead(id);
    } catch {
      // leave optimistic read state — a retry on next load will reconcile
    }
  }

  return (
    <ProviderPage title="Notifications" subtitle={`${unread} unread`}>
      <div className="mt-6 grid gap-4 pb-6 lg:grid-cols-[1fr_320px]">
        <Panel
          title="Feed"
          action={
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <CheckCheck className="size-4" /> Mark all read
            </button>
          }
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold capitalize transition-colors ${
                  filter === f ? "text-primary-foreground" : "bg-muted hover:bg-muted/70"
                }`}
                style={filter === f ? { backgroundImage: "var(--gradient-primary)" } : undefined}
              >
                {f === "ALL" ? "All" : f.replace(/_/g, " ").toLowerCase()}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {rows.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
            )}
            {rows.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl p-4 transition-colors ${
                  !n.is_read ? "bg-primary/5" : "bg-muted/50"
                }`}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {!n.is_read ? <BellRing className="size-4" /> : <Bell className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Delivery channels">
            <p className="text-sm text-muted-foreground">
              Booking notifications appear here and in the provider mobile app.
              Delivery settings will appear when additional channels are available.
            </p>
          </Panel>

          <Panel title="Account activity">
            <div className="space-y-3">
              {activity.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No activity recorded yet.</p>}
              {activity.map((a) => (
                <div key={a.log_id} className="rounded-2xl bg-muted/50 p-3">
                  <p className="text-sm">{a.action.replace(/_/g, " ").replace(/\./g, " · ").toLowerCase()}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}
