import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Camera,
  CheckCircle2,
  ClipboardList,
  KeyRound,
  MapPin,
  Navigation,
  Package,
  PenLine,
  PlayCircle,
  Plus,
} from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill, humanizeStatus } from "@/components/dashboard/StatusPill";
import { TableCard, TableFilterBar, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { fmtDate, fmtMoney } from "@/lib/format";
import { bookingStages, bookings, jobChecklist, jobTimeline, materials } from "@/lib/mock-data";

const title = "Bookings & Job Execution — FIXO Provider";
const description = "Track confirmed bookings through travel, arrival PIN, checklist, evidence, materials and customer sign-off.";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: BookingsPage,
});

function BookingsPage() {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("ALL");
  const [selectedId, setSelectedId] = useState(bookings[0]?.id ?? "");
  const [tasks, setTasks] = useState(jobChecklist);
  const [pin, setPin] = useState("");
  const [pinOk, setPinOk] = useState(false);

  const rows = useMemo(
    () =>
      bookings.filter(
        (b) =>
          (stage === "ALL" || b.stage === stage) &&
          `${b.id} ${b.customer} ${b.service}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, stage],
  );

  const selected = bookings.find((b) => b.id === selectedId) ?? bookings[0];
  const stageIndex = selected ? bookingStages.indexOf(selected.stage) : 0;
  const doneTasks = tasks.filter((t) => t.done).length;

  return (
    <ProviderPage title="Bookings" subtitle="Confirmed jobs and live job execution.">
      <TableFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by booking, customer or service..."
        filters={[
          {
            value: stage,
            onChange: setStage,
            placeholder: "Stage",
            options: [
              { value: "ALL", label: "All stages" },
              ...bookingStages.map((s) => ({ value: s, label: humanizeStatus(s) })),
            ],
          },
        ]}
      />

      <div className="grid gap-4 pb-6 xl:grid-cols-[1fr_420px]">
        <TableCard>
          <TableScroll minWidth={780}>
            <TableHead columns={["Booking", "Customer", "Service", "Schedule", "Amount", "Stage"]} />
            <tbody>
              {rows.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50"
                >
                  <td className="px-6 py-4 font-semibold">#{b.id}</td>
                  <td className="px-4 py-4">{b.customer}</td>
                  <td className="px-4 py-4 text-muted-foreground">{b.service}</td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {fmtDate(b.date)} · {b.time}
                  </td>
                  <td className="px-4 py-4 font-semibold text-primary">{fmtMoney(b.price)}</td>
                  <td className="px-4 py-4">
                    <StatusPill status={b.stage} />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
        </TableCard>

        {selected && (
          <div className="mt-6 space-y-4">
            <Panel title={`Job #${selected.id}`} action={<StatusPill status={selected.paymentStatus} />}>
              <p className="text-sm font-semibold">{selected.service}</p>
              <p className="text-xs text-muted-foreground">
                {selected.customer} · {selected.property}
              </p>
              <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" /> {selected.address}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {fmtDate(selected.date)} at {selected.time} · assigned to <strong className="text-foreground">{selected.assignedTo}</strong>
              </p>
              {selected.notes && (
                <p className="mt-3 rounded-2xl bg-primary/5 p-3 text-sm text-muted-foreground">{selected.notes}</p>
              )}

              {/* Stage tracker */}
              <ol className="mt-5 space-y-2">
                {bookingStages.map((s, i) => (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span
                      className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold ${
                        i <= stageIndex ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i <= stageIndex ? <CheckCircle2 className="size-3.5" /> : i + 1}
                    </span>
                    <span className={i <= stageIndex ? "font-medium" : "text-muted-foreground"}>{humanizeStatus(s)}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <ActionButton icon={Navigation} label="Start trip" />
                <ActionButton icon={PlayCircle} label="Start job" />
                <ActionButton icon={Camera} label="Add evidence" />
                <ActionButton icon={PenLine} label="Request change" />
              </div>
            </Panel>

            <Panel title="Arrival verification">
              <p className="text-sm text-muted-foreground">
                Ask the customer for their 4-digit job PIN. GPS check-in is recorded at the same time.
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                    setPinOk(false);
                  }}
                  placeholder="••••"
                  className="h-11 w-32 rounded-xl border border-input bg-card text-center text-lg font-semibold tracking-[0.4em] outline-none focus:ring-2 focus:ring-ring/30"
                />
                <button
                  onClick={() => setPinOk(pin === selected.jobPin)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-primary-foreground"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  <KeyRound className="size-4" /> Verify
                </button>
              </div>
              {pinOk && <p className="mt-2 text-sm font-semibold text-success">Arrival confirmed — you may start the job.</p>}
              {pin.length === 4 && !pinOk && <p className="mt-2 text-sm text-muted-foreground">Demo PIN for this job: {selected.jobPin}</p>}
            </Panel>

            <Panel title={`Work checklist (${doneTasks}/${tasks.length})`}>
              <ul className="space-y-2">
                {tasks.map((t, i) => (
                  <li key={t.task}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted/50 px-4 py-2.5 text-sm">
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={() =>
                          setTasks((prev) => prev.map((p, pi) => (pi === i ? { ...p, done: !p.done } : p)))
                        }
                        className="size-4 accent-[var(--primary)]"
                      />
                      <span className={t.done ? "text-muted-foreground line-through" : ""}>{t.task}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel
              title="Materials used"
              action={
                <button className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                  <Plus className="size-4" /> Add
                </button>
              }
            >
              <ul className="space-y-2 text-sm">
                {materials.map((m) => (
                  <li key={m.item} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <Package className="size-4 text-primary" /> {m.item} × {m.qty}
                    </span>
                    <span className="font-semibold">{fmtMoney(m.amount)}</span>
                  </li>
                ))}
                <li className="flex items-center justify-between border-t border-border px-4 pt-3 font-semibold">
                  <span>Total materials</span>
                  <span className="text-primary">{fmtMoney(materials.reduce((s, m) => s + m.amount, 0))}</span>
                </li>
              </ul>
            </Panel>

            <Panel title="Job timeline">
              <ol className="space-y-3">
                {jobTimeline.map((t) => (
                  <li key={t.label} className="flex items-start gap-3 text-sm">
                    <span className={`mt-1 size-2.5 shrink-0 rounded-full ${t.done ? "bg-primary" : "bg-muted-foreground/30"}`} />
                    <span className="flex-1">{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.at}</span>
                  </li>
                ))}
              </ol>
              <button
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                <ClipboardList className="size-4" /> Mark work complete &amp; request sign-off
              </button>
            </Panel>
          </div>
        )}
      </div>
    </ProviderPage>
  );
}

function ActionButton({ icon: Icon, label }: { icon: typeof Camera; label: string }) {
  return (
    <button className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-semibold hover:bg-muted">
      <Icon className="size-4 text-primary" /> {label}
    </button>
  );
}
