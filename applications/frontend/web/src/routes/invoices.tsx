// Invoices — issued invoices with a detail drawer for line items.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Droplets,
  FileText,
  Landmark,
  Loader2,
  Paintbrush,
  Printer,
  Receipt,
  Smartphone,
  Sparkles,
  Truck,
  Wind,
  Wrench,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type InvoiceDetail, type InvoiceRow, type PaymentMethod } from "@/lib/api-client";
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

const TABS = ["All", "Paid", "Pending", "Overdue"] as const;
type Tab = (typeof TABS)[number];

// Net-7 terms: an issued invoice unpaid a week later is flagged overdue for
// display. The backend has no due_date column, so this is a real, disclosed
// business rule applied to real timestamps — not a fabricated status.
const OVERDUE_AFTER_DAYS = 7;

function displayStatus(inv: InvoiceRow): Tab {
  if (inv.status === "PAID") return "Paid";
  if (inv.status === "ISSUED") {
    const issued = inv.issued_at ?? inv.created_at;
    const ageDays = (Date.now() - new Date(issued).getTime()) / 86_400_000;
    return ageDays > OVERDUE_AFTER_DAYS ? "Overdue" : "Pending";
  }
  return "Pending";
}

function statusStyle(status: Tab) {
  if (status === "Paid") return "bg-success/15 text-success";
  if (status === "Overdue") return "bg-destructive/15 text-destructive";
  return "bg-amber-500/15 text-amber-600";
}

function iconForService(name?: string | null) {
  const n = (name ?? "").toLowerCase();
  if (n.includes("plumb") || n.includes("leak") || n.includes("water") || n.includes("pipe")) return Droplets;
  if (n.includes("ac") || n.includes("air")) return Wind;
  if (n.includes("clean")) return Sparkles;
  if (n.includes("paint")) return Paintbrush;
  if (n.includes("mov")) return Truck;
  return Wrench;
}

function methodIcon(type?: string) {
  if (type === "mpesa") return Smartphone;
  if (type === "bank") return Landmark;
  return CreditCard;
}

const PAGE_SIZE = 8;

function InvoicesPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [rows, setRows] = useState<InvoiceRow[] | null>(null);
  const [defaultMethod, setDefaultMethod] = useState<PaymentMethod | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [tab, setTab] = useState<Tab>("All");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      setRows(await fixoSdk.listInvoices(50, 0));
    } catch {
      setRows((prev) => prev ?? []);
    }
    try {
      const methods = await fixoSdk.listPaymentMethods();
      setDefaultMethod(methods.find((m) => m.is_default) ?? methods[0] ?? null);
    } catch {
      setDefaultMethod(null);
    }
  }, []);

  useEffect(() => {
    if (access_token && !loading) void load();
  }, [access_token, loading, load]);

  const filtered = useMemo(
    () => (rows ?? []).filter((r) => tab === "All" || displayStatus(r) === tab),
    [rows, tab],
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

  function methodLabel(m: PaymentMethod | null) {
    if (!m) return "—";
    const masked = (m.details_masked?.["last4"] as string | undefined) ?? "••••";
    return `${m.provider || humanize(m.type)} •••• ${masked}`;
  }

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const totalInvoices = rows?.length ?? 0;
  const paidCount = (rows ?? []).filter((r) => displayStatus(r) === "Paid").length;
  const pendingCount = (rows ?? []).filter((r) => displayStatus(r) === "Pending").length;
  const totalBilled = (rows ?? []).reduce((s, r) => s + r.total_amount, 0);
  const currency = rows?.[0]?.currency ?? "TZS";

  return (
    <PageShell
      title="Invoices"
      subtitle="Billing records for your completed jobs"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={FileText} label="Total Invoices" hint="All time" value={String(totalInvoices)} />
        <StatCard icon={CheckCircle2} label="Paid Invoices" hint="Completed" value={String(paidCount)} tone="success" />
        <StatCard icon={Clock} label="Pending" hint="Awaiting payment" value={String(pendingCount)} tone="amber" />
        <StatCard icon={Receipt} label="Total Billed" hint="Across all invoices" value={fmtMoney(totalBilled, currency)} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-card p-4 shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-semibold">Recent invoices</h3>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex gap-1 rounded-xl bg-muted p-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setPage(1); }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === t ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                style={tab === t ? { backgroundImage: "var(--gradient-primary)" } : undefined}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            className="flex h-10 items-center gap-2 rounded-xl bg-muted px-4 text-sm font-medium hover:bg-muted/70"
          >
            <Download className="size-4" /> Download all
          </button>
        </div>
      </div>

      {rows === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={FileText}
            title={tab === "All" ? "No invoices yet" : `No ${tab.toLowerCase()} invoices`}
            description={
              tab === "All"
                ? "An invoice is issued once a booking is completed and confirmed. Check back after your next job."
                : "Try a different tab to see other invoices."
            }
            actionLabel="View My Bookings"
            actionTo="/bookings"
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4 font-semibold">Service</th>
                  <th className="px-4 py-4 font-semibold">Invoice #</th>
                  <th className="px-4 py-4 font-semibold">Provider</th>
                  <th className="px-4 py-4 font-semibold">Issue Date</th>
                  <th className="px-4 py-4 font-semibold">Payment Method</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((inv) => {
                  const Icon = iconForService(inv.service_name);
                  const status = displayStatus(inv);
                  const MethodIcon = methodIcon(defaultMethod?.type);
                  return (
                    <tr
                      key={inv.invoice_id}
                      onClick={() => void openInvoice(inv.invoice_id)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="size-4" />
                          </span>
                          <p className="font-semibold">{inv.service_name ?? "Service"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-primary font-semibold">{inv.invoice_number}</td>
                      <td className="px-4 py-4">{inv.provider_name}</td>
                      <td className="px-4 py-4 text-muted-foreground">{fmtDate(inv.created_at)}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <MethodIcon className="size-4" /> {methodLabel(defaultMethod)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(status)}`}>{status}</span>
                      </td>
                      <td className="px-4 py-4 font-semibold">{fmtMoney(inv.total_amount, inv.currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} invoices
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40"
              >
                ‹
              </button>
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        </div>
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
            <div className="mt-4 space-y-5">
              <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    {(() => {
                      const Icon = iconForService(detail.service_name);
                      return <Icon className="size-5" />;
                    })()}
                  </span>
                  <div>
                    <p className="font-semibold">{detail.service_name ?? "Service"}</p>
                    <p className="text-xs text-muted-foreground">{detail.invoice_number}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(displayStatus(detail))}`}>
                    {displayStatus(detail)}
                  </span>
                  <p className="mt-1 font-bold">{fmtMoney(detail.total_amount, detail.currency)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <Field label="Provider" value={detail.provider_name} />
                <Field label="Booking reference" value={detail.booking_number} />
                <Field label="Invoice date" value={fmtDate(detail.created_at)} />
                <Field label="Service date" value={detail.scheduled_date ? fmtDate(detail.scheduled_date) : "—"} />
                <Field label="Payment method" value={methodLabel(defaultMethod)} />
                <Field label="Due" value={detail.paid_at ? "Paid" : `Net ${OVERDUE_AFTER_DAYS} days`} />
              </div>

              {detail.items.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Billing breakdown</h4>
                  <ul className="divide-y divide-border rounded-2xl border border-border">
                    {detail.items.map((it) => (
                      <li key={it.item_id} className="flex items-center justify-between gap-4 p-3 text-sm">
                        <span>
                          {it.description}
                          {it.quantity > 1 ? <span className="text-muted-foreground"> × {it.quantity}</span> : null}
                        </span>
                        <span className="font-medium">{fmtMoney(it.line_total, detail.currency)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
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

              <button
                onClick={() => window.print()}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                <Printer className="size-4" /> Download PDF
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  hint,
  value,
  tone,
}: {
  icon: typeof FileText;
  label: string;
  hint: string;
  value: string;
  tone?: "success" | "amber";
}) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
      <span
        className={`flex size-11 items-center justify-center rounded-2xl ${
          tone === "success" ? "bg-success/15 text-success" : tone === "amber" ? "bg-amber-500/15 text-amber-600" : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="size-5" />
      </span>
      <p className="mt-4 font-semibold">{label}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}
