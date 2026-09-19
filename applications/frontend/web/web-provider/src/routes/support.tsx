import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, PhoneCall, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TableCard, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { fmtDateTime } from "@/lib/format";
import { supportApi, type SupportMessage, type SupportTicket, type TicketCategory, type TicketPriority } from "@/lib/api-client";

const title = "Support — FIXO Provider";
const description = "Raise support tickets and reach the provider helpline.";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SupportPage,
});

const CATEGORIES: TicketCategory[] = ["GENERAL", "BILLING", "ACCOUNT", "TECHNICAL", "BOOKING", "PAYOUT", "OTHER"];
const PRIORITIES: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const faqs = [
  { q: "When do I get paid?", a: "Funds clear to your wallet after customer sign-off, usually within 24 hours." },
  { q: "What happens if a customer cancels?", a: "Cancellations inside 2 hours of the slot may attract a compensation fee paid to you." },
  { q: "Can I decline a matched request?", a: "Yes, but a low acceptance rate reduces your ranking in future matches." },
];

function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("GENERAL");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [firstMessage, setFirstMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openTicket, setOpenTicket] = useState<SupportTicket | null>(null);

  function load() {
    return supportApi.listTickets(50, 0).then(setTickets);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function submitTicket() {
    if (subject.trim().length < 3) {
      toast.error("Subject must be at least 3 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const ticket = await supportApi.createTicket({ subject: subject.trim(), category, priority });
      if (firstMessage.trim()) await supportApi.addMessage(ticket.ticket_id, firstMessage.trim());
      setSubject("");
      setFirstMessage("");
      await load();
      toast.success("Ticket submitted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProviderPage title="Support" subtitle="Help and the provider helpline in one place.">
      <div className="mt-6 grid gap-4 pb-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <TableCard className="mt-0">
            <div className="px-6 pt-5">
              <h2 className="text-base font-bold tracking-tight">Your tickets</h2>
            </div>
            {!loading && tickets.length === 0 && <p className="px-6 py-8 text-center text-sm text-muted-foreground">No tickets yet.</p>}
            {tickets.length > 0 && (
              <TableScroll minWidth={640}>
                <TableHead columns={["Ticket", "Subject", "Category", "Status", "Updated"]} />
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.ticket_id} onClick={() => setOpenTicket(t)} className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50">
                      <td className="px-6 py-4 font-semibold">{t.ticket_number}</td>
                      <td className="px-4 py-4">{t.subject}</td>
                      <td className="px-4 py-4 text-muted-foreground">{t.category}</td>
                      <td className="px-4 py-4">
                        <StatusPill tone={t.status === "CLOSED" ? "muted" : "amber"} label={t.status} />
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{fmtDateTime(t.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </TableScroll>
            )}
          </TableCard>

          <Panel title="New support ticket">
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)} className="h-11 rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0) + c.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} className="h-11 rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30">
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="mt-3 h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
            <textarea
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              rows={4}
              placeholder="Describe the issue... (optional)"
              className="mt-3 w-full rounded-xl border border-input bg-card p-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            />
            <button
              onClick={() => void submitTicket()}
              disabled={submitting}
              className="mt-3 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              {submitting ? "Submitting…" : "Submit ticket"}
            </button>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Safety">
            <button
              onClick={() => {
                setCategory("GENERAL");
                setPriority("URGENT");
                setSubject("Unsafe job site — ");
              }}
              className="flex w-full items-center gap-3 rounded-2xl bg-muted/50 p-4 text-left hover:bg-muted"
            >
              <ShieldAlert className="size-5 text-primary shrink-0" />
              <span>
                <span className="block text-sm font-semibold">Report an unsafe job site</span>
                <span className="block text-xs text-muted-foreground">Opens an urgent support ticket below</span>
              </span>
            </button>
            <a href="tel:+255800110220" className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-muted/50 p-4 text-left hover:bg-muted">
              <PhoneCall className="size-5 text-primary shrink-0" />
              <span>
                <span className="block text-sm font-semibold">Call provider hotline</span>
                <span className="block text-xs text-muted-foreground">+255 800 110 220</span>
              </span>
            </a>
          </Panel>

          <Panel title="FAQs">
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="rounded-2xl bg-muted/50 p-4">
                  <summary className="cursor-pointer text-sm font-semibold">{f.q}</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </Panel>

          <Panel title="Contact">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LifeBuoy className="size-4 text-primary" /> providers@fixo.co.tz
            </p>
            <p className="mt-2 text-sm text-muted-foreground">+255 800 110 220 · 24/7 for active jobs</p>
          </Panel>
        </div>
      </div>

      {openTicket && <TicketThread ticket={openTicket} onClose={() => setOpenTicket(null)} onUpdated={load} />}
    </ProviderPage>
  );
}

function TicketThread({ ticket, onClose, onUpdated }: { ticket: SupportTicket; onClose: () => void; onUpdated: () => void }) {
  const [messages, setMessages] = useState<SupportMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const closed = ticket.status === "CLOSED";

  useEffect(() => {
    supportApi.listMessages(ticket.ticket_id, 100, 0).then(setMessages).catch(() => setMessages([]));
  }, [ticket.ticket_id]);

  async function send() {
    if (!draft.trim()) return;
    setSending(true);
    try {
      const sent = await supportApi.addMessage(ticket.ticket_id, draft.trim());
      setMessages((prev) => [...(prev ?? []), sent]);
      setDraft("");
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-card" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-border p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold">{ticket.subject}</h2>
            <StatusPill tone={closed ? "muted" : "amber"} label={ticket.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {ticket.ticket_number} · {ticket.category} · {ticket.priority}
          </p>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages === null ? (
            <p className="text-center text-sm text-muted-foreground">Loading…</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No messages yet.</p>
          ) : (
            messages.map((m) => (
              <div key={m.message_id} className={`flex ${m.sender === "PROVIDER" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.sender === "PROVIDER" ? "text-primary-foreground" : "bg-muted"}`} style={m.sender === "PROVIDER" ? { backgroundImage: "var(--gradient-primary)" } : undefined}>
                  <p>{m.body}</p>
                  <p className={`mt-1 text-[11px] ${m.sender === "PROVIDER" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{fmtDateTime(m.created_at)}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-border p-4">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void send()}
            disabled={closed}
            placeholder={closed ? "This ticket is closed" : "Write a message…"}
            className="h-11 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
          />
          <button onClick={() => void send()} disabled={closed || sending || !draft.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary-foreground disabled:opacity-50" style={{ backgroundImage: "var(--gradient-primary)" }}>
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
