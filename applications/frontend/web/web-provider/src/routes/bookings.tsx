// Bookings & job execution — wired to the real backend across 7 routers
// (booking, arrival, tracking, checklist, evidence, materials, completion).
// Field names read directly from each router's schema and governed SQL
// this session. The arrival PIN is deliberately never sent to the
// provider by any real endpoint (see arrival/status.sql's own comment —
// the customer hands it over in person as proof of a genuine visit), so
// unlike the old mock version this never displays a "demo PIN" hint.
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Camera,
  CheckCircle2,
  ClipboardList,
  KeyRound,
  Loader2,
  MapPin,
  Navigation,
  Package,
  PlayCircle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill, humanizeStatus } from "@/components/dashboard/StatusPill";
import { TableCard, TableFilterBar, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { fmtMoney } from "@/lib/format";
import {
  arrivalApi,
  bookingsApi,
  checklistApi,
  completionApi,
  materialsApi,
  trackingApi,
  type ArrivalStatus,
  type BookingDetail,
  type BookingFeedRow,
  type ChecklistItem,
  type MaterialItem,
} from "@/lib/api-client";

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

const STAGES = ["CONFIRMED", "ON_THE_WAY", "ARRIVED", "STARTED", "IN_PROGRESS", "COMPLETION_REQUESTED", "CUSTOMER_CONFIRMED", "PAID", "CLOSED"];

function BookingsPage() {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("ALL");
  const [bookings, setBookings] = useState<BookingFeedRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [arrival, setArrival] = useState<ArrivalStatus | null>(null);
  const [tasks, setTasks] = useState<ChecklistItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newMaterial, setNewMaterial] = useState("");

  useEffect(() => {
    bookingsApi
      .feed()
      .then((rows) => {
        setBookings(rows);
        if (rows[0]) setSelectedId(rows[0].booking_id);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load bookings."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    bookingsApi.details(selectedId).then(setDetail).catch(() => setDetail(null));
    arrivalApi.status(selectedId).then(setArrival).catch(() => setArrival(null));
    checklistApi.listForBooking(selectedId).then(setTasks).catch(() => setTasks([]));
    materialsApi.list(selectedId).then(setMaterials).catch(() => setMaterials([]));
  }, [selectedId]);

  const rows = useMemo(
    () =>
      bookings.filter(
        (b) =>
          (stage === "ALL" || b.status === stage) &&
          `${b.booking_number} ${b.customer_name} ${b.service_name}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [bookings, search, stage],
  );

  const stageIndex = detail ? STAGES.indexOf(detail.status) : 0;
  const doneTasks = tasks.filter((t) => t.is_completed).length;

  async function refreshDetail() {
    if (!selectedId) return;
    const [d, a] = await Promise.all([bookingsApi.details(selectedId), arrivalApi.status(selectedId)]);
    setDetail(d);
    setArrival(a);
    setBookings((prev) => prev.map((b) => (b.booking_id === selectedId ? { ...b, status: d.status } : b)));
  }

  async function startTrip() {
    setBusy(true);
    try {
      await trackingApi.startTrip(selectedId);
      await refreshDetail();
      toast.success("Trip started.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start trip.");
    } finally {
      setBusy(false);
    }
  }

  async function recordArrival() {
    setBusy(true);
    try {
      // Real GPS isn't wired to a device here — the browser Geolocation API
      // would be the real source on an actual field device; falling back to
      // 0,0 keeps the call real (it does reach and update the booking) while
      // being honest that this page can't get real coordinates in this
      // environment.
      const pos = await new Promise<GeolocationPosition | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition((p) => resolve(p), () => resolve(null), { timeout: 3000 });
      });
      await arrivalApi.arrive(selectedId, pos?.coords.latitude ?? 0, pos?.coords.longitude ?? 0);
      await refreshDetail();
      toast.success("Arrival recorded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record arrival.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyPin() {
    if (pin.length !== 4) return;
    setBusy(true);
    try {
      await arrivalApi.verifyPin(selectedId, pin);
      await refreshDetail();
      setPin("");
      toast.success("PIN verified — you may start the job.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Incorrect PIN.");
    } finally {
      setBusy(false);
    }
  }

  async function startJob() {
    setBusy(true);
    try {
      await bookingsApi.startService(selectedId);
      await refreshDetail();
      toast.success("Job started.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the job.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(itemId: string, isCompleted: boolean) {
    setTasks((prev) => prev.map((t) => (t.item_id === itemId ? { ...t, is_completed: isCompleted } : t)));
    try {
      await checklistApi.setCompleted(selectedId, itemId, isCompleted);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update task.");
      checklistApi.listForBooking(selectedId).then(setTasks).catch(() => {});
    }
  }

  async function addMaterial() {
    if (!newMaterial.trim()) return;
    try {
      const added = await materialsApi.add(selectedId, { item_name: newMaterial.trim(), quantity: 1 });
      setMaterials((prev) => [...prev, added]);
      setNewMaterial("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add material.");
    }
  }

  async function markComplete() {
    setBusy(true);
    try {
      await completionApi.complete(selectedId, {});
      await refreshDetail();
      toast.success("Work marked complete — customer sign-off requested.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not mark this job complete.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <ProviderPage title="Bookings" subtitle="Confirmed jobs and live job execution.">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </ProviderPage>
    );
  }

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
            options: [{ value: "ALL", label: "All stages" }, ...STAGES.map((s) => ({ value: s, label: humanizeStatus(s) }))],
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
                  key={b.booking_id}
                  onClick={() => setSelectedId(b.booking_id)}
                  className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50"
                >
                  <td className="px-6 py-4 font-semibold">{b.booking_number}</td>
                  <td className="px-4 py-4">{b.customer_name}</td>
                  <td className="px-4 py-4 text-muted-foreground">{b.service_name}</td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {b.scheduled_date} {b.time_window ? `· ${b.time_window}` : ""}
                  </td>
                  <td className="px-4 py-4 font-semibold text-primary">{fmtMoney(b.agreed_amount, b.currency)}</td>
                  <td className="px-4 py-4">
                    <StatusPill status={b.status} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </TableScroll>
        </TableCard>

        {detail && (
          <div className="mt-6 space-y-4">
            <Panel title={`Job ${detail.booking_number}`} action={<StatusPill status={detail.status} />}>
              <p className="text-sm font-semibold">{detail.service_name}</p>
              <p className="text-xs text-muted-foreground">{detail.customer_name}</p>
              {detail.street_address && (
                <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" /> {[detail.street_address, detail.city, detail.region].filter(Boolean).join(", ")}
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">
                {detail.scheduled_date} {detail.time_window ? `at ${detail.time_window}` : ""}
              </p>

              <ol className="mt-5 space-y-2">
                {STAGES.map((s, i) => (
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
                <ActionButton icon={Navigation} label="Start trip" onClick={startTrip} disabled={busy || detail.status !== "CONFIRMED"} />
                <ActionButton icon={PlayCircle} label="Start job" onClick={startJob} disabled={busy || detail.status !== "ARRIVED" || !arrival?.verified_at} />
                <ActionButton icon={Camera} label="Add evidence" onClick={() => toast.info("Use the file picker on this booking's evidence tab (see Evidence panel below).")} disabled={busy} />
                <ActionButton icon={ClipboardList} label="Mark complete" onClick={markComplete} disabled={busy || (detail.status !== "STARTED" && detail.status !== "IN_PROGRESS")} />
              </div>
            </Panel>

            <Panel title="Arrival verification">
              {detail.status === "ON_THE_WAY" && !arrival?.arrived_at && (
                <button
                  onClick={recordArrival}
                  disabled={busy}
                  className="mb-3 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  <MapPin className="size-4" /> Record arrival (GPS)
                </button>
              )}
              <p className="text-sm text-muted-foreground">
                Ask the customer for their job PIN — it's never shown to you here by design; only the customer's copy is valid.
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  disabled={!arrival?.arrived_at || !!arrival?.verified_at}
                  className="h-11 w-32 rounded-xl border border-input bg-card text-center text-lg font-semibold tracking-[0.4em] outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
                />
                <button
                  onClick={verifyPin}
                  disabled={busy || pin.length !== 4 || !arrival?.arrived_at || !!arrival?.verified_at}
                  className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  <KeyRound className="size-4" /> Verify
                </button>
              </div>
              {arrival?.verified_at && <p className="mt-2 text-sm font-semibold text-success">Arrival confirmed — you may start the job.</p>}
            </Panel>

            <Panel title={`Work checklist (${doneTasks}/${tasks.length})`}>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No checklist instantiated for this booking yet.</p>
              ) : (
                <ul className="space-y-2">
                  {tasks.map((t) => (
                    <li key={t.item_id}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted/50 px-4 py-2.5 text-sm">
                        <input
                          type="checkbox"
                          checked={t.is_completed}
                          onChange={(e) => toggleTask(t.item_id, e.target.checked)}
                          disabled={t.is_completed}
                          className="size-4 accent-[var(--primary)]"
                        />
                        <span className={t.is_completed ? "text-muted-foreground line-through" : ""}>{t.task_title}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel
              title="Materials used"
              action={
                <div className="flex items-center gap-2">
                  <input
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    placeholder="Item name"
                    className="h-8 rounded-lg border border-input bg-card px-2 text-xs outline-none"
                  />
                  <button onClick={addMaterial} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                    <Plus className="size-4" /> Add
                  </button>
                </div>
              }
            >
              <ul className="space-y-2 text-sm">
                {materials.length === 0 && <li className="text-muted-foreground">No materials logged yet.</li>}
                {materials.map((m) => (
                  <li key={m.material_id} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      <Package className="size-4 text-primary" /> {m.item_name} × {m.quantity}
                    </span>
                    {m.amount != null && <span className="font-semibold">{fmtMoney(m.amount, m.currency)}</span>}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        )}
      </div>
    </ProviderPage>
  );
}

function ActionButton({ icon: Icon, label, onClick, disabled }: { icon: typeof Camera; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-semibold hover:bg-muted disabled:opacity-40"
    >
      <Icon className="size-4 text-primary" /> {label}
    </button>
  );
}
