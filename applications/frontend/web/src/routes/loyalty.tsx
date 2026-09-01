// Loyalty — points balance, tier, earn/spend, and points ledger.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Sparkles, Plus, Minus, Award, RefreshCw } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type LoyaltyAccount, type LoyaltyTxn } from "@/lib/api-client";
import { fmtDateTime, fmtPoints, humanize } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/loyalty")({
  component: LoyaltyPage,
});

function LoyaltyPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [txns, setTxns] = useState<LoyaltyTxn[]>([]);
  const [points, setPoints] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [acc, list] = await Promise.all([
        fixoSdk.loyaltyAccount(),
        fixoSdk.loyaltyTransactions(50, 0),
      ]);
      setAccount(acc);
      setTxns(list);
    } catch {
      // toast emitted by client
    }
  }, []);

  useEffect(() => {
    if (access_token && !loading) void load();
  }, [access_token, loading, load]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const move = async (kind: "earn" | "spend") => {
    const n = Number(points);
    if (!n || n <= 0) {
      toast.error("Enter points first");
      return;
    }
    setBusy(true);
    try {
      const row =
        kind === "earn" ? await fixoSdk.loyaltyEarn(n) : await fixoSdk.loyaltySpend(n);
      toast.success(
        `${kind === "earn" ? "Earned" : "Spent"} ${fmtPoints(row.points)} pts — balance ${fmtPoints(row.running_total)}`,
      );
      setPoints("");
      await load();
    } catch {
      // toast emitted by client
    } finally {
      setBusy(false);
    }
  };

  const tier = account?.tier ?? "SILVER";
  const balance = account?.points_balance ?? 0;

  return (
    <PageShell
      title="Loyalty"
      subtitle="Rewards for recurring customers"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <div
            className="rounded-3xl p-6 text-primary-foreground shadow-[var(--shadow-card)]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <div className="flex items-center gap-2 text-sm opacity-90">
              <Award className="size-4" /> Points balance
            </div>
            <p className="mt-2 text-4xl font-bold">{fmtPoints(balance)}</p>
            <p className="mt-1 text-xs opacity-80">Tier · {humanize(tier)}</p>
          </div>

          <div className="space-y-4 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="space-y-2">
              <Label htmlFor="pts">Points</Label>
              <Input
                id="pts"
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="e.g. 100"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button disabled={busy} onClick={() => void move("earn")} className="gap-2">
                <Plus className="size-4" /> Earn
              </Button>
              <Button
                disabled={busy}
                variant="outline"
                onClick={() => void move("spend")}
                className="gap-2"
              >
                <Minus className="size-4" /> Spend
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void load()} className="w-full gap-2">
              <RefreshCw className="size-3.5" /> Refresh
            </Button>
          </div>
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold">Points ledger</h3>
          <p className="mb-4 text-sm text-muted-foreground">Earns and redemptions in order.</p>
          {txns.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No points activity yet"
              description="Book a service to start earning loyalty points."
              compact
            />
          ) : (
            <ul className="space-y-2.5">
              {txns.map((t, i) => (
                <li
                  key={t.txn_id ?? i}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="flex animate-in fade-in slide-in-from-bottom-2 fill-mode-both items-center justify-between gap-3 rounded-2xl border border-border p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-9 items-center justify-center rounded-full ${
                        t.points > 0
                          ? "bg-success/15 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {t.points > 0 ? <Plus className="size-4" /> : <Minus className="size-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{humanize(t.activity)}</p>
                      <p className="text-xs text-muted-foreground">{fmtDateTime(t.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${t.points > 0 ? "text-success" : "text-destructive"}`}
                    >
                      {t.points > 0 ? "+" : "−"}
                      {fmtPoints(Math.abs(t.points))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      balance {fmtPoints(t.running_total)}
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
