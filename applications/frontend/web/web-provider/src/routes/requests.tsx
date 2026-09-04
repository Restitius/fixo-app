import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Clock, Image, Inbox, MapPin, Star, Timer } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fmtDate, fmtMoney } from "@/lib/format";
import { jobRequests } from "@/lib/mock-data";

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

function countdown(seconds: number) {
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min left`;
  return `${Math.floor(seconds / 3600)} hrs left`;
}

function RequestsPage() {
  const [handled, setHandled] = useState<Record<string, "ACCEPTED" | "DECLINED">>({});
  const [selectedId, setSelectedId] = useState(jobRequests[0]?.id ?? "");
  const selected = jobRequests.find((r) => r.id === selectedId) ?? jobRequests[0];
  const open = jobRequests.filter((r) => !handled[r.id]);

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
            {jobRequests.map((r) => {
              const state = handled[r.id];
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`cursor-pointer rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] transition-all ${
                    selectedId === r.id ? "ring-2 ring-primary/40" : ""
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold tracking-tight">{r.service}</h3>
                        {r.urgent && <StatusPill tone="destructive" label="Emergency" />}
                        {state && <StatusPill tone={state === "ACCEPTED" ? "success" : "muted"} label={state === "ACCEPTED" ? "Accepted" : "Declined"} />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {r.id} · {r.propertyType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-primary">{fmtMoney(r.estimatedEarning)}</p>
                      <p className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                        <Timer className="size-3.5" /> {countdown(r.respondInSeconds)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">{r.description}</p>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-primary" /> {r.area} · {r.distanceKm} km
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5 text-primary" /> {fmtDate(r.date)} at {r.time} · {r.estimatedDuration}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="size-3.5 text-primary" /> Customer {r.customerRating}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Image className="size-3.5 text-primary" /> {r.photos} photos
                    </span>
                  </div>

                  {!state && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() => setHandled((h) => ({ ...h, [r.id]: "ACCEPTED" }))}
                        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
                        style={{ backgroundImage: "var(--gradient-primary)" }}
                      >
                        Accept job
                      </button>
                      <Link
                        to="/quotes"
                        className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-muted"
                      >
                        Send quotation
                      </Link>
                      <button
                        onClick={() => setHandled((h) => ({ ...h, [r.id]: "DECLINED" }))}
                        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10"
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
                  <Detail label="Request ID" value={selected.id} />
                  <Detail label="Customer" value={`${selected.customer} · ${selected.customerRating}★`} />
                  <Detail label="Service" value={selected.service} />
                  <Detail label="Property" value={selected.propertyType} />
                  <Detail label="Location" value={`${selected.area} (${selected.distanceKm} km away)`} />
                  <Detail label="Preferred time" value={`${fmtDate(selected.date)} · ${selected.time}`} />
                  <Detail label="Estimated duration" value={selected.estimatedDuration} />
                  <Detail label="Estimated earning" value={fmtMoney(selected.estimatedEarning)} />
                  <Detail label="Photos attached" value={String(selected.photos)} />
                </dl>
              )}
            </Panel>

            <Panel title="Matching factors">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Service category match",
                  "Inside your active service area",
                  "Available in your calendar",
                  "Provider level: Top Provider boost",
                  "Rating above area average",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary" /> {f}
                  </li>
                ))}
              </ul>
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
