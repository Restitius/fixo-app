import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Wrench } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableCard, TableFilterBar, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { fmtMoney } from "@/lib/format";
import { serviceCatalog, services } from "@/lib/mock-data";

const title = "My Services — FIXO Provider";
const description = "Manage the service categories you offer, pricing models, durations, warranties and emergency availability.";

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

function ServicesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  const rows = useMemo(
    () =>
      services.filter(
        (s) => (category === "ALL" || s.category === category) && s.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, category],
  );

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
            options: [
              { value: "ALL", label: "All categories" },
              ...[...new Set(services.map((s) => s.category))].map((c) => ({ value: c, label: c })),
            ],
          },
        ]}
        trailing={
          <button
            className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Plus className="size-4" /> Add service
          </button>
        }
      />

      <div className="grid gap-4 pb-6 lg:grid-cols-[1fr_320px]">
        {rows.length === 0 ? (
          <div className="mt-6">
            <EmptyState icon={Wrench} title="No services match" description="Adjust your search or category filter." />
          </div>
        ) : (
          <TableCard>
            <TableScroll minWidth={820}>
              <TableHead columns={["Service", "Category", "Pricing", "Price", "Duration", "Warranty", "Status"]} />
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <p className="font-semibold">{s.name}</p>
                      {s.emergency && <p className="text-xs font-medium text-destructive">Emergency available</p>}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{s.category}</td>
                    <td className="px-4 py-4 text-muted-foreground">{s.pricingModel.charAt(0) + s.pricingModel.slice(1).toLowerCase()}</td>
                    <td className="px-4 py-4 font-semibold text-primary">
                      {s.price ? fmtMoney(s.price) : `From ${fmtMoney(s.minimumCharge)}`}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{s.duration}</td>
                    <td className="px-4 py-4 text-muted-foreground">{s.warranty}</td>
                    <td className="px-4 py-4">
                      <StatusPill status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableScroll>
          </TableCard>
        )}

        <div className="mt-6 space-y-4">
          <Panel title="Available catalogue">
            <div className="space-y-4">
              {serviceCatalog.map((c) => (
                <div key={c.category}>
                  <p className="text-sm font-semibold">{c.category}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {c.items.map((i) => (
                      <span key={i} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Plan limits">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Professional plan: up to 5 categories</li>
              <li>Currently used: 3 categories, 9 services</li>
              <li>New services are reviewed within 24 hours</li>
            </ul>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}
