// Invoices — issued invoices with a detail drawer for line items.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, FilterX, Loader2 } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableFilterBar, TableCard, TableScroll, TableHead, TablePagination } from "@/components/dashboard/DataTable";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type InvoiceDetail, type InvoiceRow } from "@/lib/api-client";
import { fmtDate, fmtMoney, humanize } from "@/lib/format";

const title = "Invoices — FIXO";
const description = "Review invoices issued for your completed bookings.";

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

const PAGE_SIZE = 8;

function statusStyle(status: string) {
  const s = status.toUpperCase();
  if (s === "PAID") return "bg-success/15 text-success";
  if (s === "VOID" || s === "CANCELLED") return "bg-destructive/15 text-destructive";
  if (s === "ISSUED") return "bg-primary/10 text-primary";
  return "bg-amber-500/15 text-amber-600";
}

function InvoicesPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [rows, setRows] = useState<InvoiceRow[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      setRows(await fixoSdk.listInvoices(50, 0));
    } catch {
      // toast emitted by client
    }
  }, []);

  useEffect(() => {
    if (access_token && !loading) void load();
  }, [access_token, loading, load]);

  const filtered = useMemo(
    () =>
      (rows ?? []).filter((r) => {
        const matchesStatus = statusFilter === "all" || r.status === statusFilter;
        const matchesSearch =
          !search || [r.invoice_number, r.booking_number].some((f) => f.toLowerCase().includes(search.toLowerCase()));
        return matchesStatus && matchesSearch;
      }),
    [rows, statusFilter, search],
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  async function openInvoice(id: string) {
    setOpenId(id);
    setDetail(null);
    try {
      const d = await fixoSdk.getInvoice(id);
      setDetail(d);
    } catch {
      // toast emitted by client
    }
  }

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all";

  return (
    <PageShell
      title="Invoices"
      subtitle="Billing records for your completed jobs"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search invoices..."
        filters={[
          {
            value: statusFilter,
            onChange: (v) => { setStatusFilter(v); setPage(1); },
            placeholder: "Status",
            options: [
              { value: "all", label: "All Statuses" },
              { value: "DRAFT", label: "Draft" },
              { value: "ISSUED", label: "Issued" },
              { value: "PAID", label: "Paid" },
            ],
          },
        ]}
      />

      {rows === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState icon={FilterX} title="No matching invoices" description="Try adjusting your search or filters." actionLabel="Clear Filters" onAction={() => { setSearch(""); setStatusFilter("all"); }} />
          ) : (
            <EmptyState
              icon={FileText}
              title="No invoices yet"
              description="An invoice is issued once a booking is completed and confirmed. Check back after your next job."
              actionLabel="View My Bookings"
              actionTo="/bookings"
            />
          )}
        </div>
      ) : (
        <TableCard>
          <TableScroll minWidth={700}>
            <TableHead columns={["Invoice #", "Booking", "Date", "Status", "Amount"]} />
            <tbody>
              {paged.map((inv) => (
                <tr
                  key={inv.invoice_id}
                  onClick={() => void openInvoice(inv.invoice_id)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                >
                  <td className="px-6 py-4 font-semibold text-primary">{inv.invoice_number}</td>
                  <td className="px-4 py-4 text-muted-foreground">{inv.booking_number}</td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtDate(inv.created_at)}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(inv.status)}`}>
                      {humanize(inv.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold">{fmtMoney(inv.total_amount, inv.currency)}</td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
          <TablePagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            from={(page - 1) * PAGE_SIZE + 1}
            to={Math.min(page * PAGE_SIZE, filtered.length)}
            total={filtered.length}
            itemLabel="invoices"
          />
        </TableCard>
      )}

      <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Invoice details</SheetTitle>
          </SheetHeader>
          {!detail ? (
            <div className="mt-8 flex justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{detail.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">Booking {detail.booking_number}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(detail.status)}`}>
                  {humanize(detail.status)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Provider · {detail.provider_name}</p>
              {detail.items.length > 0 && (
                <ul className="divide-y divide-border rounded-2xl border border-border">
                  {detail.items.map((it) => (
                    <li key={it.item_id} className="flex items-center justify-between gap-4 p-3 text-sm">
                      <span>
                        {it.description}
                        <span className="text-muted-foreground"> × {it.quantity}</span>
                      </span>
                      <span className="font-medium">{fmtMoney(it.line_total, detail.currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-col gap-1 rounded-2xl bg-muted/50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{fmtMoney(detail.subtotal, detail.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{fmtMoney(detail.tax_amount, detail.currency)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{fmtMoney(detail.total_amount, detail.currency)}</span>
                </div>
              </div>
              {detail.paid_at && <p className="text-xs text-muted-foreground">Paid {fmtDate(detail.paid_at)}</p>}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}
