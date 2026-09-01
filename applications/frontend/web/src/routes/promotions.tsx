// Promotions — active offers and code validation.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { BadgePercent, FilterX, Ticket, CheckCircle2 } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableFilterBar, TableCard, TableScroll, TableHead, TablePagination } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type Promotion, type PromotionValidation } from "@/lib/api-client";
import { fmtDate, fmtMoney } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/promotions")({
  component: PromotionsPage,
});

const PAGE_SIZE = 8;

function PromotionsPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [promos, setPromos] = useState<Promotion[] | null>(null);
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("40000");
  const [result, setResult] = useState<PromotionValidation | null>(null);
  const [applying, setApplying] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    void fixoSdk
      .listPromotions(50, 0)
      .then(setPromos)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (access_token && !loading) load();
  }, [access_token, loading, load]);

  const filtered = useMemo(
    () =>
      (promos ?? []).filter((p) => {
        const matchesType = typeFilter === "all" || p.discount_type === typeFilter;
        const matchesSearch = !search || [p.name, p.code].some((f) => f.toLowerCase().includes(search.toLowerCase()));
        return matchesType && matchesSearch;
      }),
    [promos, typeFilter, search],
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const doValidate = async () => {
    if (!code.trim()) {
      toast.error("Enter a promotion code");
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter an order amount");
      return;
    }
    try {
      const res = await fixoSdk.validatePromotion(code.trim(), amt);
      setResult(res);
      toast.success(`${res.code} applies — save ${fmtMoney(res.discount_amount)}`);
    } catch {
      setResult(null);
    }
  };

  const doApply = async (p: Promotion) => {
    setApplying(true);
    try {
      await fixoSdk.usePromotion(p.promo_id);
      toast.success(`${p.code} applied`);
      setResult(null);
      setCode("");
      load();
    } catch {
      // toast emitted by client
    } finally {
      setApplying(false);
    }
  };

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const hasActiveFilters = search.trim() !== "" || typeFilter !== "all";

  return (
    <PageShell
      title="Promotions"
      subtitle="Deals and discounts on your next service"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <BadgePercent className="size-5 text-primary" /> Check a code
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="code">Promo code</Label>
            <Input id="code" placeholder="e.g. WELCOME10" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amt">Order amount (TZS)</Label>
            <Input id="amt" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <Button onClick={() => void doValidate()}>Validate</Button>
        </div>
        {result && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-success/10 p-4 text-success">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">{result.name}</p>
              <p className="text-sm">
                Save {fmtMoney(result.discount_amount)}
                {result.discount_type === "PERCENT" ? ` (${result.discount_value}%)` : ""}
              </p>
              <Button size="sm" className="mt-2 gap-2" disabled={applying} onClick={() => void doApply(result)}>
                <Ticket className="size-4" /> Apply code
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold">Active promotions</h3>
        <p className="text-sm text-muted-foreground">Currently valid offers.</p>
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search promotions..."
        filters={[
          {
            value: typeFilter,
            onChange: (v) => { setTypeFilter(v); setPage(1); },
            placeholder: "Discount Type",
            options: [
              { value: "all", label: "All Types" },
              { value: "PERCENT", label: "Percent" },
              { value: "FIXED", label: "Fixed" },
            ],
          },
        ]}
      />

      {promos === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState icon={FilterX} title="No matching promotions" description="Try adjusting your search or filters." actionLabel="Clear Filters" onAction={() => { setSearch(""); setTypeFilter("all"); }} />
          ) : (
            <EmptyState icon={Ticket} title="No active promotions" description="Check back soon — new deals and discounts show up here." />
          )}
        </div>
      ) : (
        <TableCard>
          <TableScroll minWidth={680}>
            <TableHead columns={["Code", "Name", "Discount", "Valid Until", "Action"]} />
            <tbody>
              {paged.map((p) => (
                <tr key={p.promo_id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-6 py-4 font-semibold text-primary">{p.code}</td>
                  <td className="px-4 py-4">{p.name}</td>
                  <td className="px-4 py-4">{p.discount_type === "PERCENT" ? `${p.discount_value}% off` : fmtMoney(p.discount_value)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtDate(p.valid_until)}</td>
                  <td className="px-4 py-4">
                    <Button size="sm" variant="outline" disabled={applying} onClick={() => void doApply(p)}>
                      Use
                    </Button>
                  </td>
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
            itemLabel="promotions"
          />
        </TableCard>
      )}
    </PageShell>
  );
}
