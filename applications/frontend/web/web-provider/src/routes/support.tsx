import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, PhoneCall, ShieldAlert, Siren } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TableCard, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { fmtDate, fmtMoney } from "@/lib/format";
import { disputes, supportTickets } from "@/lib/mock-data";

const title = "Support & Safety — FIXO Provider";
const description = "Raise support tickets, track disputes, report safety incidents and reach emergency assistance.";

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

const faqs = [
  { q: "When do I get paid?", a: "Funds clear to your wallet after customer sign-off, usually within 24 hours." },
  { q: "What happens if a customer cancels?", a: "Cancellations inside 2 hours of the slot may attract a compensation fee paid to you." },
  { q: "Can I decline a matched request?", a: "Yes, but a low acceptance rate reduces your ranking in future matches." },
  { q: "How do I dispute a rating?", a: "Open a ticket under Dispute within 7 days with evidence from the job." },
];

function SupportPage() {
  return (
    <ProviderPage title="Support" subtitle="Help, disputes and safety in one place.">
      <div className="mt-6 grid gap-4 pb-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <TableCard className="mt-0">
            <div className="px-6 pt-5">
              <h2 className="text-base font-bold tracking-tight">Your tickets</h2>
            </div>
            <TableScroll minWidth={640}>
              <TableHead columns={["Ticket", "Subject", "Category", "Status", "Updated"]} />
              <tbody>
                {supportTickets.map((t) => (
                  <tr key={t.id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                    <td className="px-6 py-4 font-semibold">{t.id}</td>
                    <td className="px-4 py-4">{t.subject}</td>
                    <td className="px-4 py-4 text-muted-foreground">{t.category}</td>
                    <td className="px-4 py-4">
                      <StatusPill tone={t.status === "Closed" ? "muted" : "amber"} label={t.status} />
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{fmtDate(t.updated)}</td>
                  </tr>
                ))}
              </tbody>
            </TableScroll>
          </TableCard>

          <Panel title="Open disputes">
            <div className="space-y-3">
              {disputes.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/50 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {d.id} · {fmtMoney(d.amount)} held
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Booking {d.booking} · {d.reason}
                    </p>
                  </div>
                  <StatusPill tone={d.stage.startsWith("Closed") ? "muted" : "amber"} label={d.stage} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="New support ticket">
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="h-11 rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30">
                {["Payment", "Booking", "Dispute", "Verification", "Technical", "Safety"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                placeholder="Related booking (optional)"
                className="h-11 rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <textarea
              rows={4}
              placeholder="Describe the issue..."
              className="mt-3 w-full rounded-xl border border-input bg-card p-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
            />
            <button
              className="mt-3 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Submit ticket
            </button>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Safety">
            <button className="flex w-full items-center gap-3 rounded-2xl bg-destructive/10 p-4 text-left text-destructive transition-colors hover:bg-destructive/15">
              <Siren className="size-5 shrink-0" />
              <span>
                <span className="block text-sm font-bold">Emergency SOS</span>
                <span className="block text-xs">Alerts FIXO safety team with your live location</span>
              </span>
            </button>
            <div className="mt-3 space-y-3 text-sm">
              <button className="flex w-full items-center gap-3 rounded-2xl bg-muted/50 p-4 text-left hover:bg-muted">
                <ShieldAlert className="size-5 text-primary" /> Report an unsafe job site
              </button>
              <button className="flex w-full items-center gap-3 rounded-2xl bg-muted/50 p-4 text-left hover:bg-muted">
                <PhoneCall className="size-5 text-primary" /> Call provider hotline
              </button>
            </div>
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
    </ProviderPage>
  );
}
