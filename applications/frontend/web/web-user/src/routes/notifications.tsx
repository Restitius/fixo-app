// Notifications — inbox with a booking-style centered dialog for booking/service
// updates and a squeeze side panel (no overlay) for payment/invoice updates,
// matching the pattern already established on Invoices and Promotions.
import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  CreditCard,
  FileText,
  FilterX,
  Hash,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Receipt,
  Tag,
  User,
  Wallet,
  Wrench,
  X,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { bookingApi, fixoSdk, type BookingRow, type InvoiceDetail, type NotificationRow, type PaymentMethod } from "@/lib/api-client";
import { fmtDate, fmtDateTime, fmtMoney, humanize, timeAgo } from "@/lib/format";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

const title = "Notifications — FIXO";
const description = "Updates, reminders and alerts.";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: NotificationsPage,
});

const TABS = ["All", "Unread", "Bookings", "Payments"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL_KEYS: Record<Tab, string> = {
  All: "tabs.all",
  Unread: "tabs.unread",
  Bookings: "tabs.bookings",
  Payments: "tabs.payments",
};

// The real notification types the backend actually emits (see notify() call
// sites across bookings/payments/invoices/tracking/maintenance services).
// "Bookings" groups the booking lifecycle; "Payments" groups money/billing.
function category(type: string): "bookings" | "payments" | "other" {
  if (type.startsWith("BOOKING") || type.startsWith("SERVICE") || type.startsWith("MAINTENANCE")) return "bookings";
  if (type.startsWith("PAYMENT") || type.startsWith("INVOICE")) return "payments";
  return "other";
}

function matchesTab(n: NotificationRow, tab: Tab): boolean {
  if (tab === "All") return true;
  if (tab === "Unread") return !n.read_at;
  if (tab === "Bookings") return category(n.type) === "bookings";
  return category(n.type) === "payments";
}

function iconFor(type: string) {
  if (type.startsWith("PAYMENT")) return { Icon: Wallet, tone: "bg-primary/10 text-primary" };
  if (type.startsWith("INVOICE")) return { Icon: FileText, tone: "bg-sky-500/15 text-sky-600" };
  if (type.startsWith("SERVICE")) return { Icon: CheckCircle2, tone: "bg-success/15 text-success" };
  if (type.startsWith("MAINTENANCE")) return { Icon: Wrench, tone: "bg-amber-500/15 text-amber-600" };
  if (type.startsWith("BOOKING")) return { Icon: Calendar, tone: "bg-sky-500/15 text-sky-600" };
  return { Icon: Bell, tone: "bg-muted text-muted-foreground" };
}

function badgeFor(n: NotificationRow, t: TFunction): { label: string; tone: string } | null {
  if (!n.read_at) return { label: t("list.new"), tone: "bg-success/15 text-success" };
  if (n.type === "PAYMENT.CAPTURED") return { label: t("list.paid"), tone: "bg-primary/10 text-primary" };
  return null;
}

// Booking-lifecycle updates get the full-attention centered dialog; money/billing
// updates get the receipt-style squeeze panel — same split Invoices already uses.
function usesDialog(type: string): boolean {
  return category(type) !== "payments";
}

function methodIcon(type?: string) {
  return type === "bank" ? Receipt : CreditCard;
}

function methodLabel(m: PaymentMethod | null) {
  if (!m) return "—";
  const masked = (m.details_masked?.["last4"] as string | undefined) ?? "••••";
  return `${m.provider || humanize(m.type)} •••• ${masked}`;
}

interface Enrichment {
  booking?: BookingRow;
  invoice?: InvoiceDetail;
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

function detailFields(n: NotificationRow, enrich: Enrichment | null, defaultMethod: PaymentMethod | null, t: TFunction) {
  const rows: { icon: typeof MapPin; label: string; value: string }[] = [
    { icon: Tag, label: t("detail.notificationType"), value: humanize(n.type) },
  ];
  if (enrich?.booking) {
    const b = enrich.booking;
    rows.push({ icon: Hash, label: t("detail.bookingReference"), value: b.booking_number });
    rows.push({ icon: User, label: t("detail.provider"), value: b.provider_name ?? "—" });
    rows.push({ icon: Wrench, label: t("detail.service"), value: b.service_name ?? "—" });
    rows.push({
      icon: Calendar,
      label: t("detail.scheduledVisit"),
      value: `${fmtDate(b.scheduled_date)}${b.time_window ? `, ${humanize(b.time_window)}` : ""}`,
    });
    rows.push({
      icon: MapPin,
      label: t("detail.location"),
      value: b.address_city ? `${b.address_street ? `${b.address_street}, ` : ""}${b.address_city}` : "—",
    });
    rows.push({ icon: Receipt, label: t("detail.relatedAmount"), value: fmtMoney(b.agreed_amount, b.currency) });
    if (n.type.startsWith("PAYMENT")) {
      rows.push({ icon: methodIcon(defaultMethod?.type), label: t("detail.paymentMethod"), value: methodLabel(defaultMethod) });
    }
  } else if (enrich?.invoice) {
    const inv = enrich.invoice;
    rows.push({ icon: Receipt, label: t("detail.invoiceReference"), value: inv.invoice_number });
    rows.push({ icon: Hash, label: t("detail.bookingReference"), value: inv.booking_number });
    rows.push({ icon: User, label: t("detail.provider"), value: inv.provider_name });
    rows.push({ icon: Wrench, label: t("detail.service"), value: inv.service_name ?? "—" });
    rows.push({
      icon: MapPin,
      label: t("detail.location"),
      value: inv.address_city ? `${inv.address_city}${inv.address_region ? `, ${inv.address_region}` : ""}` : "—",
    });
    rows.push({ icon: methodIcon(defaultMethod?.type), label: t("detail.paymentMethod"), value: methodLabel(defaultMethod) });
    rows.push({ icon: Wallet, label: t("detail.relatedAmount"), value: fmtMoney(inv.total_amount, inv.currency) });
  } else if (n.ref_id) {
    rows.push({ icon: Hash, label: t("detail.reference"), value: n.ref_id });
  }
  return rows;
}

function NotificationsPage() {
  const { t } = useTranslation("notifications");
  const { access_token, loading, logout, customer } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationRow[] | null>(null);
  const [defaultMethod, setDefaultMethod] = useState<PaymentMethod | null>(null);
  const [tab, setTab] = useState<Tab>("All");

  const [selected, setSelected] = useState<NotificationRow | null>(null);
  const [enrich, setEnrich] = useState<Enrichment | null>(null);
  const [enrichLoading, setEnrichLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await fixoSdk.notifications(false, 50, 0));
    } catch {
      setItems((prev) => prev ?? []);
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

  const filtered = useMemo(() => (items ?? []).filter((n) => matchesTab(n, tab)), [items, tab]);

  const siblings = useMemo(() => {
    if (!selected?.ref_type || !selected.ref_id) return [selected].filter(Boolean) as NotificationRow[];
    return (items ?? [])
      .filter((n) => n.ref_type === selected.ref_type && n.ref_id === selected.ref_id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [items, selected]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t("loading")}</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  async function markOne(id: string) {
    try {
      const res = await fixoSdk.markNotificationRead(id);
      if (res.marked) {
        setItems((prev) => prev?.map((n) => (n.notification_id === id ? { ...n, read_at: new Date().toISOString() } : n)) ?? null);
        setSelected((prev) => (prev && prev.notification_id === id ? { ...prev, read_at: new Date().toISOString() } : prev));
      }
    } catch {
      // toast emitted by client
    }
  }

  async function markAll() {
    try {
      const res = await fixoSdk.markAllNotificationsRead();
      toast.success(t("list.markedAsRead", { count: res.marked }));
      await load();
    } catch {
      // toast emitted by client
    }
  }

  async function openNotification(n: NotificationRow) {
    setSelected(n);
    setEnrich(null);
    if (!n.ref_id) return;
    setEnrichLoading(true);
    try {
      if (n.ref_type === "BOOKING") {
        setEnrich({ booking: await bookingApi.getBooking(n.ref_id) });
      } else if (n.ref_type === "INVOICE") {
        setEnrich({ invoice: await fixoSdk.getInvoice(n.ref_id) });
      }
    } catch {
      // no enrichment available — the panel just shows the base fields
    } finally {
      setEnrichLoading(false);
    }
  }

  function closeAll() {
    setSelected(null);
    setEnrich(null);
  }

  const totalThisMonth = (items ?? []).filter((n) => {
    const d = new Date(n.created_at);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const unreadCount = (items ?? []).filter((n) => !n.read_at).length;
  const bookingCount = (items ?? []).filter((n) => category(n.type) === "bookings").length;
  const paymentCount = (items ?? []).filter((n) => category(n.type) === "payments").length;

  const dialogOpen = !!selected && usesDialog(selected.type);
  const panelOpen = !!selected && !usesDialog(selected.type);

  return (
    <PageShell title={t("page.title")} subtitle={t("page.subtitle")} userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Bell} label={t("metrics.totalNotifications")} hint={t("metrics.thisMonth")} value={String(totalThisMonth)} />
        <MetricCard icon={Mail} label={t("metrics.unread")} hint={t("metrics.needsAttention")} value={String(unreadCount)} tone="amber" tintValue />
        <MetricCard icon={Calendar} label={t("metrics.bookingUpdates")} hint={t("metrics.serviceProgress")} value={String(bookingCount)} />
        <MetricCard icon={Wallet} label={t("metrics.paymentAlerts")} hint={t("metrics.recentBilling")} value={String(paymentCount)} tone="success" tintValue />
      </div>

      <div className="mt-6 flex min-h-0 flex-1 items-stretch gap-6">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-full flex-col rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">{t("list.heading")}</h3>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex gap-1 rounded-xl bg-muted p-1">
                  {TABS.map((tb) => (
                    <button
                      key={tb}
                      onClick={() => setTab(tb)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                        tab === tb ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                      style={tab === tb ? { backgroundImage: "var(--gradient-primary)" } : undefined}
                    >
                      {t(TAB_LABEL_KEYS[tb])}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => void markAll()} disabled={unreadCount === 0} className="gap-2">
                  <CheckCheck className="size-4" /> {t("list.markAllRead")}
                </Button>
              </div>
            </div>

            <div className="mt-4 flex-1 rounded-3xl bg-[#2f69d9] p-4">
            {items === null ? (
              <div className="h-72 animate-pulse rounded-[22px] bg-white/90" />
            ) : filtered.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-[22px] bg-white px-8 py-10 text-center shadow-lg">
                <span className="relative flex size-20 items-center justify-center text-[#2468c7]">
                  <span className="absolute h-px w-28 bg-[#dceaff]" />
                  <span className="absolute size-16 rounded-full bg-[#f4f8ff]" />
                  {tab !== "All" ? <FilterX className="relative size-10 stroke-[1.35]" /> : <Bell className="relative size-10 stroke-[1.35]" />}
                </span>
                <p className="mt-4 text-sm font-bold text-slate-900">{tab !== "All" ? t("list.noMatching") : t("list.allCaughtUp")}</p>
                <p className="mt-1 max-w-64 text-xs leading-5 text-slate-500">{tab !== "All" ? t("list.tryDifferentTab") : t("list.noNotificationsYet")}</p>
                <button onClick={() => setTab("All")} className="mt-6 min-w-44 rounded-full bg-[#2476f2] px-6 py-2.5 text-xs font-bold text-white shadow-[0_6px_14px_rgba(36,118,242,.28)] transition hover:bg-[#1266e7]">
                  {tab !== "All" ? t("list.showAll") : t("tabs.all")}
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((n) => {
                  const { Icon } = iconFor(n.type);
                  const badge = badgeFor(n, t);
                  const unread = !n.read_at;
                  return (
                    <button
                      key={n.notification_id}
                      onClick={() => void openNotification(n)}
                      className="relative flex min-h-72 w-full flex-col items-center rounded-[22px] bg-white px-5 py-6 text-center shadow-[0_12px_26px_rgba(10,45,105,.22)] transition hover:-translate-y-0.5"
                    >
                      {unread && <span className="absolute right-4 top-4 size-2.5 rounded-full bg-[#2476f2]" aria-label={t("list.new")} />}
                      <span className="relative flex size-20 items-center justify-center text-[#2468c7]">
                        <span className="absolute h-px w-28 bg-[#dceaff]" />
                        <span className="absolute size-16 rounded-full bg-[#f4f8ff]" />
                        <Icon className="relative size-10 stroke-[1.35]" />
                      </span>
                      <p className="mt-4 line-clamp-2 text-sm font-bold text-slate-900">{n.title}</p>
                      {n.body && <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-500">{n.body}</p>}
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                        <span title={fmtDateTime(n.created_at)}>{timeAgo(n.created_at)}</span>
                        {badge && <span className="rounded-full bg-[#edf4ff] px-2 py-0.5 font-semibold text-[#2468c7]">{badge.label}</span>}
                      </div>
                      <span className="mt-auto inline-flex min-w-40 items-center justify-center rounded-full bg-[#2476f2] px-5 py-2.5 text-xs font-bold text-white shadow-[0_6px_14px_rgba(36,118,242,.28)]">
                        {unread ? t("dialog.markAsRead") : t("panel.title")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Payment / invoice updates — squeeze panel, no overlay */}
        {panelOpen && selected && (
          <div className="flex h-full w-[380px] shrink-0 flex-col animate-in fade-in slide-in-from-right-4 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t("panel.title")}</h3>
              <button onClick={closeAll} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-5">
              <div className="flex items-start justify-between rounded-2xl bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const { Icon, tone } = iconFor(selected.type);
                    return (
                      <span className={`flex size-11 items-center justify-center rounded-2xl ${tone}`}>
                        <Icon className="size-5" />
                      </span>
                    );
                  })()}
                  <div>
                    <p className="font-semibold">{selected.title}</p>
                    {enrich?.booking?.service_name || enrich?.invoice?.service_name ? (
                      <p className="text-xs text-muted-foreground">{enrich.booking?.service_name ?? enrich.invoice?.service_name}</p>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  {badgeFor(selected, t) && (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeFor(selected, t)!.tone}`}>{badgeFor(selected, t)!.label}</span>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(selected.created_at)}</p>
                </div>
              </div>

              {enrichLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  {detailFields(selected, enrich, defaultMethod, t).map((f) => (
                    <Field key={f.label} icon={f.icon} label={f.label} value={f.value} />
                  ))}
                </div>
              )}

              <div>
                <h4 className="mb-3 text-sm font-semibold">{t("panel.whatHappened")}</h4>
                <ol className="space-y-3">
                  {siblings.map((s) => (
                    <TimelineStep key={s.notification_id} label={s.title} value={fmtDateTime(s.created_at)} />
                  ))}
                </ol>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
                <FileText className="mt-0.5 size-3.5 shrink-0 text-primary" />
                {t("panel.recordedNote")}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    toast.info(t("panel.findInvoiceToast"));
                    navigate({ to: "/invoices" });
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted"
                >
                  <FileText className="size-4" /> {t("panel.downloadInvoice")}
                </button>
                <button
                  onClick={() => navigate({ to: "/help" })}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted"
                >
                  <MessageCircle className="size-4" /> {t("panel.contactSupport")}
                </button>
              </div>

              <button
                onClick={closeAll}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                {t("panel.done")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking / service updates — centered dialog with overlay */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeAll()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("dialog.title")}</DialogTitle>
            <p className="text-sm text-muted-foreground">{t("dialog.subtitle")}</p>
          </DialogHeader>

          {selected && (
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-2xl bg-success/10 p-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const { Icon, tone } = iconFor(selected.type);
                    return (
                      <span className={`flex size-11 items-center justify-center rounded-2xl ${tone}`}>
                        <Icon className="size-5" />
                      </span>
                    );
                  })()}
                  <div>
                    <p className="font-semibold">{selected.title}</p>
                    {enrich?.booking && <p className="text-xs text-muted-foreground">{t("dialog.bookingLabel", { number: enrich.booking.booking_number })}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {badgeFor(selected, t) && (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeFor(selected, t)!.tone}`}>{badgeFor(selected, t)!.label}</span>
                  )}
                  <span className="text-sm text-muted-foreground">{timeAgo(selected.created_at)}</span>
                </div>
              </div>

              {enrichLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                  {detailFields(selected, enrich, defaultMethod, t).map((f) => (
                    <Field key={f.label} icon={f.icon} label={f.label} value={f.value} />
                  ))}
                </div>
              )}

              <div>
                <h4 className="mb-2 text-sm font-semibold">{t("dialog.message")}</h4>
                <p className="text-sm text-muted-foreground">{selected.body ?? t("dialog.noDetails")}</p>
              </div>

              <div>
                <div className="flex items-start">
                  {siblings.map((s, i) => (
                    <div key={s.notification_id} className="flex min-w-0 flex-1 flex-col items-center text-center">
                      <div className="flex w-full items-center">
                        <div className={`h-px flex-1 ${i === 0 ? "opacity-0" : "bg-success/40"}`} />
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-white">
                          <Check className="size-4" />
                        </span>
                        <div className={`h-px flex-1 ${i === siblings.length - 1 ? "opacity-0" : "bg-success/40"}`} />
                      </div>
                      <p className="mt-2 max-w-[8rem] text-xs font-medium">{s.title}</p>
                      <p className="text-[11px] text-muted-foreground">{fmtDateTime(s.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
                <MessageCircle className="mt-0.5 size-3.5 shrink-0 text-primary" />
                {t("dialog.respondNote")}
              </div>

              <div className="flex gap-2">
                <button onClick={closeAll} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted">
                  {t("dialog.close")}
                </button>
                {!selected.read_at && (
                  <button
                    onClick={() => void markOne(selected.notification_id)}
                    className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted"
                  >
                    {t("dialog.markAsRead")}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (enrich?.booking) toast.info(t("dialog.findBookingToast", { number: enrich.booking.booking_number }));
                    navigate({ to: "/bookings" });
                  }}
                  className="flex-1 rounded-xl py-3 text-sm font-semibold text-primary-foreground"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  {t("dialog.viewBooking")}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function TimelineStep({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success text-white">
        <Check className="size-3" />
      </span>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{value}</p>
      </div>
    </li>
  );
}
