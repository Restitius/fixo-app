// Services — real catalog categories with a details dialog and a real
// hand-off into the provider directory and the existing booking flow.
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bug,
  Check,
  Clock,
  Hammer,
  Leaf,
  type LucideIcon,
  Paintbrush,
  Search,
  SearchX,
  Shield,
  Siren,
  Sparkles,
  Star,
  ThumbsUp,
  Tag,
  Truck,
  Tv,
  Users,
  Wind,
  Wrench,
  X,
  Zap,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useAuth } from "@/lib/auth-context";
import { bookingApi, type CatalogCategory, type CatalogServiceResult } from "@/lib/api-client";
import { fmtMoney } from "@/lib/format";
import { useTranslation } from "react-i18next";

const title = "Browse Services — FIXO";
const description = "Discover trusted handyman services for plumbing, electrical, cleaning, repairs and more.";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ServicesPage,
});

// SERVICE_CATEGORIES.icon is a plain lowercase word seeded in the DB
// (wrench/zap/sparkles/...) — mapped to the matching real lucide icon.
const ICONS: Record<string, LucideIcon> = {
  wrench: Wrench, zap: Zap, sparkles: Sparkles, hammer: Hammer, paintbrush: Paintbrush,
  tv: Tv, wind: Wind, leaf: Leaf, bug: Bug, truck: Truck, siren: Siren, tool: Wrench,
};
function iconFor(name: string): LucideIcon {
  return ICONS[name.toLowerCase()] ?? Wrench;
}
const TONES = [
  "bg-sky-500/15 text-sky-600", "bg-amber-500/15 text-amber-600", "bg-success/15 text-success",
  "bg-purple-500/15 text-purple-600", "bg-destructive/15 text-destructive", "bg-primary/10 text-primary",
];
function toneFor(i: number) {
  return TONES[i % TONES.length];
}

const SORT_OPTIONS = ["popular", "topRated", "az"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

function ServicesPage() {
  const { t } = useTranslation("services");
  const { access_token, loading, customer, logout } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CatalogCategory[] | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("popular");
  const [detail, setDetail] = useState<CatalogCategory | null>(null);

  useEffect(() => {
    if (access_token && !loading) {
      void bookingApi.catalogCategories().then(setCategories).catch(() => setCategories([]));
    }
  }, [access_token, loading]);

  const filtered = useMemo(() => {
    let list = categories ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    list = [...list];
    if (sort === "popular") list.sort((a, b) => (b.provider_count ?? 0) - (a.provider_count ?? 0));
    else if (sort === "topRated") list.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [categories, search, sort]);

  const dataLoaded = categories !== null;
  const totalServices = (categories ?? []).reduce((s, c) => s + c.service_count, 0);
  const ratedCategories = (categories ?? []).filter((c) => c.avg_rating != null);
  const avgRating = ratedCategories.length ? ratedCategories.reduce((s, c) => s + (c.avg_rating ?? 0), 0) / ratedCategories.length : null;
  const trustedProviders = (categories ?? []).reduce((s, c) => s + (c.provider_count ?? 0), 0);
  const emergencyCategory = (categories ?? []).find((c) => c.code === "EMERGENCY");
  const popular = useMemo(() => [...(categories ?? [])].sort((a, b) => (b.provider_count ?? 0) - (a.provider_count ?? 0)).slice(0, 5), [categories]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t("common.loading")}</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  function findProviders(c: CatalogCategory) {
    navigate({ to: "/providers", search: { category_id: c.category_id, category_name: c.name } });
  }

  return (
    <PageShell title={t("services.page.title")} subtitle={t("services.page.subtitle")} userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Sparkles} label={t("services.metrics.availableServices.label")} hint={t("services.metrics.availableServices.hint")} value={dataLoaded ? String(totalServices) : "—"} />
        <MetricCard icon={Star} label={t("services.metrics.averageRating.label")} hint={t("services.metrics.averageRating.hint")} value={dataLoaded ? (avgRating ? avgRating.toFixed(1) : "—") : "—"} tone="amber" tintValue />
        <MetricCard icon={Users} label={t("services.metrics.trustedProviders.label")} hint={t("services.metrics.trustedProviders.hint")} value={dataLoaded ? String(trustedProviders) : "—"} tone="success" tintValue />
        <MetricCard icon={Siren} label={t("services.metrics.emergencyReady.label")} hint={t("services.metrics.emergencyReady.hint")} value={dataLoaded ? String(emergencyCategory?.service_count ?? 0) : "—"} />
      </div>

      <div className="mt-6 flex items-start gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("services.searchPlaceholder")}
                className="h-11 w-full rounded-xl bg-card pl-4 pr-11 text-sm shadow-[var(--shadow-card)] outline-none placeholder:text-muted-foreground"
              />
            </div>
            {SORT_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  sort === s ? "text-primary-foreground" : "bg-card text-foreground/80 shadow-[var(--shadow-card)] hover:bg-sidebar-accent"
                }`}
                style={sort === s ? { backgroundImage: "var(--gradient-primary)" } : undefined}
              >
                {t(`services.sort.${s}`)}
              </button>
            ))}
          </div>

          {!dataLoaded ? (
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-56 animate-pulse rounded-3xl bg-muted/60" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={SearchX}
                title={t("services.emptyState.title")}
                description={t("services.emptyState.description", { query: search })}
                actionLabel={t("services.emptyState.action")}
                onAction={() => setSearch("")}
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c, i) => {
                const Icon = iconFor(c.icon);
                return (
                  <div
                    key={c.category_id}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className="group animate-in fade-in slide-in-from-bottom-2 fill-mode-both cursor-pointer rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1"
                    onClick={() => setDetail(c)}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`flex size-12 items-center justify-center rounded-2xl ${toneFor(i)}`}>
                        <Icon className="size-6" />
                      </span>
                      {c.avg_rating != null && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
                          <Star className="size-3 fill-current text-[#FFB800]" />
                          {c.avg_rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 text-lg font-semibold">{c.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="font-medium text-primary">{c.min_price != null ? t("services.fromPrice", { price: fmtMoney(c.min_price) }) : t("services.askProvider")}</span>
                      <span className="text-muted-foreground">
                        {c.total_jobs != null
                          ? t("services.jobsDoneCount", { count: c.total_jobs, formatted: c.total_jobs.toLocaleString() })
                          : t("services.serviceCount", { count: c.service_count })}
                      </span>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); findProviders(c); }}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                      style={{ backgroundImage: "var(--gradient-primary)" }}
                    >
                      {t("services.findProviders")}
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="w-[320px] shrink-0 space-y-6 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Users className="size-5 text-primary" /> {t("services.popularCategories")}
            </h3>
            <div className="space-y-1">
              {popular.map((c, i) => {
                const Icon = iconFor(c.icon);
                return (
                  <button key={c.category_id} onClick={() => setDetail(c)} className="flex w-full items-center gap-3 rounded-xl py-2 text-left hover:bg-muted/50">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-muted-foreground">{i + 1}</span>
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${toneFor(i)}`}>
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{t("services.providerCount", { count: c.provider_count ?? 0 })}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-primary/5 p-4 text-center">
            <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <p className="mt-3 font-semibold">{t("services.quickMatch.title")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("services.quickMatch.description")}</p>
            <button
              onClick={() => navigate({ to: "/book", search: {} })}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              {t("services.quickMatch.cta")}
            </button>
          </div>
        </div>
      </div>

      <ServiceDetailsDialog category={detail} onClose={() => setDetail(null)} onFindProviders={findProviders} />
    </PageShell>
  );
}

function ServiceDetailsDialog({
  category,
  onClose,
  onFindProviders,
}: {
  category: CatalogCategory | null;
  onClose: () => void;
  onFindProviders: (c: CatalogCategory) => void;
}) {
  const { t } = useTranslation("services");
  const navigate = useNavigate();
  const [services, setServices] = useState<CatalogServiceResult[] | null>(null);

  useEffect(() => {
    if (!category) {
      setServices(null);
      return;
    }
    setServices(null);
    void bookingApi
      .catalogSearch(category.name)
      .then((res) => setServices(res.results.filter((s) => s.category_code === category.code)))
      .catch(() => setServices([]));
  }, [category?.category_id]);

  if (!category) return null;
  const Icon = iconFor(category.icon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-background p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold">{t("services.dialog.title")}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"><X className="size-5" /></button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-7" />
          </span>
          <div>
            <h3 className="text-lg font-bold">{category.name}</h3>
            {category.avg_rating != null && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="size-3.5 fill-current text-[#FFB800]" /> {category.avg_rating.toFixed(1)}
                {" "}({t("services.dialog.jobsCompleted", { count: category.total_jobs ?? 0, formatted: (category.total_jobs ?? 0).toLocaleString() })})
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 rounded-2xl bg-muted/40 p-4">
          <div>
            <p className="text-xs text-muted-foreground">{t("services.dialog.startingFrom")}</p>
            <p className="text-lg font-bold text-primary">{category.min_price != null ? fmtMoney(category.min_price) : t("services.askProvider")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{t("services.dialog.providersAvailable")}</p>
              <p className="text-sm font-semibold">{category.provider_count ?? 0}</p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">{category.description}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border p-4">
            <h4 className="mb-2 font-semibold">{t("services.dialog.whatsIncluded")}</h4>
            {services === null ? (
              <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : services.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("services.dialog.noServicesYet")}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {services.map((s) => (
                  <li key={s.service_id} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" /> {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-border p-4">
            <h4 className="mb-2 flex items-center gap-2 font-semibold"><Tag className="size-4 text-primary" /> {t("services.dialog.priceRange")}</h4>
            <p className="text-lg font-bold text-primary">
              {category.min_price != null ? t("services.dialog.priceFrom", { price: fmtMoney(category.min_price) }) : t("services.dialog.varies")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("services.dialog.priceVariesNote")}</p>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="mb-2 font-semibold">{t("services.dialog.whyChooseFixo")}</h4>
          <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-success" /> {t("services.dialog.reasons.skilled")}</li>
            <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-success" /> {t("services.dialog.reasons.quickResponse")}</li>
            <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-success" /> {t("services.dialog.reasons.qualityWork")}</li>
            <li className="flex items-center gap-2"><Check className="size-4 shrink-0 text-success" /> {t("services.dialog.reasons.transparentPricing")}</li>
          </ul>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3 rounded-2xl bg-primary/5 p-4 text-center text-xs">
          <div>
            <Shield className="mx-auto size-5 text-primary" />
            <p className="mt-1 font-semibold">{t("services.dialog.features.realReviews.title")}</p>
            <p className="text-muted-foreground">{t("services.dialog.features.realReviews.hint")}</p>
          </div>
          <div>
            <Tag className="mx-auto size-5 text-primary" />
            <p className="mt-1 font-semibold">{t("services.dialog.features.upfrontPricing.title")}</p>
            <p className="text-muted-foreground">{t("services.dialog.features.upfrontPricing.hint")}</p>
          </div>
          <div>
            <Clock className="mx-auto size-5 text-primary" />
            <p className="mt-1 font-semibold">{t("services.dialog.features.onTimeService.title")}</p>
            <p className="text-muted-foreground">{t("services.dialog.features.onTimeService.hint")}</p>
          </div>
          <div>
            <ThumbsUp className="mx-auto size-5 text-primary" />
            <p className="mt-1 font-semibold">{t("services.dialog.features.providersReadyCount", { count: category.provider_count ?? 0 })}</p>
            <p className="text-muted-foreground">{t("services.dialog.features.readyToHelp")}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted">{t("common.close")}</button>
          <button onClick={() => onFindProviders(category)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary py-3 text-sm font-semibold text-primary hover:bg-primary/5">
            {t("services.findProviders")} <ArrowRight className="size-4" />
          </button>
          <button
            onClick={() => navigate({ to: "/book", search: { category: category.name, categoryId: category.category_id, path: "direct" } })}
            className="flex-1 rounded-xl py-3 text-sm font-semibold text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {t("common.bookNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
