import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, BriefcaseBusiness, Check, CheckCheck, FileText, ShieldCheck, Star, WalletCards } from "lucide-react";

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

  function iconFor(category: string) {
    const key = category.toUpperCase();
    if (key.includes("PAYMENT") || key.includes("INVOICE")) return WalletCards;
    if (key.includes("QUOTE") || key.includes("REQUEST")) return FileText;
    if (key.includes("REVIEW")) return Star;
    if (key.includes("ACCOUNT") || key.includes("VERIFICATION")) return ShieldCheck;
    if (key.includes("BOOKING")) return BriefcaseBusiness;
    return Bell;
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

          <div className="grid gap-4 rounded-3xl bg-[#2f69d9] p-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.length === 0 && (
              <div className="col-span-full flex min-h-72 flex-col items-center justify-center rounded-[22px] bg-white px-8 py-10 text-center shadow-lg">
                <span className="relative flex size-20 items-center justify-center text-[#2468c7]">
                  <span className="absolute h-px w-28 bg-[#dceaff]" />
                  <span className="absolute size-16 rounded-full bg-[#f4f8ff]" />
                  <Bell className="relative size-10 stroke-[1.4]" />
                </span>
                <p className="mt-4 text-sm font-bold text-slate-900">Your inbox is empty</p>
                <p className="mt-1 max-w-56 text-xs leading-5 text-slate-500">Job, quote, payment and account updates will appear here.</p>
                <button onClick={load} className="mt-6 min-w-44 rounded-full bg-[#2476f2] px-6 py-2.5 text-xs font-bold text-white shadow-[0_6px_14px_rgba(36,118,242,.28)] transition hover:bg-[#1266e7]">
                  Refresh notifications
                </button>
              </div>
            )}
            {rows.map((n) => {
              const Icon = iconFor(n.category);
              return (
                <article key={n.id} className="relative flex min-h-72 flex-col items-center rounded-[22px] bg-white px-5 py-6 text-center shadow-[0_12px_26px_rgba(10,45,105,.22)]">
                  {!n.is_read && <span className="absolute right-4 top-4 size-2.5 rounded-full bg-[#2476f2]" aria-label="Unread" />}
                  <span className="relative flex size-20 items-center justify-center text-[#2468c7]">
                    <span className="absolute h-px w-28 bg-[#dceaff]" />
                    <span className="absolute size-16 rounded-full bg-[#f4f8ff]" />
                    <Icon className="relative size-10 stroke-[1.35]" />
                  </span>
                  <p className="mt-4 line-clamp-2 text-sm font-bold text-slate-900">{n.title}</p>
                  <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-500">{n.body}</p>
                  <p className="mt-2 text-[11px] text-slate-400">{new Date(n.created_at).toLocaleDateString()}</p>
                  <button
                    onClick={() => !n.is_read && void markRead(n.id)}
                    disabled={n.is_read}
                    className="mt-auto inline-flex min-w-40 items-center justify-center gap-1.5 rounded-full bg-[#2476f2] px-5 py-2.5 text-xs font-bold text-white shadow-[0_6px_14px_rgba(36,118,242,.28)] transition hover:bg-[#1266e7] disabled:bg-[#e8f0fb] disabled:text-[#2468c7] disabled:shadow-none"
                  >
                    {n.is_read && <Check className="size-3.5" />}
                    {n.is_read ? "Read" : "Mark as read"}
                  </button>
                </article>
              );
            })}
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
