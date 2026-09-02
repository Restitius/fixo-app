// Wallet — balance, ledger, and credit/debit actions.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  FilterX,
  Receipt,
  RefreshCw,
  Wallet as WalletIcon,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TableFilterBar, TableCard, TableScroll, TableHead, TablePagination } from "@/components/dashboard/DataTable";
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

const PAGE_SIZE = 8;

function WalletPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [balance, setBalance] = useState<{ balance: number; currency: string } | null>(null);
  const [txns, setTxns] = useState<WalletTxn[] | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      const [bal, list] = await Promise.all([
        fixoSdk.walletBalance(),
        fixoSdk.walletTransactions(100, 0),
      ]);
      setBalance(bal);
      setTxns(list);
    } catch {
      setTxns((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    if (access_token && !loading) void load();
  }, [access_token, loading, load]);

  const filtered = useMemo(
    () =>
      (txns ?? []).filter((t) => {
        const matchesType = typeFilter === "all" || t.entry_type === typeFilter;
        const matchesSearch = !search || humanize(t.entry_type).toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
      }),
    [txns, typeFilter, search],
  );

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
  const credited = (txns ?? []).filter((t) => t.entry_type === "CREDIT").reduce((s, t) => s + t.amount, 0);
  const debited = (txns ?? []).filter((t) => t.entry_type === "DEBIT").reduce((s, t) => s + t.amount, 0);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const hasActiveFilters = search.trim() !== "" || typeFilter !== "all";

  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
    setPage(1);
  }

  return (
    <PageShell title="Wallet" subtitle="Your service wallet and ledger" userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard icon={WalletIcon} label="Available Balance" hint="Right now" value={balance ? fmtMoney(balance.balance, balance.currency) : "—"} hero />
        <MetricCard icon={ArrowDownLeft} label="Total Credited" hint="All time" value={fmtMoney(credited, currency)} tone="success" />
        <MetricCard icon={ArrowUpRight} label="Total Debited" hint="All time" value={fmtMoney(debited, currency)} tone="destructive" />
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-3xl bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="min-w-[180px] flex-1 space-y-1.5">
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
        <Button disabled={busy} onClick={() => void applyAmount("credit")} className="gap-2">
          <ArrowDownLeft className="size-4" /> Credit
        </Button>
        <Button disabled={busy} variant="outline" onClick={() => void applyAmount("debit")} className="gap-2">
          <ArrowUpRight className="size-4" /> Debit
        </Button>
        <Button variant="ghost" size="icon" onClick={() => void load()} title="Refresh">
          <RefreshCw className="size-4" />
        </Button>
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search transactions..."
        filters={[
          {
            value: typeFilter,
            onChange: (v) => { setTypeFilter(v); setPage(1); },
            placeholder: "Type",
            options: [
              { value: "all", label: "All Types" },
              { value: "CREDIT", label: "Credit" },
              { value: "DEBIT", label: "Debit" },
            ],
          },
        ]}
      />

      {txns === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState icon={FilterX} title="No matching transactions" description="Try adjusting your search or filters." actionLabel="Clear Filters" onAction={clearFilters} />
          ) : (
            <EmptyState icon={Receipt} title="No transactions yet" description="Credits, debits and holds on your wallet will show up here." />
          )}
        </div>
      ) : (
        <TableCard className="grow">
          <TableScroll minWidth={640}>
            <TableHead columns={["Type", "Date", "Amount", "Balance After"]} />
            <tbody>
              {paged.map((t, i) => (
                <tr key={t.entry_id ?? i} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex size-9 items-center justify-center rounded-full ${
                          t.entry_type === "CREDIT" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {t.entry_type === "CREDIT" ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                      </span>
                      <p className="font-semibold">{humanize(t.entry_type)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtDateTime(t.created_at)}</td>
                  <td className={`px-4 py-4 font-semibold ${t.entry_type === "CREDIT" ? "text-success" : "text-destructive"}`}>
                    {t.entry_type === "CREDIT" ? "+" : "−"}
                    {fmtMoney(t.amount, t.currency)}
                  </td>
                  <td className="px-4 py-4">{fmtMoney(t.running_balance, t.currency)}</td>
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
            itemLabel="transactions"
          />
        </TableCard>
      )}
    </PageShell>
  );
}
