// Pricing — wired to the real backend.
// Real model: one structured pricing row per CONFIGURED service, one of five
// mutually-exclusive shapes (enforced server-side in provider_pricing_service.py):
//   FIXED (base_amount) | STARTING (from_amount) | HOURLY (hourly_rate [+ minimum_hours])
//   | INSPECTION_THEN_QUOTE (optional inspection_fee) | CUSTOM_QUOTATION (no amounts).
// Dropped from the old mock: callout/emergency/weekend/after-hours surcharges,
// travel-fee-per-km, and the commission-tier table — none of these fields exist
// anywhere in the real pricing or services schema. Commission rate itself isn't
// exposed by any provider-facing endpoint either, so the "commission example"
// panel is gone rather than showing a fabricated percentage.
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Tags } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fmtMoney } from "@/lib/format";
import {
  onboardingApi,
  type ProviderServiceConfig,
  type ProviderServicePricing,
} from "@/lib/api-client";

const title = "Pricing — FIXO Provider";
const description = "Set structured pricing for each of your configured services.";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PricingPage,
});

const PRICING_MODELS = [
  { code: "FIXED", label: "Fixed price" },
  { code: "STARTING", label: "Starting from" },
  { code: "HOURLY", label: "Hourly rate" },
  { code: "INSPECTION_THEN_QUOTE", label: "Inspection, then quote" },
  { code: "CUSTOM_QUOTATION", label: "Custom quotation only" },
] as const;

const field = "h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30";

type Draft = Partial<ProviderServicePricing>;

function PricingPage() {
  const [services, setServices] = useState<ProviderServiceConfig[]>([]);
  const [pricing, setPricing] = useState<Record<string, ProviderServicePricing>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([onboardingApi.myServices(), onboardingApi.listPricing()])
      .then(([svcs, prices]) => {
        setServices(svcs);
        const byId: Record<string, ProviderServicePricing> = {};
        for (const p of prices) byId[p.service_id] = p;
        setPricing(byId);
        const initialDrafts: Record<string, Draft> = {};
        const validModels: readonly string[] = PRICING_MODELS.map((m) => m.code);
        for (const s of svcs) {
          initialDrafts[s.service_id] = byId[s.service_id] ?? {
            // s.pricing_model is the coarse FIXED/HOURLY/QUOTED config-level field
            // (a different, 3-value enum from this endpoint's 5 structured models) —
            // only reuse it when it happens to also be a valid structured model code.
            pricing_model: validModels.includes(s.pricing_model) ? s.pricing_model : "CUSTOM_QUOTATION",
            currency: "TZS",
            is_negotiable: false,
          };
        }
        setDrafts(initialDrafts);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load pricing."))
      .finally(() => setLoading(false));
  }, []);

  function updateDraft(serviceId: string, patch: Draft) {
    setDrafts((d) => ({ ...d, [serviceId]: { ...d[serviceId], ...patch } }));
  }

  async function save(serviceId: string) {
    const draft = drafts[serviceId];
    if (!draft?.pricing_model) return;
    setSavingId(serviceId);
    try {
      const saved = await onboardingApi.upsertPricing(serviceId, draft);
      setPricing((p) => ({ ...p, [serviceId]: saved }));
      toast.success("Pricing saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save pricing.");
    } finally {
      setSavingId(null);
    }
  }

  const priced = services.filter((s) => pricing[s.service_id]).length;

  if (loading) {
    return (
      <ProviderPage title="Pricing" subtitle="Set structured pricing for each of your configured services.">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </ProviderPage>
    );
  }

  return (
    <ProviderPage title="Pricing" subtitle="Set structured pricing for each of your configured services.">
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <MetricCard icon={Tags} label="Configured services" value={String(services.length)} hint="From Services" />
        <MetricCard icon={Tags} label="Priced services" value={`${priced}/${services.length}`} hint="Have pricing set" tone="success" tintValue />
      </div>

      <div className="mt-4 pb-6">
        <Panel title="Service pricing">
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven't configured any services yet. Add services on the Services page first.
            </p>
          ) : (
            <div className="space-y-4">
              {services.map((s) => {
                const draft = drafts[s.service_id] ?? {};
                const model = draft.pricing_model ?? "CUSTOM_QUOTATION";
                const existing = pricing[s.service_id];
                return (
                  <div key={s.service_id} className="rounded-2xl bg-muted/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{s.display_name || s.service_id}</p>
                        {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                      </div>
                      {existing && <StatusPill status="PRICED" />}
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-xs text-muted-foreground">Pricing model</span>
                        <select
                          className={field}
                          value={model}
                          onChange={(e) => updateDraft(s.service_id, { pricing_model: e.target.value })}
                        >
                          {PRICING_MODELS.map((m) => (
                            <option key={m.code} value={m.code}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      {model === "FIXED" && (
                        <AmountField label="Price" value={draft.base_amount} onChange={(v) => updateDraft(s.service_id, { base_amount: v })} />
                      )}
                      {model === "STARTING" && (
                        <AmountField label="Starting from" value={draft.from_amount} onChange={(v) => updateDraft(s.service_id, { from_amount: v })} />
                      )}
                      {model === "HOURLY" && (
                        <>
                          <AmountField label="Hourly rate" value={draft.hourly_rate} onChange={(v) => updateDraft(s.service_id, { hourly_rate: v })} />
                          <AmountField
                            label="Minimum hours (optional)"
                            value={draft.minimum_hours}
                            onChange={(v) => updateDraft(s.service_id, { minimum_hours: v })}
                          />
                        </>
                      )}
                      {model === "INSPECTION_THEN_QUOTE" && (
                        <AmountField
                          label="Inspection fee (optional)"
                          value={draft.inspection_fee}
                          onChange={(v) => updateDraft(s.service_id, { inspection_fee: v })}
                        />
                      )}
                    </div>

                    <label className="mt-3 block">
                      <span className="mb-1 block text-xs text-muted-foreground">What's included (optional)</span>
                      <input
                        className={field}
                        value={draft.includes_text ?? ""}
                        onChange={(e) => updateDraft(s.service_id, { includes_text: e.target.value })}
                      />
                    </label>

                    <label className="mt-3 flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={draft.is_negotiable ?? false}
                        onChange={(e) => updateDraft(s.service_id, { is_negotiable: e.target.checked })}
                      />
                      Price is negotiable
                    </label>

                    {existing?.base_amount != null && (
                      <p className="mt-2 text-xs text-muted-foreground">Currently: {fmtMoney(existing.base_amount)}</p>
                    )}

                    <button
                      onClick={() => save(s.service_id)}
                      disabled={savingId === s.service_id}
                      className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                      style={{ backgroundImage: "var(--gradient-primary)" }}
                    >
                      {savingId === s.service_id ? "Saving…" : "Save pricing"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </ProviderPage>
  );
}

function AmountField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <input
        className={field}
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    </label>
  );
}
