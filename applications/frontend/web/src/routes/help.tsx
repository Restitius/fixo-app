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

function fmtDuration(ms: number): string {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hours}h ${rem}m` : `${hours}h`;
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
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
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
    <PageShell title="Help" subtitle="Support tickets and helpdesk" userName={customer?.full_name} onLogout={logout}>
      <div className="flex gap-6">
        <div className="min-w-0 flex-1">
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Ticket} label="Open Tickets" hint="View all open" value={dataLoaded ? String(openCount) : "—"} />
            <MetricCard icon={CheckCircle2} label="Resolved" hint="View resolved" value={dataLoaded ? String(resolvedCount) : "—"} tone="success" tintValue />
            <MetricCard icon={Clock} label="Avg Response" hint="This month" value={dataLoaded ? (responded.length ? fmtDuration(avgResponseMs) : "—") : "—"} />
            <MetricCard icon={Mail} label="Unread Replies" hint="View replies" value={dataLoaded ? String(unreadCount) : "—"} tone="amber" tintValue />
          </div>

          <div className="mt-6 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[200px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search tickets..."
                  className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
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
                <Plus className="size-4" /> New Ticket
              </button>
            </div>

            <div className="mt-4">
              {!dataLoaded ? (
                <div className="h-64 animate-pulse rounded-3xl bg-muted/60" />
              ) : filtered.length === 0 ? (
                hasActiveFilters ? (
                  <EmptyState compact icon={FileQuestion} title="No matching tickets" description="Try adjusting your search or filters." actionLabel="Clear Filters" onAction={() => { setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); }} />
                ) : (
                  <EmptyState
                    compact
                    icon={HelpCircle}
                    title="No support tickets"
                    description="Need help with a booking, payment or your account? Open a ticket and we'll get back to you."
                    actionLabel="New Ticket"
                    onAction={() => setShowForm(true)}
                  />
                )
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <th className="py-3 font-semibold">Ticket #</th>
                          <th className="px-4 py-3 font-semibold">Subject</th>
                          <th className="px-4 py-3 font-semibold">Category</th>
                          <th className="px-4 py-3 font-semibold">Priority</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold">Updated</th>
                          <th className="px-4 py-3 font-semibold">Messages</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paged.map((t) => {
                          const unread = isUnread(t, viewed);
                          return (
                            <tr key={t.ticket_id} onClick={() => openAndMarkViewed(t)} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40">
                              <td className="py-3 font-semibold text-primary">
                                <span className="flex items-center gap-2">
                                  {unread && <span className="size-2 rounded-full bg-primary" />}
                                  {t.ticket_number}
                                </span>
                              </td>
                              <td className="px-4 py-3">{t.subject}</td>
                              <td className="px-4 py-3 text-muted-foreground">{humanize(t.category)}</td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyle(t.priority)}`}>{humanize(t.priority)}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(t.status)}`}>{humanize(t.status)}</span>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{fmtDate(t.updated_at)}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 text-muted-foreground">
                                  <MessagesSquare className="size-3.5" /> {t.message_count ?? 0}
                                  {unread && <span className="size-1.5 rounded-full bg-primary" />}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} tickets
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
  const navigate = useNavigate();
  const faqs = [
    { label: "How to create a ticket", onClick: () => toast.info("Click \"New Ticket\" above, fill in the subject and message, and submit.") },
    { label: "Understanding ticket status", onClick: () => toast.info("Open = awaiting a reply. Resolved = the team considers it solved. Closed = the thread is archived.") },
    { label: "Refund and cancellations", onClick: () => navigate({ to: "/payments" }) },
    { label: "Payment & billing help", onClick: () => navigate({ to: "/payments" }) },
  ];

  return (
    <div className="mt-6 w-[320px] shrink-0 space-y-6 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
      <div>
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MessageCircle className="size-5" />
          </span>
          <div>
            <p className="font-semibold">Need help?</p>
            <p className="text-sm text-muted-foreground">Find quick answers or get in touch with our support team.</p>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 font-semibold">FAQ shortcuts</p>
        <div className="divide-y divide-border">
          {faqs.map((f) => (
            <button key={f.label} onClick={f.onClick} className="flex w-full items-center justify-between py-2.5 text-left text-sm hover:text-primary">
              {f.label} <span aria-hidden>›</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="font-semibold">Still need help?</p>
        <p className="mb-3 text-sm text-muted-foreground">Our support team is here for you.</p>
        <button onClick={onNewTicket} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted">
          <HelpCircle className="size-4" /> Contact Support
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
      { label: "Ticket created", sub: fmtDateTime(ticket.created_at), done: true },
    ];
    for (const m of messages ?? []) {
      steps.push({
        label: m.sender === "SUPPORT" ? "Support replied" : "You replied",
        sub: fmtDateTime(m.created_at),
        done: true,
      });
    }
    const lastSender = messages && messages.length > 0 ? messages[messages.length - 1]!.sender : null;
    if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
      steps.push({ label: humanize(ticket.status), sub: fmtDateTime(ticket.updated_at), done: true });
    } else if (lastSender === "SUPPORT") {
      steps.push({ label: "Awaiting customer", sub: "Respond to continue", done: false, current: true });
    } else {
      steps.push({ label: "Resolved", sub: "Pending", done: false });
    }
    return steps;
  }, [ticket, messages]);

  return (
    <div className="mt-6 w-[420px] shrink-0 animate-in fade-in slide-in-from-right-4 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
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
        <Field icon={FileText} label="Category" value={humanize(ticket.category)} />
        <Field icon={Info} label="Priority" value={humanize(ticket.priority)} />
        <Field icon={CheckCircle2} label="Status" value={humanize(ticket.status)} />
        <Field icon={Clock} label="Last updated" value={fmtDateTime(ticket.updated_at)} />
      </div>

      {relatedBooking && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field icon={Calendar} label="Related to" value={`${relatedBooking.service_name ?? "Booking"} · ${fmtDate(relatedBooking.scheduled_date)}`} />
          <Field icon={CheckCircle2} label="Provider" value={relatedBooking.provider_name ?? "—"} />
        </div>
      )}

      <div className="mt-5">
        <h4 className="mb-2 text-sm font-semibold">Conversation</h4>
        <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
          {messages === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet.</p>
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
        <h4 className="mb-3 text-sm font-semibold">Ticket Timeline</h4>
        <ol className="space-y-3">
          {timeline.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${s.done ? "bg-primary text-primary-foreground" : s.current ? "border-2 border-primary text-primary" : "border-2 border-border text-muted-foreground"}`}>
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
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-2 text-sm font-semibold">Reply to customer</p>
          <div className="flex items-end gap-2">
            <button onClick={() => toast.info("Attachments aren't available on ticket replies yet.")} className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-muted">
              <Paperclip className="size-4" />
            </button>
            <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your message..." className="min-h-10 flex-1" />
            <button onClick={() => void sendReply()} disabled={sending || !reply.trim()} className="flex size-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground disabled:opacity-50" style={{ backgroundImage: "var(--gradient-primary)" }}>
              <Send className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          <RotateCcw className="size-3.5" /> This ticket is closed. Open a new ticket if you need further help.
          <button onClick={() => navigate({ to: "/help" })} className="ml-auto font-semibold text-primary hover:underline">New Ticket</button>
        </div>
      )}
    </div>
  );
}

function NewTicketDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (t: SupportTicket) => void }) {
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
      toast.error("Subject must be at least 3 characters");
      return;
    }
    if (message.trim().length < 1) {
      toast.error("Describe the issue before submitting");
      return;
    }
    setCreating(true);
    try {
      const ticket = await fixoSdk.createTicket(subject.trim(), category, priority);
      const body = bookingRef.trim() ? `${REF_PREFIX}${bookingRef.trim()}\n${message.trim()}` : message.trim();
      await fixoSdk.addTicketMessage(ticket.ticket_id, body.slice(0, 4000));
      void fixoSdk.setPreference("SUPPORT_CONTACT_PREFERENCE", contactPref).catch(() => {});
      if (photoNames.length > 0) {
        toast.info("Attachments aren't available yet — your ticket and message were saved.");
      }
      toast.success("Support ticket opened");
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
      <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>New Support Ticket</DialogTitle>
          <p className="text-sm text-muted-foreground">Tell us what went wrong and our team will help.</p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Subject *</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Briefly describe your issue" />
            </div>
            <div className="space-y-1.5">
              <Label>Booking reference</Label>
              <Input value={bookingRef} onChange={(e) => setBookingRef(e.target.value)} placeholder="e.g. BK-123456" />
              <p className="text-xs text-muted-foreground">Optional</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{humanize(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority *</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{humanize(p)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Message *</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 2000))} placeholder="Provide as much detail as possible..." className="min-h-28" />
            <p className="text-right text-xs text-muted-foreground">{message.length}/2000</p>
          </div>

          <label className="block cursor-pointer space-y-1.5">
            <Label>Attachment (optional)</Label>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-border py-6 text-center">
              <Paperclip className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {photoNames.length > 0 ? `${photoNames.length} file(s) selected` : (<>Drag and drop files here or <span className="font-semibold text-primary">browse</span></>)}
              </p>
              <p className="text-xs text-muted-foreground">Max 5MB per file (PDF, JPG, PNG)</p>
            </div>
            <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={(e) => setPhotoNames(Array.from(e.target.files ?? []).map((f) => f.name))} />
          </label>

          <div className="space-y-1.5">
            <Label>How would you like us to contact you? *</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setContactPref("EMAIL")}
                className={`flex items-start gap-2 rounded-xl border p-3 text-left ${contactPref === "EMAIL" ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <Mail className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Email</p>
                  <p className="text-xs text-muted-foreground">We'll reply to your email</p>
                </div>
              </button>
              <button
                onClick={() => setContactPref("IN_APP")}
                className={`flex items-start gap-2 rounded-xl border p-3 text-left ${contactPref === "IN_APP" ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <MessageCircle className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold">In-app</p>
                  <p className="text-xs text-muted-foreground">We'll reply in your inbox</p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Our team typically responds within 1-2 business hours.
          </div>

          <div className="flex gap-2">
            <button onClick={() => onOpenChange(false)} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted">Cancel</button>
            <button
              onClick={() => void submit()}
              disabled={creating}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              <Send className="size-4" /> {creating ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
