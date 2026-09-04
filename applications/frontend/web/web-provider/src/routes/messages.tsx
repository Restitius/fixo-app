import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Paperclip, Phone, Send, ShieldAlert } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { conversations, messages as seedMessages } from "@/lib/mock-data";

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
  const [activeId, setActiveId] = useState(conversations[0]?.id ?? "");
  const [list, setList] = useState(seedMessages);
  const [draft, setDraft] = useState("");
  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];

  function send() {
    if (!draft.trim()) return;
    setList((l) => [
      ...l,
      { id: `m${l.length + 1}`, from: "provider" as const, text: draft.trim(), at: "now" },
    ]);
    setDraft("");
  }

  return (
    <ProviderPage title="Messages" subtitle="Conversations stay attached to their booking.">
      <div className="mt-6 grid min-h-0 flex-1 gap-4 pb-6 lg:grid-cols-[300px_1fr]">
        <div className="overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]">
          <ul className="divide-y divide-border">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={`flex w-full items-start gap-3 p-4 text-left transition-colors ${
                    activeId === c.id ? "bg-primary/5" : "hover:bg-muted/60"
                  }`}
                >
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground"
                    style={{ backgroundImage: "var(--gradient-primary)" }}
                  >
                    {c.customer.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{c.customer}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{c.at}</span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{c.last}</span>
                    <span className="mt-1 block text-[11px] font-medium text-primary">#{c.booking}</span>
                  </span>
                  {c.unread > 0 && (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      {c.unread}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-h-[520px] flex-col overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-3 border-b border-border p-4">
            <div>
              <p className="text-sm font-bold">{active?.customer}</p>
              <p className="text-xs text-muted-foreground">Booking #{active?.booking}</p>
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
            {list.map((m) =>
              m.from === "system" ? (
                <p key={m.id} className="mx-auto w-fit rounded-full bg-muted px-4 py-1.5 text-xs text-muted-foreground">
                  {m.text} · {m.at}
                </p>
              ) : (
                <div key={m.id} className={`flex ${m.from === "provider" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.from === "provider" ? "text-primary-foreground" : "bg-muted"
                    }`}
                    style={m.from === "provider" ? { backgroundImage: "var(--gradient-primary)" } : undefined}
                  >
                    <p>{m.text}</p>
                    <p className={`mt-1 text-[11px] ${m.from === "provider" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {m.at}
                    </p>
                  </div>
                </div>
              ),
            )}
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
