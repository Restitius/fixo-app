// Documents & Compliance — wired to the real backend.
// Real model (provider_verification_service.py): the provider uploads
// identity/compliance documents (front image required, back image and a
// doc number/issue/expiry dates optional) against a governed doc-type
// catalogue (GET /providers/verification/doc-types), one active document
// per type. Status is a progress aggregate (required-missing types,
// expiring-soon), and the whole package is submitted for review once —
// not per document. File bytes go through the shared uploads endpoint
// (POST /uploads) used elsewhere this session (onboarding, profile).
// Dropped from the old mock: per-document "Replace" always being available
// (the real endpoint only allows withdrawing a not-yet-verified document,
// then re-uploading) and the fabricated static "Upload rules" list.
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileCheck2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TableCard, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { fmtDate } from "@/lib/format";
import {
  onboardingApi,
  type VerificationDocType,
  type VerificationDocument,
  type VerificationStatus,
} from "@/lib/api-client";

const title = "Documents & Compliance — FIXO Provider";
const description = "Upload and track the identity and compliance documents FIXO needs on file.";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const [docTypes, setDocTypes] = useState<VerificationDocType[]>([]);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    return Promise.all([onboardingApi.docTypes(), onboardingApi.documents(), onboardingApi.verificationStatus()]).then(
      ([dt, docs, st]) => {
        setDocTypes(dt);
        setDocuments(docs);
        setStatus(st);
      },
    );
  }

  useEffect(() => {
    load()
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load documents."))
      .finally(() => setLoading(false));
  }, []);

  async function withdraw(docId: string) {
    try {
      await onboardingApi.withdrawDocument(docId);
      toast.success("Document withdrawn.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not withdraw document.");
    }
  }

  async function submitForReview() {
    setSubmitting(true);
    try {
      await onboardingApi.submitVerification();
      toast.success("Submitted for review.");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit for review.");
    } finally {
      setSubmitting(false);
    }
  }

  const verified = documents.filter((d) => d.status === "VERIFIED").length;
  const pending = documents.filter((d) => d.status === "UNDER_REVIEW" || d.status === "SUBMITTED" || d.status === "MORE_INFO_REQUIRED").length;
  const missing = status?.required_missing.length ?? 0;

  if (loading) {
    return (
      <ProviderPage title="Documents" subtitle="Compliance paperwork FIXO needs on file.">
        <div className="mt-6 h-40 animate-pulse rounded-3xl bg-muted/50" />
      </ProviderPage>
    );
  }

  return (
    <ProviderPage title="Documents" subtitle="Compliance paperwork FIXO needs on file.">
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard icon={FileCheck2} label="Verified" value={String(verified)} hint="Approved documents" tone="success" tintValue />
        <MetricCard icon={FileCheck2} label="In review" value={String(pending)} hint="Awaiting FIXO or you" tone="amber" tintValue />
        <MetricCard icon={FileCheck2} label="Missing" value={String(missing)} hint="Required, not yet submitted" tone="destructive" tintValue />
      </div>

      <div className="mt-4 grid gap-4 pb-6 lg:grid-cols-[1fr_320px]">
        <TableCard className="mt-0">
          <div className="flex items-center justify-between px-6 pt-5">
            <h2 className="text-base font-bold tracking-tight">All documents</h2>
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              <Upload className="size-4" /> Upload document
            </button>
          </div>
          {documents.length === 0 ? (
            <p className="px-6 py-6 text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            <TableScroll minWidth={760}>
              <TableHead columns={["Document", "Reference", "Issued", "Expires", "Status", ""]} />
              <tbody>
                {documents.map((d) => (
                  <tr key={d.doc_id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                    <td className="px-6 py-4 font-semibold">{docTypes.find((t) => t.code === d.doc_type)?.name ?? d.doc_type}</td>
                    <td className="px-4 py-4 text-muted-foreground">{d.doc_number ?? "—"}</td>
                    <td className="px-4 py-4 text-muted-foreground">{d.issue_date ? fmtDate(d.issue_date) : "—"}</td>
                    <td className="px-4 py-4 text-muted-foreground">{d.expiry_date ? fmtDate(d.expiry_date) : "—"}</td>
                    <td className="px-4 py-4">
                      <StatusPill status={d.status} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      {d.status !== "VERIFIED" && (
                        <button onClick={() => withdraw(d.doc_id)} className="text-sm font-semibold text-destructive hover:underline">
                          Withdraw
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableScroll>
          )}
        </TableCard>

        <div className="space-y-4">
          <Panel title="Review status">
            <p className="text-sm">
              Status: <strong>{status?.verification_status ?? "NOT_SUBMITTED"}</strong>
            </p>
            {status && status.required_missing.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">Still needed: {status.required_missing.join(", ")}</p>
            )}
            {status && status.documents_expiring_soon > 0 && (
              <p className="mt-2 text-xs text-amber-600">
                {status.documents_expiring_soon} document{status.documents_expiring_soon > 1 ? "s" : ""} expiring soon
              </p>
            )}
            <button
              onClick={submitForReview}
              disabled={submitting || missing > 0}
              className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
          </Panel>

          <Panel title="Document types">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {docTypes.map((t) => (
                <li key={t.code} className="flex items-center justify-between">
                  <span>{t.name}</span>
                  {t.is_required && <span className="text-xs font-semibold text-destructive">Required</span>}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      {showAdd && (
        <AddDocumentModal
          docTypes={docTypes}
          onClose={() => setShowAdd(false)}
          onSaved={async () => {
            setShowAdd(false);
            await load();
          }}
        />
      )}
    </ProviderPage>
  );
}

function AddDocumentModal({
  docTypes,
  onClose,
  onSaved,
}: {
  docTypes: VerificationDocType[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [docType, setDocType] = useState(docTypes[0]?.code ?? "");
  const [docNumber, setDocNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!docType || !frontFile) {
      toast.error("Select a document type and choose a front image.");
      return;
    }
    setSaving(true);
    try {
      const front = await onboardingApi.uploadFile(frontFile);
      const back = backFile ? await onboardingApi.uploadFile(backFile) : null;
      await onboardingApi.addDocument({
        doc_type: docType,
        front_image_url: front.url,
        back_image_url: back?.url,
        doc_number: docNumber || undefined,
        issue_date: issueDate || undefined,
        expiry_date: expiryDate || undefined,
      });
      toast.success("Document uploaded.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload document.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Upload document</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs text-muted-foreground">Document type</span>
          <select className={inputCls} value={docType} onChange={(e) => setDocType(e.target.value)}>
            {docTypes.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
                {t.is_required ? " (required)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs text-muted-foreground">Document number (optional)</span>
          <input className={inputCls} value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
        </label>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Issue date (optional)</span>
            <input type="date" className={inputCls} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">Expiry date (optional)</span>
            <input type="date" className={inputCls} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs text-muted-foreground">Front image</span>
          <input type="file" accept="image/*,.pdf" onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)} className="block w-full text-sm" />
        </label>
        <label className="mt-4 block">
          <span className="mb-1 block text-xs text-muted-foreground">Back image (optional)</span>
          <input type="file" accept="image/*,.pdf" onChange={(e) => setBackFile(e.target.files?.[0] ?? null)} className="block w-full text-sm" />
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {saving ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
