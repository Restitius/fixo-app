// Incoming requests — wired to the real /providers/requests feed and
// respond endpoint. Field names read directly from requests_router.py /
// provider_request_service.py and the real PRV.REQUESTS.FEED SQL.
import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Clock, Inbox, Loader2, MapPin, Timer } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fmtMoney } from "@/lib/format";
import { dashboardApi, requestsApi, type RequestFeedItem } from "@/lib/api-client";

const title = "Incoming Job Requests — FIXO Provider";
const description = "Review matched service requests, accept, decline or send a quotation before the response window closes.";

export const Route = createFileRoute("/requests")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: RequestsPage,
});

function countdown(seconds?: number | null) {
  if (seconds == null) return "";
  if (seconds <= 0) return "Expired";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min left`;
  return `${Math.floor(seconds / 3600)} hrs left`;
}

function RequestsPage() {
  const [requests, setRequests] = useState<RequestFeedItem[]>([]);
  const [handled, setHandled] = useState<Record<string, "ACCEPTED" | "DECLINED">>({});
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    dashboardApi
      .requestsFeed()
      .then((rows) => {
        setRequests(rows);
        if (rows[0]) setSelectedId(rows[0].request_id);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load requests."))
      .finally(() => setLoading(false));
  }, []);

  const selected = requests.find((r) => r.request_id === selectedId) ?? requests[0];
  const open = requests.filter((r) => !handled[r.request_id]);

  async function respond(requestId: string, response_type: "ACCEPTED" | "DECLINED") {
    setBusyId(requestId);
    try {
      await requestsApi.respond(requestId, { response_type });
      setHandled((h) => ({ ...h, [requestId]: response_type }));
      toast.success(response_type === "ACCEPTED" ? "Job accepted." : "Request declined.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not respond to this request.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <ProviderPage title="Incoming requests" subtitle="Matched to your categories, service areas and availability.">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </ProviderPage>
    );
  }

  return (
    <ProviderPage title="Incoming requests" subtitle="Matched to your categories, service areas and availability.">
      {open.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Inbox}
            title="No open requests"
            description="You have responded to everything. New matched requests will appear here instantly."
            actionLabel="Check availability"
            actionTo="/availability"
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 pb-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {requests.map((r) => {
              const state = handled[r.request_id];
              return (
                <div
                  key={r.match_id}
                  onClick={() => setSelectedId(r.request_id)}
                  className={`cursor-pointer rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] transition-all ${
                    selectedId === r.request_id ? "ring-2 ring-primary/40" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold tracking-tight">{r.service_name}</h3>
                        {state && <StatusPill tone={state === "ACCEPTED" ? "success" : "muted"} label={state === "ACCEPTED" ? "Accepted" : "Declined"} />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{r.request_number}</p>
                    </div>
                    <div className="text-right">
                      {r.estimated_earnings != null && <p className="text-lg font-extrabold text-primary">{fmtMoney(r.estimated_earnings)}</p>}
                      <p className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                        <Timer className="size-3.5" /> {countdown(r.respond_in_seconds)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">{r.description}</p>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-primary" /> {[r.city, r.region].filter(Boolean).join(", ") || "—"}
                    </span>
                    {r.preferred_date && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5 text-primary" /> {r.preferred_date} {r.time_window ? `· ${r.time_window}` : ""}
                      </span>
                    )}
                  </div>

                  {!state && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); respond(r.request_id, "ACCEPTED"); }}
                        disabled={busyId === r.request_id}
                        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
                        style={{ backgroundImage: "var(--gradient-primary)" }}
                      >
                        Accept job
                      </button>
                      <Link
                        to="/quotes"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-muted"
                      >
                        Send quotation
                      </Link>
                      <button
                        onClick={(e) => { e.stopPropagation(); respond(r.request_id, "DECLINED"); }}
                        disabled={busyId === r.request_id}
                        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <Panel title="Request details">
              {selected && (
                <dl className="space-y-3 text-sm">
                  <Detail label="Request number" value={selected.request_number} />
                  <Detail label="Customer" value={selected.customer_name} />
                  <Detail label="Service" value={selected.service_name} />
                  {selected.property_name && <Detail label="Property" value={selected.property_name} />}
                  <Detail label="Location" value={[selected.city, selected.region].filter(Boolean).join(", ") || "—"} />
                  {selected.preferred_date && <Detail label="Preferred time" value={`${selected.preferred_date}${selected.time_window ? ` · ${selected.time_window}` : ""}`} />}
                  {selected.estimated_earnings != null && <Detail label="Estimated earning" value={fmtMoney(selected.estimated_earnings)} />}
                </dl>
              )}
            </Panel>
          </div>
        </div>
      )}
    </ProviderPage>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
