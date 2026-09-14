import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Paperclip, Phone, Send, ShieldAlert } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { fixoSdk, type ProviderBookingFeedRow, type ProviderMessage } from "@/lib/api-client";

const title = "Messages — FIXO Provider";
const description = "In-app chat with customers, tied to each booking and monitored for safety.";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const [bookings, setBookings] = useState<ProviderBookingFeedRow[]>([]);
  const [activeId, setActiveId] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [list, setList] = useState<ProviderMessage[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    fixoSdk
      .bookingFeed(50, 0)
      .then((rows) => {
        setBookings(rows);
        if (rows[0]) setActiveId(rows[0].booking_id);
      })
      .catch(() => setBookings([]));
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    fixoSdk
      .getConversation(activeId)
      .then((conv) => {
        if (cancelled) return;
        setConversationId(conv.conversation_id);
        return fixoSdk.listMessages(activeId, conv.conversation_id);
      })
      .then((msgs) => {
        if (!cancelled && msgs) setList(msgs);
      })
      .catch(() => {
        if (!cancelled) {
          setConversationId(null);
          setList([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  const active = bookings.find((b) => b.booking_id === activeId);

  async function send() {
    if (!draft.trim() || !conversationId || !activeId) return;
    const body = draft.trim();
    setDraft("");
    try {
      const sent = await fixoSdk.sendMessage(activeId, conversationId, body);
      setList((l) => [...l, sent]);
    } catch {
      // leave the draft cleared but don't fabricate a sent message on failure
    }
  }

  return (
    <ProviderPage title="Messages" subtitle="Conversations stay attached to their booking.">
      <div className="mt-6 grid min-h-0 flex-1 gap-4 pb-6 lg:grid-cols-[300px_1fr]">
        <div className="overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]">
          <ul className="divide-y divide-border">
            {bookings.length === 0 && (
              <li className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</li>
            )}
            {bookings.map((b) => (
              <li key={b.booking_id}>
                <button
                  onClick={() => setActiveId(b.booking_id)}
                  className={`flex w-full items-start gap-3 p-4 text-left transition-colors ${
                    activeId === b.booking_id ? "bg-primary/5" : "hover:bg-muted/60"
                  }`}
                >
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground"
                    style={{ backgroundImage: "var(--gradient-primary)" }}
                  >
                    {b.customer_name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{b.customer_name}</span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{b.service_name}</span>
                    <span className="mt-1 block text-[11px] font-medium text-primary">#{b.booking_number}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-h-[520px] flex-col overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-3 border-b border-border p-4">
            <div>
              <p className="text-sm font-bold">{active?.customer_name}</p>
              <p className="text-xs text-muted-foreground">Booking #{active?.booking_number}</p>
            </div>
            <div className="flex gap-2">
              <button className="flex size-10 items-center justify-center rounded-xl bg-muted hover:bg-muted/70">
                <Phone className="size-4" />
              </button>
              <button className="flex size-10 items-center justify-center rounded-xl bg-muted hover:bg-muted/70" title="Report">
                <ShieldAlert className="size-4 text-destructive" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {list.map((m) => (
              <div key={m.message_id} className={`flex ${m.sender_role === "PROVIDER" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.sender_role === "PROVIDER" ? "text-primary-foreground" : "bg-muted"
                  }`}
                  style={m.sender_role === "PROVIDER" ? { backgroundImage: "var(--gradient-primary)" } : undefined}
                >
                  <p>{m.body}</p>
                  <p
                    className={`mt-1 text-[11px] ${
                      m.sender_role === "PROVIDER" ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-border p-3">
            <button className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted hover:bg-muted/70">
              <Paperclip className="size-4" />
            </button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Write a message..."
              className="h-11 flex-1 rounded-xl bg-muted px-4 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={send}
              className="flex size-11 shrink-0 items-center justify-center rounded-xl text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </ProviderPage>
  );
}
