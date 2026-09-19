import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Scale, Send } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fmtDateTime } from "@/lib/format";
import { disputesApi, type Dispute, type DisputeEvidenceItem, type DisputeResponse, type DisputeResponseKind } from "@/lib/api-client";

const title = "Disputes — FIXO Provider";
const description = "Track disputes on your bookings and respond with evidence.";

export const Route = createFileRoute("/disputes")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DisputesPage,
});

function statusTone(status: string): "success" | "amber" | "muted" | "destructive" {
  const s = status.toLowerCase();
  if (s === "resolved") return "success";
  if (s === "withdrawn") return "muted";
  if (s === "under_review") return "amber";
  return "destructive"; // open
}

function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDispute, setOpenDispute] = useState<Dispute | null>(null);

  useEffect(() => {
    disputesApi
      .list("all", undefined, 50, 0)
      .then(setDisputes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProviderPage title="Disputes" subtitle="Booking disputes and your responses.">
      <Panel title="Your disputes" className="mt-6">
        {!loading && disputes.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No disputes on your bookings.</p>}
        <div className="space-y-3">
          {disputes.map((d) => (
            <div key={d.dispute_id} onClick={() => setOpenDispute(d)} className="cursor-pointer rounded-2xl bg-muted/50 p-4 hover:bg-muted">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  {d.dispute_number} · booking {d.booking_number}
                </p>
                <StatusPill tone={statusTone(d.status)} label={d.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {d.category} · opened {fmtDateTime(d.created_at)}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{d.description}</p>
            </div>
          ))}
        </div>
      </Panel>

      {openDispute && <DisputeDetail dispute={openDispute} onClose={() => setOpenDispute(null)} />}
    </ProviderPage>
  );
}

function DisputeDetail({ dispute, onClose }: { dispute: Dispute; onClose: () => void }) {
  const [full, setFull] = useState<Dispute>(dispute);
  const [evidence, setEvidence] = useState<DisputeEvidenceItem[]>([]);
  const [responses, setResponses] = useState<DisputeResponse[] | null>(null);
  const [kind, setKind] = useState<DisputeResponseKind>("explanation");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const closed = full.status === "resolved" || full.status === "withdrawn";

  useEffect(() => {
    disputesApi.get(dispute.dispute_id).then(setFull);
    disputesApi.listEvidence(dispute.dispute_id).then(setEvidence);
    disputesApi.listResponses(dispute.dispute_id).then(setResponses).catch(() => setResponses([]));
  }, [dispute.dispute_id]);

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    try {
      const sent = await disputesApi.respond(dispute.dispute_id, kind, body.trim());
      setResponses((prev) => [...(prev ?? []), sent]);
      setBody("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send response — the dispute may already be closed.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-card" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-border p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Scale className="size-4 text-primary" /> {full.dispute_number}
            </h2>
            <StatusPill tone={statusTone(full.status)} label={full.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Booking {full.booking_number} · {full.category}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">{full.description}</p>
          {full.resolution && (
            <div className="mt-3 rounded-xl bg-muted/60 p-3 text-sm">
              <p className="font-semibold">Resolution</p>
              <p className="mt-1 text-muted-foreground">{full.resolution}</p>
            </div>
          )}
          {evidence.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-muted-foreground">Evidence ({evidence.length})</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {evidence.map((e) => (
                  <a key={e.evidence_id} href={e.url} target="_blank" rel="noreferrer" className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted">
                    {e.kind}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {responses === null ? (
            <p className="text-center text-sm text-muted-foreground">Loading…</p>
          ) : responses.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No responses yet.</p>
          ) : (
            responses.map((r) => (
              <div key={r.response_id} className="rounded-2xl bg-muted/50 p-3.5">
                <div className="flex items-center justify-between">
                  <StatusPill tone="primary" label={r.kind} />
                  <span className="text-xs text-muted-foreground">{fmtDateTime(r.created_at)}</span>
                </div>
                <p className="mt-2 text-sm">{r.body}</p>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border p-4">
          {closed ? (
            <p className="text-center text-xs text-muted-foreground">This dispute is {full.status} — no further responses can be added.</p>
          ) : (
            <>
              <select value={kind} onChange={(e) => setKind(e.target.value as DisputeResponseKind)} className="mb-2 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/30">
                <option value="acknowledgment">Acknowledgment</option>
                <option value="explanation">Explanation</option>
                <option value="refund_offer">Refund offer</option>
              </select>
              <div className="flex items-center gap-2">
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void send()}
                  placeholder="Write your response…"
                  className="h-11 flex-1 rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                />
                <button onClick={() => void send()} disabled={sending || !body.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary-foreground disabled:opacity-50" style={{ backgroundImage: "var(--gradient-primary)" }}>
                  <Send className="size-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
