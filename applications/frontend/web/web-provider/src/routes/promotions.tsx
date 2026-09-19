import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Tag } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fmtDate, fmtMoney } from "@/lib/format";
import { promotionsApi, type DiscountType, type Promotion } from "@/lib/api-client";

const title = "Promotions — FIXO Provider";
const description = "Create and manage your own discount codes.";

export const Route = createFileRoute("/promotions")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PromotionsPage,
});

function PromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  function load() {
    return promotionsApi.list(undefined, 50, 0).then(setPromos);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function deactivate(p: Promotion) {
    if (!confirm(`Deactivate promo code "${p.code}"?`)) return;
    try {
      await promotionsApi.deactivate(p.promo_id);
      await load();
      toast.success("Promotion deactivated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not deactivate.");
    }
  }

  return (
    <ProviderPage title="Promotions" subtitle="Discount codes customers can redeem on your services.">
      <Panel
        title="Your promotions"
        className="mt-6"
        action={
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            <Plus className="size-4" /> Create code
          </button>
        }
      >
        {!loading && promos.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No promotion codes yet.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {promos.map((p) => (
            <div key={p.promo_id} className="rounded-2xl bg-muted/50 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Tag className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{p.code}</p>
                    <p className="text-xs text-muted-foreground">{p.name}</p>
                  </div>
                </div>
                <StatusPill tone={p.active ? "success" : "muted"} label={p.active ? "Active" : "Inactive"} />
              </div>
              <p className="mt-2 text-sm font-semibold text-primary">{p.discount_type === "PERCENT" ? `${p.discount_value}% off` : fmtMoney(p.discount_value)}</p>
              <p className="text-xs text-muted-foreground">
                Min {fmtMoney(p.min_amount)} · {p.used_count} used{p.usage_limit ? ` of ${p.usage_limit}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {fmtDate(p.valid_from)} – {fmtDate(p.valid_until)}
              </p>
              {p.active && (
                <button onClick={() => void deactivate(p)} className="mt-2 text-xs font-semibold text-destructive hover:underline">
                  Deactivate
                </button>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {creating && (
        <CreateModal
          onClose={() => setCreating(false)}
          onSaved={async () => {
            setCreating(false);
            await load();
          }}
        />
      )}
    </ProviderPage>
  );
}

function toDateTimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CreateModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const now = new Date();
  const inAMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENT");
  const [discountValue, setDiscountValue] = useState("10");
  const [minAmount, setMinAmount] = useState("0");
  const [validFrom, setValidFrom] = useState(toDateTimeLocal(now));
  const [validUntil, setValidUntil] = useState(toDateTimeLocal(inAMonth));
  const [saving, setSaving] = useState(false);

  async function save() {
    if (code.trim().length < 2 || name.trim().length < 1) {
      toast.error("Code and name are required.");
      return;
    }
    const value = Number(discountValue);
    if (!discountValue || value < 0 || (discountType === "PERCENT" && value > 100)) {
      toast.error(discountType === "PERCENT" ? "Enter a discount between 0 and 100." : "Enter a valid discount value.");
      return;
    }
    setSaving(true);
    try {
      await promotionsApi.create({
        code: code.trim(),
        name: name.trim(),
        discount_type: discountType,
        discount_value: value,
        min_amount: Number(minAmount) || 0,
        valid_from: new Date(validFrom).toISOString(),
        valid_until: new Date(validUntil).toISOString(),
      });
      toast.success("Promotion created.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create promotion.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">Create promotion</h2>
        <div className="mt-4 space-y-3">
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Code (e.g. SAVE10)" className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          <div className="grid grid-cols-2 gap-3">
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value as DiscountType)} className="h-11 rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30">
              <option value="PERCENT">Percent</option>
              <option value="FIXED_AMOUNT">Fixed amount</option>
            </select>
            <input value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} type="number" placeholder="Discount value" className="h-11 rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          </div>
          <input value={minAmount} onChange={(e) => setMinAmount(e.target.value)} type="number" placeholder="Minimum order amount" className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">Valid from</span>
              <input type="datetime-local" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Valid until</span>
              <input type="datetime-local" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
            </label>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted">
            Cancel
          </button>
          <button onClick={() => void save()} disabled={saving} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50" style={{ backgroundImage: "var(--gradient-primary)" }}>
            {saving ? "Saving…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
