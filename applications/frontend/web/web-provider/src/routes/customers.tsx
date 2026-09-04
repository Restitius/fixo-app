import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Repeat, Users } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TableCard, TableFilterBar, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { fmtDate, fmtMoney } from "@/lib/format";
import { customers, performance } from "@/lib/mock-data";

const title = "Customers — FIXO Provider";
const description = "Recurring customers, business accounts, service history and scheduled maintenance visits.";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");

  const rows = useMemo(
    () =>
      customers.filter(
        (c) => (type === "ALL" || c.type === type) && c.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, type],
  );

  const businessCount = customers.filter((c) => c.type === "Business").length;
  const revenue = customers.reduce((s, c) => s + c.revenue, 0);

  return (
    <ProviderPage title="Customers" subtitle="Your recurring and business relationships.">
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard icon={Users} label="Total customers" value={String(customers.length)} hint={`${businessCount} business accounts`} />
        <MetricCard icon={Repeat} label="Repeat rate" value={`${performance.repeatCustomers}%`} hint="Customers who rebooked" tone="success" tintValue />
        <MetricCard icon={Users} label="Lifetime revenue" value={fmtMoney(revenue)} hint="Across all customers" />
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customers..."
        filters={[
          {
            value: type,
            onChange: setType,
            placeholder: "Type",
            options: [
              { value: "ALL", label: "All types" },
              { value: "Business", label: "Business" },
              { value: "Residential", label: "Residential" },
            ],
          },
        ]}
      />

      <div className="grid gap-4 pb-6 lg:grid-cols-[1fr_320px]">
        <TableCard>
          <TableScroll minWidth={800}>
            <TableHead columns={["Customer", "Type", "Jobs", "Last service", "Next visit", "Revenue"]} />
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.frequency}</p>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{c.type}</td>
                  <td className="px-4 py-4">{c.jobs}</td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtDate(c.lastService)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{c.nextVisit === "—" ? "—" : fmtDate(c.nextVisit)}</td>
                  <td className="px-4 py-4 font-semibold text-primary">{fmtMoney(c.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
        </TableCard>

        <div className="mt-6 space-y-4">
          <Panel title="Maintenance contracts">
            <div className="space-y-3">
              {customers
                .filter((c) => c.nextVisit !== "—")
                .map((c) => (
                  <div key={c.id} className="rounded-2xl bg-muted/50 p-4">
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.frequency} · next {fmtDate(c.nextVisit)}
                    </p>
                  </div>
                ))}
            </div>
          </Panel>

          <Panel title="Business account tools">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Bulk booking and multi-site jobs</li>
              <li>Consolidated monthly invoicing</li>
              <li>Negotiated contract rates</li>
              <li>Dedicated purchase-order references</li>
            </ul>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}
