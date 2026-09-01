// Notifications center — inbox, unread badge, read / mark-all.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCheck } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type NotificationRow } from "@/lib/api-client";
import { fmtDateTime, humanize, timeAgo } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await fixoSdk.notifications(unreadOnly, 50, 0));
    } catch {
      // toast emitted by client
    }
  }, [unreadOnly]);

  useEffect(() => {
    if (access_token && !loading) void load();
  }, [access_token, loading, unreadOnly, load]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const markOne = async (id: string) => {
    try {
      const res = await fixoSdk.markNotificationRead(id);
      if (res.marked) {
        setItems((prev) =>
          prev.map((n) => (n.notification_id === id ? { ...n, read_at: new Date().toISOString() } : n)),
        );
      }
    } catch {
      // toast emitted by client
    }
  };

  const markAll = async () => {
    try {
      const res = await fixoSdk.markAllNotificationsRead();
      toast.success(`${res.marked} notification${res.marked === 1 ? "" : "s"} marked as read`);
      await load();
    } catch {
      // toast emitted by client
    }
  };

  return (
    <PageShell
      title="Notifications"
      subtitle="Updates, reminders and alerts"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-1.5 rounded-2xl bg-card p-1.5 shadow-[var(--shadow-card)]">
          <button
            onClick={() => setUnreadOnly(false)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              !unreadOnly ? "text-primary-foreground" : "text-foreground/70 hover:text-foreground"
            }`}
            style={!unreadOnly ? { backgroundImage: "var(--gradient-primary)" } : undefined}
          >
            All
          </button>
          <button
            onClick={() => setUnreadOnly(true)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              unreadOnly ? "text-primary-foreground" : "text-foreground/70 hover:text-foreground"
            }`}
            style={unreadOnly ? { backgroundImage: "var(--gradient-primary)" } : undefined}
          >
            Unread
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={() => void markAll()} className="gap-2">
          <CheckCheck className="size-4" /> Mark all read
        </Button>
      </div>

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="All caught up"
            description="No notifications here — updates and reminders will show up as they happen."
          />
        ) : (
          <ul className="space-y-3">
            {items.map((n, i) => {
              const unread = !n.read_at;
              return (
                <li
                  key={n.notification_id}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className={`flex animate-in fade-in slide-in-from-bottom-2 fill-mode-both items-start gap-4 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)] ${
                    unread ? "border border-primary/30" : ""
                  }`}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Bell className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{n.title}</p>
                      {unread && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          New
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                    </div>
                    {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {humanize(n.type)} · {fmtDateTime(n.created_at)}
                    </p>
                  </div>
                  {unread && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void markOne(n.notification_id)}
                      title="Mark as read"
                    >
                      <CheckCheck className="size-4" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageShell>
  );
}