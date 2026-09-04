import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Coins, ShieldAlert, Wallet } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TableCard, TableFilterBar, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { fmtDate, fmtMoney } from "@/lib/format";
import { walletSummary, walletTransactions } from "@/lib/mock-data";

const title = "Wallet — FIXO Provider";
const description = "Available balance, pending clearance, commission deductions and every wallet transaction.";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");

  const rows = useMemo(
    () =>
      walletTransactions.filter(
        (t) =>
          (type === "ALL" || t.type === type) &&
          `${t.id} ${t.label} ${t.booking}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, type],
  );

  return (
    <ProviderPage title="Wallet" subtitle="Everything that moves through your FIXO balance.">
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Wallet} label="Available balance" value={fmtMoney(walletSummary.available)} hint="Ready to withdraw" hero />
        <MetricCard icon={Coins} label="Pending clearance" value={fmtMoney(walletSummary.pending)} hint="Clears after sign-off" tone="amber" tintValue />
        <MetricCard icon={ShieldAlert} label="Reserved" value={fmtMoney(walletSummary.reserved)} hint="Held for open disputes" tone="destructive" tintValue />
        <MetricCard icon={Coins} label="Lifetime earnings" value={fmtMoney(walletSummary.totalEarned)} hint={`${fmtMoney(walletSummary.withdrawn)} withdrawn`} tone="success" tintValue />
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search transactions..."
        filters={[
          {
            value: type,
            onChange: setType,
            placeholder: "Type",
            options: [
              { value: "ALL", label: "All types" },
              ...["EARNING", "WITHDRAWAL", "BONUS", "ADJUSTMENT"].map((t) => ({
                value: t,
                label: t.charAt(0) + t.slice(1).toLowerCase(),
              })),
            ],
          },
        ]}
      />

      <TableCard className="mb-6">
        <TableScroll minWidth={820}>
          <TableHead columns={["Transaction", "Booking", "Description", "Gross", "Commission", "Net", "Date"]} />
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                <td className="px-6 py-4 font-semibold">{t.id}</td>
                <td className="px-4 py-4 text-muted-foreground">{t.booking}</td>
                <td className="px-4 py-4 text-muted-foreground">{t.label}</td>
                <td className="px-4 py-4">{fmtMoney(t.gross)}</td>
                <td className="px-4 py-4 text-muted-foreground">{t.commission ? `- ${fmtMoney(t.commission)}` : "—"}</td>
                <td className={`px-4 py-4 font-semibold ${t.net < 0 ? "text-destructive" : "text-success"}`}>
                  {t.net < 0 ? `- ${fmtMoney(Math.abs(t.net))}` : fmtMoney(t.net)}
                </td>
                <td className="px-4 py-4 text-muted-foreground">{fmtDate(t.date)}</td>
              </tr>
            ))}
          </tbody>
        </TableScroll>
      </TableCard>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Panel title="How your money flows">
          <ol className="space-y-3 text-sm text-muted-foreground">
            {[
              "Customer payment is authorized before the job starts.",
              "Funds are captured once the customer signs off the completed work.",
              "Platform commission is deducted automatically.",
              "Net amount lands in your wallet as pending, then clears.",
              "You withdraw to your bank or mobile money account.",
            ].map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Withdraw">
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Amount (TZS)</span>
            <input
              type="number"
              defaultValue={walletSummary.available}
              className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            />
          </label>
          <label className="mt-3 block">
            <span className="mb-1 block text-xs text-muted-foreground">Destination</span>
            <select className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30">
              <option>CRDB Bank ****4471</option>
              <option>M-Pesa +255 754 ***220</option>
            </select>
          </label>
          <p className="mt-3 text-xs text-muted-foreground">Minimum withdrawal TZS 20,000 · fee TZS 1,500 · arrives within 24 hours.</p>
          <button
            className="mt-4 w-full rounded-xl py-3 text-sm font-semibold text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            Request withdrawal
          </button>
        </Panel>
      </div>
    </ProviderPage>
  );
}
