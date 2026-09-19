// My Services — wired to the real backend.
// Real model (provider_service_config_service.py): the provider picks a
// catalogue service, then fully configures it (display name, description,
// years experience, a coarse pricing_model of FIXED/HOURLY/QUOTED +
// minimum_charge when FIXED, duration, emergency availability). Any edit
// resets the lifecycle to DRAFT; DRAFT/REJECTED can be submitted for
// platform APPROVED/PENDING_APPROVAL/REJECTED review. Structured per-model
// pricing (the 5-option FIXED/STARTING/HOURLY/INSPECTION_THEN_QUOTE/
// CUSTOM_QUOTATION system) lives on the separate Pricing page.
// Dropped from the old mock: "tools/materials/warranty" free-text summary
// columns and the fabricated "Plan limits" panel (no such backend concept).
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Plus, Wrench, X } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableCard, TableFilterBar, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { fmtMoney } from "@/lib/format";
import { onboardingApi, type CatalogServiceOption, type ProviderServiceConfig } from "@/lib/api-client";

const title = "My Services — FIXO Provider";
const description = "Manage the service categories you offer, pricing models, durations and emergency availability.";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ServicesPage,
});

const inputCls = "h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30";

function ServicesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [configured, setConfigured] = useState<ProviderServiceConfig[]>([]);
  const [catalog, setCatalog] = useState<CatalogServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState<CatalogServiceOption | null>(null);

  function load() {
    return Promise.all([onboardingApi.myServices(), onboardingApi.serviceCatalog()]).then(([cfg, cat]) => {
      setConfigured(cfg);
      setCatalog(cat);
    });
  }

  useEffect(() => {
    load()
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load services."))
      .finally(() => setLoading(false));
  }, []);

  const configuredIds = useMemo(() => new Set(configured.map((s) => s.service_id)), [configured]);
  const categories = useMemo(() => [...new Set(catalog.map((c) => c.category_name))], [catalog]);

  const rows = useMemo(
    () =>
      configured.filter(
        (s) =>
          (category === "ALL" || s.category_name === category) &&
          (s.display_name ?? s.service_name ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
    [configured, search, category],
  );

  async function archive(serviceId: string) {
    if (!confirm("Remove this service? Customers will no longer see it.")) return;
    try {
      await onboardingApi.removeService(serviceId);
      toast.success("Service removed.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove service.");
    }
  }

  async function submit(serviceId: string) {
    try {
      await onboardingApi.submitService(serviceId);
      toast.success("Submitted for approval.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit for approval.");
    }
  }

  if (loading) {
    return (
      <ProviderPage title="My services" subtitle="What you offer, how you price it, and what customers can book.">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </ProviderPage>
    );
  }

  return (
    <ProviderPage title="My services" subtitle="What you offer, how you price it, and what customers can book.">
      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search services..."
        filters={[
          {
            value: category,
            onChange: setCategory,
            placeholder: "Category",
            options: [{ value: "ALL", label: "All categories" }, ...categories.map((c) => ({ value: c, label: c }))],
          },
        ]}
        trailing={
          <button
            onClick={() => setPicker(catalog.find((c) => !configuredIds.has(c.service_id)) ?? null)}
            disabled={catalog.every((c) => configuredIds.has(c.service_id))}
            className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Plus className="size-4" /> Add service
          </button>
        }
      />

      <div className="grid gap-4 pb-6 lg:grid-cols-[1fr_320px]">
        {rows.length === 0 ? (
          <div className="mt-6">
            <EmptyState icon={Wrench} title="No services yet" description="Add a service from the catalogue to start receiving requests." />
          </div>
        ) : (
          <TableCard>
            <TableScroll minWidth={820}>
              <TableHead columns={["Service", "Category", "Pricing", "Amount", "Duration", "Status", ""]} />
              <tbody>
                {rows.map((s) => (
                  <tr key={s.service_id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <p className="font-semibold">{s.display_name || s.service_name}</p>
                      {s.is_emergency_available && <p className="text-xs font-medium text-destructive">Emergency available</p>}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{s.category_name ?? "—"}</td>
                    <td className="px-4 py-4 text-muted-foreground">{s.pricing_model}</td>
                    <td className="px-4 py-4 font-semibold text-primary">
                      {s.minimum_charge ? fmtMoney(s.minimum_charge) : "—"}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{s.duration_minutes ? `${s.duration_minutes} min` : "—"}</td>
                    <td className="px-4 py-4">
                      <StatusPill status={s.status ?? "DRAFT"} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {(s.status === "DRAFT" || s.status === "REJECTED") && (
                          <button onClick={() => submit(s.service_id)} className="text-xs font-semibold text-primary hover:underline">
                            Submit
                          </button>
                        )}
                        <button onClick={() => archive(s.service_id)} className="text-xs font-semibold text-destructive hover:underline">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableScroll>
          </TableCard>
        )}

        <div className="mt-6 space-y-4">
          <Panel title="Available catalogue">
            <div className="space-y-2">
              {catalog
                .filter((c) => !configuredIds.has(c.service_id))
                .map((c) => (
                  <button
                    key={c.service_id}
                    onClick={() => setPicker(c)}
                    className="flex w-full items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2.5 text-left text-sm hover:bg-muted"
                  >
                    <span>
                      <span className="font-medium">{c.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{c.category_name}</span>
                    </span>
                    <Plus className="size-4 text-muted-foreground" />
                  </button>
                ))}
              {catalog.every((c) => configuredIds.has(c.service_id)) && (
                <p className="text-sm text-muted-foreground">You've configured every service in the catalogue.</p>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {picker && (
        <ConfigureModal
          option={picker}
          onClose={() => setPicker(null)}
          onSaved={async () => {
            setPicker(null);
            await load();
          }}
        />
      )}
    </ProviderPage>
  );
}

function ConfigureModal({
  option,
  onClose,
  onSaved,
}: {
  option: CatalogServiceOption;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pricingModel, setPricingModel] = useState<"FIXED" | "HOURLY" | "QUOTED">("QUOTED");
  const [minimumCharge, setMinimumCharge] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [description, setDescription] = useState(option.description ?? "");
  const [emergency, setEmergency] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (pricingModel === "FIXED" && (!minimumCharge || Number(minimumCharge) <= 0)) {
      toast.error("Minimum charge is required for fixed pricing.");
      return;
    }
    setSaving(true);
    try {
      await onboardingApi.configureService(option.service_id, {
        display_name: option.name,
        description: description || undefined,
        years_experience: yearsExperience ? Number(yearsExperience) : undefined,
        pricing_model: pricingModel,
        minimum_charge: pricingModel === "FIXED" ? Number(minimumCharge) : undefined,
        duration_minutes: durationMinutes ? Number(durationMinutes) : undefined,
        is_emergency_available: emergency,
      });
      toast.success("Service added.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add service.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{option.name}</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{option.category_name}</p>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs text-muted-foreground">Description (optional)</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-xl border border-input bg-card p-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
        </label>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Pricing model</span>
            <select className={inputCls} value={pricingModel} onChange={(e) => setPricingModel(e.target.value as "FIXED" | "HOURLY" | "QUOTED")}>
              <option value="QUOTED">Quoted per job</option>
              <option value="FIXED">Fixed</option>
              <option value="HOURLY">Hourly</option>
            </select>
          </label>
          {pricingModel === "FIXED" && (
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Minimum charge</span>
              <input type="number" className={inputCls} value={minimumCharge} onChange={(e) => setMinimumCharge(e.target.value)} />
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Duration (minutes, optional)</span>
            <input type="number" className={inputCls} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Years of experience (optional)</span>
            <input type="number" className={inputCls} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} />
          </label>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} />
          Available for emergency requests
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {saving ? "Saving…" : "Add service"}
          </button>
        </div>
      </div>
    </div>
  );
}
