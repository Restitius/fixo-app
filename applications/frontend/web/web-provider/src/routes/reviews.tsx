import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Star } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { fmtDate } from "@/lib/format";
import { provider, ratingBreakdown, reviews } from "@/lib/mock-data";

const title = "Reviews & Ratings — FIXO Provider";
const description = "Customer ratings by category, written reviews and your public replies.";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ReviewsPage,
});

function Stars({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`size-4 ${i <= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`} />
      ))}
    </span>
  );
}

function ReviewsPage() {
  const unreplied = reviews.filter((r) => !r.replied).length;

  return (
    <ProviderPage title="Reviews" subtitle="What your customers say — and how you respond.">
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard icon={Star} label="Overall rating" value={`${provider.rating} / 5`} hint={`${provider.reviewCount} reviews`} hero />
        <MetricCard icon={MessageSquare} label="Awaiting reply" value={String(unreplied)} hint="Reply within 48 hours" tone="amber" tintValue />
        <MetricCard icon={Star} label="5-star reviews" value={`${Math.round((reviews.filter((r) => r.rating === 5).length / reviews.length) * 100)}%`} hint="Of recent reviews" tone="success" tintValue />
      </div>

      <div className="mt-4 grid gap-4 pb-6 lg:grid-cols-[1fr_320px]">
        <Panel title="Recent reviews">
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl bg-muted/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{r.customer}</p>
                  <div className="flex items-center gap-3">
                    <Stars n={r.rating} />
                    <span className="text-xs text-muted-foreground">{fmtDate(r.date)}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
                {r.replied ? (
                  <p className="mt-3 rounded-xl bg-card p-3 text-xs text-muted-foreground">
                    <strong className="text-foreground">Your reply:</strong> Thank you for the kind feedback — happy to help again anytime.
                  </p>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <input
                      placeholder="Write a public reply..."
                      className="h-10 flex-1 rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                    />
                    <button
                      className="rounded-xl px-4 text-sm font-semibold text-primary-foreground"
                      style={{ backgroundImage: "var(--gradient-primary)" }}
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Rating breakdown">
            <div className="space-y-3">
              {ratingBreakdown.map((b) => (
                <div key={b.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{b.label}</span>
                    <span className="font-semibold">{b.value}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${(b.value / 5) * 100}%`, backgroundImage: "var(--gradient-primary)" }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Review policy">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Reviews can only be left after a completed, signed-off job.</li>
              <li>You may reply once publicly to each review.</li>
              <li>Abusive or fake reviews can be reported for removal.</li>
              <li>Ratings below 3.5 for 30 days trigger a quality review.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}
