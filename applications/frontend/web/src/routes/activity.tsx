// Activity — chronological feed across all bookings.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Activity as ActivityIcon, FilterX } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableFilterBar, TableCard, TableScroll, TableHead, TablePagination } from "@/components/dashboard/DataTable";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type ActivityEvent } from "@/lib/api-client";
import { fmtDateTime, humanize } from "@/lib/format";

export const Route = createFileRoute("/activity")({
  component: ActivityPage,
});

const PAGE_SIZE = 8;

function ActivityPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [page, setPage] = useState(1);

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

  const eventTypes = useMemo(() => Array.from(new Set((events ?? []).map((e) => e.event))), [events]);

  const filtered = useMemo(
    () =>
      (events ?? []).filter((e) => {
        const matchesType = eventFilter === "all" || e.event === eventFilter;
        const matchesSearch =
          !search || [e.booking_number, e.service_name ?? "", e.detail ?? ""].some((f) => f.toLowerCase().includes(search.toLowerCase()));
        return matchesType && matchesSearch;
      }),
    [events, eventFilter, search],
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const hasActiveFilters = search.trim() !== "" || eventFilter !== "all";

  return (
    <PageShell
      title="Activity"
      subtitle="A chronological log of your journey"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search activity..."
        filters={[
          {
            value: eventFilter,
            onChange: (v) => { setEventFilter(v); setPage(1); },
            placeholder: "Event",
            options: [{ value: "all", label: "All Events" }, ...eventTypes.map((e) => ({ value: e, label: humanize(e) }))],
          },
        ]}
      />

      {events === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState icon={FilterX} title="No matching activity" description="Try adjusting your search or filters." actionLabel="Clear Filters" onAction={() => { setSearch(""); setEventFilter("all"); }} />
          ) : (
            <EmptyState icon={ActivityIcon} title="No activity yet" description="Booking events — confirmations, payments, updates — will show up here." actionLabel="Browse Services" actionTo="/services" />
          )}
        </div>
      ) : (
        <TableCard>
          <TableScroll minWidth={720}>
            <TableHead columns={["Event", "Booking", "Detail", "Date"]} />
            <tbody>
              {paged.map((ev, idx) => (
                <tr key={idx} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-6 py-4 font-semibold">{humanize(ev.event)}</td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {ev.booking_number}
                    {ev.service_name ? ` · ${ev.service_name}` : ""}
                  </td>
                  <td className="px-4 py-4 max-w-xs truncate text-muted-foreground">{ev.detail ?? "—"}</td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtDateTime(ev.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
          <TablePagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            from={(page - 1) * PAGE_SIZE + 1}
            to={Math.min(page * PAGE_SIZE, filtered.length)}
            total={filtered.length}
            itemLabel="events"
          />
        </TableCard>
      )}
    </PageShell>
  );
}
