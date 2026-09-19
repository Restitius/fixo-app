import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, CalendarRange, TrendingUp, Wallet } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fmtDate, fmtMoney } from "@/lib/format";
import { earningsApi, type EarningsSummary, type EarningsTransaction } from "@/lib/api-client";

const title = "Earnings — FIXO Provider";
const description = "Your real earnings balance and invoice transaction history.";

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
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<EarningsTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([earningsApi.summary(), earningsApi.transactions(50, 0)])
      .then(([s, t]) => {
        setSummary(s);
        setTransactions(t);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProviderPage title="Earnings" subtitle="Your real balance and invoice history.">
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Wallet} label="Lifetime earnings" value={fmtMoney(summary?.total_earnings ?? 0, summary?.currency)} hint="Issued + paid invoices" />
        <MetricCard icon={TrendingUp} label="Available balance" value={fmtMoney(summary?.available_balance ?? 0, summary?.currency)} hint="Paid invoices" tone="success" tintValue />
        <MetricCard icon={CalendarClock} label="Pending" value={fmtMoney(summary?.pending_earnings ?? 0, summary?.currency)} hint="Issued, not yet paid" tone="amber" tintValue />
        <MetricCard icon={CalendarRange} label="This month" value={fmtMoney(summary?.views.this_month ?? 0, summary?.currency)} hint={`This week: ${fmtMoney(summary?.views.this_week ?? 0, summary?.currency)}`} />
      </div>

      <div className="mt-4 grid gap-4 pb-6 lg:grid-cols-3">
        <MetricCard icon={CalendarRange} label="Today" value={fmtMoney(summary?.views.today ?? 0, summary?.currency)} hint="Paid today" />
        <MetricCard icon={CalendarRange} label="This year" value={fmtMoney(summary?.views.this_year ?? 0, summary?.currency)} hint="Paid this year" />
        <MetricCard icon={Wallet} label="Withdrawn" value={fmtMoney(summary?.withdrawn_amount ?? 0, summary?.currency)} hint="Sent to payout methods" />
      </div>

      <Panel title="Invoice transactions">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="py-2 pr-4">Invoice</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Service</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Paid</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No transactions yet.
                  </td>
                </tr>
              )}
              {transactions.map((t) => (
                <tr key={t.invoice_id} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-4 font-medium">{t.invoice_number}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{t.customer_name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{t.service_name}</td>
                  <td className="py-3 pr-4">
                    <StatusPill status={t.status} />
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">{t.paid_at ? fmtDate(t.paid_at) : "—"}</td>
                  <td className="py-3 text-right font-semibold text-primary">{fmtMoney(t.amount, t.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </ProviderPage>
  );
}
