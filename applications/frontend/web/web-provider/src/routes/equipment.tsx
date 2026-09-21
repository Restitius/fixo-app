import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Wrench } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fmtDate } from "@/lib/format";
import { equipmentApi, teamApi, type Equipment, type EquipmentCategory, type EquipmentCondition, type TeamMember } from "@/lib/api-client";

const title = "Equipment — FIXO Provider";
const description = "Track tools, vehicles and equipment, and who they're assigned to.";

export const Route = createFileRoute("/equipment")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: EquipmentPage,
});

const CATEGORIES: EquipmentCategory[] = ["POWER_TOOL", "VEHICLE", "SAFETY_GEAR", "DIAGNOSTIC", "OTHER"];
const CONDITIONS: EquipmentCondition[] = ["NEW", "GOOD", "FAIR", "POOR"];

function statusTone(s: string): "success" | "amber" | "primary" | "muted" {
  if (s === "AVAILABLE") return "success";
  if (s === "IN_USE") return "primary";
  if (s === "MAINTENANCE") return "amber";
  return "muted"; // RETIRED
}

function EquipmentPage() {
  const [items, setItems] = useState<Equipment[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  function load() {
    return Promise.all([equipmentApi.list(undefined, undefined, 50, 0), teamApi.list("ACTIVE", undefined, 50, 0)]).then(([e, m]) => {
      setItems(e);
      setMembers(m);
    });
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function assign(item: Equipment, memberId: string) {
    try {
      await equipmentApi.assign(item.equipment_id, memberId || null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update assignment.");
    }
  }

  async function retire(item: Equipment) {
    if (!confirm(`Retire "${item.name}"? This can't be undone.`)) return;
    try {
      await equipmentApi.retire(item.equipment_id);
      await load();
      toast.success("Equipment retired.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not retire.");
    }
  }

  return (
    <ProviderPage title="Equipment" subtitle="Tools, vehicles and who they're assigned to.">
      <Panel title="Your equipment" className="mt-6" action={
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <Plus className="size-4" /> Add
        </button>
      }>
        {!loading && items.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No equipment yet.</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((e) => (
            <div key={e.equipment_id} className="rounded-2xl bg-muted/50 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Wrench className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{e.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.category} · {e.condition}
                    </p>
                  </div>
                </div>
                <StatusPill tone={statusTone(e.status)} label={e.status} />
              </div>
              {e.serial_number && <p className="mt-2 text-xs text-muted-foreground">S/N {e.serial_number}</p>}
              {e.purchase_date && <p className="text-xs text-muted-foreground">Purchased {fmtDate(e.purchase_date)}</p>}
              {e.status !== "RETIRED" && (
                <div className="mt-3 flex items-center gap-2">
                  <select
                    value={e.assigned_member_id ?? ""}
                    onChange={(ev) => void assign(e, ev.target.value)}
                    disabled={e.status === "MAINTENANCE"}
                    className="h-9 flex-1 rounded-lg border border-input bg-card px-2.5 text-xs outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.member_id} value={m.member_id}>
                        {m.full_name}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => void retire(e)} className="text-xs font-semibold text-destructive hover:underline">
                    Retire
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Panel>

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
  const [name, setName] = useState("");
  const [category, setCategory] = useState<EquipmentCategory>("OTHER");
  const [condition, setCondition] = useState<EquipmentCondition>("GOOD");
  const [serialNumber, setSerialNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    try {
      await equipmentApi.create({ name: name.trim(), category, condition, serial_number: serialNumber || undefined, notes: notes || undefined });
      toast.success("Equipment added.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add equipment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">Add equipment</h2>
        <div className="mt-4 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          <div className="grid grid-cols-2 gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value as EquipmentCategory)} className="h-11 rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <select value={condition} onChange={(e) => setCondition(e.target.value as EquipmentCondition)} className="h-11 rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30">
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0) + c.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="Serial number (optional)" className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted">
            Cancel
          </button>
          <button onClick={() => void save()} disabled={saving} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50" style={{ backgroundImage: "var(--gradient-primary)" }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
