// Warranties (Module 29) — warranties on completed jobs, with a claim flow.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  FileWarning,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableFilterBar, TableCard, TableScroll, TableHead, TablePagination } from "@/components/dashboard/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { warrantiesApi, type WarrantyRow } from "@/lib/api-client";
import { fmtDate, humanize } from "@/lib/format";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const title = "Warranties — FIXO";
const description = "Warranties on your completed jobs, with a simple claim flow.";

export const Route = createFileRoute("/warranties")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: WarrantiesPage,
});

// The backend paginates at up to 20 rows/page with no total-count field, so
// we page through it ourselves (capped) to build one in-memory list — the
// same "fetch a generous batch, paginate client-side" shape already used by
// Payments/Invoices — then slice PAGE_SIZE rows per screen for the table.
const FETCH_LIMIT = 20;
const MAX_FETCH_PAGES = 10;
const PAGE_SIZE = 8;
const EXPIRING_SOON_DAYS = 30;

const SUBMITTED_CLAIM_STATES = ["SUBMITTED", "APPROVED"];

function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return (d.getTime() - Date.now()) / 86_400_000;
}

function isActive(w: WarrantyRow): boolean {
  return (w.status ?? "").toUpperCase() === "ACTIVE";
}

function isExpiringSoon(w: WarrantyRow): boolean {
  if (!isActive(w)) return false;
  const days = daysUntil(w.expires_at);
  return days !== null && days >= 0 && days <= EXPIRING_SOON_DAYS;
}

function hasClaim(w: WarrantyRow): boolean {
  const c = (w.claim_status ?? "").toUpperCase();
  return c !== "" && c !== "NONE";
}

function isClaimSubmitted(w: WarrantyRow): boolean {
  return SUBMITTED_CLAIM_STATES.includes((w.claim_status ?? "").toUpperCase());
}

function canFileClaim(w: WarrantyRow): boolean {
  return !isClaimSubmitted(w);
}

// Heuristic (not an exact enum map) so any status/claim_status string the
// API returns still gets a sensible color — the label text itself always
// comes from humanize(), never a hardcoded value → tone map.
function toneFor(value?: string | null): string {
  const v = (value ?? "").toUpperCase();
  if (v.includes("ACTIVE") || v.includes("APPROVED")) return "bg-success/15 text-success";
  if (v.includes("EXPIRED") || v.includes("REJECTED")) return "bg-destructive/15 text-destructive";
  if (v.includes("SUBMITTED") || v.includes("PENDING")) return "bg-amber-500/15 text-amber-600";
  return "bg-muted text-muted-foreground";
}

function WarrantiesPage() {
  const { t } = useTranslation("warranties");
  const { access_token, loading, logout, customer } = useAuth();
  const [warranties, setWarranties] = useState<WarrantyRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [claimTarget, setClaimTarget] = useState<WarrantyRow | null>(null);

  const load = useCallback(async () => {
    try {
      let all: WarrantyRow[] = [];
      for (let p = 1; p <= MAX_FETCH_PAGES; p++) {
        const batch = await warrantiesApi.list(p, FETCH_LIMIT);
        all = all.concat(batch);
        if (batch.length < FETCH_LIMIT) break;
      }
      setWarranties(all);
    } catch {
      setWarranties((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    if (access_token && !loading) void load();
  }, [access_token, loading, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return warranties ?? [];
    return (warranties ?? []).filter((w) =>
      [w.service_name, w.provider_name].some((f) => (f ?? "").toLowerCase().includes(q)),
    );
  }, [warranties, search]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t("loading")}</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const totalWarranties = (warranties ?? []).length;
  const activeCount = (warranties ?? []).filter(isActive).length;
  const expiringSoonCount = (warranties ?? []).filter(isExpiringSoon).length;
  const claimsSubmittedCount = (warranties ?? []).filter(hasClaim).length;

  const hasFilters = search.trim() !== "";
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  return (
    <PageShell title={t("page.title")} subtitle={t("page.subtitle")} userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ShieldCheck} label={t("metrics.total")} hint={t("metrics.totalHint")} value={String(totalWarranties)} />
        <MetricCard icon={CheckCircle2} label={t("metrics.active")} hint={t("metrics.activeHint")} value={String(activeCount)} tone="success" tintValue />
        <MetricCard icon={Clock} label={t("metrics.expiringSoon")} hint={t("metrics.expiringSoonHint", { count: EXPIRING_SOON_DAYS })} value={String(expiringSoonCount)} tone="amber" tintValue />
        <MetricCard icon={FileWarning} label={t("metrics.claimsSubmitted")} hint={t("metrics.claimsSubmittedHint", { count: claimsSubmittedCount })} value={String(claimsSubmittedCount)} tone="primary" />
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={t("filterBar.searchPlaceholder")}
      />

      {warranties === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasFilters ? (
            <EmptyState
              icon={ShieldCheck}
              title={t("empty.filteredTitle")}
              description={t("empty.filteredDescription")}
              actionLabel={t("empty.clearFilters")}
              onAction={() => setSearch("")}
            />
          ) : (
            <EmptyState
              icon={ShieldCheck}
              title={t("empty.title")}
              description={t("empty.description")}
              actionLabel={t("empty.action")}
              actionTo="/bookings"
            />
          )}
        </div>
      ) : (
        <TableCard className="grow">
          <TableScroll minWidth={860}>
            <TableHead
              columns={[
                t("table.service"),
                t("table.provider"),
                t("table.expires"),
                t("table.status"),
                t("table.claim"),
                t("table.actions"),
              ]}
            />
            <tbody>
              {paged.map((w) => {
                const claimable = canFileClaim(w);
                return (
                  <tr
                    key={w.warranty_id}
                    onClick={() => claimable && setClaimTarget(w)}
                    className={`border-b border-border last:border-0 ${claimable ? "cursor-pointer hover:bg-muted/40" : ""}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Wrench className="size-5" />
                        </span>
                        <p className="font-semibold">{w.service_name ?? t("serviceFallback")}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">{w.provider_name ?? "—"}</td>
                    <td className="px-4 py-4 text-muted-foreground">{fmtDate(w.expires_at)}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneFor(w.status)}`}>
                        {w.status ? humanize(w.status) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {hasClaim(w) ? (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneFor(w.claim_status)}`}>
                          {humanize(w.claim_status as string)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {claimable ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setClaimTarget(w); }}
                          className="rounded-xl border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5"
                        >
                          {t("fileClaim")}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("claimAlreadyFiled")}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableScroll>
          <TablePagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            from={filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
            to={Math.min(page * PAGE_SIZE, filtered.length)}
            total={filtered.length}
            itemLabel={t("itemLabel")}
          />
        </TableCard>
      )}

      <ClaimDialog
        warranty={claimTarget}
        onOpenChange={(o) => !o && setClaimTarget(null)}
        onClaimed={() => {
          setClaimTarget(null);
          void load();
        }}
      />
    </PageShell>
  );
}

function ClaimDialog({
  warranty,
  onOpenChange,
  onClaimed,
}: {
  warranty: WarrantyRow | null;
  onOpenChange: (open: boolean) => void;
  onClaimed: () => void;
}) {
  const { t } = useTranslation("warranties");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (warranty) setDescription("");
  }, [warranty?.warranty_id]);

  const trimmedLength = description.trim().length;
  const tooShort = trimmedLength > 0 && trimmedLength < 10;

  async function submit() {
    if (!warranty) return;
    if (trimmedLength < 10) {
      toast.error(t("claimDialog.tooShort"));
      return;
    }
    setBusy(true);
    try {
      await warrantiesApi.claim(warranty.warranty_id, description.trim());
      toast.success(t("claimDialog.submitted"));
      onClaimed();
    } catch {
      // toast emitted by client
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!warranty} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("claimDialog.title")}</DialogTitle>
        </DialogHeader>
        {warranty && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-muted/50 p-4 text-sm">
              <p className="font-semibold">{warranty.service_name ?? t("serviceFallback")}</p>
              <p className="text-muted-foreground">{warranty.provider_name ?? "—"}</p>
            </div>
            <div className="space-y-1.5">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("claimDialog.placeholder")}
                maxLength={2000}
                rows={5}
              />
              <p className={`text-xs ${tooShort ? "text-destructive" : "text-muted-foreground"}`}>
                {t("claimDialog.hint", { count: description.length })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted"
              >
                {t("claimDialog.cancel")}
              </button>
              <button
                onClick={() => void submit()}
                disabled={busy || trimmedLength < 10}
                className="flex-1 rounded-xl py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                {busy ? t("claimDialog.submitting") : t("claimDialog.submit")}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
