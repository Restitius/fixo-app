// Providers — real provider directory for a service category, backed by the
// new GET /providers?category_id= endpoint (Module 14 extended this session).
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Calendar,
  Headset,
  Lock,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Search,
  ShieldCheck,
  Star,
  Tag,
  UserX,
  Users,
  Wrench,
  X,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { bookingApi, favoritesApi, type ProviderListing, type ProviderProfile } from "@/lib/api-client";
import { fmtMoney } from "@/lib/format";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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

const SORT_OPTIONS = ["recommended", "topRated", "lowestPrice", "mostJobs"] as const;
type Sort = (typeof SORT_OPTIONS)[number];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
}
const TONES = ["bg-sky-500/15 text-sky-600", "bg-primary/10 text-primary", "bg-success/15 text-success", "bg-amber-500/15 text-amber-600"];

function ProvidersPage() {
  const { t } = useTranslation("services");
  const { access_token, loading, customer, logout } = useAuth();
  const navigate = useNavigate();
  const { category_id, category_name } = Route.useSearch();
  const [providers, setProviders] = useState<ProviderListing[] | null>(null);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("all");
  const [minRating, setMinRating] = useState("0");
  const [sort, setSort] = useState<Sort>("recommended");
  const [selected, setSelected] = useState<ProviderListing | null>(null);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!(access_token && !loading)) return;
    if (!category_id) {
      setProviders([]);
      return;
    }
    setProviders(null);
    void bookingApi.listProvidersByCategory(category_id).then(setProviders).catch(() => setProviders([]));
  }, [access_token, loading, category_id]);

  useEffect(() => {
    if (!(access_token && !loading)) return;
    favoritesApi.list(1, 20).then((rows) => setFavoritedIds(new Set(rows.map((r) => r.provider_id)))).catch(() => {});
  }, [access_token, loading]);

  async function toggleFavorite(providerId: string) {
    try {
      const result = await favoritesApi.toggle(providerId);
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (result.is_favorite) next.add(providerId);
        else next.delete(providerId);
        return next;
      });
      toast.success(result.is_favorite ? t("common.toast.savedToBookmarks") : t("common.toast.removedFromBookmarks"));
    } catch {
      // apiClient already toasts the error
    }
  }

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
    if (sort === "topRated") list.sort((a, b) => b.rating_avg - a.rating_avg);
    else if (sort === "lowestPrice") list.sort((a, b) => a.base_amount - b.base_amount);
    else if (sort === "mostJobs") list.sort((a, b) => b.jobs_completed - a.jobs_completed);
    return list;
  }, [providers, search, location, minRating, sort]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t("common.loading")}</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const dataLoaded = providers !== null;
  const avgRating = (providers ?? []).length ? (providers ?? []).reduce((s, p) => s + p.rating_avg, 0) / (providers ?? []).length : 0;
  const totalReviews = (providers ?? []).reduce((s, p) => s + p.rating_count, 0);
  const minPrice = (providers ?? []).length ? Math.min(...(providers ?? []).map((p) => p.base_amount)) : null;

  function bookNow(p: ProviderListing) {
    navigate({
      to: "/book",
      search: { category: category_name, categoryId: category_id, providerId: p.provider_id, providerName: p.display_name, path: "find-provider" },
    });
  }

  return (
    <PageShell
      title={category_name ? t("providers.pageTitleWithCategory", { category: category_name }) : t("providers.pageTitle")}
      subtitle={t("providers.subtitle")}
      userName={customer?.full_name}
      onLogout={logout}
    >
      <button onClick={() => navigate({ to: "/services" })} className="mt-6 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("providers.backToServices")}
      </button>

      {!category_id ? (
        <div className="mt-6">
          <EmptyState icon={UserX} title={t("providers.noCategory.title")} description={t("providers.noCategory.description")} actionLabel={t("providers.noCategory.action")} actionTo="/services" />
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Briefcase} label={t("providers.metrics.providersFound.label")} hint={t("providers.metrics.providersFound.hint")} value={dataLoaded ? String((providers ?? []).length) : "—"} />
            <MetricCard icon={Star} label={t("providers.metrics.averageRating.label")} hint={t("providers.metrics.averageRating.hint", { count: totalReviews, formatted: totalReviews.toLocaleString() })} value={dataLoaded ? avgRating.toFixed(1) : "—"} tone="amber" tintValue />
            <MetricCard icon={MessagesSquare} label={t("providers.metrics.totalReviews.label")} hint={t("providers.metrics.totalReviews.hint")} value={dataLoaded ? totalReviews.toLocaleString() : "—"} tone="success" tintValue />
            <MetricCard icon={Tag} label={t("providers.metrics.startingFrom.label")} hint={t("providers.metrics.startingFrom.hint")} value={dataLoaded ? (minPrice != null ? fmtMoney(minPrice) : "—") : "—"} />
          </div>

          <div className="mt-6 flex items-start gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("providers.searchPlaceholder")}
                    className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-sm shadow-[var(--shadow-card)] outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="w-[160px] bg-card shadow-[var(--shadow-card)]"><MapPin className="mr-1 size-4" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("providers.allLocations")}</SelectItem>
                    {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger className="w-[130px] bg-card shadow-[var(--shadow-card)]"><Star className="mr-1 size-4" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">{t("providers.anyRating")}</SelectItem>
                    <SelectItem value="4">4.0+</SelectItem>
                    <SelectItem value="4.5">4.5+</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
                  <SelectTrigger className="w-[160px] bg-card shadow-[var(--shadow-card)]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((s) => <SelectItem key={s} value={s}>{t(`providers.sort.${s}`)}</SelectItem>)}
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
                    title={t("providers.noResults.title", { category: category_name ?? "" })}
                    description={t("providers.noResults.description")}
                    actionLabel={t("providers.noResults.action")}
                    onAction={() => { setSearch(""); setLocation("all"); setMinRating("0"); }}
                  />
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {filtered.map((p, i) => (
                    <div
                      key={p.provider_id}
                      style={{ animationDelay: `${i * 50}ms` }}
                      className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both flex flex-wrap items-center gap-4 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-200 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]"
                    >
                      <span className={`flex size-16 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${TONES[i % TONES.length]}`}>
                        {initials(p.display_name)}
                      </span>
                      <div className="min-w-[180px] flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{p.display_name}</h3>
                          {p.rating_avg >= 4.8 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                              <Award className="size-3" /> {t("common.topRated")}
                            </span>
                          )}
                        </div>
                        <p className="flex items-center gap-1 text-sm">
                          <Star className="size-3.5 fill-current text-[#FFB800]" /> {p.rating_avg.toFixed(1)}
                          <span className="text-muted-foreground">({t("common.reviewsCount", { count: p.rating_count, formatted: p.rating_count.toLocaleString() })})</span>
                        </p>
                        {p.headline && <p className="mt-0.5 text-sm text-muted-foreground">{p.headline}</p>}
                        {p.city && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" /> {p.city}{p.region ? `, ${p.region}` : ""}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground"><Briefcase className="size-3.5" /> {t("common.jobsDoneCount", { count: p.jobs_completed, formatted: p.jobs_completed.toLocaleString() })}</span>
                        <span className="font-semibold text-primary">{t("providers.startingFromPrice", { price: fmtMoney(p.base_amount) })}</span>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => toggleFavorite(p.provider_id)}
                          title={favoritedIds.has(p.provider_id) ? t("providers.removeBookmark") : t("providers.saveBookmark")}
                          className={`flex items-center justify-center rounded-xl border px-3 py-2.5 transition-colors ${
                            favoritedIds.has(p.provider_id) ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          {favoritedIds.has(p.provider_id) ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                        </button>
                        <button onClick={() => setSelected(p)} className="rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5">
                          {t("providers.viewProfile")}
                        </button>
                        <button
                          onClick={() => bookNow(p)}
                          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all duration-200 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]"
                          style={{ backgroundImage: "var(--gradient-primary)" }}
                        >
                          {t("common.bookNow")} <ArrowRight className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-[320px] shrink-0 space-y-6">
              <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
                <h3 className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-primary" /> {t("providers.serviceArea.title")}</h3>
                {cities.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">{t("providers.serviceArea.empty")}</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cities.map((c) => (
                      <span key={c} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{c}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-primary/5 p-5">
                <h3 className="flex items-center gap-2 font-semibold text-primary"><ShieldCheck className="size-4" /> {t("providers.recommendation.title")}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t("providers.recommendation.description", { category: category_name || t("providers.thisService") })}</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Star className="size-4 text-primary" /> {t("providers.recommendation.items.reviews")}</li>
                  <li className="flex items-center gap-2"><Tag className="size-4 text-primary" /> {t("providers.recommendation.items.pricing")}</li>
                  <li className="flex items-center gap-2"><Lock className="size-4 text-primary" /> {t("providers.recommendation.items.security")}</li>
                  <li className="flex items-center gap-2"><Headset className="size-4 text-primary" /> {t("providers.recommendation.items.support")}</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      <ProviderProfileDialog
        provider={selected}
        onClose={() => setSelected(null)}
        onBookNow={bookNow}
        favorited={!!selected && favoritedIds.has(selected.provider_id)}
        onToggleFavorite={toggleFavorite}
      />
    </PageShell>
  );
}

function ProviderProfileDialog({
  provider,
  onClose,
  onBookNow,
  favorited,
  onToggleFavorite,
}: {
  provider: ProviderListing | null;
  onClose: () => void;
  onBookNow: (p: ProviderListing) => void;
  favorited: boolean;
  onToggleFavorite: (providerId: string) => void;
}) {
  const { t } = useTranslation("services");
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-background p-6 shadow-[var(--shadow-lg)] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-[var(--ease-premium)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold">{t("providers.dialog.title")}</h2>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"><X className="size-5" /></button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">{initials(provider.display_name)}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{provider.display_name}</h3>
              {provider.rating_avg >= 4.8 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  <Award className="size-3" /> {t("common.topRated")}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{provider.headline}</p>
            <p className="mt-1 flex items-center gap-1 text-sm">
              <Star className="size-3.5 fill-current text-[#FFB800]" /> {provider.rating_avg.toFixed(1)} ({t("common.reviewsCount", { count: provider.rating_count, formatted: provider.rating_count.toLocaleString() })})
              <span className="text-muted-foreground"> · {t("common.jobsDoneCount", { count: provider.jobs_completed, formatted: provider.jobs_completed.toLocaleString() })}</span>
            </p>
          </div>
        </div>

        {profile?.bio && <p className="mt-4 text-sm text-muted-foreground">{profile.bio}</p>}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-muted/40 p-3 text-center shadow-[var(--shadow-xs)]">
            <Calendar className="mx-auto size-5 text-primary" />
            <p className="mt-2 text-xs text-muted-foreground">{t("providers.dialog.activeSince")}</p>
            <p className="text-sm font-bold">{profile ? new Date(profile.created_at).getFullYear() : "—"}</p>
          </div>
          <div className="rounded-2xl bg-muted/40 p-3 text-center shadow-[var(--shadow-xs)]">
            <Briefcase className="mx-auto size-5 text-primary" />
            <p className="mt-2 text-xs text-muted-foreground">{t("providers.dialog.completedJobs")}</p>
            <p className="text-sm font-bold">{provider.jobs_completed.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl bg-muted/40 p-3 text-center shadow-[var(--shadow-xs)]">
            <Users className="mx-auto size-5 text-primary" />
            <p className="mt-2 text-xs text-muted-foreground">{t("providers.dialog.servicesOffered")}</p>
            <p className="text-sm font-bold">{profile ? profile.services.length : "—"}</p>
          </div>
          <div className="rounded-2xl bg-muted/40 p-3 text-center shadow-[var(--shadow-xs)]">
            <Tag className="mx-auto size-5 text-primary" />
            <p className="mt-2 text-xs text-muted-foreground">{t("providers.dialog.avgPrice")}</p>
            <p className="text-sm font-bold">
              {profile && profile.services.length > 0
                ? fmtMoney(profile.services.reduce((s, x) => s + x.base_amount, 0) / profile.services.length)
                : "—"}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-semibold">{t("providers.dialog.servicesPricing")}</h4>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{t("providers.dialog.allPricesInTZS")}</span>
          </div>
          {profile === null ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : profile.services.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("providers.dialog.noServices")}</p>
          ) : (
            <div className="space-y-2">
              {profile.services.map((s) => (
                <div
                  key={s.service_id}
                  className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3 shadow-[var(--shadow-xs)] transition-shadow duration-200 hover:shadow-[var(--shadow-sm)]"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Wrench className="size-4" /></span>
                  <span className="min-w-0 flex-1 text-sm font-medium">{s.name}</span>
                  <span className="shrink-0 font-semibold text-primary">{fmtMoney(s.base_amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-primary/5 p-4 text-xs sm:grid-cols-4">
          <div>
            <ShieldCheck className="size-5 text-primary" />
            <p className="mt-1 font-semibold">{t("providers.dialog.features.transparentPricing.title")}</p>
            <p className="text-muted-foreground">{t("providers.dialog.features.transparentPricing.hint")}</p>
          </div>
          <div>
            <Star className="size-5 text-primary" />
            <p className="mt-1 font-semibold">{t("providers.dialog.features.realReviewsCount", { count: provider.rating_count, formatted: provider.rating_count.toLocaleString() })}</p>
            <p className="text-muted-foreground">{t("providers.dialog.features.realReviews.hint")}</p>
          </div>
          <div>
            <MapPin className="size-5 text-primary" />
            <p className="mt-1 font-semibold">{t("providers.dialog.features.coverageTitle", { city: provider.city ?? t("providers.dialog.localFallback") })}</p>
            <p className="text-muted-foreground">{t("providers.dialog.features.coverage.hint")}</p>
          </div>
          <div>
            <Lock className="size-5 text-primary" />
            <p className="mt-1 font-semibold">{t("providers.dialog.features.securePayments.title")}</p>
            <p className="text-muted-foreground">{t("providers.dialog.features.securePayments.hint")}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium transition-colors hover:bg-muted">{t("common.close")}</button>
          <button
            onClick={() => onToggleFavorite(provider.provider_id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors ${
              favorited ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
            }`}
          >
            {favorited ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
            {favorited ? t("providers.dialog.saved") : t("providers.dialog.save")}
          </button>
          <button
            onClick={() => toast.info(t("providers.dialog.messageUnavailable"))}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <MessageCircle className="size-4" /> {t("providers.dialog.messageProvider")}
          </button>
          <button
            onClick={() => onBookNow(provider)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all duration-200 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {t("common.bookNow")} <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
