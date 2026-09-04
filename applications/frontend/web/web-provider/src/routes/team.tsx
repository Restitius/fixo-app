import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, Plus, Wrench } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TableCard, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { fmtDate } from "@/lib/format";
import { bookings, equipment, team } from "@/lib/mock-data";

const title = "Team & Equipment — FIXO Provider";
const description = "Manage workers, roles and permissions, assign jobs and track tools and maintenance schedules.";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TeamPage,
});

function TeamPage() {
  return (
    <ProviderPage title="Team" subtitle="Workers, job assignment and equipment.">
      <div className="mt-6 grid gap-4 pb-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <TableCard className="mt-0">
            <div className="flex items-center justify-between px-6 pt-5">
              <h2 className="text-base font-bold tracking-tight">Team members</h2>
              <button className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                <Plus className="size-4" /> Invite worker
              </button>
            </div>
            <TableScroll minWidth={680}>
              <TableHead columns={["Name", "Role", "Jobs done", "Rating", "Status"]} />
              <tbody>
                {team.map((m) => (
                  <tr key={m.id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                    <td className="px-6 py-4 font-semibold">{m.name}</td>
                    <td className="px-4 py-4 text-muted-foreground">{m.role}</td>
                    <td className="px-4 py-4">{m.jobs || "—"}</td>
                    <td className="px-4 py-4">{m.rating ? `${m.rating} ★` : "—"}</td>
                    <td className="px-4 py-4">
                      <StatusPill
                        tone={m.status === "Active" ? "success" : m.status === "On a job" ? "primary" : "muted"}
                        label={m.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableScroll>
          </TableCard>

          <Panel title="Job assignment">
            <div className="space-y-3">
              {bookings.slice(0, 4).map((b) => (
                <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/50 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      #{b.id} · {b.service}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(b.date)} at {b.time} · {b.customer}
                    </p>
                  </div>
                  <select
                    defaultValue={b.assignedTo}
                    className="h-10 rounded-xl border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                  >
                    <option>{b.assignedTo}</option>
                    {team
                      .filter((t) => t.name !== b.assignedTo)
                      .map((t) => (
                        <option key={t.id}>{t.name}</option>
                      ))}
                  </select>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Roles & permissions">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Owner</strong> — full access</li>
              <li><strong className="text-foreground">Dispatcher</strong> — requests, bookings, assignment</li>
              <li><strong className="text-foreground">Technician</strong> — assigned jobs only</li>
              <li><strong className="text-foreground">Apprentice</strong> — assisted jobs, no pricing</li>
              <li><strong className="text-foreground">Finance officer</strong> — wallet, payouts, invoices</li>
            </ul>
          </Panel>

          <Panel
            title="Equipment"
            action={
              <button className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                <Plus className="size-4" /> Add
              </button>
            }
          >
            <div className="space-y-3">
              {equipment.map((e) => (
                <div key={e.id} className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Wrench className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{e.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.serial} · {e.assignedTo}
                    </p>
                    <p className="text-xs text-muted-foreground">Next service {fmtDate(e.maintenance)}</p>
                  </div>
                  <StatusPill tone={e.condition === "Good" ? "success" : "amber"} label={e.condition} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Team performance">
            <div className="flex items-center gap-3 rounded-2xl bg-primary/5 p-4">
              <Briefcase className="size-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                {team.filter((t) => t.jobs > 0).length} field workers completed{" "}
                <strong className="text-foreground">{team.reduce((s, t) => s + t.jobs, 0)}</strong> jobs.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}
