import { createFileRoute } from "@tanstack/react-router";
import { Percent, Receipt, Tags } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { fmtMoney } from "@/lib/format";
import { commissionTiers, services } from "@/lib/mock-data";

const title = "Pricing & Commission — FIXO Provider";
const description = "Set base prices, minimum charges, callout and emergency surcharges, and see your net earnings after commission.";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PricingPage,
});

const field = "h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30";

function PricingPage() {
  const commission = 0.1;

  return (
    <ProviderPage title="Pricing" subtitle="Your rates, surcharges and how commission affects each payout.">
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard icon={Tags} label="Active priced services" value={String(services.filter((s) => s.price > 0).length)} hint="Visible to customers" />
        <MetricCard icon={Percent} label="Commission rate" value="10%" hint="Professional plan" tone="amber" tintValue />
        <MetricCard icon={Receipt} label="Avg. net per job" value={fmtMoney(268000)} hint="Last 30 days" tone="success" tintValue />
      </div>

      <div className="mt-4 grid gap-4 pb-6 lg:grid-cols-[1fr_360px]">
        <Panel title="Service rates">
          <div className="space-y-3">
            {services.map((s) => (
              <div key={s.id} className="grid gap-3 rounded-2xl bg-muted/50 p-4 sm:grid-cols-[1.4fr_1fr_1fr]">
                <div>
                  <p className="text-sm font-semibold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.category} · {s.pricingModel.charAt(0) + s.pricingModel.slice(1).toLowerCase()}
                  </p>
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs text-muted-foreground">Base price</span>
                  <input className={field} type="number" defaultValue={s.price} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-muted-foreground">Minimum charge</span>
                  <input className={field} type="number" defaultValue={s.minimumCharge} />
                </label>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Surcharges">
            <div className="space-y-3">
              {[
                { label: "Callout fee", value: 10000 },
                { label: "Emergency surcharge (%)", value: 25 },
                { label: "Weekend surcharge (%)", value: 15 },
                { label: "After-hours surcharge (%)", value: 20 },
                { label: "Travel fee per km beyond radius", value: 1200 },
              ].map((s) => (
                <label key={s.label} className="block">
                  <span className="mb-1 block text-xs text-muted-foreground">{s.label}</span>
                  <input className={field} type="number" defaultValue={s.value} />
                </label>
              ))}
            </div>
            <button
              className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Save pricing
            </button>
          </Panel>

          <Panel title="Commission example">
            <div className="space-y-2 text-sm">
              <Row label="Customer pays" value={fmtMoney(100000)} />
              <Row label="Platform commission (10%)" value={`- ${fmtMoney(100000 * commission)}`} />
              <div className="flex items-center justify-between border-t border-border pt-2 font-semibold">
                <span>You receive</span>
                <span className="text-primary">{fmtMoney(100000 * (1 - commission))}</span>
              </div>
            </div>
            <table className="mt-4 w-full text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-1.5 font-semibold">Plan</th>
                  <th className="py-1.5 font-semibold">Commission</th>
                  <th className="py-1.5 font-semibold">Payout</th>
                </tr>
              </thead>
              <tbody>
                {commissionTiers.map((t) => (
                  <tr key={t.plan} className="border-t border-border/60">
                    <td className="py-2 font-medium">{t.plan}</td>
                    <td className="py-2 text-primary">{t.commission}</td>
                    <td className="py-2 text-muted-foreground">{t.payout}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
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
