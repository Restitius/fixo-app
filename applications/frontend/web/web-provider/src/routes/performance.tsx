import { createFileRoute } from "@tanstack/react-router";
import { Activity, CheckCircle2, Clock, Trophy } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fmtDate } from "@/lib/format";
import { disputes, performance, provider } from "@/lib/mock-data";

const title = "Performance & Ranking — FIXO Provider";
const description = "Acceptance and completion rates, response time, provider level, ranking factors and open disputes.";

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

const levels = [
  { name: "New", need: "0 jobs", done: true },
  { name: "Rising", need: "25 jobs · 4.3★", done: true },
  { name: "Established", need: "100 jobs · 4.5★", done: true },
  { name: "Top Provider", need: "250 jobs · 4.7★", done: true },
  { name: "Elite", need: "750 jobs · 4.85★", done: false },
];

const rankingFactors = [
  { label: "Rating", weight: 30, score: 96 },
  { label: "Completion rate", weight: 25, score: 95 },
  { label: "Response time", weight: 20, score: 92 },
  { label: "Proximity to job", weight: 15, score: 80 },
  { label: "Verification level", weight: 10, score: 88 },
];

function PerformancePage() {
  return (
    <ProviderPage title="Performance" subtitle="Your standing in the FIXO matching engine.">
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Trophy} label="Provider level" value={provider.level} hint={`${provider.completedJobs} jobs completed`} hero />
        <MetricCard icon={CheckCircle2} label="Acceptance rate" value={`${performance.acceptanceRate}%`} hint={`${performance.accepted} of ${performance.offered} offers`} tone="success" tintValue />
        <MetricCard icon={Activity} label="Completion rate" value={`${performance.completionRate}%`} hint={`${performance.cancellationRate}% cancelled`} tone="primary" tintValue />
        <MetricCard icon={Clock} label="Avg. response" value={`${performance.responseMinutes} min`} hint="Target under 10 minutes" tone="amber" tintValue />
      </div>

      <div className="mt-4 grid gap-4 pb-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Panel title="Ranking factors">
            <div className="space-y-3">
              {rankingFactors.map((f) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {f.label} <span className="text-xs">({f.weight}%)</span>
                    </span>
                    <span className="font-semibold">{f.score}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${f.score}%`, backgroundImage: "var(--gradient-primary)" }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Ranking decides which providers a customer sees first for a matching request.
            </p>
          </Panel>

          <Panel title="Cancellations & disputes">
            <div className="space-y-3">
              {disputes.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/50 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {d.id} · booking {d.booking}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {d.reason} · opened {fmtDate(d.opened)}
                    </p>
                  </div>
                  <StatusPill tone={d.stage.startsWith("Closed") ? "muted" : "amber"} label={d.stage} />
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {performance.cancelled} cancellations in the last 90 days. Cancelling an accepted job within 2 hours of the
              slot affects your ranking.
            </p>
          </Panel>
        </div>

        <Panel title="Level progression">
          <div className="space-y-3">
            {levels.map((l) => (
              <div
                key={l.name}
                className={`flex items-center gap-3 rounded-2xl p-4 ${l.done ? "bg-primary/5" : "bg-muted/50"}`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    l.done ? "text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                  style={l.done ? { backgroundImage: "var(--gradient-primary)" } : undefined}
                >
                  {l.done ? "✓" : ""}
                </span>
                <div>
                  <p className="text-sm font-semibold">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.need}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Elite unlocks an 8% commission rate, priority matching and a featured badge.
          </p>
        </Panel>
      </div>
    </ProviderPage>
  );
}
