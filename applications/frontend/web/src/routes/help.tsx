// Help — support tickets: create, browse and message a real helpdesk thread.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FilterX, HelpCircle, Plus, Send } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableFilterBar, TableCard, TableScroll, TableHead, TablePagination } from "@/components/dashboard/DataTable";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

const CATEGORIES = ["GENERAL", "BOOKING", "PAYMENT", "ACCOUNT", "PROVIDER"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const PAGE_SIZE = 8;

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
  const [openTicket, setOpenTicket] = useState<SupportTicket | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

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

  const filtered = useMemo(
    () =>
      (tickets ?? []).filter((t) => {
        const matchesStatus = statusFilter === "all" || t.status === statusFilter;
        const matchesSearch = !search || [t.subject, t.ticket_number].some((f) => f.toLowerCase().includes(search.toLowerCase()));
        return matchesStatus && matchesSearch;
      }),
    [tickets, statusFilter, search],
  );

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

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all";

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

      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search tickets..."
        filters={[
          {
            value: statusFilter,
            onChange: (v) => { setStatusFilter(v); setPage(1); },
            placeholder: "Status",
            options: [
              { value: "all", label: "All Statuses" },
              { value: "OPEN", label: "Open" },
              { value: "RESOLVED", label: "Resolved" },
              { value: "CLOSED", label: "Closed" },
            ],
          },
        ]}
      />

      {tickets === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState icon={FilterX} title="No matching tickets" description="Try adjusting your search or filters." actionLabel="Clear Filters" onAction={() => { setSearch(""); setStatusFilter("all"); }} />
          ) : (
            <EmptyState
              icon={HelpCircle}
              title="No support tickets"
              description="Need help with a booking, payment or your account? Open a ticket and we'll get back to you."
              actionLabel="New Ticket"
              onAction={() => setShowForm(true)}
            />
          )}
        </div>
      ) : (
        <TableCard>
          <TableScroll minWidth={780}>
            <TableHead columns={["Ticket #", "Subject", "Category", "Priority", "Status", "Messages"]} />
            <tbody>
              {paged.map((t) => (
                <tr key={t.ticket_id} onClick={() => setOpenTicket(t)} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-6 py-4 font-semibold text-primary">{t.ticket_number}</td>
                  <td className="px-4 py-4">{t.subject}</td>
                  <td className="px-4 py-4 text-muted-foreground">{humanize(t.category)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{humanize(t.priority)}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(t.status)}`}>{humanize(t.status)}</span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{t.message_count ?? 0}</td>
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
            itemLabel="tickets"
          />
        </TableCard>
      )}

      <TicketThreadSheet ticket={openTicket} onOpenChange={(o) => !o && setOpenTicket(null)} />
    </PageShell>
  );
}

function TicketThreadSheet({ ticket, onOpenChange }: { ticket: SupportTicket | null; onOpenChange: (open: boolean) => void }) {
  const [messages, setMessages] = useState<TicketMessage[] | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!ticket) {
      setMessages(null);
      setReply("");
      return;
    }
    let cancelled = false;
    fixoSdk.listTicketMessages(ticket.ticket_id).then((msgs) => {
      if (!cancelled) setMessages(msgs);
    });
    return () => {
      cancelled = true;
    };
  }, [ticket]);

  async function sendReply() {
    if (!ticket || !reply.trim()) return;
    setSending(true);
    try {
      const msg = await fixoSdk.addTicketMessage(ticket.ticket_id, reply.trim());
      setMessages((prev) => [...(prev ?? []), msg]);
      setReply("");
    } catch {
      // toast emitted by client
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet open={!!ticket} onOpenChange={(o) => !o && onOpenChange(false)}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{ticket?.subject}</SheetTitle>
        </SheetHeader>
        {ticket && (
          <>
            <p className="text-sm text-muted-foreground">
              {ticket.ticket_number} · {humanize(ticket.category)} · {humanize(ticket.priority)} priority · {fmtDate(ticket.created_at)}
            </p>
            <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
              {messages === null ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.message_id}
                    className={`max-w-[85%] rounded-2xl p-3 text-sm ${m.sender === "CUSTOMER" ? "ml-auto bg-primary/10 text-right" : "bg-muted/50"}`}
                  >
                    <p>{m.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(m.created_at)}</p>
                  </div>
                ))
              )}
            </div>
            {ticket.status !== "CLOSED" && (
              <div className="mt-3 flex gap-2 border-t border-border pt-3">
                <Input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => e.key === "Enter" && void sendReply()}
                />
                <Button size="icon" disabled={sending} onClick={() => void sendReply()}>
                  <Send className="size-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
