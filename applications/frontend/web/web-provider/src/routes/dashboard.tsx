import { Link, createFileRoute } from "@tanstack/react-router";
import { Briefcase, CalendarDays, Inbox, Star, TrendingUp, Wallet } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fmtMoney } from "@/lib/format";
import {
  bookings,
  dashboardStats,
  jobRequests,
  notifications,
  onboardingSteps,
  performance,
  provider,
  walletSummary,
  weekLoad,
} from "@/lib/mock-data";

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
  const todays = bookings.filter((b) => b.date === "2026-09-04");
  const maxLoad = Math.max(...weekLoad.map((w) => w.value), 1);
  const doneSteps = onboardingSteps.filter((s) => s.done).length;

  return (
    <ProviderPage title={`Habari, ${provider.firstName}`} subtitle="Here is what is happening with your business today.">
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Briefcase} label="Jobs today" value={String(dashboardStats.todayJobs)} hint="2 remaining" />
        <MetricCard icon={Inbox} label="New requests" value={String(dashboardStats.pendingRequests)} hint="Awaiting your response" tone="amber" tintValue />
        <MetricCard icon={Wallet} label="Earned today" value={fmtMoney(dashboardStats.earningsToday)} hint="Net after commission" tone="success" tintValue />
        <MetricCard icon={Star} label="Rating" value={`${provider.rating}`} hint={`${provider.reviewCount} reviews`} />
      </div>

      {doneSteps < onboardingSteps.length && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5 text-primary-foreground" style={{ backgroundImage: "var(--gradient-primary)" }}>
          <div>
            <p className="text-base font-bold">Finish your onboarding ({doneSteps}/{onboardingSteps.length})</p>
            <p className="text-sm text-primary-foreground/85">Complete service areas, payout details and agreements to unlock full job matching.</p>
          </div>
          <Link to="/onboarding" className="rounded-xl bg-white/95 px-5 py-2.5 text-sm font-bold text-primary">
            Continue
          </Link>
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
            {todays.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-muted/50 p-4">
                <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <span className="text-sm font-bold">{b.time}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{b.service}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {b.customer} · {b.address}
                  </p>
                </div>
                <StatusPill status={b.stage} />
                <span className="text-sm font-bold text-primary">{fmtMoney(b.price)}</span>
                <Link to="/bookings" className="text-sm font-semibold text-primary hover:underline">
                  Open
                </Link>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Wallet">
          <p className="text-3xl font-extrabold tracking-tight text-primary">{fmtMoney(walletSummary.available)}</p>
          <p className="text-sm text-muted-foreground">Available for withdrawal</p>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Pending clearance" value={fmtMoney(walletSummary.pending)} />
            <Row label="Reserved (disputes)" value={fmtMoney(walletSummary.reserved)} />
            <Row label="Lifetime earnings" value={fmtMoney(walletSummary.totalEarned)} />
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
            {jobRequests.slice(0, 3).map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{r.service}</p>
                    {r.urgent && <StatusPill tone="destructive" label="Urgent" />}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.customer} · {r.area} · {r.distanceKm} km · {r.estimatedDuration}
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">{fmtMoney(r.estimatedEarning)}</span>
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

        <Panel title="This week">
          <div className="flex h-40 items-end gap-2">
            {weekLoad.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-xl"
                  style={{ height: `${(d.value / maxLoad) * 100}%`, backgroundImage: "var(--gradient-primary)", minHeight: 4 }}
                />
                <span className="text-xs text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Acceptance rate" value={`${performance.acceptanceRate}%`} />
            <Row label="Completion rate" value={`${performance.completionRate}%`} />
            <Row label="Avg. response" value={`${performance.responseMinutes} min`} />
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 pb-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Recent notifications">
          <ul className="space-y-3">
            {notifications.slice(0, 4).map((n) => (
              <li key={n.id} className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.unread ? "bg-primary" : "bg-muted-foreground/40"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.body}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{n.at}</span>
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
