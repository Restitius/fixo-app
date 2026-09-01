// Invoices — issued invoices with expandable line-item detail.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
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
  const [details, setDetails] = useState<Record<string, InvoiceDetail>>({});

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

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  async function toggle(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (!details[id]) {
      try {
        const d = await fixoSdk.getInvoice(id);
        setDetails((prev) => ({ ...prev, [id]: d }));
      } catch {
        // toast emitted by client
      }
    }
  }

  return (
    <PageShell
      title="Invoices"
      subtitle="Billing records for your completed jobs"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6">
        {rows === null ? (
          <LoadingRows />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            description="An invoice is issued once a booking is completed and confirmed. Check back after your next job."
            actionLabel="View My Bookings"
            actionTo="/bookings"
          />
        ) : (
          <div className="space-y-3">
            {rows.map((inv, i) => (
              <div
                key={inv.invoice_id}
                style={{ animationDelay: `${i * 40}ms` }}
                className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-3xl bg-card shadow-[var(--shadow-card)]"
              >
                <button
                  onClick={() => void toggle(inv.invoice_id)}
                  className="flex w-full flex-col gap-2 p-5 text-left sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{inv.invoice_number}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle(inv.status)}`}>
                        {humanize(inv.status)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Booking {inv.booking_number} · {fmtDate(inv.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">{fmtMoney(inv.total_amount, inv.currency)}</p>
                    {openId === inv.invoice_id ? (
                      <ChevronUp className="size-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {openId === inv.invoice_id && (
                  <div className="border-t border-border px-5 py-4">
                    {(() => {
                      const d = details[inv.invoice_id];
                      if (!d) return <p className="text-sm text-muted-foreground">Loading…</p>;
                      return (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">Provider · {d.provider_name}</p>
                          {d.items.length > 0 && (
                            <ul className="divide-y divide-border rounded-2xl border border-border">
                              {d.items.map((it) => (
                                <li key={it.item_id} className="flex items-center justify-between gap-4 p-3 text-sm">
                                  <span>
                                    {it.description}
                                    <span className="text-muted-foreground"> × {it.quantity}</span>
                                  </span>
                                  <span className="font-medium">{fmtMoney(it.line_total, d.currency)}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="flex flex-col gap-1 rounded-2xl bg-muted/50 p-4 text-sm sm:w-64 sm:self-end">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span>{fmtMoney(d.subtotal, d.currency)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tax</span>
                              <span>{fmtMoney(d.tax_amount, d.currency)}</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                              <span>Total</span>
                              <span>{fmtMoney(d.total_amount, d.currency)}</span>
                            </div>
                          </div>
                          {d.paid_at && (
                            <p className="text-xs text-muted-foreground">Paid {fmtDate(d.paid_at)}</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-3xl bg-muted/60" />
      ))}
    </div>
  );
}
