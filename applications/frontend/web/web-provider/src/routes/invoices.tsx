import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TableCard, TableFilterBar, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { fmtDate, fmtMoney } from "@/lib/format";
import { invoices } from "@/lib/mock-data";

const title = "Invoices — FIXO Provider";
const description = "Customer invoices, earnings statements, commission statements and withdrawal receipts.";

export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: InvoicesPage,
});

const kinds = ["Customer invoice", "Earnings statement", "Commission statement", "Withdrawal receipt"];

function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("ALL");

  const rows = useMemo(
    () =>
      invoices.filter(
        (i) =>
          (kind === "ALL" || i.kind === kind) &&
          `${i.id} ${i.customer} ${i.booking}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, kind],
  );

  return (
    <ProviderPage title="Invoices" subtitle="Every document FIXO generates for your business.">
      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search documents..."
        filters={[
          {
            value: kind,
            onChange: setKind,
            placeholder: "Document type",
            options: [{ value: "ALL", label: "All documents" }, ...kinds.map((k) => ({ value: k, label: k }))],
          },
        ]}
      />

      <div className="grid gap-4 pb-6 lg:grid-cols-[1fr_320px]">
        <TableCard>
          <TableScroll minWidth={760}>
            <TableHead columns={["Document", "Type", "Booking", "Party", "Amount", "Date", ""]} />
            <tbody>
              {rows.map((i) => (
                <tr key={i.id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                  <td className="px-6 py-4 font-semibold">{i.id}</td>
                  <td className="px-4 py-4 text-muted-foreground">{i.kind}</td>
                  <td className="px-4 py-4 text-muted-foreground">{i.booking}</td>
                  <td className="px-4 py-4">{i.customer}</td>
                  <td className="px-4 py-4 font-semibold">{fmtMoney(i.amount)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtDate(i.date)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <StatusPill status={i.status} />
                      <button className="text-muted-foreground transition-colors hover:text-primary" title="Download PDF">
                        <Download className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
        </TableCard>

        <div className="mt-6 space-y-4">
          <Panel title="Tax & compliance">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>TIN-114-902-338 is on file and printed on every customer invoice.</p>
              <p>VAT is applied at 18% where applicable.</p>
              <p>Annual summaries are issued each January for tax filing.</p>
            </div>
            <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold hover:bg-muted">
              <FileText className="size-4" /> Download 2026 summary
            </button>
          </Panel>
          <Panel title="Invoice preferences">
            <label className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm">
              Email invoices to me <input type="checkbox" defaultChecked className="size-4 accent-[var(--primary)]" />
            </label>
            <label className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm">
              Include company logo <input type="checkbox" defaultChecked className="size-4 accent-[var(--primary)]" />
            </label>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}
