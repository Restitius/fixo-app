import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TableCard, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { teamApi, type TeamMember, type TeamRole } from "@/lib/api-client";

const title = "Team — FIXO Provider";
const description = "Manage the workers on your provider account.";

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

const ROLES: { role: TeamRole; description: string }[] = [
  { role: "OWNER", description: "Full account access" },
  { role: "MANAGER", description: "Manage jobs, team and pricing" },
  { role: "DISPATCHER", description: "Requests, bookings and assignment" },
  { role: "TECHNICIAN", description: "Assigned jobs only" },
  { role: "OTHER", description: "Custom / unlisted role" },
];

function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TeamMember | "new" | null>(null);

  function load() {
    return teamApi.list(undefined, undefined, 50, 0).then(setMembers);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function deactivate(member: TeamMember) {
    if (!confirm(`Deactivate ${member.full_name}? This can't be undone.`)) return;
    try {
      await teamApi.deactivate(member.member_id);
      await load();
      toast.success("Team member deactivated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not deactivate.");
    }
  }

  return (
    <ProviderPage title="Team" subtitle="Workers on your provider account.">
      <div className="mt-6 grid gap-4 pb-6 xl:grid-cols-[1fr_320px]">
        <TableCard className="mt-0">
          <div className="flex items-center justify-between px-6 pt-5">
            <h2 className="text-base font-bold tracking-tight">Team members</h2>
            <button onClick={() => setEditing("new")} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              <Plus className="size-4" /> Add member
            </button>
          </div>
          {!loading && members.length === 0 && <p className="px-6 py-10 text-center text-sm text-muted-foreground">No team members yet.</p>}
          {members.length > 0 && (
            <TableScroll minWidth={680}>
              <TableHead columns={["Name", "Role", "Phone", "Status", ""]} />
              <tbody>
                {members.map((m) => (
                  <tr key={m.member_id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                    <td className="px-6 py-4 font-semibold">{m.full_name}</td>
                    <td className="px-4 py-4 text-muted-foreground">{m.role}</td>
                    <td className="px-4 py-4 text-muted-foreground">{m.phone}</td>
                    <td className="px-4 py-4">
                      <StatusPill tone={m.status === "ACTIVE" ? "success" : "muted"} label={m.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-3 text-xs font-semibold">
                        <button onClick={() => setEditing(m)} className="text-primary hover:underline">
                          Edit
                        </button>
                        {m.status === "ACTIVE" && (
                          <button onClick={() => void deactivate(m)} className="text-destructive hover:underline">
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableScroll>
          )}
        </TableCard>

        <Panel title="Roles">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {ROLES.map((r) => (
              <li key={r.role}>
                <strong className="text-foreground">{r.role.charAt(0) + r.role.slice(1).toLowerCase()}</strong> — {r.description}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {editing && (
        <EditModal
          member={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
    </ProviderPage>
  );
}

function EditModal({ member, onClose, onSaved }: { member: TeamMember | null; onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState(member?.full_name ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [role, setRole] = useState<TeamRole>(member?.role ?? "TECHNICIAN");
  const [notes, setNotes] = useState(member?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (fullName.trim().length < 2) {
      toast.error("Full name must be at least 2 characters.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Phone is required.");
      return;
    }
    setSaving(true);
    try {
      const data = { full_name: fullName.trim(), phone: phone.trim(), email: email || undefined, role, notes: notes || undefined };
      if (member) await teamApi.update(member.member_id, data);
      else await teamApi.create(data);
      toast.success(member ? "Team member updated." : "Team member added.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save team member.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">{member ? "Edit team member" : "Add team member"}</h2>
        <div className="mt-4 space-y-3">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          <select value={role} onChange={(e) => setRole(e.target.value as TeamRole)} className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30">
            {ROLES.map((r) => (
              <option key={r.role} value={r.role}>
                {r.role.charAt(0) + r.role.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
