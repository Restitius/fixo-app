// Wallet — balance, ledger, and credit/debit actions.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type WalletTxn } from "@/lib/api-client";
import { fmtDateTime, fmtMoney, humanize } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
});

function WalletPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [balance, setBalance] = useState<{ balance: number; currency: string } | null>(null);
  const [txns, setTxns] = useState<WalletTxn[]>([]);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [bal, list] = await Promise.all([
        fixoSdk.walletBalance(),
        fixoSdk.walletTransactions(50, 0),
      ]);
      setBalance(bal);
      setTxns(list);
    } catch {
      // toast already emitted by client
    }
  }, []);

  useEffect(() => {
    if (access_token && !loading) void load();
  }, [access_token, loading, load]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const applyAmount = async (kind: "credit" | "debit") => {
    const n = Number(amount);
    if (!n || n <= 0) {
      toast.error("Enter a positive amount");
      return;
    }
    setBusy(true);
    try {
      const row = kind === "credit" ? await fixoSdk.walletCredit(n) : await fixoSdk.walletDebit(n);
      toast.success(
        `${kind === "credit" ? "Credited" : "Debited"} ${fmtMoney(row.amount, row.currency)}`,
      );
      setAmount("");
      await load();
    } catch {
      // toast already emitted
    } finally {
      setBusy(false);
    }
  };

  const currency = balance?.currency ?? "TZS";

  return (
    <PageShell title="Wallet" subtitle="Your service wallet and ledger" userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Balance + actions */}
        <div className="space-y-6">
          <div
            className="rounded-3xl p-6 text-primary-foreground shadow-[var(--shadow-card)]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <div className="flex items-center gap-2 text-sm opacity-90">
              <WalletIcon className="size-4" />
              Available Balance
            </div>
            <p className="mt-2 text-4xl font-bold">
              {balance ? fmtMoney(balance.balance, balance.currency) : "—"}
            </p>
            <p className="mt-1 text-xs opacity-80">Ledger-backed · double-entry</p>
          </div>

          <div className="space-y-4 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({currency})</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                inputMode="decimal"
                placeholder="e.g. 20000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button disabled={busy} onClick={() => void applyAmount("credit")} className="gap-2">
                <ArrowDownLeft className="size-4" /> Credit
              </Button>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => void applyAmount("debit")}
                className="gap-2"
              >
                <ArrowUpRight className="size-4" /> Debit
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void load()} className="w-full gap-2">
              <RefreshCw className="size-3.5" /> Refresh
            </Button>
          </div>
        </div>

        {/* Ledger */}
        <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold">Transactions</h3>
          <p className="mb-4 text-sm text-muted-foreground">Credits, debits and holds in order.</p>
          {txns.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No transactions yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {txns.map((t, i) => (
                <li key={t.entry_id ?? i} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-9 items-center justify-center rounded-full ${
                        t.entry_type === "CREDIT"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {t.entry_type === "CREDIT" ? (
                        <ArrowDownLeft className="size-4" />
                      ) : (
                        <ArrowUpRight className="size-4" />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{humanize(t.entry_type)}</p>
                      <p className="text-xs text-muted-foreground">{fmtDateTime(t.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        t.entry_type === "CREDIT" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {t.entry_type === "CREDIT" ? "+" : "−"}
                      {fmtMoney(t.amount, t.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      bal {fmtMoney(t.running_balance, t.currency)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageShell>
  );
}