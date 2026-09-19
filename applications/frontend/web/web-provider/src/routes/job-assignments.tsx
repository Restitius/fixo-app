import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TableCard, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { fmtDateTime } from "@/lib/format";
import { bookingsApi, jobAssignmentsApi, teamApi, type BookingFeedRow, type JobAssignment, type JobAssignmentStatus, type TeamMember } from "@/lib/api-client";

const title = "Job Assignments — FIXO Provider";
const description = "Assign your bookings to team members.";

export const Route = createFileRoute("/job-assignments")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: JobAssignmentsPage,
});

const STATUSES: JobAssignmentStatus[] = ["ASSIGNED", "ACKNOWLEDGED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

function statusTone(s: JobAssignmentStatus): "success" | "amber" | "primary" | "muted" {
  if (s === "COMPLETED") return "success";
  if (s === "CANCELLED") return "muted";
  if (s === "IN_PROGRESS" || s === "ACKNOWLEDGED") return "primary";
  return "amber"; // ASSIGNED
}

function JobAssignmentsPage() {
  const [assignments, setAssignments] = useState<JobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  function load() {
    return jobAssignmentsApi.list(undefined, undefined, 50, 0).then(setAssignments);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function updateStatus(a: JobAssignment, status: JobAssignmentStatus) {
    try {
      await jobAssignmentsApi.update(a.assignment_id, { status });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update status.");
    }
  }

  async function cancel(a: JobAssignment) {
    if (!confirm(`Cancel the assignment for booking ${a.booking_number}?`)) return;
    try {
      await jobAssignmentsApi.cancel(a.assignment_id);
      await load();
      toast.success("Assignment cancelled.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel.");
    }
  }

  return (
    <ProviderPage title="Job Assignments" subtitle="Assign your bookings to team members.">
      <TableCard className="mt-6">
        <div className="flex items-center justify-between px-6 pt-5">
          <h2 className="text-base font-bold tracking-tight">Assignments</h2>
          <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            <Plus className="size-4" /> Assign a booking
          </button>
        </div>
        {!loading && assignments.length === 0 && <p className="px-6 py-10 text-center text-sm text-muted-foreground">No job assignments yet.</p>}
        {assignments.length > 0 && (
          <TableScroll minWidth={760}>
            <TableHead columns={["Booking", "Member", "Status", "Assigned", ""]} />
            <tbody>
              {assignments.map((a) => (
                <tr key={a.assignment_id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                  <td className="px-6 py-4 font-semibold">{a.booking_number}</td>
                  <td className="px-4 py-4 text-muted-foreground">{a.member_name}</td>
                  <td className="px-4 py-4">
                    {a.status === "COMPLETED" || a.status === "CANCELLED" ? (
                      <StatusPill tone={statusTone(a.status)} label={a.status} />
                    ) : (
                      <select
                        value={a.status}
                        onChange={(e) => void updateStatus(a, e.target.value as JobAssignmentStatus)}
                        className="h-9 rounded-lg border border-input bg-card px-2.5 text-xs outline-none focus:ring-2 focus:ring-ring/30"
                      >
                        {STATUSES.filter((s) => s !== "CANCELLED").map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtDateTime(a.assigned_at)}</td>
                  <td className="px-4 py-4">
                    {a.status !== "COMPLETED" && a.status !== "CANCELLED" && (
                      <button onClick={() => void cancel(a)} className="text-xs font-semibold text-destructive hover:underline">
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
        )}
      </TableCard>

      {creating && (
        <CreateModal
          onClose={() => setCreating(false)}
          onSaved={async () => {
            setCreating(false);
            await load();
          }}
        />
      )}
    </ProviderPage>
  );
}

function CreateModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [bookings, setBookings] = useState<BookingFeedRow[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [bookingId, setBookingId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    bookingsApi.feed(undefined, 50, 0).then(setBookings);
    teamApi.list("ACTIVE", undefined, 50, 0).then(setMembers);
  }, []);

  async function save() {
    if (!bookingId || !memberId) {
      toast.error("Select a booking and a team member.");
      return;
    }
    setSaving(true);
    try {
      await jobAssignmentsApi.create({ booking_id: bookingId, member_id: memberId, notes: notes || undefined });
      toast.success("Booking assigned.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create assignment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">Assign a booking</h2>
        <p className="mt-1 text-xs text-muted-foreground">Only your active team members can be assigned.</p>
        <div className="mt-4 space-y-3">
          <select value={bookingId} onChange={(e) => setBookingId(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30">
            <option value="">Select a booking…</option>
            {bookings.map((b) => (
              <option key={b.booking_id} value={b.booking_id}>
                {b.booking_number} · {b.service_name} · {b.customer_name}
              </option>
            ))}
          </select>
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30">
            <option value="">Select a team member…</option>
            {members.map((m) => (
              <option key={m.member_id} value={m.member_id}>
                {m.full_name} · {m.role}
              </option>
            ))}
          </select>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
        </div>
        {members.length === 0 && <p className="mt-3 text-xs text-destructive">No active team members yet — add one on the Team page first.</p>}
        {bookings.length === 0 && <p className="mt-2 text-xs text-destructive">No bookings yet.</p>}
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={() => void save()}
            disabled={saving || members.length === 0 || bookings.length === 0}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {saving ? "Saving…" : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}
