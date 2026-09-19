// Payouts — wired to the real /providers/me/payouts/* endpoints. The mock
// version's "Payout schedule" panel (instant/weekly/monthly) is dropped:
// the real backend only supports on-demand withdrawal, no scheduling.
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Banknote, Loader2, Plus, Timer } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TableCard, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { fmtMoney } from "@/lib/format";
import { payoutsApi, type PayoutMethod, type PayoutRow } from "@/lib/api-client";

const title = "Payouts — FIXO Provider";
const description = "Withdrawal history, payout methods and settlement status for your FIXO earnings.";

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

const field = "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30";

function PayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [methodType, setMethodType] = useState<"BANK" | "MOBILE_MONEY">("MOBILE_MONEY");
  const [providerName, setProviderName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([payoutsApi.list(), payoutsApi.listMethods()])
      .then(([p, m]) => {
        setPayouts(p);
        setMethods(m);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load payouts."))
      .finally(() => setLoading(false));
  }, []);

  const paid = payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  const processing = payouts.filter((p) => p.status === "PROCESSING").reduce((s, p) => s + p.amount, 0);

  async function addMethod() {
    setSaving(true);
    try {
      const added = await payoutsApi.addMethod({
        method_type: methodType,
        provider_name: providerName || undefined,
        account_holder: accountHolder || undefined,
        account_number: accountNumber || undefined,
        mobile_number: mobileNumber || undefined,
        currency: "TZS",
        is_default: methods.length === 0,
      });
      setMethods((prev) => [...prev, added]);
      setShowAdd(false);
      setProviderName("");
      setAccountHolder("");
      setAccountNumber("");
      setMobileNumber("");
      toast.success("Payout method added.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add payout method.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <ProviderPage title="Payouts" subtitle="Move your cleared balance to your bank or mobile money.">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </ProviderPage>
    );
  }

  return (
    <ProviderPage title="Payouts" subtitle="Move your cleared balance to your bank or mobile money.">
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard icon={Banknote} label="Processing" value={fmtMoney(processing)} hint="Settling now" tone="amber" tintValue />
        <MetricCard icon={Banknote} label="Paid out" value={fmtMoney(paid)} hint="All time" tone="success" tintValue />
        <MetricCard icon={Timer} label="Total payouts" value={String(payouts.length)} hint="Requested" />
      </div>

      <div className="mt-4 grid gap-4 pb-6 lg:grid-cols-[1fr_340px]">
        <TableCard className="mt-0">
          <div className="px-6 pt-5">
            <h2 className="text-base font-bold tracking-tight">Payout history</h2>
          </div>
          <TableScroll minWidth={640}>
            <TableHead columns={["Payout", "Method", "Amount", "Requested", "Status"]} />
            <tbody>
              {payouts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No payouts requested yet.
                  </td>
                </tr>
              )}
              {payouts.map((p) => (
                <tr key={p.payout_id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                  <td className="px-6 py-4 font-semibold">{p.payout_number}</td>
                  <td className="px-4 py-4 text-muted-foreground">{p.destination ?? p.method_type ?? "—"}</td>
                  <td className="px-4 py-4 font-semibold">{fmtMoney(p.amount, p.currency)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{p.requested_at?.slice(0, 10) ?? "—"}</td>
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
              <button onClick={() => setShowAdd((v) => !v)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                <Plus className="size-4" /> Add
              </button>
            }
          >
            <div className="space-y-3">
              {methods.length === 0 && <p className="text-sm text-muted-foreground">No payout methods yet.</p>}
              {methods.map((m) => (
                <div key={m.method_id} className="rounded-2xl bg-muted/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{m.method_type}</p>
                    {m.is_default && <StatusPill tone="success" label="Default" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{m.mobile_number || m.account_number || m.provider_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.account_holder ?? m.provider_name} · {m.currency}
                  </p>
                </div>
              ))}
            </div>

            {showAdd && (
              <div className="mt-4 space-y-2 rounded-2xl border border-border p-3">
                <select value={methodType} onChange={(e) => setMethodType(e.target.value as "BANK" | "MOBILE_MONEY")} className={field}>
                  <option value="MOBILE_MONEY">Mobile money</option>
                  <option value="BANK">Bank account</option>
                </select>
                {methodType === "MOBILE_MONEY" ? (
                  <>
                    <input className={field} placeholder="Provider (M-Pesa, Tigo Pesa…)" value={providerName} onChange={(e) => setProviderName(e.target.value)} />
                    <input className={field} placeholder="Mobile number" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                  </>
                ) : (
                  <>
                    <input className={field} placeholder="Account holder" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
                    <input className={field} placeholder="Bank name" value={providerName} onChange={(e) => setProviderName(e.target.value)} />
                    <input className={field} placeholder="Account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                  </>
                )}
                <button
                  onClick={addMethod}
                  disabled={saving}
                  className="w-full rounded-xl py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  {saving ? "Saving…" : "Save method"}
                </button>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}
