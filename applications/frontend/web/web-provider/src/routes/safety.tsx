import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fmtDateTime } from "@/lib/format";
import { safetyApi, type SafetyCategory, type SafetyReport, type SafetySeverity } from "@/lib/api-client";

const title = "Safety — FIXO Provider";
const description = "Report a safety incident and track escalation.";

export const Route = createFileRoute("/safety")({
  validateSearch: (search: Record<string, unknown>) => ({
    urgent: search["urgent"] === true || search["urgent"] === "true" || search["urgent"] === "1",
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SafetyPage,
});

const CATEGORIES: SafetyCategory[] = ["UNSAFE_CUSTOMER", "PROPERTY_HAZARD", "INJURY", "HARASSMENT", "OTHER"];
const SEVERITIES: SafetySeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function SafetyPage() {
  const { urgent } = Route.useSearch();
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<SafetyCategory>(urgent ? "UNSAFE_CUSTOMER" : "OTHER");
  const [severity, setSeverity] = useState<SafetySeverity>(urgent ? "HIGH" : "LOW");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openReport, setOpenReport] = useState<SafetyReport | null>(null);

  function load() {
    return safetyApi.listReports(undefined, undefined, 50, 0).then(setReports);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function submit() {
    if (description.trim().length < 10) {
      toast.error("Description must be at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await safetyApi.createReport({ category, severity, description: description.trim() });
      setDescription("");
      await load();
      toast.success("Safety report submitted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit report.");
    } finally {
      setSubmitting(false);
    }
  }

  async function escalate(report: SafetyReport) {
    try {
      await safetyApi.escalate(report.report_id);
      await load();
      toast.success("Report escalated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not escalate.");
    }
  }

  return (
    <ProviderPage title="Safety" subtitle="Report incidents and track escalation.">
      <div className="mt-6 grid gap-4 pb-6 lg:grid-cols-[1fr_360px]">
        <Panel title="Your reports">
          {!loading && reports.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No safety reports yet.</p>}
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.report_id} onClick={() => setOpenReport(r)} className="cursor-pointer rounded-2xl bg-muted/50 p-4 hover:bg-muted">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{r.report_number}</p>
                  <div className="flex items-center gap-2">
                    <StatusPill tone={r.severity === "CRITICAL" || r.severity === "HIGH" ? "destructive" : "amber"} label={r.severity} />
                    <StatusPill tone={r.status === "ESCALATED" ? "primary" : "muted"} label={r.status} />
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.category} · {fmtDateTime(r.created_at)}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="New safety report">
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={category} onChange={(e) => setCategory(e.target.value as SafetyCategory)} className="h-11 rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ").toLowerCase().replace(/^\w/, (m) => m.toUpperCase())}
                </option>
              ))}
            </select>
            <select value={severity} onChange={(e) => setSeverity(e.target.value as SafetySeverity)} className="h-11 rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30">
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe what happened (min 10 characters)..."
            className="mt-3 w-full rounded-xl border border-input bg-card p-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
          />
          <button
            onClick={() => void submit()}
            disabled={submitting}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <ShieldAlert className="size-4" /> {submitting ? "Submitting…" : "Submit report"}
          </button>
          <p className="mt-3 text-xs text-muted-foreground">Reports are reviewed by the FIXO safety team. Resolution isn't self-service — you can escalate an open report if it needs urgent attention.</p>
        </Panel>
      </div>

      {openReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpenReport(null)}>
          <div className="w-full max-w-md rounded-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">{openReport.report_number}</h2>
              <StatusPill tone={openReport.status === "ESCALATED" ? "primary" : "muted"} label={openReport.status} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {openReport.category} · {openReport.severity} · {fmtDateTime(openReport.created_at)}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">{openReport.description}</p>
            {openReport.escalated_at && <p className="mt-3 text-xs text-muted-foreground">Escalated {fmtDateTime(openReport.escalated_at)}</p>}
            <div className="mt-5 flex gap-2">
              <button onClick={() => setOpenReport(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted">
                Close
              </button>
              {(openReport.status === "OPEN" || openReport.status === "UNDER_REVIEW") && (
                <button
                  onClick={() => void escalate(openReport).then(() => setOpenReport(null))}
                  className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90"
                >
                  Escalate
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ProviderPage>
  );
}
