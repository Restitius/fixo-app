import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Crown, Users } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fmtDate, fmtMoney } from "@/lib/format";
import { subscriptionsApi, type CurrentSubscription, type SubscriptionHistoryRow, type SubscriptionPlan } from "@/lib/api-client";

const title = "Subscription — FIXO Provider";
const description = "Manage your FIXO subscription plan.";

export const Route = createFileRoute("/subscription")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [current, setCurrent] = useState<CurrentSubscription | null>(null);
  const [history, setHistory] = useState<SubscriptionHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  function load() {
    return Promise.all([
      subscriptionsApi.listPlans(),
      subscriptionsApi.current().catch(() => null),
      subscriptionsApi.history(50, 0),
    ]).then(([p, c, h]) => {
      setPlans(p);
      setCurrent(c);
      setHistory(h);
    });
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function subscribe(plan: SubscriptionPlan) {
    const verb = current ? "Switch to" : "Subscribe to";
    if (!confirm(`${verb} the ${plan.name} plan (${fmtMoney(plan.price_monthly)}/month)?`)) return;
    setBusyPlanId(plan.plan_id);
    try {
      await subscriptionsApi.subscribe(plan.plan_id);
      await load();
      toast.success(`Now on the ${plan.name} plan.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not subscribe.");
    } finally {
      setBusyPlanId(null);
    }
  }

  async function cancel() {
    if (!confirm("Cancel your subscription? You'll lose plan benefits immediately.")) return;
    setCancelling(true);
    try {
      await subscriptionsApi.cancel();
      await load();
      toast.success("Subscription cancelled.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <ProviderPage title="Subscription" subtitle="Your FIXO plan, billing and history.">
      <Panel title="Current plan" className="mt-6">
        {loading ? null : current ? (
          <div className="rounded-2xl bg-muted/50 p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Crown className="size-5" />
                </span>
                <div>
                  <p className="text-base font-semibold">{current.plan_name}</p>
                  <p className="text-sm text-muted-foreground">{fmtMoney(current.price_monthly)}/month</p>
                </div>
              </div>
              <StatusPill status={current.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>Started {fmtDate(current.started_at)}</span>
              {current.current_period_end && <span>Renews {fmtDate(current.current_period_end)}</span>}
              {current.max_team_members != null && (
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3.5" /> Up to {current.max_team_members} team members
                </span>
              )}
            </div>
            {current.status === "ACTIVE" && (
              <button onClick={() => void cancel()} disabled={cancelling} className="mt-4 text-xs font-semibold text-destructive hover:underline disabled:opacity-50">
                {cancelling ? "Cancelling…" : "Cancel subscription"}
              </button>
            )}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">You're not subscribed to a plan yet. Pick one below.</p>
        )}
      </Panel>

      <Panel title={current ? "Switch plan" : "Available plans"} className="mt-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((p) => {
            const isCurrent = current?.plan_id === p.plan_id && current.status === "ACTIVE";
            return (
              <div key={p.plan_id} className="rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{p.name}</p>
                  {isCurrent && <StatusPill tone="success" label="Current" />}
                </div>
                {p.description && <p className="mt-1 text-xs text-muted-foreground">{p.description}</p>}
                <p className="mt-2 text-sm font-semibold text-primary">{fmtMoney(p.price_monthly)}/month</p>
                {p.max_team_members != null && <p className="text-xs text-muted-foreground">Up to {p.max_team_members} team members</p>}
                {!isCurrent && (
                  <button
                    onClick={() => void subscribe(p)}
                    disabled={busyPlanId === p.plan_id}
                    className="mt-3 w-full rounded-xl py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    style={{ backgroundImage: "var(--gradient-primary)" }}
                  >
                    {busyPlanId === p.plan_id ? "Saving…" : current ? "Switch to this plan" : "Subscribe"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="History" className="mt-6">
        {!loading && history.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No subscription history yet.</p>}
        <div className="space-y-2">
          {history.map((h) => (
            <div key={`${h.subscription_id}-${h.started_at}`} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{h.plan_name}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtDate(h.started_at)} {h.cancelled_at ? `– ${fmtDate(h.cancelled_at)}` : h.current_period_end ? `– renews ${fmtDate(h.current_period_end)}` : ""}
                </p>
              </div>
              <StatusPill status={h.status} />
            </div>
          ))}
        </div>
      </Panel>
    </ProviderPage>
  );
}
