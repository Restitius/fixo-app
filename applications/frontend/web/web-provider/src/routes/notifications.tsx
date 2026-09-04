import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellRing, CheckCheck } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { activityLog, notifications as seed } from "@/lib/mock-data";

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

const filters = ["ALL", "request", "quote", "payment", "review", "verification", "payout"];

function NotificationsPage() {
  const [items, setItems] = useState(seed);
  const [filter, setFilter] = useState("ALL");

  const rows = items.filter((n) => filter === "ALL" || n.type === filter);
  const unread = items.filter((n) => n.unread).length;

  return (
    <ProviderPage title="Notifications" subtitle={`${unread} unread`}>
      <div className="mt-6 grid gap-4 pb-6 lg:grid-cols-[1fr_320px]">
        <Panel
          title="Feed"
          action={
            <button
              onClick={() => setItems((p) => p.map((n) => ({ ...n, unread: false })))}
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
                {f === "ALL" ? "All" : f}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {rows.map((n) => (
              <div
                key={n.id}
                onClick={() => setItems((p) => p.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl p-4 transition-colors ${
                  n.unread ? "bg-primary/5" : "bg-muted/50"
                }`}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {n.unread ? <BellRing className="size-4" /> : <Bell className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{n.at}</span>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Delivery channels">
            {[
              "New job requests",
              "Quote responses",
              "Booking changes",
              "Payments & payouts",
              "Reviews",
              "Compliance reminders",
              "Promotions from FIXO",
            ].map((c, i) => (
              <label key={c} className="flex items-center justify-between gap-3 border-b border-border/60 py-3 text-sm last:border-0">
                {c}
                <span className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    Push <input type="checkbox" defaultChecked className="size-4 accent-[var(--primary)]" />
                  </span>
                  <span className="flex items-center gap-1">
                    SMS <input type="checkbox" defaultChecked={i < 3} className="size-4 accent-[var(--primary)]" />
                  </span>
                </span>
              </label>
            ))}
          </Panel>

          <Panel title="Account activity">
            <div className="space-y-3">
              {activityLog.map((a) => (
                <div key={a.at} className="rounded-2xl bg-muted/50 p-3">
                  <p className="text-sm">{a.text}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    {a.at} <StatusPill tone="muted" label={a.actor} />
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}
