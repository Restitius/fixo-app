// Service Areas — wired to the real backend.
// Real model (provider_area_service.py): two kinds of coverage entry —
// LOCATION (country/region/city/district/ward/neighborhood) or RADIUS
// (center lat/lng + radius_km) — plus a separate travel policy (base
// location, max travel distance, travel fee, free travel radius).
// Dropped from the old mock: per-area travel fee/active-radius (those live
// only on the single shared travel-policy row, not per area) and the
// fabricated "Estimated reach: 480,000 households" + coverage-map preview
// (no backend field for either).
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, MapPinned, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { onboardingApi, type AreaSettings, type ServiceArea } from "@/lib/api-client";

const title = "Service Areas — FIXO Provider";
const description = "Define the areas you cover and your travel policy so you only get matched to reachable jobs.";

export const Route = createFileRoute("/service-areas")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ServiceAreasPage,
});

const field = "h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30";

function ServiceAreasPage() {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [settings, setSettings] = useState<Partial<AreaSettings>>({ currency: "TZS" });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  function load() {
    return Promise.all([onboardingApi.listAreas(), onboardingApi.getAreaSettings().catch(() => null)]).then(
      ([a, s]) => {
        setAreas(a);
        if (s) setSettings(s);
      },
    );
  }

  useEffect(() => {
    load()
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load service areas."))
      .finally(() => setLoading(false));
  }, []);

  async function toggleActive(area: ServiceArea) {
    try {
      const updated = await onboardingApi.updateArea(area.area_id, { is_active: !area.is_active });
      setAreas((prev) => prev.map((a) => (a.area_id === area.area_id ? updated : a)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update area.");
    }
  }

  async function remove(areaId: string) {
    try {
      await onboardingApi.removeArea(areaId);
      setAreas((prev) => prev.filter((a) => a.area_id !== areaId));
      toast.success("Area removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove area.");
    }
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      const saved = await onboardingApi.saveAreaSettings(settings);
      setSettings(saved);
      toast.success("Travel policy saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save travel policy.");
    } finally {
      setSavingSettings(false);
    }
  }

  function describeArea(a: ServiceArea): string {
    if (a.area_type === "RADIUS") {
      return `Within ${a.radius_km ?? "—"} km of a point`;
    }
    return [a.district, a.city, a.region, a.country].filter(Boolean).join(", ") || "—";
  }

  if (loading) {
    return (
      <ProviderPage title="Service areas" subtitle="Only jobs inside your active areas are matched to you.">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </ProviderPage>
    );
  }

  return (
    <ProviderPage title="Service areas" subtitle="Only jobs inside your active areas are matched to you.">
      <div className="mt-6 grid gap-4 pb-6 lg:grid-cols-[1fr_340px]">
        <Panel
          title="Covered areas"
          action={
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              <Plus className="size-4" /> Add area
            </button>
          }
        >
          {areas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No service areas yet. Add one to start receiving matched requests.</p>
          ) : (
            <div className="space-y-3">
              {areas.map((a) => (
                <div key={a.area_id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-muted/50 p-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <MapPinned className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{a.label || describeArea(a)}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.area_type === "RADIUS" ? "Radius" : "Location"} · {describeArea(a)}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold">
                    <input type="checkbox" checked={a.is_active} onChange={() => toggleActive(a)} className="size-4 accent-[var(--primary)]" />
                    {a.is_active ? "Active" : "Paused"}
                  </label>
                  <button onClick={() => remove(a.area_id)} className="text-xs font-semibold text-destructive hover:underline">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Travel policy">
            <div className="grid gap-3">
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Base latitude</span>
                <input
                  type="number"
                  className={field}
                  value={settings.base_latitude ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, base_latitude: e.target.value === "" ? undefined : Number(e.target.value) }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Base longitude</span>
                <input
                  type="number"
                  className={field}
                  value={settings.base_longitude ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, base_longitude: e.target.value === "" ? undefined : Number(e.target.value) }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Maximum travel distance (km)</span>
                <input
                  type="number"
                  className={field}
                  value={settings.max_travel_km ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, max_travel_km: e.target.value === "" ? undefined : Number(e.target.value) }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Free travel radius (km)</span>
                <input
                  type="number"
                  className={field}
                  value={settings.free_travel_radius_km ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, free_travel_radius_km: e.target.value === "" ? undefined : Number(e.target.value) }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Travel fee beyond free radius</span>
                <input
                  type="number"
                  className={field}
                  value={settings.travel_fee ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, travel_fee: e.target.value === "" ? undefined : Number(e.target.value) }))}
                />
              </label>
            </div>
            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              {savingSettings ? "Saving…" : "Save travel policy"}
            </button>
          </Panel>

          <Panel title="Matching impact">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{areas.filter((a) => a.is_active).length} active area(s)</li>
              <li>Wider coverage improves your match rate but increases travel time</li>
            </ul>
          </Panel>
        </div>
      </div>

      {showAdd && (
        <AddAreaModal
          onClose={() => setShowAdd(false)}
          onSaved={async () => {
            setShowAdd(false);
            await load();
          }}
        />
      )}
    </ProviderPage>
  );
}

function AddAreaModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [areaType, setAreaType] = useState<"LOCATION" | "RADIUS">("LOCATION");
  const [label, setLabel] = useState("");
  const [country, setCountry] = useState("Tanzania");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [centerLat, setCenterLat] = useState("");
  const [centerLng, setCenterLng] = useState("");
  const [radiusKm, setRadiusKm] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (areaType === "LOCATION" && !country && !region && !city) {
      toast.error("Provide at least a country, region or city.");
      return;
    }
    if (areaType === "RADIUS" && (!centerLat || !centerLng || !radiusKm)) {
      toast.error("Radius areas require a center point and a radius.");
      return;
    }
    setSaving(true);
    try {
      await onboardingApi.addArea({
        area_type: areaType,
        label: label || undefined,
        ...(areaType === "LOCATION"
          ? { country: country || undefined, region: region || undefined, city: city || undefined, district: district || undefined }
          : {
              center_latitude: Number(centerLat),
              center_longitude: Number(centerLng),
              radius_km: Number(radiusKm),
            }),
      });
      toast.success("Area added.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add area.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Add service area</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs text-muted-foreground">Type</span>
          <select className={field} value={areaType} onChange={(e) => setAreaType(e.target.value as "LOCATION" | "RADIUS")}>
            <option value="LOCATION">Location (region/city/district)</option>
            <option value="RADIUS">Radius (around a point)</option>
          </select>
        </label>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs text-muted-foreground">Label (optional)</span>
          <input className={field} value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>

        {areaType === "LOCATION" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Country</span>
              <input className={field} value={country} onChange={(e) => setCountry(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Region</span>
              <input className={field} value={region} onChange={(e) => setRegion(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">City</span>
              <input className={field} value={city} onChange={(e) => setCity(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">District</span>
              <input className={field} value={district} onChange={(e) => setDistrict(e.target.value)} />
            </label>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Center latitude</span>
              <input type="number" className={field} value={centerLat} onChange={(e) => setCenterLat(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Center longitude</span>
              <input type="number" className={field} value={centerLng} onChange={(e) => setCenterLng(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted-foreground">Radius (km)</span>
              <input type="number" className={field} value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} />
            </label>
          </div>
        )}

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
            {saving ? "Saving…" : "Add area"}
          </button>
        </div>
      </div>
    </div>
  );
}
