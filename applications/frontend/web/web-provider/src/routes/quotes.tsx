import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Plus } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TableCard, TableFilterBar, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { fmtDate, fmtMoney } from "@/lib/format";
import { quotes } from "@/lib/mock-data";

const title = "Quotations — FIXO Provider";
const description = "Build, send and track quotations with labour, materials, transport, tax and discount breakdowns.";

export const Route = createFileRoute("/quotes")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: QuotesPage,
});

function QuotesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selectedId, setSelectedId] = useState(quotes[0]?.id ?? "");

  const rows = useMemo(
    () =>
      quotes.filter(
        (q) =>
          (status === "ALL" || q.status === status) &&
          `${q.id} ${q.customer} ${q.service}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, status],
  );

  const selected = quotes.find((q) => q.id === selectedId) ?? quotes[0];

  return (
    <ProviderPage title="Quotations" subtitle="Every quote you have drafted, sent or closed.">
      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by quote, customer or service..."
        filters={[
          {
            value: status,
            onChange: setStatus,
            placeholder: "Status",
            options: [
              { value: "ALL", label: "All statuses" },
              ...["DRAFT", "SUBMITTED", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED", "WITHDRAWN"].map((s) => ({
                value: s,
                label: s.charAt(0) + s.slice(1).toLowerCase(),
              })),
            ],
          },
        ]}
        trailing={
          <button
            className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Plus className="size-4" /> New quote
          </button>
        }
      />

      <div className="grid gap-4 pb-6 lg:grid-cols-[1fr_360px]">
        {rows.length === 0 ? (
          <div className="mt-6">
            <EmptyState icon={FileText} title="No quotations found" description="Try a different search term or status filter." />
          </div>
        ) : (
          <TableCard>
            <TableScroll minWidth={760}>
              <TableHead columns={["Quote", "Customer", "Service", "Total", "Valid until", "Status"]} />
              <tbody>
                {rows.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => setSelectedId(q.id)}
                    className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-6 py-4 font-semibold">{q.id}</td>
                    <td className="px-4 py-4">{q.customer}</td>
                    <td className="px-4 py-4 text-muted-foreground">{q.service}</td>
                    <td className="px-4 py-4 font-semibold text-primary">{fmtMoney(q.total)}</td>
                    <td className="px-4 py-4 text-muted-foreground">{fmtDate(q.expiresOn)}</td>
                    <td className="px-4 py-4">
                      <StatusPill status={q.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableScroll>
          </TableCard>
        )}

        {selected && (
          <div className="mt-6 space-y-4">
            <Panel title={`Quote ${selected.id}`} action={<StatusPill status={selected.status} />}>
              <p className="text-sm font-semibold">{selected.service}</p>
              <p className="text-xs text-muted-foreground">
                {selected.customer} · from request {selected.requestId}
              </p>

              <dl className="mt-4 space-y-2 text-sm">
                <Line label="Labour" value={fmtMoney(selected.labour)} />
                <Line label="Materials" value={fmtMoney(selected.materials)} />
                <Line label="Transport" value={fmtMoney(selected.transport)} />
                <Line label="Tax (VAT)" value={fmtMoney(selected.tax)} />
                <Line label="Discount" value={`- ${fmtMoney(selected.discount)}`} />
                <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-extrabold text-primary">{fmtMoney(selected.total)}</span>
                </div>
              </dl>

              <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <Line label="Estimated duration" value={selected.duration} />
                <Line label="Proposed start" value={fmtDate(selected.startDate)} />
                <Line label="Valid until" value={fmtDate(selected.expiresOn)} />
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  Duplicate
                </button>
                <button className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted">
                  Edit &amp; resend
                </button>
                <button className="rounded-xl px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10">
                  Withdraw
                </button>
              </div>
            </Panel>

            <Panel title="Quote settings">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Default validity: 7 days</li>
                <li>VAT applied at 18%</li>
                <li>Terms: 50% deposit for jobs above TZS 500,000</li>
                <li>Auto-reminder to customer after 48 hours</li>
              </ul>
            </Panel>
          </div>
        )}
      </div>
    </ProviderPage>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
