// Wallet — wired to the real /providers/me/wallet* and payout-method
// endpoints. entry_type values (WITHDRAWAL, BONUS, ADJUSTMENT,
// REFUND_DEDUCTION) confirmed by grepping every real INSERT into
// PROVIDER_WALLET_LEDGER this session — there is currently no "earning
// credit from a completed job" pathway wired into the ledger anywhere in
// the backend, so that filter option is intentionally not offered here
// rather than added for a category that can never actually appear.
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Coins, Loader2, ShieldAlert, Wallet } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TableCard, TableFilterBar, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { fmtMoney } from "@/lib/format";
import { payoutsApi, walletApi, type PayoutMethod, type WalletOverview, type WalletTransaction } from "@/lib/api-client";

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
  const [overview, setOverview] = useState<WalletOverview | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [amount, setAmount] = useState("");
  const [methodId, setMethodId] = useState("");
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    Promise.all([walletApi.overview(), walletApi.transactions(50), payoutsApi.listMethods()])
      .then(([ov, tx, m]) => {
        setOverview(ov);
        setTransactions(tx);
        setMethods(m);
        if (m[0]) setMethodId(m[0].method_id);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load your wallet."))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(
    () =>
      transactions.filter(
        (t) =>
          (type === "ALL" || t.entry_type === type) &&
          `${t.entry_id} ${t.description ?? ""} ${t.booking_number ?? ""}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [transactions, search, type],
  );

  async function requestWithdrawal() {
    const value = Number(amount);
    if (!methodId || !value || value <= 0) {
      toast.error("Choose a payout method and enter a valid amount.");
      return;
    }
    setWithdrawing(true);
    try {
      await payoutsApi.withdraw({ method_id: methodId, amount: value, currency: overview?.currency ?? "TZS" });
      toast.success("Withdrawal requested.");
      const [ov, tx] = await Promise.all([walletApi.overview(), walletApi.transactions(50)]);
      setOverview(ov);
      setTransactions(tx);
      setAmount("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not request withdrawal.");
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) {
    return (
      <ProviderPage title="Wallet" subtitle="Everything that moves through your FIXO balance.">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </ProviderPage>
    );
  }

  const currency = overview?.currency ?? "TZS";

  return (
    <ProviderPage title="Wallet" subtitle="Everything that moves through your FIXO balance.">
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Wallet} label="Available balance" value={fmtMoney(overview?.available_balance ?? 0, currency)} hint="Ready to withdraw" hero />
        <MetricCard icon={Coins} label="Pending clearance" value={fmtMoney(overview?.pending_balance ?? 0, currency)} hint="Clears after sign-off" tone="amber" tintValue />
        <MetricCard icon={ShieldAlert} label="Reserved" value={fmtMoney(overview?.reserved_funds ?? 0, currency)} hint="Held for open disputes" tone="destructive" tintValue />
        <MetricCard icon={Coins} label="Withdrawn" value={fmtMoney(overview?.withdrawals ?? 0, currency)} hint={`${fmtMoney(overview?.bonuses ?? 0, currency)} in bonuses`} tone="success" tintValue />
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
              ...["WITHDRAWAL", "BONUS", "ADJUSTMENT", "REFUND_DEDUCTION"].map((t) => ({ value: t, label: t.charAt(0) + t.slice(1).toLowerCase().replace("_", " ") })),
            ],
          },
        ]}
      />

      <TableCard className="mb-6">
        <TableScroll minWidth={820}>
          <TableHead columns={["Type", "Booking", "Description", "Amount", "Balance after", "Date"]} />
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No transactions yet.
                </td>
              </tr>
            )}
            {rows.map((t) => (
              <tr key={t.entry_id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                <td className="px-6 py-4 font-semibold">{t.entry_type}</td>
                <td className="px-4 py-4 text-muted-foreground">{t.booking_number ?? "—"}</td>
                <td className="px-4 py-4 text-muted-foreground">{t.description ?? "—"}</td>
                <td className={`px-4 py-4 font-semibold ${t.amount < 0 ? "text-destructive" : "text-success"}`}>{fmtMoney(t.amount, t.currency)}</td>
                <td className="px-4 py-4 text-muted-foreground">{fmtMoney(t.running_balance, t.currency)}</td>
                <td className="px-4 py-4 text-muted-foreground">{t.created_at.slice(0, 10)}</td>
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
          {methods.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add a payout method on the Payouts page before withdrawing.</p>
          ) : (
            <>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Amount ({currency})</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                />
              </label>
              <label className="mt-3 block">
                <span className="mb-1 block text-xs text-muted-foreground">Destination</span>
                <select
                  value={methodId}
                  onChange={(e) => setMethodId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {methods.map((m) => (
                    <option key={m.method_id} value={m.method_id}>
                      {m.method_type} — {m.mobile_number || m.account_number || m.provider_name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={requestWithdrawal}
                disabled={withdrawing}
                className="mt-4 w-full rounded-xl py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                {withdrawing ? "Requesting…" : "Request withdrawal"}
              </button>
            </>
          )}
        </Panel>
      </div>
    </ProviderPage>
  );
}
