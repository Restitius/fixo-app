// Invoices — wired to the real /providers/me/invoices/* endpoints. The
// real backend model is periodic earnings STATEMENTS (gross/commission/
// tax/net per period, status issued/paid/overdue/void) — not per-booking
// customer invoices with a party/PDF download, which is what the old
// mock modeled. provider_invoices_service.py's own docstring: "No
// generation or delivery happens in this phase" — so no download button,
// and the "Tax & compliance"/"Invoice preferences" panels (TIN on file,
// VAT rate, email/logo toggles) are dropped since none of those fields
// exist in the real schema.
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TableCard, TableFilterBar, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { fmtMoney } from "@/lib/format";
import { invoicesApi, type InvoiceRow, type InvoiceSummary } from "@/lib/api-client";

const title = "Invoices — FIXO Provider";
const description = "Periodic earnings statements: gross, commission, tax and net per period.";

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

function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([invoicesApi.list(), invoicesApi.summary()])
      .then(([r, s]) => {
        setRows(r);
        setSummary(s);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load invoices."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter(
        (i) => (status === "ALL" || i.status === status) && i.invoice_number.toLowerCase().includes(search.toLowerCase()),
      ),
    [rows, search, status],
  );

  if (loading) {
    return (
      <ProviderPage title="Invoices" subtitle="Periodic earnings statements FIXO generates for your business.">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </ProviderPage>
    );
  }

  return (
    <ProviderPage title="Invoices" subtitle="Periodic earnings statements FIXO generates for your business.">
      {summary && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Receipt} label="Statements" value={String(summary.total_count)} hint="All time" />
          <MetricCard icon={Receipt} label="Gross" value={fmtMoney(summary.total_gross)} hint="Before deductions" />
          <MetricCard icon={Receipt} label="Net" value={fmtMoney(summary.total_net)} hint="After commission + tax" tone="success" tintValue />
          <MetricCard icon={AlertCircle} label="Overdue" value={String(summary.overdue_count)} hint="Need attention" tone={summary.overdue_count > 0 ? "destructive" : "primary"} tintValue />
        </div>
      )}

      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by invoice number..."
        filters={[
          {
            value: status,
            onChange: setStatus,
            placeholder: "Status",
            options: [
              { value: "ALL", label: "All statuses" },
              ...["issued", "paid", "overdue", "void"].map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
            ],
          },
        ]}
      />

      <div className="grid gap-4 pb-6 lg:grid-cols-1">
        <TableCard>
          <TableScroll minWidth={760}>
            <TableHead columns={["Statement", "Period", "Gross", "Commission", "Tax", "Net", "Status"]} />
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No statements yet.
                  </td>
                </tr>
              )}
              {filtered.map((i) => (
                <tr key={i.id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                  <td className="px-6 py-4 font-semibold">{i.invoice_number}</td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {i.period_start} – {i.period_end}
                  </td>
                  <td className="px-4 py-4">{fmtMoney(i.gross_amount, i.currency)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtMoney(i.commission_amount, i.currency)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtMoney(i.tax_amount, i.currency)}</td>
                  <td className="px-4 py-4 font-semibold text-primary">{fmtMoney(i.net_amount, i.currency)}</td>
                  <td className="px-4 py-4">
                    <StatusPill status={i.status.toUpperCase()} />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
        </TableCard>
      </div>
    </ProviderPage>
  );
}
