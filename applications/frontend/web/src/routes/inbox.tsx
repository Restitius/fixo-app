// Inbox — real per-booking messaging (Module 19's conversation domain).
// The backend models a thread per booking rather than a flat contact list,
// so this opens a real thread against whichever booking you pick.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, Loader2, MessageCircle, Send } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { bookingApi, fixoSdk, type BookingHistoryRow, type BookingMessage } from "@/lib/api-client";
import { humanize } from "@/lib/format";

const title = "Inbox — FIXO";
const description = "Message the providers on your real bookings.";

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: InboxPage,
});

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
}

function InboxPage() {
  const { access_token, loading, customer, logout } = useAuth();
  const [bookings, setBookings] = useState<BookingHistoryRow[] | null>(null);
  const [active, setActive] = useState<BookingHistoryRow | null>(null);

  useEffect(() => {
    if (!(access_token && !loading)) return;
    fixoSdk.bookingHistory(undefined, 100, 0).then(setBookings).catch(() => setBookings([]));
  }, [access_token, loading]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const withProvider = (bookings ?? []).filter((b) => b.provider_name);

  return (
    <PageShell title="Inbox" subtitle="Message the providers on your bookings" userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        {bookings === null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/60" />)}
          </div>
        ) : withProvider.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No conversations yet"
            description="Once a provider is assigned to one of your bookings, you can message them here."
            actionLabel="Browse Services"
            actionTo="/services"
          />
        ) : (
          <div className="rounded-3xl bg-card shadow-[var(--shadow-card)]">
            {withProvider.map((b, i) => (
              <button
                key={b.booking_id}
                onClick={() => setActive(b)}
                className={`flex w-full items-center gap-4 p-5 text-left hover:bg-muted/40 ${i === withProvider.length - 1 ? "" : "border-b border-border"}`}
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                  {initials(b.provider_name!)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{b.provider_name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {b.service_name ?? "Service"} · {humanize(b.status)}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      <ThreadDialog booking={active} onClose={() => setActive(null)} />
    </PageShell>
  );
}

function ThreadDialog({ booking, onClose }: { booking: BookingHistoryRow | null; onClose: () => void }) {
  const [messages, setMessages] = useState<BookingMessage[] | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!booking) {
      setMessages(null);
      return;
    }
    setMessages(null);
    bookingApi.listBookingMessages(booking.booking_id).then((r) => setMessages(r.messages)).catch(() => setMessages([]));
  }, [booking?.booking_id]);

  async function send() {
    if (!booking || !body.trim()) return;
    setSending(true);
    try {
      const sent = await bookingApi.sendBookingMessage(booking.booking_id, body.trim());
      setMessages((prev) => [
        ...(prev ?? []),
        { message_id: sent.message_id, from_provider: false, body: body.trim(), created_at: new Date().toISOString() },
      ]);
      setBody("");
    } catch {
      // apiClient already toasts the error
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={!!booking} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{booking?.provider_name}</DialogTitle>
        </DialogHeader>
        <div className="flex h-[420px] flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto py-2">
            {messages === null ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No messages yet — say hello!</p>
            ) : (
              messages.map((m) => (
                <div key={m.message_id} className={`flex ${m.from_provider ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.from_provider ? "rounded-bl-md bg-muted text-foreground" : "rounded-br-md text-primary-foreground"
                    }`}
                    style={!m.from_provider ? { backgroundImage: "var(--gradient-primary)" } : undefined}
                  >
                    {m.body}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-3 border-t border-border pt-4">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Message..."
              className="h-11 flex-1 rounded-full bg-muted px-5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={send}
              disabled={sending || !body.trim()}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-primary-foreground disabled:opacity-60"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
