import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquareOff, Star } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { fmtDate } from "@/lib/format";
import { ratingsApi, type ProviderReview, type ReviewSummary } from "@/lib/api-client";

const title = "Reviews — FIXO Provider";
const description = "Real customer star ratings and written reviews.";

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
  const [reviews, setReviews] = useState<ProviderReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([ratingsApi.list(undefined, 50, 0), ratingsApi.summary()])
      .then(([r, s]) => {
        setReviews(r);
        setSummary(s);
      })
      .finally(() => setLoading(false));
  }, []);

  const breakdown = summary
    ? [
        { stars: 5, count: summary.five_star },
        { stars: 4, count: summary.four_star },
        { stars: 3, count: summary.three_star },
        { stars: 2, count: summary.two_star },
        { stars: 1, count: summary.one_star },
      ]
    : [];
  const maxBreakdown = Math.max(1, ...breakdown.map((b) => b.count));

  return (
    <ProviderPage title="Reviews" subtitle="What your customers say.">
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard icon={Star} label="Average rating" value={`${(summary?.average_rating ?? 0).toFixed(1)} / 5`} hint={`${summary?.total_count ?? 0} reviews`} hero />
        <MetricCard icon={Star} label="5-star reviews" value={summary && summary.total_count > 0 ? `${Math.round((summary.five_star / summary.total_count) * 100)}%` : "0%"} hint="Of all reviews" tone="success" tintValue />
        <MetricCard icon={Star} label="This month" value={String(summary?.this_month ?? 0)} hint="New reviews" />
      </div>

      <div className="mt-4 grid gap-4 pb-6 lg:grid-cols-[1fr_320px]">
        <Panel title="Recent reviews">
          <div className="space-y-4">
            {!loading && reviews.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                <MessageSquareOff className="size-6" />
                <p className="text-sm">No reviews yet.</p>
              </div>
            )}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl bg-muted/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-muted-foreground">Verified customer</p>
                  <div className="flex items-center gap-3">
                    <Stars n={r.rating} />
                    <span className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</span>
                  </div>
                </div>
                {r.title && <p className="mt-2 text-sm font-semibold">{r.title}</p>}
                <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Rating breakdown">
            <div className="space-y-3">
              {breakdown.map((b) => (
                <div key={b.stars}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{b.stars} star</span>
                    <span className="font-semibold">{b.count}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${(b.count / maxBreakdown) * 100}%`, backgroundImage: "var(--gradient-primary)" }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Review policy">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Reviews are shown here read-only — replying and moderation aren't available yet.</li>
              <li>Customer identities aren't shown to protect their privacy.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}
