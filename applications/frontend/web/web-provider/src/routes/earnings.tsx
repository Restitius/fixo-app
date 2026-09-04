import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Percent, TrendingUp, Wallet } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { fmtMoney } from "@/lib/format";
import { earningsByService, earningsTrend, performance, promotions, walletSummary } from "@/lib/mock-data";

const title = "Earnings & Analytics — FIXO Provider";
const description = "Revenue trends by month and service, commission paid, conversion metrics and promotion impact.";

export const Route = createFileRoute("/earnings")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: EarningsPage,
});

function EarningsPage() {
  const maxTrend = Math.max(...earningsTrend.map((t) => t.value));
  const maxService = Math.max(...earningsByService.map((t) => t.value));
  const commissionPaid = Math.round(walletSummary.totalEarned * 0.1);

  return (
    <ProviderPage title="Earnings" subtitle="How your business is performing financially.">
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Wallet} label="Lifetime earnings" value={fmtMoney(walletSummary.totalEarned)} hint="Net of commission" />
        <MetricCard icon={TrendingUp} label="This month" value={fmtMoney(earningsTrend[earningsTrend.length - 1]?.value ?? 0)} hint="September 2026" tone="success" tintValue />
        <MetricCard icon={Percent} label="Commission paid" value={fmtMoney(commissionPaid)} hint="10% platform fee" tone="amber" tintValue />
        <MetricCard icon={BarChart3} label="Avg. job value" value={fmtMoney(268000)} hint="Last 90 days" />
      </div>

      <div className="mt-4 grid gap-4 pb-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Monthly revenue">
          <div className="flex h-56 items-end gap-3">
            {earningsTrend.map((t) => (
              <div key={t.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[11px] font-semibold text-muted-foreground">{(t.value / 1_000_000).toFixed(1)}M</span>
                <div
                  className="w-full rounded-t-xl"
                  style={{ height: `${(t.value / maxTrend) * 100}%`, backgroundImage: "var(--gradient-primary)" }}
                />
                <span className="text-xs text-muted-foreground">{t.label}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Revenue by service">
          <div className="space-y-3">
            {earningsByService.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-semibold">{fmtMoney(s.value)}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${(s.value / maxService) * 100}%`, backgroundImage: "var(--gradient-primary)" }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 pb-6 lg:grid-cols-2">
        <Panel title="Conversion funnel">
          <div className="space-y-3 text-sm">
            {[
              { label: "Requests offered", value: performance.offered },
              { label: "Accepted", value: performance.accepted },
              { label: "Completed", value: performance.completed },
              { label: "Cancelled", value: performance.cancelled },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-semibold">{r.value}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(r.value / performance.offered) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Promotions">
          <div className="space-y-3">
            {promotions.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/50 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.funding} · {p.period} · {p.impact}
                  </p>
                </div>
                <button
                  className={`rounded-xl px-4 py-2 text-xs font-semibold ${
                    p.joined ? "border border-border bg-card hover:bg-muted" : "text-primary-foreground"
                  }`}
                  style={p.joined ? undefined : { backgroundImage: "var(--gradient-primary)" }}
                >
                  {p.joined ? "Leave" : "Join"}
                </button>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </ProviderPage>
  );
}
