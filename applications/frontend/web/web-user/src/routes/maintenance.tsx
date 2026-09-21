// Maintenance (Module 33) — recurring upkeep plans for home assets (e.g.
// "service the AC every 180 days"). Plans reference an asset (generic
// /assets domain) and a service (catalog). The backend's list/get queries
// join in asset_name/service_name/plan_number even though the shared
// MaintenancePlanRow type in api-client.ts only declares the base columns —
// PlanRow below extends it locally (without touching api-client.ts) so the
// table can show real names instead of bare ids.
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Plus,
  Wrench,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableFilterBar, TableCard, TableScroll, TableHead, TablePagination } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth-context";
import {
  maintenanceApi,
  assetsApi,
  bookingApi,
  type MaintenancePlanRow,
  type AssetRow,
  type CatalogCategory,
  type CatalogServiceResult,
} from "@/lib/api-client";
import { fmtDate, humanize } from "@/lib/format";

const title = "Maintenance — FIXO";
const description = "Recurring maintenance plans for your home assets.";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: MaintenancePage,
});

// See file header note — asset_name/service_name/plan_number/last_done_at
// are real columns the backend's LIST/GET queries return via a join, just
// not declared on the shared MaintenancePlanRow type.
type PlanRow = MaintenancePlanRow & {
  plan_number?: string;
  asset_name?: string;
  service_name?: string;
  last_done_at?: string | null;
};

// The backend caps a page at 50 rows with no total-count field, so we page
// through it ourselves (capped) to build one in-memory list — the same
// "fetch a generous batch, paginate client-side" shape used by
// Payments/Warranties — then slice PAGE_SIZE rows per screen for the table.
const FETCH_LIMIT = 50;
const MAX_FETCH_PAGES = 4;
const PAGE_SIZE = 8;
const DUE_SOON_DAYS = 30;

function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return (d.getTime() - Date.now()) / 86_400_000;
}

function isActive(p: PlanRow): boolean {
  return (p.status ?? "").toUpperCase() === "ACTIVE";
}
function isOverdue(p: PlanRow): boolean {
  return (p.status ?? "").toUpperCase() === "OVERDUE";
}
function isCancelled(p: PlanRow): boolean {
  return (p.status ?? "").toUpperCase() === "CANCELLED";
}
function isDueSoon(p: PlanRow): boolean {
  if (!isActive(p)) return false;
  const days = daysUntil(p.next_due_date);
  return days !== null && days >= 0 && days <= DUE_SOON_DAYS;
}

function statusTone(status: string): string {
  const s = (status ?? "").toUpperCase();
  if (s === "OVERDUE") return "bg-destructive/15 text-destructive";
  if (s === "CANCELLED") return "bg-muted text-muted-foreground";
  return "bg-success/15 text-success";
}

function MaintenancePage() {
  const { t } = useTranslation("maintenance");
  const { access_token, loading, logout, customer } = useAuth();

  const [plans, setPlans] = useState<PlanRow[] | null>(null);
  const [assets, setAssets] = useState<AssetRow[] | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[] | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [markingDoneId, setMarkingDoneId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PlanRow | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      let all: PlanRow[] = [];
      for (let p = 1; p <= MAX_FETCH_PAGES; p++) {
        const batch = (await maintenanceApi.listPlans(p, FETCH_LIMIT)) as PlanRow[];
        all = all.concat(batch);
        if (batch.length < FETCH_LIMIT) break;
      }
      setPlans(all);
    } catch {
      setPlans((prev) => prev ?? []);
    }
  }, []);

  const loadAssets = useCallback(() => {
    void assetsApi.list().then(setAssets).catch(() => setAssets((a) => a ?? []));
  }, []);

  const loadCategories = useCallback(() => {
    void bookingApi.catalogCategories().then(setCategories).catch(() => setCategories((c) => c ?? []));
  }, []);

  useEffect(() => {
    if (access_token && !loading) {
      void loadPlans();
      loadAssets();
      loadCategories();
    }
  }, [access_token, loading, loadPlans, loadAssets, loadCategories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (plans ?? []).filter((p) => {
      if (statusFilter !== "all" && (p.status ?? "").toUpperCase() !== statusFilter) return false;
      if (!q) return true;
      return [p.asset_name, p.service_name, p.plan_number].some((f) => (f ?? "").toLowerCase().includes(q));
    });
  }, [plans, search, statusFilter]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t("loading")}</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const totalPlans = (plans ?? []).length;
  const activeCount = (plans ?? []).filter(isActive).length;
  const dueSoonCount = (plans ?? []).filter(isDueSoon).length;
  const overdueCount = (plans ?? []).filter(isOverdue).length;

  const hasFilters = search.trim() !== "" || statusFilter !== "all";
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  async function markDone(p: PlanRow) {
    setMarkingDoneId(p.plan_id);
    try {
      await maintenanceApi.markDone(p.plan_id);
      toast.success(t("actions.markedDone", { asset: p.asset_name ?? t("assetFallback") }));
      void loadPlans();
    } catch {
      // toast already emitted by api client
    } finally {
      setMarkingDoneId(null);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await maintenanceApi.cancelPlan(cancelTarget.plan_id);
      toast.success(t("cancelConfirm.cancelled"));
      setCancelTarget(null);
      void loadPlans();
    } catch {
      // toast already emitted by api client
    } finally {
      setCancelling(false);
    }
  }

  return (
    <PageShell title={t("page.title")} subtitle={t("page.subtitle")} userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ClipboardList} label={t("metrics.total")} hint={t("metrics.totalHint")} value={String(totalPlans)} />
        <MetricCard icon={CheckCircle2} label={t("metrics.active")} hint={t("metrics.activeHint")} value={String(activeCount)} tone="success" tintValue />
        <MetricCard icon={Clock} label={t("metrics.dueSoon")} hint={t("metrics.dueSoonHint", { count: DUE_SOON_DAYS })} value={String(dueSoonCount)} tone="amber" tintValue />
        <MetricCard icon={AlertTriangle} label={t("metrics.overdue")} hint={t("metrics.overdueHint")} value={String(overdueCount)} tone="destructive" tintValue />
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={t("filterBar.searchPlaceholder")}
        filters={[
          {
            value: statusFilter,
            onChange: (v) => { setStatusFilter(v); setPage(1); },
            placeholder: t("filterBar.statusPlaceholder"),
            options: [
              { value: "all", label: t("filterBar.allStatuses") },
              { value: "ACTIVE", label: t("statuses.ACTIVE") },
              { value: "OVERDUE", label: t("statuses.OVERDUE") },
              { value: "CANCELLED", label: t("statuses.CANCELLED") },
            ],
          },
        ]}
        trailing={
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="size-4" /> {t("filterBar.addPlan")}
          </Button>
        }
      />

      {plans === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasFilters ? (
            <EmptyState
              icon={Wrench}
              title={t("empty.filteredTitle")}
              description={t("empty.filteredDescription")}
              actionLabel={t("empty.clearFilters")}
              onAction={() => { setSearch(""); setStatusFilter("all"); }}
            />
          ) : (
            <EmptyState
              icon={Wrench}
              title={t("empty.title")}
              description={t("empty.description")}
              actionLabel={t("empty.action")}
              onAction={() => setAddOpen(true)}
            />
          )}
        </div>
      ) : (
        <TableCard className="grow">
          <TableScroll minWidth={860}>
            <TableHead
              columns={[
                t("table.asset"),
                t("table.service"),
                t("table.interval"),
                t("table.nextDue"),
                t("table.status"),
                t("table.actions"),
              ]}
            />
            <tbody>
              {paged.map((p) => {
                const overdue = isOverdue(p);
                const actionable = isActive(p) || overdue;
                return (
                  <tr key={p.plan_id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Wrench className="size-4" />
                        </span>
                        <p className="font-semibold">{p.asset_name ?? t("assetFallback")}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{p.service_name ?? t("serviceFallback")}</td>
                    <td className="px-4 py-4 text-muted-foreground">{t("table.intervalValue", { count: p.interval_days })}</td>
                    <td className={`px-4 py-4 ${overdue ? "font-medium text-destructive" : "text-muted-foreground"}`}>
                      {fmtDate(p.next_due_date)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(p.status)}`}>
                        {t(`statuses.${(p.status ?? "").toUpperCase()}`, { defaultValue: humanize(p.status ?? "") })}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {actionable ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => void markDone(p)}
                            disabled={markingDoneId === p.plan_id}
                            className="rounded-xl border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/5 disabled:opacity-60"
                          >
                            {markingDoneId === p.plan_id ? t("actions.markingDone") : t("actions.markDone")}
                          </button>
                          <button
                            onClick={() => setCancelTarget(p)}
                            className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            {t("actions.cancel")}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("actions.cancelledNote")}</span>
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

      <AddPlanDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        assets={assets}
        categories={categories}
        onCreated={() => void loadPlans()}
      />

      <AlertDialog open={!!cancelTarget} onOpenChange={(v) => !v && !cancelling && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("cancelConfirm.description", {
                asset: cancelTarget?.asset_name ?? t("assetFallback"),
                service: cancelTarget?.service_name ?? t("serviceFallback"),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>{t("cancelConfirm.keep")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmCancel()}
            >
              {cancelling ? t("actions.cancelling") : t("cancelConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function AddPlanDialog({
  open,
  onOpenChange,
  assets,
  categories,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assets: AssetRow[] | null;
  categories: CatalogCategory[] | null;
  onCreated: () => void;
}) {
  const { t } = useTranslation("maintenance");
  const [assetId, setAssetId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [services, setServices] = useState<CatalogServiceResult[] | null>(null);
  const [intervalDays, setIntervalDays] = useState("180");
  const [nextDueDate, setNextDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset the form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setAssetId(assets && assets.length > 0 ? String(assets[0]!.asset_id) : "");
    setCategoryId(categories && categories.length > 0 ? categories[0]!.category_id : "");
    setServiceId("");
    setServices(null);
    setIntervalDays("180");
    setNextDueDate("");
    setNotes("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Default-select once assets/categories arrive after the dialog is already open.
  useEffect(() => {
    if (open && !assetId && assets && assets.length > 0) setAssetId(String(assets[0]!.asset_id));
  }, [open, assets, assetId]);
  useEffect(() => {
    if (open && !categoryId && categories && categories.length > 0) setCategoryId(categories[0]!.category_id);
  }, [open, categories, categoryId]);

  // The catalog has no "list services in category" endpoint — the same
  // category-name search used by the booking flow (routes/book.tsx) doubles
  // as one here.
  useEffect(() => {
    if (!open || !categoryId) return;
    const category = categories?.find((c) => c.category_id === categoryId);
    if (!category) return;
    let cancelled = false;
    setServices(null);
    setServiceId("");
    bookingApi
      .catalogSearch(category.name)
      .then((res) => {
        if (cancelled) return;
        setServices(res.results);
        if (res.results.length === 1) setServiceId(res.results[0]!.service_id);
      })
      .catch(() => {
        if (!cancelled) setServices([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, categoryId, categories]);

  const noAssets = assets !== null && assets.length === 0;
  const intervalNum = Number(intervalDays);

  async function submit() {
    if (!assetId) {
      toast.error(t("addDialog.selectAsset"));
      return;
    }
    if (!serviceId) {
      toast.error(t("addDialog.selectService"));
      return;
    }
    if (!Number.isFinite(intervalNum) || intervalNum < 1 || intervalNum > 1095) {
      toast.error(t("addDialog.intervalRange"));
      return;
    }
    setSaving(true);
    try {
      await maintenanceApi.createPlan({
        asset_id: assetId,
        service_id: serviceId,
        interval_days: intervalNum,
        next_due_date: nextDueDate || null,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      toast.success(t("addDialog.created"));
      onOpenChange(false);
      onCreated();
    } catch {
      // toast already emitted by api client
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("addDialog.title")}</DialogTitle>
        </DialogHeader>

        {noAssets ? (
          <div className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            <p>{t("addDialog.noAssetsHint")}</p>
            <Link to="/properties" className="mt-2 inline-block font-semibold text-primary hover:underline">
              {t("addDialog.noAssetsCta")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("addDialog.assetLabel")}</Label>
              <Select value={assetId} onValueChange={setAssetId}>
                <SelectTrigger><SelectValue placeholder={t("addDialog.assetPlaceholder")} /></SelectTrigger>
                <SelectContent>
                  {(assets ?? []).map((a) => (
                    <SelectItem key={a.asset_id} value={String(a.asset_id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("addDialog.categoryLabel")}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder={t("addDialog.categoryPlaceholder")} /></SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c.category_id} value={c.category_id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("addDialog.serviceLabel")}</Label>
              <Select value={serviceId} onValueChange={setServiceId} disabled={!categoryId || services === null}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !categoryId
                        ? t("addDialog.servicePlaceholder")
                        : services === null
                          ? t("addDialog.loadingServices")
                          : services.length === 0
                            ? t("addDialog.noServicesFound")
                            : t("addDialog.servicePlaceholder")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(services ?? []).map((s) => (
                    <SelectItem key={s.service_id} value={s.service_id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("addDialog.intervalLabel")}</Label>
              <Input
                type="number"
                min="1"
                max="1095"
                inputMode="numeric"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("addDialog.intervalHint")}</p>
            </div>
            <div className="space-y-1.5">
              <Label>{t("addDialog.nextDueLabel")}</Label>
              <Input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                {t("addDialog.nextDueHint", { count: Number.isFinite(intervalNum) && intervalNum > 0 ? intervalNum : 180 })}
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>{t("addDialog.notesLabel")}</Label>
              <Textarea
                placeholder={t("addDialog.notesPlaceholder")}
                value={notes}
                maxLength={300}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t("addDialog.cancel")}
          </Button>
          {!noAssets && (
            <Button disabled={saving} onClick={() => void submit()}>
              {saving ? t("addDialog.saving") : t("addDialog.save")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
