import { createFileRoute } from "@tanstack/react-router";
import { FileCheck2, Upload } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TableCard, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { fmtDate } from "@/lib/format";
import { documents } from "@/lib/mock-data";

const title = "Documents & Compliance — FIXO Provider";
const description = "Upload and track licences, insurance, tax certificates and clearances with expiry reminders.";

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
  const verified = documents.filter((d) => d.status === "VERIFIED").length;
  const pending = documents.filter((d) => d.status === "UNDER_REVIEW" || d.status === "MORE_INFO_REQUIRED").length;
  const missing = documents.filter((d) => d.status === "NOT_SUBMITTED").length;

  return (
    <ProviderPage title="Documents" subtitle="Compliance paperwork FIXO needs on file.">
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard icon={FileCheck2} label="Verified" value={String(verified)} hint="Approved documents" tone="success" tintValue />
        <MetricCard icon={FileCheck2} label="In review" value={String(pending)} hint="Awaiting FIXO or you" tone="amber" tintValue />
        <MetricCard icon={FileCheck2} label="Missing" value={String(missing)} hint="Not yet submitted" tone="destructive" tintValue />
      </div>

      <div className="mt-4 grid gap-4 pb-6 lg:grid-cols-[1fr_320px]">
        <TableCard className="mt-0">
          <div className="px-6 pt-5">
            <h2 className="text-base font-bold tracking-tight">All documents</h2>
          </div>
          <TableScroll minWidth={760}>
            <TableHead columns={["Document", "Reference", "Issued", "Expires", "Status", ""]} />
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                  <td className="px-6 py-4 font-semibold">{d.type}</td>
                  <td className="px-4 py-4 text-muted-foreground">{d.number}</td>
                  <td className="px-4 py-4 text-muted-foreground">{d.issued === "—" ? "—" : fmtDate(d.issued)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{d.expires === "—" ? "—" : fmtDate(d.expires)}</td>
                  <td className="px-4 py-4">
                    <StatusPill status={d.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                      <Upload className="size-4" /> {d.status === "NOT_SUBMITTED" ? "Upload" : "Replace"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
        </TableCard>

        <div className="space-y-4">
          <Panel title="Action needed">
            <div className="space-y-3">
              {documents
                .filter((d) => d.status !== "VERIFIED")
                .map((d) => (
                  <div key={d.id} className="rounded-2xl bg-muted/50 p-4">
                    <p className="text-sm font-semibold">{d.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.status === "NOT_SUBMITTED"
                        ? "Required for high-value jobs."
                        : d.status === "MORE_INFO_REQUIRED"
                          ? "FIXO needs a clearer scan."
                          : "Under review — usually within 48 hours."}
                    </p>
                  </div>
                ))}
            </div>
          </Panel>
          <Panel title="Upload rules">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>PDF, JPG or PNG up to 10 MB.</li>
              <li>All four corners visible, no glare.</li>
              <li>Expiry dates must be readable.</li>
              <li>We remind you 30 days before expiry.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}
