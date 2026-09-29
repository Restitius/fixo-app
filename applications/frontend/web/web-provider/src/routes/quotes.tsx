// Quotations — wired to the real /providers/quotations endpoints. Field
// names read directly from quotations_router.py / the real PRV.QUOTE.*
// SQL this session (list is a summary shape, get is the full breakdown).
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  validateSearch: (search: Record<string, unknown>) => ({
    requestId: typeof search["requestId"] === "string" ? search["requestId"] : undefined,
  }),
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
  const { requestId } = Route.useSearch();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(!!requestId);

  const load = () =>
    quotesApi
      .list()
      .then((rows) => {
        setQuotes(rows);
        if (rows[0]) setSelectedId(rows[0].quote_id);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load quotations."));

  useEffect(() => {
    load().finally(() => setLoading(false));
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

  // Both mutations return only {quote_id, status, updated_at/submitted_at} -
  // the guarded UPDATE's RETURNING clause, not a full quote - so the list row
  // and the open detail panel are updated by merging that into what's already
  // loaded, never by treating the mutation response as the full QuoteDetail.
  async function withdraw(quoteId: string) {
    setBusy(true);
    try {
      const updated = await quotesApi.withdraw(quoteId);
      setQuotes((prev) => prev.map((q) => (q.quote_id === quoteId ? { ...q, status: updated.status } : q)));
      setSelectedDetail((prev) => (prev && prev.quote_id === quoteId ? { ...prev, status: updated.status } : prev));
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
      setSelectedDetail((prev) => (prev && prev.quote_id === quoteId ? { ...prev, status: updated.status } : prev));
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
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          New quotes are created from a request's "Send quotation" action on the Requests page.
        </p>
        {requestId && (
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="shrink-0 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            {showCreate ? "Cancel" : "New quote"}
          </button>
        )}
      </div>

      {requestId && showCreate && (
        <div className="mt-4">
          <Panel title="New quote">
            <CreateQuoteForm
              requestId={requestId}
              busy={busy}
              setBusy={setBusy}
              onSaved={async (quoteId) => {
                setShowCreate(false);
                await load();
                // save() upgrades the request's existing auto-quote in place
                // (same quote_id) far more often than it creates a new one, so
                // setSelectedId(quoteId) alone is frequently a no-op - the id
                // was already selected, the [selectedId] effect never re-fires,
                // and the panel keeps showing the pre-save total/status. Fetch
                // the fresh detail directly instead of relying on that effect.
                setSelectedId(quoteId);
                quotesApi.get(quoteId).then(setSelectedDetail).catch(() => undefined);
                void navigate({ to: "/quotes", search: { requestId: undefined } });
              }}
            />
          </Panel>
        </div>
      )}

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

function CreateQuoteForm({
  requestId,
  busy,
  setBusy,
  onSaved,
}: {
  requestId: string;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onSaved: (quoteId: string) => void;
}) {
  const [totalAmount, setTotalAmount] = useState("");
  const [labourCost, setLabourCost] = useState("");
  const [materialsCost, setMaterialsCost] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    const total = Number(totalAmount);
    if (!total || total <= 0) {
      setError("Enter a valid total amount");
      return;
    }
    setBusy(true);
    try {
      const created = await quotesApi.save(requestId, {
        total_amount: total,
        labour_cost: labourCost ? Number(labourCost) : null,
        materials_cost: materialsCost ? Number(materialsCost) : null,
        notes: notes || null,
      });
      toast.success("Quote saved as a draft.");
      onSaved(created.quote_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this quote.");
    } finally {
      setBusy(false);
    }
  }

  const field = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none";

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-muted-foreground">
          Total amount *
          <input type="number" min="1" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} className={`mt-1 ${field}`} />
        </label>
        <label className="text-xs text-muted-foreground">
          Labour cost
          <input type="number" min="0" value={labourCost} onChange={(e) => setLabourCost(e.target.value)} className={`mt-1 ${field}`} />
        </label>
        <label className="text-xs text-muted-foreground">
          Materials cost
          <input type="number" min="0" value={materialsCost} onChange={(e) => setMaterialsCost(e.target.value)} className={`mt-1 ${field}`} />
        </label>
      </div>
      <label className="block text-xs text-muted-foreground">
        Notes for the customer (optional)
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`mt-1 ${field}`} />
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <button
        onClick={() => void save()}
        disabled={busy}
        className="rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      >
        Save as draft
      </button>
    </div>
  );
}
