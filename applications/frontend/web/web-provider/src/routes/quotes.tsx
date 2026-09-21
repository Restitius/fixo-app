// Quotations — wired to the real /providers/quotations endpoints. Field
// names read directly from quotations_router.py / the real PRV.QUOTE.*
// SQL this session (list is a summary shape, get is the full breakdown).
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TableCard, TableFilterBar, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { fmtMoney } from "@/lib/format";
import { quotesApi, type QuoteDetail, type QuoteRow } from "@/lib/api-client";

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
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    quotesApi
      .list()
      .then((rows) => {
        setQuotes(rows);
        if (rows[0]) setSelectedId(rows[0].quote_id);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load quotations."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      return;
    }
    quotesApi.get(selectedId).then(setSelectedDetail).catch(() => setSelectedDetail(null));
  }, [selectedId]);

  const rows = useMemo(
    () =>
      quotes.filter(
        (q) =>
          (status === "ALL" || q.status === status) &&
          `${q.request_number} ${q.service_name}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [quotes, search, status],
  );

  async function withdraw(quoteId: string) {
    setBusy(true);
    try {
      const updated = await quotesApi.withdraw(quoteId);
      setQuotes((prev) => prev.map((q) => (q.quote_id === quoteId ? { ...q, status: updated.status } : q)));
      setSelectedDetail(updated);
      toast.success("Quote withdrawn.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not withdraw this quote.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(quoteId: string) {
    setBusy(true);
    try {
      const updated = await quotesApi.submit(quoteId);
      setQuotes((prev) => prev.map((q) => (q.quote_id === quoteId ? { ...q, status: updated.status } : q)));
      setSelectedDetail(updated);
      toast.success("Quote sent to the customer.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit this quote.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <ProviderPage title="Quotations" subtitle="Every quote you have drafted, sent or closed.">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </ProviderPage>
    );
  }

  return (
    <ProviderPage title="Quotations" subtitle="Every quote you have drafted, sent or closed.">
      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by request number or service..."
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
      />
      <p className="mt-2 text-xs text-muted-foreground">
        New quotes are created from a request's "Send quotation" action on the Requests page.
      </p>

      <div className="mt-4 grid gap-4 pb-6 lg:grid-cols-[1fr_360px]">
        {rows.length === 0 ? (
          <div className="mt-2">
            <EmptyState icon={FileText} title="No quotations found" description="Try a different search term or status filter." />
          </div>
        ) : (
          <TableCard>
            <TableScroll minWidth={760}>
              <TableHead columns={["Request", "Service", "Total", "Valid until", "Status"]} />
              <tbody>
                {rows.map((q) => (
                  <tr
                    key={q.quote_id}
                    onClick={() => setSelectedId(q.quote_id)}
                    className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-6 py-4 font-semibold">{q.request_number}</td>
                    <td className="px-4 py-4 text-muted-foreground">{q.service_name}</td>
                    <td className="px-4 py-4 font-semibold text-primary">{fmtMoney(q.total_amount, q.currency)}</td>
                    <td className="px-4 py-4 text-muted-foreground">{q.valid_until ?? "—"}</td>
                    <td className="px-4 py-4">
                      <StatusPill status={q.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableScroll>
          </TableCard>
        )}

        {selectedDetail && (
          <div className="mt-6 space-y-4">
            <Panel title={`Quote for ${selectedDetail.request_number}`} action={<StatusPill status={selectedDetail.status} />}>
              <p className="text-sm font-semibold">{selectedDetail.service_name}</p>

              <dl className="mt-4 space-y-2 text-sm">
                {selectedDetail.labour_cost != null && <Line label="Labour" value={fmtMoney(selectedDetail.labour_cost, selectedDetail.currency)} />}
                {selectedDetail.materials_cost != null && <Line label="Materials" value={fmtMoney(selectedDetail.materials_cost, selectedDetail.currency)} />}
                {selectedDetail.transport_cost != null && <Line label="Transport" value={fmtMoney(selectedDetail.transport_cost, selectedDetail.currency)} />}
                {selectedDetail.tax_amount != null && <Line label="Tax" value={fmtMoney(selectedDetail.tax_amount, selectedDetail.currency)} />}
                {selectedDetail.discount_amount != null && <Line label="Discount" value={`- ${fmtMoney(selectedDetail.discount_amount, selectedDetail.currency)}`} />}
                <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-extrabold text-primary">{fmtMoney(selectedDetail.total_amount, selectedDetail.currency)}</span>
                </div>
              </dl>

              <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                {selectedDetail.estimated_hours != null && <Line label="Estimated hours" value={String(selectedDetail.estimated_hours)} />}
                {selectedDetail.proposed_start_date && <Line label="Proposed start" value={selectedDetail.proposed_start_date} />}
                {selectedDetail.valid_until && <Line label="Valid until" value={selectedDetail.valid_until} />}
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                {selectedDetail.status === "DRAFT" && (
                  <button
                    onClick={() => submit(selectedDetail.quote_id)}
                    disabled={busy}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    style={{ backgroundImage: "var(--gradient-primary)" }}
                  >
                    Send to customer
                  </button>
                )}
                {(selectedDetail.status === "SUBMITTED" || selectedDetail.status === "VIEWED") && (
                  <button
                    onClick={() => withdraw(selectedDetail.quote_id)}
                    disabled={busy}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  >
                    Withdraw
                  </button>
                )}
              </div>
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
