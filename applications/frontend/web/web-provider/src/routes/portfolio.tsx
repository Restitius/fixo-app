import { createFileRoute } from "@tanstack/react-router";
import { Images, Plus } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { fmtDate } from "@/lib/format";
import { portfolio, provider } from "@/lib/mock-data";

const title = "Portfolio — FIXO Provider";
const description = "Showcase completed work with before-and-after photos, categories and project notes.";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  return (
    <ProviderPage title="Portfolio" subtitle="Work samples customers see on your public profile.">
      <div className="mt-6 grid gap-4 pb-6 lg:grid-cols-[1fr_320px]">
        <Panel
          title="Projects"
          action={
            <button className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              <Plus className="size-4" /> Add project
            </button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {portfolio.map((p) => (
              <article key={p.id} className="overflow-hidden rounded-2xl bg-muted/50">
                <div
                  className="flex h-36 items-center justify-center text-primary-foreground"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  <Images className="size-8 opacity-80" />
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.category} · {fmtDate(p.date)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                  <div className="mt-3 flex gap-2 text-xs font-semibold">
                    <button className="rounded-lg border border-border bg-card px-3 py-1.5 hover:bg-muted">Edit</button>
                    <button className="rounded-lg border border-border bg-card px-3 py-1.5 hover:bg-muted">Remove</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Public profile preview">
            <p className="text-sm font-semibold">{provider.title}</p>
            <p className="text-xs text-muted-foreground">
              {provider.rating}★ · {provider.reviewCount} reviews · {provider.completedJobs} jobs
            </p>
            <p className="mt-3 text-sm text-muted-foreground">{provider.bio}</p>
            <button className="mt-4 w-full rounded-xl border border-border bg-card py-2.5 text-sm font-semibold hover:bg-muted">
              View public profile
            </button>
          </Panel>
          <Panel title="Photo guidelines">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Get the customer's permission before publishing job photos.</li>
              <li>Use before-and-after pairs where possible.</li>
              <li>No faces, addresses, or number plates.</li>
              <li>Minimum 1200px wide, up to 10 photos per project.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}
