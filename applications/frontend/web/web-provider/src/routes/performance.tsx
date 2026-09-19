import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, CheckCircle2, Clock, Trophy } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fmtDate, fmtMoney } from "@/lib/format";
import { kpisApi, rankingApi, type KpiPeriod, type KpiSummary, type ProviderRanking } from "@/lib/api-client";

const title = "Performance — FIXO Provider";
const description = "Your real ranking, completion/on-time rates and period-by-period KPI history.";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PerformancePage,
});

function PerformancePage() {
  const [ranking, setRanking] = useState<ProviderRanking | null>(null);
  const [rankingChecked, setRankingChecked] = useState(false);
  const [summary, setSummary] = useState<KpiSummary | null>(null);
  const [periods, setPeriods] = useState<KpiPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ranking_router raises 404 until a batch job first computes this
    // provider's ranking — not an error state, just "not ranked yet".
    rankingApi
      .mine()
      .then(setRanking)
      .catch(() => setRanking(null))
      .finally(() => setRankingChecked(true));
    Promise.all([kpisApi.summary(), kpisApi.list("monthly", 12, 0)])
      .then(([s, k]) => {
        setSummary(s);
        setPeriods(k);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProviderPage title="Performance" subtitle="Your standing in the FIXO matching engine.">
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Trophy}
          label="Rank level"
          value={rankingChecked ? (ranking ? ranking.rank_level : "Not ranked yet") : "…"}
          hint={ranking ? `${ranking.completed_jobs} jobs completed` : "Computed periodically, not in real time"}
          hero
        />
        <MetricCard icon={CheckCircle2} label="Completion rate" value={`${(summary?.avg_completion_rate ?? 0).toFixed(0)}%`} hint={`${summary?.total_jobs_completed ?? 0} jobs completed`} tone="success" tintValue />
        <MetricCard icon={Activity} label="On-time rate" value={`${(summary?.avg_on_time_rate ?? 0).toFixed(0)}%`} hint={`${summary?.total_jobs_cancelled ?? 0} cancelled`} tone="primary" tintValue />
        <MetricCard icon={Clock} label="Avg. response" value={`${Math.round(summary?.avg_response_time_minutes ?? 0)} min`} hint={`${(summary?.avg_rating ?? 0).toFixed(1)}★ avg rating`} tone="amber" tintValue />
      </div>

      <div className="mt-4 grid gap-4 pb-6 lg:grid-cols-[1fr_340px]">
        <Panel title="Monthly KPI history">
          <div className="space-y-3">
            {!loading && periods.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No KPI periods recorded yet.</p>}
            {periods.map((p) => (
              <div key={p.id} className="rounded-2xl bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {fmtDate(p.period_start)} – {fmtDate(p.period_end)}
                  </p>
                  <span className="text-sm font-semibold text-primary">{fmtMoney(p.revenue)}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.jobs_completed} completed · {p.jobs_cancelled} cancelled · {p.completion_rate.toFixed(0)}% completion · {p.on_time_rate.toFixed(0)}% on-time · {p.avg_rating.toFixed(1)}★ · {p.response_time_minutes} min response
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Ranking signals">
          {!ranking ? (
            <p className="text-sm text-muted-foreground">
              Your ranking hasn't been computed yet. It updates periodically based on completed jobs, ratings and
              response time.
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              <Row label="Rank score" value={String(ranking.rank_score)} />
              <Row label="Recurring customers" value={String(ranking.recurring_customers)} />
              <Row label="Referrals" value={String(ranking.referrals)} />
              <Row label="Avg completion rate" value={`${ranking.avg_completion_rate.toFixed(0)}%`} />
              <Row label="Avg on-time rate" value={`${ranking.avg_on_time_rate.toFixed(0)}%`} />
              <Row label="Avg rating" value={`${ranking.avg_rating.toFixed(1)}★`} />
              {ranking.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {ranking.badges.map((b) => (
                    <StatusPill key={b} tone="primary" label={b} />
                  ))}
                </div>
              )}
              {ranking.last_computed_at && <p className="text-xs text-muted-foreground">Last computed {fmtDate(ranking.last_computed_at)}</p>}
            </div>
          )}
        </Panel>
      </div>
    </ProviderPage>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
