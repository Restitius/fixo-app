// Notifications center — inbox, unread badge, read / mark-all.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Bell, CheckCheck, FilterX } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableFilterBar, TableCard, TableScroll, TableHead, TablePagination } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type NotificationRow } from "@/lib/api-client";
import { fmtDateTime, humanize, timeAgo } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

const PAGE_SIZE = 8;

function NotificationsPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [items, setItems] = useState<NotificationRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      setItems(await fixoSdk.notifications(false, 50, 0));
    } catch {
      // toast emitted by client
    }
  }, []);

  useEffect(() => {
    if (access_token && !loading) void load();
  }, [access_token, loading, load]);

  const filtered = useMemo(
    () =>
      (items ?? []).filter((n) => {
        const matchesStatus = statusFilter === "all" || (statusFilter === "unread" ? !n.read_at : !!n.read_at);
        const matchesSearch = !search || [n.title, n.body ?? ""].some((f) => f.toLowerCase().includes(search.toLowerCase()));
        return matchesStatus && matchesSearch;
      }),
    [items, statusFilter, search],
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const markOne = async (id: string) => {
    try {
      const res = await fixoSdk.markNotificationRead(id);
      if (res.marked) {
        setItems((prev) => prev?.map((n) => (n.notification_id === id ? { ...n, read_at: new Date().toISOString() } : n)) ?? null);
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

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all";
  const unreadCount = (items ?? []).filter((n) => !n.read_at).length;

  return (
    <PageShell
      title="Notifications"
      subtitle="Updates, reminders and alerts"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search notifications..."
        filters={[
          {
            value: statusFilter,
            onChange: (v) => { setStatusFilter(v); setPage(1); },
            placeholder: "Status",
            options: [
              { value: "all", label: "All" },
              { value: "unread", label: "Unread" },
              { value: "read", label: "Read" },
            ],
          },
        ]}
        trailing={
          <Button variant="outline" size="sm" onClick={() => void markAll()} disabled={unreadCount === 0} className="gap-2">
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        }
      />

      {items === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState icon={FilterX} title="No matching notifications" description="Try adjusting your search or filters." actionLabel="Clear Filters" onAction={() => { setSearch(""); setStatusFilter("all"); }} />
          ) : (
            <EmptyState icon={Bell} title="All caught up" description="No notifications here — updates and reminders will show up as they happen." />
          )}
        </div>
      ) : (
        <TableCard>
          <TableScroll minWidth={760}>
            <TableHead columns={["Notification", "Type", "Date", "Status", "Actions"]} />
            <tbody>
              {paged.map((n) => {
                const unread = !n.read_at;
                return (
                  <tr key={n.notification_id} className={`border-b border-border last:border-0 hover:bg-muted/40 ${unread ? "bg-primary/5" : ""}`}>
                    <td className="px-6 py-4">
                      <p className="font-semibold">{n.title}</p>
                      {n.body && <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">{n.body}</p>}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{humanize(n.type)}</td>
                    <td className="px-4 py-4 text-muted-foreground">
                      <span title={fmtDateTime(n.created_at)}>{timeAgo(n.created_at)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${unread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {unread ? "New" : "Read"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {unread && (
                        <Button size="sm" variant="ghost" onClick={() => void markOne(n.notification_id)} title="Mark as read">
                          <CheckCheck className="size-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableScroll>
          <TablePagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            from={(page - 1) * PAGE_SIZE + 1}
            to={Math.min(page * PAGE_SIZE, filtered.length)}
            total={filtered.length}
            itemLabel="notifications"
          />
        </TableCard>
      )}
    </PageShell>
  );
}
