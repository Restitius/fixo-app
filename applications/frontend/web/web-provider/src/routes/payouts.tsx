import { createFileRoute } from "@tanstack/react-router";
import { Banknote, Plus, Timer } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TableCard, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { fmtDate, fmtMoney } from "@/lib/format";
import { payoutMethods, payouts, walletSummary } from "@/lib/mock-data";

const title = "Payouts — FIXO Provider";
const description = "Withdrawal history, payout methods, schedules and settlement status for your FIXO earnings.";

export const Route = createFileRoute("/payouts")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PayoutsPage,
});

function PayoutsPage() {
  const paid = payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const processing = payouts.filter((p) => p.status === "PROCESSING").reduce((s, p) => s + p.amount, 0);

  return (
    <ProviderPage title="Payouts" subtitle="Move your cleared balance to your bank or mobile money.">
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard icon={Banknote} label="Available to withdraw" value={fmtMoney(walletSummary.available)} hint="Cleared funds" hero />
        <MetricCard icon={Timer} label="Processing" value={fmtMoney(processing)} hint="Settling now" tone="amber" tintValue />
        <MetricCard icon={Banknote} label="Paid out" value={fmtMoney(paid)} hint="All time" tone="success" tintValue />
      </div>

      <div className="mt-4 grid gap-4 pb-6 lg:grid-cols-[1fr_340px]">
        <TableCard className="mt-0">
          <div className="px-6 pt-5">
            <h2 className="text-base font-bold tracking-tight">Payout history</h2>
          </div>
          <TableScroll minWidth={640}>
            <TableHead columns={["Payout", "Method", "Amount", "Requested", "Status"]} />
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                  <td className="px-6 py-4 font-semibold">{p.id}</td>
                  <td className="px-4 py-4 text-muted-foreground">{p.method}</td>
                  <td className="px-4 py-4 font-semibold">{fmtMoney(p.amount)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtDate(p.requested)}</td>
                  <td className="px-4 py-4">
                    <StatusPill status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
        </TableCard>

        <div className="space-y-4">
          <Panel
            title="Payout methods"
            action={
              <button className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                <Plus className="size-4" /> Add
              </button>
            }
          >
            <div className="space-y-3">
              {payoutMethods.map((m) => (
                <div key={m.id} className="rounded-2xl bg-muted/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{m.type}</p>
                    {m.primary && <StatusPill tone="success" label="Primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{m.detail}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.holder} · {m.currency}
                  </p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Payout schedule">
            <div className="space-y-3 text-sm">
              {["Instant (on request)", "Weekly — every Monday", "Monthly — 1st of the month"].map((o, i) => (
                <label key={o} className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
                  <input type="radio" name="schedule" defaultChecked={i === 0} className="size-4 accent-[var(--primary)]" />
                  {o}
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Failed payouts are returned to your wallet within 3 working days.
            </p>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}
