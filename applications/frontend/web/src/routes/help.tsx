// Help — support tickets: create, browse and message a real helpdesk thread.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, Plus, Send } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type SupportTicket, type TicketMessage } from "@/lib/api-client";
import { fmtDateTime, humanize } from "@/lib/format";
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

const CATEGORIES = ["GENERAL", "BOOKING", "PAYMENT", "ACCOUNT", "PROVIDER"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

function statusStyle(status: string) {
  const s = status.toUpperCase();
  if (s === "RESOLVED" || s === "CLOSED") return "bg-success/15 text-success";
  if (s === "URGENT") return "bg-destructive/15 text-destructive";
  return "bg-primary/10 text-primary";
}

function HelpPage() {
  const { access_token, loading, logout, customer } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ subject: "", category: "GENERAL" as string, priority: "MEDIUM" as string });
  const [openId, setOpenId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, TicketMessage[]>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setTickets(await fixoSdk.listTickets(50, 0));
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

  async function createTicket() {
    if (draft.subject.trim().length < 3) {
      toast.error("Subject must be at least 3 characters");
      return;
    }
    setCreating(true);
    try {
      await fixoSdk.createTicket(draft.subject.trim(), draft.category, draft.priority);
      toast.success("Support ticket opened");
      setDraft({ subject: "", category: "GENERAL", priority: "MEDIUM" });
      setShowForm(false);
      load();
    } catch {
      // toast emitted by client
    } finally {
      setCreating(false);
    }
  }

  async function toggle(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (!messages[id]) {
      try {
        const msgs = await fixoSdk.listTicketMessages(id);
        setMessages((prev) => ({ ...prev, [id]: msgs }));
      } catch {
        // toast emitted by client
      }
    }
  }

  async function sendReply(id: string) {
    const body = (replyDrafts[id] ?? "").trim();
    if (!body) return;
    setSending(id);
    try {
      const msg = await fixoSdk.addTicketMessage(id, body);
      setMessages((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), msg] }));
      setReplyDrafts((prev) => ({ ...prev, [id]: "" }));
    } catch {
      // toast emitted by client
    } finally {
      setSending(null);
    }
  }

  return (
    <PageShell title="Help" subtitle="Support tickets and helpdesk" userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          <Plus className="size-4" /> New Ticket
        </Button>
      </div>

      {showForm && (
        <div className="mt-4 space-y-3 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] animate-in fade-in slide-in-from-top-1">
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input
              value={draft.subject}
              onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
              placeholder="What do you need help with?"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={draft.category} onValueChange={(v) => setDraft((d) => ({ ...d, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {humanize(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={draft.priority} onValueChange={(v) => setDraft((d) => ({ ...d, priority: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {humanize(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button disabled={creating} onClick={() => void createTicket()}>
              {creating ? "Opening..." : "Open Ticket"}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6">
        {tickets === null ? (
          <LoadingRows />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title="No support tickets"
            description="Need help with a booking, payment or your account? Open a ticket and we'll get back to you."
            actionLabel="New Ticket"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="space-y-3">
            {tickets.map((t, i) => (
              <div
                key={t.ticket_id}
                style={{ animationDelay: `${i * 40}ms` }}
                className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-3xl bg-card shadow-[var(--shadow-card)]"
              >
                <button
                  onClick={() => void toggle(t.ticket_id)}
                  className="flex w-full flex-col gap-2 p-5 text-left sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{t.subject}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle(t.status)}`}>
                        {humanize(t.status)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {t.ticket_number} · {humanize(t.category)} · {humanize(t.priority)} priority
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-muted-foreground">{t.message_count ?? 0} messages</p>
                    {openId === t.ticket_id ? (
                      <ChevronUp className="size-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {openId === t.ticket_id && (
                  <div className="border-t border-border px-5 py-4">
                    {!messages[t.ticket_id] ? (
                      <p className="text-sm text-muted-foreground">Loading…</p>
                    ) : (
                      <div className="space-y-3">
                        {messages[t.ticket_id]!.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No messages yet.</p>
                        ) : (
                          messages[t.ticket_id]!.map((m) => (
                            <div
                              key={m.message_id}
                              className={`max-w-md rounded-2xl p-3 text-sm ${
                                m.sender === "CUSTOMER"
                                  ? "ml-auto bg-primary/10 text-right"
                                  : "bg-muted/50"
                              }`}
                            >
                              <p>{m.body}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(m.created_at)}</p>
                            </div>
                          ))
                        )}
                        {t.status !== "CLOSED" && (
                          <div className="flex gap-2 pt-2">
                            <Input
                              value={replyDrafts[t.ticket_id] ?? ""}
                              onChange={(e) =>
                                setReplyDrafts((prev) => ({ ...prev, [t.ticket_id]: e.target.value }))
                              }
                              placeholder="Type a message..."
                              onKeyDown={(e) => e.key === "Enter" && void sendReply(t.ticket_id)}
                            />
                            <Button
                              size="icon"
                              disabled={sending === t.ticket_id}
                              onClick={() => void sendReply(t.ticket_id)}
                            >
                              <Send className="size-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
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
      {[0, 1].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-3xl bg-muted/60" />
      ))}
    </div>
  );
}
