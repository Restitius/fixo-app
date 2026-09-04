// Search — real catalog search (same endpoint the booking flow already uses).
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ArrowRight, Search as SearchIcon, Wrench } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { bookingApi, type CatalogServiceResult } from "@/lib/api-client";
import { useTranslation } from "react-i18next";

const title = "Search — FIXO";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title }] }),
  component: SearchPage,
});

function SearchPage() {
  const { t } = useTranslation("services");
  const { access_token, loading, customer, logout } = useAuth();
  const navigate = useNavigate();
  const { q } = Route.useSearch();
  const [query, setQuery] = useState(q ?? "");
  const [results, setResults] = useState<CatalogServiceResult[] | null>(null);

  useEffect(() => {
    if (!(access_token && !loading)) return;
    if (!q || !q.trim()) {
      setResults(null);
      return;
    }
    setResults(null);
    bookingApi.catalogSearch(q).then((r) => setResults(r.results)).catch(() => setResults([]));
  }, [access_token, loading, q]);

  function runSearch() {
    navigate({ to: "/search", search: { q: query.trim() || undefined } });
  }

  return (
    <PageShell title={t("search.pageTitle")} subtitle={t("search.subtitle")} userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-3 rounded-2xl bg-card p-2 shadow-[var(--shadow-card)]">
          <SearchIcon className="ml-3 size-5 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder={t("search.placeholder")}
            className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={runSearch}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {t("search.searchButton")}
          </button>
        </div>

        <div className="mt-6">
          {!q ? (
            <p className="text-sm text-muted-foreground">{t("search.prompt")}</p>
          ) : results === null ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/60" />)}
            </div>
          ) : results.length === 0 ? (
            <EmptyState icon={SearchIcon} title={t("search.empty.title")} description={t("search.empty.description", { query: q })} />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t("search.resultsCount", { count: results.length, query: q })}</p>
              {results.map((r) => (
                <button
                  key={r.service_id}
                  onClick={() => navigate({ to: "/book", search: { category: r.category_name, path: "direct" } })}
                  className="flex w-full items-center gap-4 rounded-2xl bg-card p-4 text-left shadow-[var(--shadow-card)] hover:bg-muted/40"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Wrench className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{r.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{r.description}</p>
                    <p className="mt-0.5 text-xs font-medium text-primary">{r.category_name}</p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
