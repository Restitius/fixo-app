import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MapPinned, Plus } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { fmtMoney } from "@/lib/format";
import { serviceAreas } from "@/lib/mock-data";

const title = "Service Areas — FIXO Provider";
const description = "Define the districts you cover, travel radius and travel fees so you only get matched to reachable jobs.";

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

function ServiceAreasPage() {
  const [areas, setAreas] = useState(serviceAreas);

  return (
    <ProviderPage title="Service areas" subtitle="Only jobs inside your active areas are matched to you.">
      <div className="mt-6 grid gap-4 pb-6 lg:grid-cols-[1fr_340px]">
        <Panel
          title="Covered areas"
          action={
            <button className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              <Plus className="size-4" /> Add area
            </button>
          }
        >
          <div className="space-y-3">
            {areas.map((a, i) => (
              <div key={a.area} className="flex flex-wrap items-center gap-4 rounded-2xl bg-muted/50 p-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MapPinned className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{a.area}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.region} · {a.radiusKm} km radius · travel fee {a.travelFee ? fmtMoney(a.travelFee) : "Free"}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={a.active}
                    onChange={() => setAreas((prev) => prev.map((p, pi) => (pi === i ? { ...p, active: !p.active } : p)))}
                    className="size-4 accent-[var(--primary)]"
                  />
                  {a.active ? "Active" : "Paused"}
                </label>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Base location">
            <p className="text-sm font-semibold">Mikocheni, Kinondoni</p>
            <p className="text-xs text-muted-foreground">Dar es Salaam, Tanzania</p>
            <div className="mt-4 flex h-40 items-center justify-center rounded-2xl bg-primary/5 text-sm text-muted-foreground">
              Coverage map preview
            </div>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs text-muted-foreground">Maximum travel distance (km)</span>
              <input
                type="number"
                defaultValue={25}
                className="h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </label>
          </Panel>

          <Panel title="Matching impact">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{areas.filter((a) => a.active).length} active areas</li>
              <li>Estimated reach: 480,000 households</li>
              <li>Wider coverage improves your match rate but increases travel time</li>
            </ul>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}
