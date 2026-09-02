// Providers — real provider directory for a service category, backed by the
// new GET /providers?category_id= endpoint (Module 14 extended this session).
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Briefcase,
  Headset,
  Lock,
  MapPin,
  MessagesSquare,
  Search,
  ShieldCheck,
  Star,
  Tag,
  UserX,
  X,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { bookingApi, type ProviderListing, type ProviderProfile } from "@/lib/api-client";
import { fmtMoney } from "@/lib/format";

const title = "Find Providers — FIXO";
const description = "Choose a trusted, real-reviewed professional for your service.";

const providersSearchSchema = z.object({
  category_id: z.string().optional(),
  category_name: z.string().optional(),
});

export const Route = createFileRoute("/providers")({
  validateSearch: providersSearchSchema,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ProvidersPage,
});

const SORTS = ["Recommended", "Top Rated", "Lowest Price", "Most Jobs"] as const;
type Sort = (typeof SORTS)[number];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
}
const TONES = ["bg-sky-500/15 text-sky-600", "bg-primary/10 text-primary", "bg-success/15 text-success", "bg-amber-500/15 text-amber-600"];

function ProvidersPage() {
  const { access_token, loading, customer, logout } = useAuth();
  const navigate = useNavigate();
  const { category_id, category_name } = Route.useSearch();
  const [providers, setProviders] = useState<ProviderListing[] | null>(null);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("all");
  const [minRating, setMinRating] = useState("0");
  const [sort, setSort] = useState<Sort>("Recommended");
  const [selected, setSelected] = useState<ProviderListing | null>(null);

  useEffect(() => {
    if (!(access_token && !loading)) return;
    if (!category_id) {
      setProviders([]);
      return;
    }
    setProviders(null);
    void bookingApi.listProvidersByCategory(category_id).then(setProviders).catch(() => setProviders([]));
  }, [access_token, loading, category_id]);

  const cities = useMemo(() => Array.from(new Set((providers ?? []).map((p) => p.city).filter((c): c is string => !!c))), [providers]);

  const filtered = useMemo(() => {
    let list = providers ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.display_name.toLowerCase().includes(q) || (p.headline ?? "").toLowerCase().includes(q));
    }
    if (location !== "all") list = list.filter((p) => p.city === location);
    if (minRating !== "0") list = list.filter((p) => p.rating_avg >= Number(minRating));
    list = [...list];
    if (sort === "Top Rated") list.sort((a, b) => b.rating_avg - a.rating_avg);
    else if (sort === "Lowest Price") list.sort((a, b) => a.base_amount - b.base_amount);
    else if (sort === "Most Jobs") list.sort((a, b) => b.jobs_completed - a.jobs_completed);
    return list;
  }, [providers, search, location, minRating, sort]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const dataLoaded = providers !== null;
  const avgRating = (providers ?? []).length ? (providers ?? []).reduce((s, p) => s + p.rating_avg, 0) / (providers ?? []).length : 0;
  const totalReviews = (providers ?? []).reduce((s, p) => s + p.rating_count, 0);
  const minPrice = (providers ?? []).length ? Math.min(...(providers ?? []).map((p) => p.base_amount)) : null;

  function bookNow(p: ProviderListing) {
    navigate({ to: "/book", search: { category: category_name, providerName: p.display_name } });
  }

  return (
    <PageShell
      title={category_name ? `${category_name} Providers` : "Find Providers"}
      subtitle="Choose a trusted professional for your service"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <button onClick={() => navigate({ to: "/services" })} className="mt-6 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Services
      </button>

      {!category_id ? (
        <div className="mt-6">
          <EmptyState icon={UserX} title="Pick a service first" description="Choose a service category to see the real providers who offer it." actionLabel="Browse Services" actionTo="/services" />
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Briefcase} label="Providers Found" hint="Matching this category" value={dataLoaded ? String((providers ?? []).length) : "—"} />
            <MetricCard icon={Star} label="Average Rating" hint={`Based on ${totalReviews.toLocaleString()} reviews`} value={dataLoaded ? avgRating.toFixed(1) : "—"} tone="amber" tintValue />
            <MetricCard icon={MessagesSquare} label="Total Reviews" hint="Across these providers" value={dataLoaded ? totalReviews.toLocaleString() : "—"} tone="success" tintValue />
            <MetricCard icon={Tag} label="Starting From" hint="Competitive pricing" value={dataLoaded ? (minPrice != null ? fmtMoney(minPrice) : "—") : "—"} />
          </div>

          <div className="mt-6 flex items-start gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search providers..."
                    className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-sm shadow-[var(--shadow-card)] outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="w-[160px] bg-card shadow-[var(--shadow-card)]"><MapPin className="mr-1 size-4" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger className="w-[130px] bg-card shadow-[var(--shadow-card)]"><Star className="mr-1 size-4" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Rating</SelectItem>
                    <SelectItem value="4">4.0+</SelectItem>
                    <SelectItem value="4.5">4.5+</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                  <SelectTrigger className="w-[160px] bg-card shadow-[var(--shadow-card)]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SORTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {!dataLoaded ? (
                <div className="mt-6 space-y-4">
                  {[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-muted/60" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    icon={UserX}
                    title={`No ${category_name ?? ""} providers right now`}
                    description="We don't have anyone matching your filters yet. Try widening your search."
                    actionLabel="Clear Filters"
                    onAction={() => { setSearch(""); setLocation("all"); setMinRating("0"); }}
                  />
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {filtered.map((p, i) => (
                    <div
                      key={p.provider_id}
                      style={{ animationDelay: `${i * 50}ms` }}
                      className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both flex flex-wrap items-center gap-4 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]"
                    >
                      <span className={`flex size-16 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${TONES[i % TONES.length]}`}>
                        {initials(p.display_name)}
                      </span>
                      <div className="min-w-[180px] flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{p.display_name}</h3>
                          {p.rating_avg >= 4.8 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                              <Award className="size-3" /> Top Rated
                            </span>
                          )}
                        </div>
                        <p className="flex items-center gap-1 text-sm">
                          <Star className="size-3.5 fill-current text-[#FFB800]" /> {p.rating_avg.toFixed(1)}
                          <span className="text-muted-foreground">({p.rating_count.toLocaleString()} reviews)</span>
                        </p>
                        {p.headline && <p className="mt-0.5 text-sm text-muted-foreground">{p.headline}</p>}
                        {p.city && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" /> {p.city}{p.region ? `, ${p.region}` : ""}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground"><Briefcase className="size-3.5" /> {p.jobs_completed.toLocaleString()} jobs done</span>
                        <span className="font-semibold text-primary">Starting from {fmtMoney(p.base_amount)}</span>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button onClick={() => setSelected(p)} className="rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5">
                          View Profile
                        </button>
                        <button
                          onClick={() => bookNow(p)}
                          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                          style={{ backgroundImage: "var(--gradient-primary)" }}
                        >
                          Book Now <ArrowRight className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-[320px] shrink-0 space-y-6">
              <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
                <h3 className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-primary" /> Service Area</h3>
                {cities.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">No location data yet for these providers.</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cities.map((c) => (
                      <span key={c} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{c}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-primary/5 p-5">
                <h3 className="flex items-center gap-2 font-semibold text-primary"><ShieldCheck className="size-4" /> Our Recommendation</h3>
                <p className="mt-1 text-xs text-muted-foreground">These providers are ranked by real customer ratings for {category_name ?? "this service"}.</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Star className="size-4 text-primary" /> Real reviews from real customers</li>
                  <li className="flex items-center gap-2"><Tag className="size-4 text-primary" /> Transparent, per-job pricing</li>
                  <li className="flex items-center gap-2"><Lock className="size-4 text-primary" /> Secure booking &amp; payments</li>
                  <li className="flex items-center gap-2"><Headset className="size-4 text-primary" /> Support available if anything goes wrong</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      <ProviderProfileDialog provider={selected} onClose={() => setSelected(null)} onBookNow={bookNow} />
    </PageShell>
  );
}

function ProviderProfileDialog({
  provider,
  onClose,
  onBookNow,
}: {
  provider: ProviderListing | null;
  onClose: () => void;
  onBookNow: (p: ProviderListing) => void;
}) {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);

  useEffect(() => {
    if (!provider) {
      setProfile(null);
      return;
    }
    setProfile(null);
    void bookingApi.getProviderProfile(provider.provider_id).then(setProfile).catch(() => setProfile(null));
  }, [provider?.provider_id]);

  if (!provider) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-background p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold">Provider Profile</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"><X className="size-5" /></button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">{initials(provider.display_name)}</span>
          <div>
            <h3 className="text-lg font-bold">{provider.display_name}</h3>
            <p className="text-sm text-muted-foreground">{provider.headline}</p>
            <p className="mt-1 flex items-center gap-1 text-sm">
              <Star className="size-3.5 fill-current text-[#FFB800]" /> {provider.rating_avg.toFixed(1)} ({provider.rating_count.toLocaleString()} reviews)
              <span className="text-muted-foreground"> · {provider.jobs_completed.toLocaleString()} jobs done</span>
            </p>
          </div>
        </div>

        {profile?.bio && <p className="mt-4 text-sm text-muted-foreground">{profile.bio}</p>}

        <div className="mt-4">
          <h4 className="mb-2 font-semibold">Services &amp; pricing</h4>
          {profile === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : profile.services.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services listed yet.</p>
          ) : (
            <div className="divide-y divide-border rounded-2xl border border-border">
              {profile.services.map((s) => (
                <div key={s.service_id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span>{s.name}</span>
                  <span className="font-semibold text-primary">{fmtMoney(s.base_amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted">Close</button>
          <button
            onClick={() => onBookNow(provider)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            Book Now <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
