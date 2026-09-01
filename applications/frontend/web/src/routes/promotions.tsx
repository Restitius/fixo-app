// Promotions — active offers and code validation.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { BadgePercent, Ticket, CheckCircle2 } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type Promotion, type PromotionValidation } from "@/lib/api-client";
import { fmtDate, fmtMoney, humanize } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/promotions")({
  component: PromotionsPage,
});

function PromotionsPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("40000");
  const [result, setResult] = useState<PromotionValidation | null>(null);
  const [applying, setApplying] = useState(false);

  const load = useCallback(() => {
    void fixoSdk
      .listPromotions(50, 0)
      .then(setPromos)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (access_token && !loading) load();
  }, [access_token, loading, load]);

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

  return (
    <PageShell
      title="Promotions"
      subtitle="Deals and discounts on your next service"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <BadgePercent className="size-5 text-primary" /> Check a code
          </h3>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Promo code</Label>
              <Input
                id="code"
                placeholder="e.g. WELCOME10"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amt">Order amount (TZS)</Label>
              <Input
                id="amt"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={() => void doValidate()}>
              Validate
            </Button>
            {result && (
              <div className="flex items-start gap-3 rounded-2xl bg-success/10 p-4 text-success">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-semibold">{result.name}</p>
                  <p className="text-sm">
                    Save {fmtMoney(result.discount_amount)}
                    {result.discount_type === "PERCENT"
                      ? ` (${result.discount_value}%)`
                      : ""}
                  </p>
                  <Button
                    size="sm"
                    className="mt-2 gap-2"
                    disabled={applying}
                    onClick={() => void doApply(result)}
                  >
                    <Ticket className="size-4" /> Apply code
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold">Active promotions</h3>
          <p className="mb-4 text-sm text-muted-foreground">Currently valid offers.</p>
          {promos.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No active promotions.
            </p>
          ) : (
            <ul className="space-y-3">
              {promos.map((p) => (
                <li
                  key={p.promo_id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {p.name} <span className="text-primary">· {p.code}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {p.discount_type === "PERCENT"
                        ? `${p.discount_value}% off`
                        : fmtMoney(p.discount_value)}{" "}
                      · until {fmtDate(p.valid_until)}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => void doApply(p)}>
                    Use
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageShell>
  );
}
