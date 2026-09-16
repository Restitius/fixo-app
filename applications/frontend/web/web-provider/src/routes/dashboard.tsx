// Provider dashboard — wired to the real /providers/dashboard* endpoints,
// the requests feed, wallet overview and onboarding status. Field names
// read directly from provider_dashboard_service.py / their governed SQL
// this session, not guessed from the old mock-data.ts shapes.
import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Briefcase, CalendarDays, Inbox, Loader2, Star, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fmtMoney } from "@/lib/format";
import { useProviderAuth } from "@/lib/provider-auth";
import {
  dashboardApi,
  fixoSdk,
  onboardingApi,
  type DashboardEarnings,
  type DashboardOverview,
  type DashboardPerformance,
  type DashboardScheduleItem,
  type ProviderNotificationRow,
  type RequestFeedItem,
  type WalletOverview,
} from "@/lib/api-client";

const title = "Provider Dashboard — FIXO";
const description = "Today's jobs, incoming requests, earnings and performance at a glance.";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { session } = useProviderAuth();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<DashboardScheduleItem[]>([]);
  const [earnings, setEarnings] = useState<DashboardEarnings | null>(null);
  const [performance, setPerformance] = useState<DashboardPerformance | null>(null);
  const [wallet, setWallet] = useState<WalletOverview | null>(null);
  const [requests, setRequests] = useState<RequestFeedItem[]>([]);
  const [notifications, setNotifications] = useState<ProviderNotificationRow[]>([]);
  const [onboardingComplete, setOnboardingComplete] = useState<{ progress: string; completed: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ov, sched, earn, perf, wal, reqs, notifs, onboarding] = await Promise.all([
          dashboardApi.overview(),
          dashboardApi.schedule(),
          dashboardApi.earnings(),
          dashboardApi.performance(),
          // Non-critical for the dashboard to render — same treatment as
          // requests/notifications/onboarding below. A real bug this
          // session (wallet_router.py missing the standard envelope) made
          // this throw on every call; without a .catch() here that single
          // failure silently killed the *entire* Promise.all, and every
          // fallback-to-zero value in this page's JSX made the resulting
          // all-null state look identical to a genuine empty account.
          dashboardApi.wallet().catch(() => null),
          dashboardApi.requestsFeed().catch(() => []),
          fixoSdk.notifications("all", 4).catch(() => []),
          onboardingApi.status().catch(() => null),
        ]);
        setOverview(ov);
        setTodaySchedule(sched.today);
        setEarnings(earn);
        setPerformance(perf);
        setWallet(wal);
        setRequests(reqs);
        setNotifications(notifs);
        if (onboarding) setOnboardingComplete({ progress: onboarding.progress, completed: onboarding.completed });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not load your dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <ProviderPage title="Loading…" subtitle="">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </ProviderPage>
    );
  }

  const stats = overview?.stats;
  const firstName = session?.first_name ?? session?.display_name ?? "there";

  return (
    <ProviderPage title={`Habari, ${firstName}`} subtitle="Here is what is happening with your business today.">
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Briefcase} label="Jobs today" value={String(stats?.todays_jobs ?? 0)} hint={`${stats?.active_jobs ?? 0} active`} />
        <MetricCard icon={Inbox} label="New requests" value={String(stats?.pending_requests ?? 0)} hint="Awaiting your response" tone="amber" tintValue />
        <MetricCard
          icon={Wallet}
          label="Earned today"
          value={fmtMoney(stats?.earnings_today ?? 0, stats?.currency)}
          hint="Collected today"
          tone="success"
          tintValue
        />
        <MetricCard icon={Star} label="Rating" value={stats?.rating_avg != null ? String(stats.rating_avg) : "—"} hint={`${stats?.rating_count ?? 0} reviews`} />
      </div>

      {onboardingComplete && !onboardingComplete.completed && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5 text-primary-foreground" style={{ backgroundImage: "var(--gradient-primary)" }}>
          <div>
            <p className="text-base font-bold">Finish your onboarding ({onboardingComplete.progress})</p>
            <p className="text-sm text-primary-foreground/85">Complete service areas, payout details and agreements to unlock full job matching.</p>
          </div>
          <Link to="/onboarding" className="rounded-xl bg-white/95 px-5 py-2.5 text-sm font-bold text-primary">
            Continue
          </Link>
        </div>
      )}

      {overview && overview.attention.length > 0 && (
        <div className="mt-6 space-y-2">
          {overview.attention.map((a) => (
            <div key={a.code} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
              <span>{a.message}</span>
              <StatusPill tone={a.severity === "critical" ? "destructive" : a.severity === "warning" ? "amber" : "primary"} label={a.severity} />
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Today's schedule"
          action={
            <Link to="/calendar" className="text-sm font-semibold text-primary hover:underline">
              Open calendar
            </Link>
          }
        >
          <div className="space-y-3">
            {todaySchedule.length === 0 && <p className="text-sm text-muted-foreground">No jobs scheduled for today.</p>}
            {todaySchedule.map((b) => (
              <div key={b.booking_id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-muted/50 p-4">
                <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <span className="text-xs font-bold">{b.time_window ?? "—"}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{b.service_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.booking_number}</p>
                </div>
                <StatusPill status={b.status} />
                <span className="text-sm font-bold text-primary">{fmtMoney(b.agreed_amount, b.currency)}</span>
                <Link to="/bookings" className="text-sm font-semibold text-primary hover:underline">
                  Open
                </Link>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Wallet">
          <p className="text-3xl font-extrabold tracking-tight text-primary">{fmtMoney(wallet?.available_balance ?? 0, wallet?.currency)}</p>
          <p className="text-sm text-muted-foreground">Available for withdrawal</p>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Pending clearance" value={fmtMoney(wallet?.pending_balance ?? 0, wallet?.currency)} />
            <Row label="Reserved (disputes)" value={fmtMoney(wallet?.reserved_funds ?? 0, wallet?.currency)} />
          </div>
          <Link
            to="/payouts"
            className="mt-5 block rounded-xl py-2.5 text-center text-sm font-semibold text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            Withdraw funds
          </Link>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Incoming requests"
          action={
            <Link to="/requests" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          }
        >
          <div className="space-y-3">
            {requests.length === 0 && <p className="text-sm text-muted-foreground">No incoming requests right now.</p>}
            {requests.slice(0, 3).map((r) => (
              <div key={r.match_id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.service_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.customer_name} · {[r.city, r.region].filter(Boolean).join(", ")}
                  </p>
                </div>
                {r.estimated_earnings != null && <span className="text-sm font-bold text-primary">{fmtMoney(r.estimated_earnings)}</span>}
                <Link
                  to="/requests"
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-primary-foreground"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  Respond
                </Link>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Performance">
          <div className="space-y-2 text-sm">
            <Row label="Acceptance rate" value={performance?.acceptance_rate != null ? `${Math.round(performance.acceptance_rate * 100)}%` : "—"} />
            <Row label="Completion rate" value={performance?.completion_rate != null ? `${Math.round(performance.completion_rate * 100)}%` : "—"} />
            <Row label="Avg. response" value={performance?.response_time_minutes != null ? `${performance.response_time_minutes} min` : "—"} />
            <Row label="Collected this week" value={fmtMoney(earnings?.collected_week ?? 0, earnings?.currency)} />
            <Row label="Collected this month" value={fmtMoney(earnings?.collected_month ?? 0, earnings?.currency)} />
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 pb-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Recent notifications">
          <ul className="space-y-3">
            {notifications.length === 0 && <p className="text-sm text-muted-foreground">No notifications yet.</p>}
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${!n.is_read ? "bg-primary" : "bg-muted-foreground/40"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Quick actions">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Quotes", to: "/quotes", icon: TrendingUp },
              { label: "Calendar", to: "/calendar", icon: CalendarDays },
              { label: "Services", to: "/services", icon: Briefcase },
              { label: "Earnings", to: "/earnings", icon: Wallet },
            ].map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="flex flex-col items-center gap-2 rounded-2xl bg-muted/50 p-4 text-sm font-semibold transition-colors hover:bg-muted"
              >
                <a.icon className="size-5 text-primary" />
                {a.label}
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </ProviderPage>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
