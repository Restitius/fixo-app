// Bookmarks — real saved providers via the favorites domain (Module 30).
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, Bookmark, BookmarkX, Briefcase, MapPin, Star } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { favoritesApi, type FavoriteProvider } from "@/lib/api-client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const title = "Bookmarks — FIXO";
const description = "Your saved, favorite providers in one place.";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: BookmarksPage,
});

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
}
const TONES = ["bg-sky-500/15 text-sky-600", "bg-primary/10 text-primary", "bg-success/15 text-success", "bg-amber-500/15 text-amber-600"];

function BookmarksPage() {
  const { t } = useTranslation("services");
  const { access_token, loading, customer, logout } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteProvider[] | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!(access_token && !loading)) return;
    favoritesApi.list(1, 20).then(setFavorites).catch(() => setFavorites([]));
  }, [access_token, loading]);

  async function removeFavorite(providerId: string) {
    setRemovingId(providerId);
    try {
      const result = await favoritesApi.toggle(providerId);
      if (!result.is_favorite) {
        setFavorites((prev) => (prev ?? []).filter((f) => f.provider_id !== providerId));
        toast.success(t("common.toast.removedFromBookmarks"));
      }
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t("common.loading")}</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const dataLoaded = favorites !== null;

  return (
    <PageShell title={t("bookmarks.pageTitle")} subtitle={t("bookmarks.subtitle")} userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        {!dataLoaded ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-3xl bg-muted/60" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title={t("bookmarks.empty.title")}
            description={t("bookmarks.empty.description")}
            actionLabel={t("bookmarks.empty.action")}
            actionTo="/services"
          />
        ) : (
          <div className="space-y-4">
            {favorites.map((p, i) => (
              <div
                key={p.favorite_id}
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
                      <MapPin className="size-3" /> {p.city}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground"><Briefcase className="size-3.5" /> {t("common.jobsDoneCount", { count: p.jobs_completed, formatted: p.jobs_completed.toLocaleString() })}</span>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => removeFavorite(p.provider_id)}
                    disabled={removingId === p.provider_id}
                    className="flex items-center gap-2 rounded-xl border border-destructive/40 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60"
                  >
                    <BookmarkX className="size-4" /> {t("bookmarks.remove")}
                  </button>
                  <button
                    onClick={() => navigate({ to: "/book", search: { providerId: p.provider_id, providerName: p.display_name, path: "find-provider" } })}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                    style={{ backgroundImage: "var(--gradient-primary)" }}
                  >
                    {t("common.bookNow")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
