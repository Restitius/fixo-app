// Help — support tickets and helpdesk, matching the reference: a squeeze
// ticket-detail panel (real conversation + a real derived timeline), a
// "Need help?" sidebar, and a richer New Ticket dialog.
import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  FileQuestion,
  FileText,
  HelpCircle,
  Info,
  Mail,
  MessageCircle,
  MessagesSquare,
  Paperclip,
  Plus,
  RotateCcw,
  Search,
  Send,
  Ticket,
  X,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type SupportTicket, type TicketMessage } from "@/lib/api-client";
import { fmtDate, fmtDateTime, humanize } from "@/lib/format";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

const title = "Help — FIXO";
const description = "Open support tickets and get help from the FIXO team.";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: HelpPage,
});

// The real backend enum (see SupportService._CATEGORIES) — the previous
// build used PAYMENT/PROVIDER, which aren't valid and would 400 on submit.
const CATEGORIES = ["GENERAL", "BILLING", "ACCOUNT", "TECHNICAL", "BOOKING", "OTHER"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const PAGE_SIZE = 8;

// SUPPORT_TICKETS has no related_booking_id column (a same-named query exists
// in the repo but was never migrated — it isn't registered or reachable) and
// there's no attachment storage for tickets. A booking reference the customer
// types in is real input we don't want to silently drop, so it's captured as
// a plain prefix on the first message instead of a fabricated linked record.
const REF_PREFIX = "Booking reference: ";

function statusStyle(status: string) {
  const s = status.toUpperCase();
  if (s === "RESOLVED" || s === "CLOSED") return "bg-success/15 text-success";
  if (s === "URGENT") return "bg-destructive/15 text-destructive";
  return "bg-primary/10 text-primary";
}

function priorityStyle(priority: string) {
  const p = priority.toUpperCase();
  if (p === "URGENT" || p === "HIGH") return "bg-destructive/15 text-destructive";
  if (p === "LOW") return "bg-success/15 text-success";
  return "bg-amber-500/15 text-amber-600";
}

function fmtDuration(ms: number, t: TFunction): string {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return t("help.metrics.durationMinutes", { count: mins });
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? t("help.metrics.durationHoursMinutes", { hours, minutes: rem }) : t("help.metrics.durationHours", { count: hours });
}

// Per-viewer "have I seen the latest support reply" state — nothing on the
// server tracks per-customer read state for tickets, so this lives in the
// browser the same way the Promotions redemption ledger does.
const VIEWED_KEY_PREFIX = "fixo.tickets_viewed.";

function loadViewed(customerId?: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(`${VIEWED_KEY_PREFIX}${customerId ?? "anon"}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function markViewed(customerId: string | undefined, ticketId: string) {
  const key = `${VIEWED_KEY_PREFIX}${customerId ?? "anon"}`;
  const current = loadViewed(customerId);
  current[ticketId] = new Date().toISOString();
  try {
    localStorage.setItem(key, JSON.stringify(current));
  } catch {
    // best-effort only
  }
  return current;
}

function isUnread(t: SupportTicket, viewed: Record<string, string>): boolean {
  if (!t.last_support_message_at) return false;
  const seenAt = viewed[t.ticket_id];
  return !seenAt || new Date(t.last_support_message_at).getTime() > new Date(seenAt).getTime();
}

function HelpPage() {
  const { t } = useTranslation("support");
  const { access_token, loading, logout, customer } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [openTicket, setOpenTicket] = useState<SupportTicket | null>(null);
  const [viewed, setViewed] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setTickets(await fixoSdk.listTickets(100, 0));
    } catch {
      setTickets((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    if (access_token && !loading) void load();
  }, [access_token, loading, load]);

  useEffect(() => {
    if (customer?.customer_id) setViewed(loadViewed(customer.customer_id));
  }, [customer?.customer_id]);

  const filtered = useMemo(
    () =>
      (tickets ?? []).filter((t) => {
        const matchesStatus = statusFilter === "all" || t.status === statusFilter;
        const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
        const matchesSearch = !search || [t.subject, t.ticket_number].some((f) => f.toLowerCase().includes(search.toLowerCase()));
        return matchesStatus && matchesCategory && matchesSearch;
      }),
    [tickets, statusFilter, categoryFilter, search],
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t("loading")}</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  function openAndMarkViewed(t: SupportTicket) {
    setOpenTicket(t);
    if (customer?.customer_id) setViewed(markViewed(customer.customer_id, t.ticket_id));
  }

  const openCount = (tickets ?? []).filter((t) => t.status === "OPEN").length;
  const resolvedCount = (tickets ?? []).filter((t) => t.status === "RESOLVED").length;
  const responded = (tickets ?? []).filter((t) => t.first_response_at);
  const avgResponseMs =
    responded.length > 0
      ? responded.reduce((s, t) => s + (new Date(t.first_response_at!).getTime() - new Date(t.created_at).getTime()), 0) / responded.length
      : 0;
  const unreadCount = (tickets ?? []).filter((t) => isUnread(t, viewed)).length;
  const dataLoaded = tickets !== null;

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all" || categoryFilter !== "all";

  return (
    <PageShell title={t("help.page.title")} subtitle={t("help.page.subtitle")} userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Ticket} label={t("help.metrics.openTickets")} hint={t("help.metrics.viewAllOpen")} value={dataLoaded ? String(openCount) : "—"} />
        <MetricCard icon={CheckCircle2} label={t("help.metrics.resolved")} hint={t("help.metrics.viewResolved")} value={dataLoaded ? String(resolvedCount) : "—"} tone="success" tintValue />
        <MetricCard icon={Clock} label={t("help.metrics.avgResponse")} hint={t("help.metrics.thisMonth")} value={dataLoaded ? (responded.length ? fmtDuration(avgResponseMs, t) : "—") : "—"} />
        <MetricCard icon={Mail} label={t("help.metrics.unreadReplies")} hint={t("help.metrics.viewReplies")} value={dataLoaded ? String(unreadCount) : "—"} tone="amber" tintValue />
      </div>

      <div className="mt-6 flex min-h-0 flex-1 items-stretch gap-6">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-full flex-col rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder={t("help.search.placeholder")}
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder={t("help.filters.allStatuses")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("help.filters.allStatuses")}</SelectItem>
                  <SelectItem value="OPEN">{t("help.filters.open")}</SelectItem>
                  <SelectItem value="RESOLVED">{t("help.filters.resolved")}</SelectItem>
                  <SelectItem value="CLOSED">{t("help.filters.closed")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder={t("help.filters.allCategories")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("help.filters.allCategories")}</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{humanize(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={() => setShowForm(true)}
                className="ml-auto flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-primary-foreground"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                <Plus className="size-4" /> {t("help.newTicket")}
              </button>
            </div>

            <div className="mt-4 flex flex-1 flex-col">
              {!dataLoaded ? (
                <div className="h-64 animate-pulse rounded-3xl bg-muted/60" />
              ) : filtered.length === 0 ? (
                hasActiveFilters ? (
                  <EmptyState compact icon={FileQuestion} title={t("help.empty.noMatchingTitle")} description={t("help.empty.noMatchingDescription")} actionLabel={t("help.empty.clearFilters")} onAction={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); }} />
                ) : (
                  <EmptyState
                    compact
                    icon={HelpCircle}
                    title={t("help.empty.noTicketsTitle")}
                    description={t("help.empty.noTicketsDescription")}
                    actionLabel={t("help.newTicket")}
                    onAction={() => setShowForm(true)}
                  />
                )
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <th className="py-3 font-semibold">{t("help.table.ticketNumber")}</th>
                          <th className="px-4 py-3 font-semibold">{t("help.table.subject")}</th>
                          <th className="px-4 py-3 font-semibold">{t("help.table.category")}</th>
                          <th className="px-4 py-3 font-semibold">{t("help.table.priority")}</th>
                          <th className="px-4 py-3 font-semibold">{t("help.table.status")}</th>
                          <th className="px-4 py-3 font-semibold">{t("help.table.updated")}</th>
                          <th className="px-4 py-3 font-semibold">{t("help.table.messages")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paged.map((t2) => {
                          const unread = isUnread(t2, viewed);
                          return (
                            <tr key={t2.ticket_id} onClick={() => openAndMarkViewed(t2)} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40">
                              <td className="py-3 font-semibold text-primary">
                                <span className="flex items-center gap-2">
                                  {unread && <span className="size-2 rounded-full bg-primary" />}
                                  {t2.ticket_number}
                                </span>
                              </td>
                              <td className="px-4 py-3">{t2.subject}</td>
                              <td className="px-4 py-3 text-muted-foreground">{humanize(t2.category)}</td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyle(t2.priority)}`}>{humanize(t2.priority)}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(t2.status)}`}>{humanize(t2.status)}</span>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{fmtDate(t2.updated_at)}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 text-muted-foreground">
                                  <MessagesSquare className="size-3.5" /> {t2.message_count ?? 0}
                                  {unread && <span className="size-1.5 rounded-full bg-primary" />}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      {t("help.table.showing", { from: (page - 1) * PAGE_SIZE + 1, to: Math.min(page * PAGE_SIZE, filtered.length), total: filtered.length })}
                    </p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40">‹</button>
                      <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{page}</span>
                      <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40">›</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {openTicket ? (
          <TicketDetailPanel ticket={openTicket} onClose={() => setOpenTicket(null)} onReplySent={load} />
        ) : (
          <HelpSidebar onNewTicket={() => setShowForm(true)} />
        )}
      </div>

      <NewTicketDialog
        open={showForm}
        onOpenChange={setShowForm}
        onCreated={(t) => {
          load();
          openAndMarkViewed(t);
        }}
      />
    </PageShell>
  );
}

function HelpSidebar({ onNewTicket }: { onNewTicket: () => void }) {
  const { t } = useTranslation("support");
  const navigate = useNavigate();
  const faqs = [
    { label: t("help.sidebar.faqs.createTicket"), onClick: () => toast.info(t("help.sidebar.faqToasts.createTicket")) },
    { label: t("help.sidebar.faqs.ticketStatus"), onClick: () => toast.info(t("help.sidebar.faqToasts.ticketStatus")) },
    { label: t("help.sidebar.faqs.refunds"), onClick: () => navigate({ to: "/payments" }) },
    { label: t("help.sidebar.faqs.paymentBilling"), onClick: () => navigate({ to: "/payments" }) },
  ];

  return (
    <div className="flex h-full w-[320px] shrink-0 flex-col rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
      <div>
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageCircle className="size-5" />
          </span>
          <div>
            <p className="font-semibold">{t("help.sidebar.needHelpTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("help.sidebar.needHelpDescription")}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 font-semibold">{t("help.sidebar.faqShortcuts")}</p>
        <div className="divide-y divide-border">
          {faqs.map((f) => (
            <button key={f.label} onClick={f.onClick} className="flex w-full items-center justify-between py-2.5 text-left text-sm hover:text-primary">
              {f.label} <span aria-hidden>›</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto border-t border-border pt-5">
        <p className="font-semibold">{t("help.sidebar.stillNeedHelpTitle")}</p>
        <p className="mb-3 text-sm text-muted-foreground">{t("help.sidebar.stillNeedHelpDescription")}</p>
        <button onClick={onNewTicket} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted">
          <HelpCircle className="size-4" /> {t("help.sidebar.contactSupport")}
        </button>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function TicketDetailPanel({ ticket, onClose, onReplySent }: { ticket: SupportTicket; onClose: () => void; onReplySent: () => void }) {
  const { t } = useTranslation("support");
  const navigate = useNavigate();
  const [messages, setMessages] = useState<TicketMessage[] | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [relatedBooking, setRelatedBooking] = useState<{
    booking_number: string;
    service_name?: string | null | undefined;
    provider_name?: string | null | undefined;
    scheduled_date?: string | null | undefined;
  } | null>(null);

  useEffect(() => {
    setMessages(null);
    setRelatedBooking(null);
    void fixoSdk.listTicketMessages(ticket.ticket_id).then(async (msgs) => {
      setMessages(msgs);
      const first = msgs[0];
      if (first?.body.startsWith(REF_PREFIX)) {
        const ref = first.body.slice(REF_PREFIX.length).split("\n")[0]?.trim().toUpperCase();
        if (ref) {
          try {
            const all = await fixoSdk.bookingHistory(undefined, 100, 0);
            const match = all.find((b) => b.booking_number.toUpperCase() === ref);
            if (match) {
              setRelatedBooking({
                booking_number: match.booking_number,
                service_name: match.service_name,
                provider_name: match.provider_name,
                scheduled_date: match.scheduled_date,
              });
            }
          } catch {
            // no matching booking — the reference is shown as free text only
          }
        }
      }
    });
  }, [ticket.ticket_id]);

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const msg = await fixoSdk.addTicketMessage(ticket.ticket_id, reply.trim());
      setMessages((prev) => [...(prev ?? []), msg]);
      setReply("");
      onReplySent();
    } catch {
      // toast emitted by client
    } finally {
      setSending(false);
    }
  }

  const timeline = useMemo(() => {
    const steps: { label: string; sub: string; done: boolean; current?: boolean }[] = [
      { label: t("help.detail.timeline.ticketCreated"), sub: fmtDateTime(ticket.created_at), done: true },
    ];
    for (const m of messages ?? []) {
      steps.push({
        label: m.sender === "SUPPORT" ? t("help.detail.timeline.supportReplied") : t("help.detail.timeline.youReplied"),
        sub: fmtDateTime(m.created_at),
        done: true,
      });
    }
    const lastSender = messages && messages.length > 0 ? messages[messages.length - 1]!.sender : null;
    if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
      steps.push({ label: humanize(ticket.status), sub: fmtDateTime(ticket.updated_at), done: true });
    } else if (lastSender === "SUPPORT") {
      steps.push({ label: t("help.detail.timeline.awaitingCustomer"), sub: t("help.detail.timeline.respondToContinue"), done: false, current: true });
    } else {
      steps.push({ label: t("help.detail.timeline.resolved"), sub: t("help.detail.timeline.pending"), done: false });
    }
    return steps;
  }, [ticket, messages, t]);

  return (
    <div className="flex h-full w-[420px] shrink-0 flex-col animate-in fade-in slide-in-from-right-4 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <span className="size-2 rounded-full bg-primary" /> {ticket.ticket_number}
          </p>
          <h3 className="mt-1 text-lg font-semibold">{ticket.subject}</h3>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-muted/40 p-3">
        <Field icon={FileText} label={t("help.detail.category")} value={humanize(ticket.category)} />
        <Field icon={Info} label={t("help.detail.priority")} value={humanize(ticket.priority)} />
        <Field icon={CheckCircle2} label={t("help.detail.status")} value={humanize(ticket.status)} />
        <Field icon={Clock} label={t("help.detail.lastUpdated")} value={fmtDateTime(ticket.updated_at)} />
      </div>

      {relatedBooking && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field icon={Calendar} label={t("help.detail.relatedTo")} value={`${relatedBooking.service_name ?? t("help.detail.bookingFallback")} · ${fmtDate(relatedBooking.scheduled_date)}`} />
          <Field icon={CheckCircle2} label={t("help.detail.provider")} value={relatedBooking.provider_name ?? "—"} />
        </div>
      )}

      <div className="mt-5">
        <h4 className="mb-2 text-sm font-semibold">{t("help.detail.conversation")}</h4>
        <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
          {messages === null ? (
            <p className="text-sm text-muted-foreground">{t("help.detail.loadingMessages")}</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("help.detail.noMessages")}</p>
          ) : (
            messages.map((m) => {
              const body = m.body.startsWith(REF_PREFIX) ? m.body.split("\n").slice(1).join("\n").trim() || m.body : m.body;
              return (
                <div key={m.message_id} className={`max-w-[85%] rounded-2xl p-3 text-sm ${m.sender === "CUSTOMER" ? "ml-auto bg-primary/10" : "bg-muted/50"}`}>
                  <p>{body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(m.created_at)}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-5">
        <h4 className="mb-3 text-sm font-semibold">{t("help.detail.timeline.title")}</h4>
        <ol className="space-y-3">
          {timeline.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${s.done ? "bg-success text-white" : s.current ? "border-2 border-primary text-primary" : "border-2 border-border text-muted-foreground"}`}>
                {s.done ? <Check className="size-3" /> : <Circle className="size-2 fill-current" />}
              </span>
              <div>
                <p className={`text-sm font-medium ${s.done || s.current ? "" : "text-muted-foreground"}`}>{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {ticket.status !== "CLOSED" ? (
        <div className="mt-auto border-t border-border pt-4">
          <p className="mb-2 text-sm font-semibold">{t("help.detail.replyToCustomer")}</p>
          <div className="flex items-end gap-2">
            <button onClick={() => toast.info(t("help.detail.attachmentsNotAvailable"))} className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted">
              <Paperclip className="size-4" />
            </button>
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t("help.detail.replyPlaceholder")} className="min-h-10 flex-1" />
            <button onClick={() => void sendReply()} disabled={sending || !reply.trim()} className="flex size-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground disabled:opacity-50" style={{ backgroundImage: "var(--gradient-primary)" }}>
              <Send className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-auto flex items-center gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          <RotateCcw className="size-3.5" /> {t("help.detail.closedNotice")}
          <button onClick={() => navigate({ to: "/help" })} className="ml-auto font-semibold text-primary hover:underline">{t("help.newTicket")}</button>
        </div>
      )}
    </div>
  );
}

function NewTicketDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (t: SupportTicket) => void }) {
  const { t } = useTranslation("support");
  const [subject, setSubject] = useState("");
  const [bookingRef, setBookingRef] = useState("");
  const [category, setCategory] = useState<string>("GENERAL");
  const [priority, setPriority] = useState<string>("MEDIUM");
  const [message, setMessage] = useState("");
  const [photoNames, setPhotoNames] = useState<string[]>([]);
  const [contactPref, setContactPref] = useState<"EMAIL" | "IN_APP">("EMAIL");
  const [creating, setCreating] = useState(false);

  function reset() {
    setSubject("");
    setBookingRef("");
    setCategory("GENERAL");
    setPriority("MEDIUM");
    setMessage("");
    setPhotoNames([]);
  }

  async function submit() {
    if (subject.trim().length < 3) {
      toast.error(t("help.dialog.subjectTooShort"));
      return;
    }
    if (message.trim().length < 1) {
      toast.error(t("help.dialog.describeIssue"));
      return;
    }
    setCreating(true);
    try {
      const ticket = await fixoSdk.createTicket(subject.trim(), category, priority);
      const body = bookingRef.trim() ? `${REF_PREFIX}${bookingRef.trim()}\n${message.trim()}` : message.trim();
      await fixoSdk.addTicketMessage(ticket.ticket_id, body.slice(0, 4000));
      void fixoSdk.setPreference("SUPPORT_CONTACT_PREFERENCE", contactPref).catch(() => {});
      if (photoNames.length > 0) {
        toast.info(t("help.dialog.attachmentsNotAvailable"));
      }
      toast.success(t("help.dialog.ticketOpened"));
      reset();
      onOpenChange(false);
      onCreated(ticket);
    } catch {
      // toast emitted by client
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t("help.dialog.title")}</DialogTitle>
          <p className="text-sm text-muted-foreground">{t("help.dialog.subtitle")}</p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("help.dialog.subjectLabel")}</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("help.dialog.subjectPlaceholder")} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("help.dialog.bookingReferenceLabel")}</Label>
              <Input value={bookingRef} onChange={(e) => setBookingRef(e.target.value)} placeholder={t("help.dialog.bookingReferencePlaceholder")} />
              <p className="text-xs text-muted-foreground">{t("help.dialog.optional")}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("help.dialog.categoryLabel")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{humanize(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("help.dialog.priorityLabel")}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{humanize(p)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("help.dialog.messageLabel")}</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 2000))} placeholder={t("help.dialog.messagePlaceholder")} className="min-h-28" />
            <p className="text-right text-xs text-muted-foreground">{message.length}/2000</p>
          </div>

          <label className="block cursor-pointer space-y-1.5">
            <Label>{t("help.dialog.attachmentLabel")}</Label>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-border py-6 text-center">
              <Paperclip className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {photoNames.length > 0 ? t("help.dialog.filesSelected", { count: photoNames.length }) : (<>{t("help.dialog.dragDropPrefix")} <span className="font-semibold text-primary">{t("help.dialog.browse")}</span></>)}
              </p>
              <p className="text-xs text-muted-foreground">{t("help.dialog.maxFileSize")}</p>
            </div>
            <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={(e) => setPhotoNames(Array.from(e.target.files ?? []).map((f) => f.name))} />
          </label>

          <div className="space-y-1.5">
            <Label>{t("help.dialog.contactMethodLabel")}</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setContactPref("EMAIL")}
                className={`flex items-start gap-2 rounded-xl border p-3 text-left ${contactPref === "EMAIL" ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <Mail className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{t("help.dialog.contactEmailTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("help.dialog.contactEmailHint")}</p>
                </div>
              </button>
              <button
                onClick={() => setContactPref("IN_APP")}
                className={`flex items-start gap-2 rounded-xl border p-3 text-left ${contactPref === "IN_APP" ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <MessageCircle className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{t("help.dialog.contactInAppTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("help.dialog.contactInAppHint")}</p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {t("help.dialog.responseTimeNote")}
          </div>

          <div className="flex gap-2">
            <button onClick={() => onOpenChange(false)} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted">{t("help.dialog.cancel")}</button>
            <button
              onClick={() => void submit()}
              disabled={creating}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              <Send className="size-4" /> {creating ? t("help.dialog.submitting") : t("help.dialog.submit")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
