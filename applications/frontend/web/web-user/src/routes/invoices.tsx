// Invoices — issued invoices, with a paid-invoice receipt popup and a
// pending-invoice side panel that squeezes the page layout (no dark overlay)
// rather than covering it.
import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  CreditCard,
  Download,
  Droplets,
  FileText,
  Landmark,
  Loader2,
  MapPin,
  MessageCircle,
  Paintbrush,
  Printer,
  Receipt,
  Share2,
  Smartphone,
  Sparkles,
  Truck,
  User,
  Wind,
  Wrench,
  X,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type InvoiceDetail, type InvoiceRow, type PaymentMethod } from "@/lib/api-client";
import { fmtDate, fmtDateTime, fmtMoney, humanize } from "@/lib/format";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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
const PAGE_SIZE = 8;

// The schema has no due_date column, so "due" and "overdue" are real,
// disclosed computed rules over real timestamps (issued_at/created_at),
// not stored/fabricated fields.
const DUE_DAYS = 3;

function dueDate(inv: Pick<InvoiceRow, "issued_at" | "created_at">) {
  const base = new Date(inv.issued_at ?? inv.created_at);
  base.setDate(base.getDate() + DUE_DAYS);
  return base;
}

function displayStatus(inv: InvoiceRow): Tab {
  if (inv.status === "PAID") return "Paid";
  if (inv.status === "ISSUED") {
    return Date.now() > dueDate(inv).getTime() ? "Overdue" : "Pending";
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

function methodLabel(m: PaymentMethod | null) {
  if (!m) return "—";
  const masked = (m.details_masked?.["last4"] as string | undefined) ?? "••••";
  return `${m.provider || humanize(m.type)} •••• ${masked}`;
}

function InvoicesPage() {
  const { t } = useTranslation("billing");
  const { access_token, loading, logout, customer } = useAuth();
  const [rows, setRows] = useState<InvoiceRow[] | null>(null);
  const [defaultMethod, setDefaultMethod] = useState<PaymentMethod | null>(null);
  const [tab, setTab] = useState<Tab>("All");
  const [page, setPage] = useState(1);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InvoiceDetail | null>(null);
  const [panelMode, setPanelMode] = useState<"none" | "panel" | "dialog">("none");

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
    return <div className="flex min-h-screen items-center justify-center">{t("invoices.loading")}</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  async function openInvoice(inv: InvoiceRow) {
    setDetailId(inv.invoice_id);
    setDetail(null);
    setPanelMode(displayStatus(inv) === "Paid" ? "dialog" : "panel");
    try {
      const d = await fixoSdk.getInvoice(inv.invoice_id);
      setDetail(d);
    } catch {
      // toast emitted by client
    }
  }

  function closeAll() {
    setDetailId(null);
    setDetail(null);
    setPanelMode("none");
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
      title={t("invoices.page.title")}
      subtitle={t("invoices.page.subtitle")}
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={FileText} label={t("invoices.metrics.totalInvoices")} hint={t("invoices.metrics.allTime")} value={String(totalInvoices)} />
        <MetricCard icon={CheckCircle2} label={t("invoices.metrics.paidInvoices")} hint={t("invoices.metrics.completed")} value={String(paidCount)} tone="success" />
        <MetricCard icon={Clock} label={t("invoices.metrics.pending")} hint={t("invoices.metrics.awaitingPayment")} value={String(pendingCount)} tone="amber" />
        <MetricCard icon={Receipt} label={t("invoices.metrics.totalBilled")} hint={t("invoices.metrics.acrossAllInvoices")} value={fmtMoney(totalBilled, currency)} />
      </div>

      <div className="mt-6 flex min-h-0 flex-1 items-start gap-6">
        {/* Main column — squeezes left when the panel is open */}
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-card p-4 shadow-[var(--shadow-card)]">
            <h3 className="text-lg font-semibold">{t("invoices.recentInvoices")}</h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex gap-1 rounded-xl bg-muted p-1">
                {TABS.map((filterTab) => (
                  <button
                    key={filterTab}
                    onClick={() => { setTab(filterTab); setPage(1); }}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                      tab === filterTab ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={tab === filterTab ? { backgroundImage: "var(--gradient-primary)" } : undefined}
                  >
                    {t(`invoices.tabs.${filterTab.toLowerCase()}`)}
                  </button>
                ))}
              </div>
              <button
                onClick={() => window.print()}
                className="flex h-10 items-center gap-2 rounded-xl bg-muted px-4 text-sm font-medium hover:bg-muted/70"
              >
                <Download className="size-4" /> {t("invoices.downloadAll")}
              </button>
            </div>
          </div>

          {rows === null ? (
            <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
          ) : filtered.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={FileText}
                title={tab === "All" ? t("invoices.empty.titleAll") : t(`invoices.empty.titleFiltered${tab}`)}
                description={
                  tab === "All"
                    ? t("invoices.empty.descriptionAll")
                    : t("invoices.empty.descriptionFiltered")
                }
                actionLabel={t("invoices.empty.viewMyBookings")}
                actionTo="/bookings"
              />
            </div>
          ) : (
            <div className="mt-6 flex grow shrink-0 flex-col overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4 font-semibold">{t("invoices.table.service")}</th>
                      <th className="px-4 py-4 font-semibold">{t("invoices.table.invoiceNumber")}</th>
                      <th className="px-4 py-4 font-semibold">{t("invoices.table.provider")}</th>
                      <th className="px-4 py-4 font-semibold">{t("invoices.table.issueDate")}</th>
                      <th className="px-4 py-4 font-semibold">{t("invoices.table.paymentMethod")}</th>
                      <th className="px-4 py-4 font-semibold">{t("invoices.table.status")}</th>
                      <th className="px-4 py-4 font-semibold">{t("invoices.table.amount")}</th>
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
                          onClick={() => void openInvoice(inv)}
                          className={`cursor-pointer border-b border-border last:border-0 hover:bg-muted/40 ${
                            detailId === inv.invoice_id ? "bg-primary/5" : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Icon className="size-5" />
                              </span>
                              <p className="font-semibold">{inv.service_name ?? t("invoices.serviceFallback")}</p>
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
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(status)}`}>{t(`invoices.tabs.${status.toLowerCase()}`)}</span>
                          </td>
                          <td className="px-4 py-4 font-semibold">{fmtMoney(inv.total_amount, inv.currency)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-auto flex shrink-0 items-center justify-between border-t border-border px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  {t("invoices.pagination.showing", {
                    count: filtered.length,
                    from: (page - 1) * PAGE_SIZE + 1,
                    to: Math.min(page * PAGE_SIZE, filtered.length),
                  })}
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
        </div>

        {/* Pending/overdue side panel — in normal flow, no overlay, squeezes the column above */}
        {panelMode === "panel" && (
          <PendingInvoicePanel
            detail={detail}
            defaultMethod={defaultMethod}
            onClose={closeAll}
            onDownload={() => setPanelMode("dialog")}
          />
        )}
      </div>

      {/* Paid-invoice receipt popup (also reachable from the panel's Download action) */}
      <PaidInvoiceDialog
        open={panelMode === "dialog"}
        detail={detail}
        defaultMethod={defaultMethod}
        onOpenChange={(o) => !o && closeAll()}
      />
    </PageShell>
  );
}


function Field({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

// ---- Pending/Overdue side panel (image 3 content, squeeze layout, no overlay) ----

function PendingInvoicePanel({
  detail,
  defaultMethod,
  onClose,
  onDownload,
}: {
  detail: InvoiceDetail | null;
  defaultMethod: PaymentMethod | null;
  onClose: () => void;
  onDownload: () => void;
}) {
  const { t } = useTranslation("billing");
  const navigate = useNavigate();

  return (
    <div className="w-[380px] shrink-0 animate-in fade-in slide-in-from-right-4 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("invoices.panel.title")}</h3>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
          <X className="size-4" />
        </button>
      </div>

      {!detail ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          <div>
            <p className="text-lg font-semibold">{detail.service_name ?? t("invoices.serviceFallback")}</p>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(displayStatus(detail))}`}>
              {t(`invoices.tabs.${displayStatus(detail).toLowerCase()}`)}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <Field icon={Receipt} label={t("invoices.fields.invoiceNumber")} value={detail.invoice_number} />
            <Field icon={FileText} label={t("invoices.fields.bookingReference")} value={detail.booking_number} />
            <Field icon={User} label={t("invoices.fields.provider")} value={detail.provider_name} />
            <Field icon={Wrench} label={t("invoices.fields.category")} value={detail.category_name ?? "—"} />
            <Field icon={Calendar} label={t("invoices.fields.invoiceDate")} value={fmtDate(detail.created_at)} />
            <Field icon={Calendar} label={t("invoices.fields.dueDate")} value={fmtDate(dueDate(detail).toISOString())} />
            <Field
              icon={MapPin}
              label={t("invoices.fields.location")}
              value={detail.address_city ? `${detail.address_city}${detail.address_region ? `, ${detail.address_region}` : ""}` : "—"}
            />
            <Field icon={CreditCard} label={t("invoices.fields.paymentMethod")} value={methodLabel(defaultMethod)} />
          </div>

          <div className="flex flex-col gap-1 rounded-2xl bg-muted/50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("invoices.billing.subtotal")}</span>
              <span>{fmtMoney(detail.subtotal, detail.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("invoices.billing.platformFee")}</span>
              <span>{fmtMoney(detail.tax_amount, detail.currency)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-border pt-2 font-semibold">
              <span>{t("invoices.billing.totalAmount")}</span>
              <span>{fmtMoney(detail.total_amount, detail.currency)}</span>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">{t("invoices.panel.progressTimeline")}</h4>
            <ol className="space-y-3">
              <TimelineStep done label={t("invoices.timeline.invoiceIssued")} value={detail.issued_at ? fmtDateTime(detail.issued_at) : fmtDateTime(detail.created_at)} />
              <TimelineStep current label={t("invoices.timeline.paymentPending")} value={fmtDateTime(detail.created_at)} />
              <TimelineStep label={t("invoices.timeline.reminderScheduled")} value={fmtDateTime(dueDate(detail).toISOString())} />
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onDownload}
              className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted"
            >
              <Download className="size-4" /> {t("invoices.panel.downloadInvoice")}
            </button>
            <button
              onClick={() => navigate({ to: "/help" })}
              className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted"
            >
              <MessageCircle className="size-4" /> {t("invoices.panel.contactSupport")}
            </button>
          </div>

          <button
            onClick={() => {
              toast.info(t("invoices.panel.payNotWiredToast"));
              navigate({ to: "/payments" });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {t("invoices.panel.payNow")}
          </button>
        </div>
      )}
    </div>
  );
}

function TimelineStep({ done, current, label, value }: { done?: boolean; current?: boolean; label: string; value: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
          done ? "bg-success text-white" : current ? "border-2 border-primary text-primary" : "border-2 border-border text-muted-foreground"
        }`}
      >
        {done ? <Check className="size-3" /> : <Circle className="size-2 fill-current" />}
      </span>
      <div>
        <p className={`text-sm font-medium ${done || current ? "" : "text-muted-foreground"}`}>{label}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
    </li>
  );
}

// ---- Paid-invoice receipt popup (image 2 content, centered dialog with overlay) ----

function PaidInvoiceDialog({
  open,
  detail,
  defaultMethod,
  onOpenChange,
}: {
  open: boolean;
  detail: InvoiceDetail | null;
  defaultMethod: PaymentMethod | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation("billing");
  const { customer } = useAuth();
  const [downloadedAt, setDownloadedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setDownloadedAt(null);
  }, [open, detail?.invoice_id]);

  function downloadPdf() {
    setDownloadedAt(new Date().toISOString());
    window.print();
  }

  async function shareReceipt() {
    if (!detail) return;
    const text = t("invoices.dialog.shareText", {
      invoiceNumber: detail.invoice_number,
      amount: fmtMoney(detail.total_amount, detail.currency),
      provider: detail.provider_name,
    });
    if (navigator.share) {
      try {
        await navigator.share({ title: "FIXO Invoice", text });
      } catch {
        // user cancelled the share sheet
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success(t("invoices.dialog.receiptCopied"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("invoices.panel.title")}</DialogTitle>
        </DialogHeader>

        {!detail ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {(() => {
                    const Icon = iconForService(detail.service_name);
                    return <Icon className="size-5" />;
                  })()}
                </span>
                <div>
                  <p className="font-semibold">{detail.service_name ?? t("invoices.serviceFallback")}</p>
                  <p className="text-xs text-muted-foreground">{detail.invoice_number}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(displayStatus(detail))}`}>
                  {t(`invoices.tabs.${displayStatus(detail).toLowerCase()}`)}
                </span>
                <p className="mt-1 font-bold">{fmtMoney(detail.total_amount, detail.currency)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <Field icon={User} label={t("invoices.fields.provider")} value={detail.provider_name} />
              <Field icon={User} label={t("invoices.fields.customer")} value={customer?.full_name ?? "—"} />
              <Field icon={Calendar} label={t("invoices.fields.invoiceDate")} value={fmtDate(detail.created_at)} />
              <Field icon={Calendar} label={t("invoices.fields.dueDate")} value={fmtDate(dueDate(detail).toISOString())} />
              <Field
                icon={MapPin}
                label={t("invoices.fields.location")}
                value={detail.address_city ? `${detail.address_city}${detail.address_region ? `, ${detail.address_region}` : ""}` : "—"}
              />
              <Field icon={CreditCard} label={t("invoices.fields.paymentMethod")} value={methodLabel(defaultMethod)} />
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold">{t("invoices.dialog.billingBreakdown")}</h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("invoices.billing.serviceCharge")}</span>
                  <span>{fmtMoney(detail.subtotal, detail.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("invoices.billing.platformFee")}</span>
                  <span>{fmtMoney(detail.tax_amount, detail.currency)}</span>
                </div>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
                <span>{t("invoices.billing.totalAmount")}</span>
                <span>{fmtMoney(detail.total_amount, detail.currency)}</span>
              </div>
            </div>

            <ReceiptTimeline detail={detail} downloadedAt={downloadedAt} />

            <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
              <FileText className="mt-0.5 size-3.5 shrink-0 text-primary" />
              {t("invoices.dialog.receiptNote")}
            </div>

            <div className="flex gap-2">
              <button onClick={() => onOpenChange(false)} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted">
                {t("invoices.dialog.close")}
              </button>
              <button
                onClick={() => void shareReceipt()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted"
              >
                <Share2 className="size-4" /> {t("invoices.dialog.shareReceipt")}
              </button>
              <button
                onClick={downloadPdf}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                <Printer className="size-4" /> {t("invoices.dialog.downloadPdf")}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReceiptTimeline({ detail, downloadedAt }: { detail: InvoiceDetail; downloadedAt: string | null }) {
  const { t } = useTranslation("billing");
  const steps: { label: string; at: string | null }[] = [
    { label: t("invoices.timeline.issued"), at: detail.issued_at ?? detail.created_at },
    { label: t("invoices.timeline.paid"), at: detail.paid_at ?? null },
    { label: t("invoices.timeline.downloaded"), at: downloadedAt },
  ];

  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{t("invoices.dialog.progress")}</h4>
      <div className="flex items-start gap-1">
        {steps.map((s, i) => (
          <div key={s.label} className="flex min-w-0 flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className={`h-px flex-1 ${i === 0 ? "opacity-0" : s.at ? "bg-primary/40" : "bg-border"}`} />
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                  s.at ? "bg-success text-white" : "border-2 border-border text-muted-foreground"
                }`}
              >
                {s.at ? <Check className="size-4" /> : <Circle className="size-2 fill-current" />}
              </span>
              <div className={`h-px flex-1 ${i === steps.length - 1 ? "opacity-0" : s.at ? "bg-primary/40" : "bg-border"}`} />
            </div>
            <p className="mt-2 text-xs font-medium">{s.label}</p>
            <p className="text-[11px] text-muted-foreground">{s.at ? fmtDateTime(s.at) : "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
