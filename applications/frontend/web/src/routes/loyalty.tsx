// Loyalty — points balance, tier, earn/spend, and points ledger.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Sparkles, Plus, Minus, Award, FilterX, RefreshCw } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableFilterBar, TableCard, TableScroll, TableHead, TablePagination } from "@/components/dashboard/DataTable";
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

const PAGE_SIZE = 8;

function LoyaltyPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [txns, setTxns] = useState<LoyaltyTxn[] | null>(null);
  const [points, setPoints] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      const [acc, list] = await Promise.all([
        fixoSdk.loyaltyAccount(),
        fixoSdk.loyaltyTransactions(100, 0),
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

  const filtered = useMemo(
    () =>
      (txns ?? []).filter((t) => {
        const matchesType = typeFilter === "all" || (typeFilter === "earned" ? t.points > 0 : t.points < 0);
        const matchesSearch = !search || humanize(t.activity).toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
      }),
    [txns, typeFilter, search],
  );

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

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const hasActiveFilters = search.trim() !== "" || typeFilter !== "all";

  return (
    <PageShell
      title="Loyalty"
      subtitle="Rewards for recurring customers"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div
          className="rounded-3xl p-5 text-primary-foreground shadow-[var(--shadow-card)]"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15">
            <Award className="size-5" />
          </span>
          <p className="mt-4 text-2xl font-bold tracking-tight">{fmtPoints(balance)}</p>
          <p className="mt-0.5 text-sm opacity-80">Points Balance · {humanize(tier)} Tier</p>
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-3xl bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="min-w-[140px] flex-1 space-y-1.5">
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
          <Button disabled={busy} onClick={() => void move("earn")} className="gap-2">
            <Plus className="size-4" /> Earn
          </Button>
          <Button disabled={busy} variant="outline" onClick={() => void move("spend")} className="gap-2">
            <Minus className="size-4" /> Spend
          </Button>
          <Button variant="ghost" size="icon" onClick={() => void load()} title="Refresh">
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search activity..."
        filters={[
          {
            value: typeFilter,
            onChange: (v) => { setTypeFilter(v); setPage(1); },
            placeholder: "Type",
            options: [
              { value: "all", label: "All" },
              { value: "earned", label: "Earned" },
              { value: "spent", label: "Spent" },
            ],
          },
        ]}
      />

      {txns === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState icon={FilterX} title="No matching activity" description="Try adjusting your search or filters." actionLabel="Clear Filters" onAction={() => { setSearch(""); setTypeFilter("all"); }} />
          ) : (
            <EmptyState icon={Sparkles} title="No points activity yet" description="Book a service to start earning loyalty points." />
          )}
        </div>
      ) : (
        <TableCard>
          <TableScroll minWidth={640}>
            <TableHead columns={["Activity", "Date", "Points", "Balance After"]} />
            <tbody>
              {paged.map((t, i) => (
                <tr key={t.txn_id ?? i} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex size-9 items-center justify-center rounded-full ${
                          t.points > 0 ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {t.points > 0 ? <Plus className="size-4" /> : <Minus className="size-4" />}
                      </span>
                      <p className="font-semibold">{humanize(t.activity)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtDateTime(t.created_at)}</td>
                  <td className={`px-4 py-4 font-semibold ${t.points > 0 ? "text-success" : "text-destructive"}`}>
                    {t.points > 0 ? "+" : "−"}
                    {fmtPoints(Math.abs(t.points))}
                  </td>
                  <td className="px-4 py-4">{fmtPoints(t.running_total)}</td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
          <TablePagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            from={(page - 1) * PAGE_SIZE + 1}
            to={Math.min(page * PAGE_SIZE, filtered.length)}
            total={filtered.length}
            itemLabel="entries"
          />
        </TableCard>
      )}
    </PageShell>
  );
}
