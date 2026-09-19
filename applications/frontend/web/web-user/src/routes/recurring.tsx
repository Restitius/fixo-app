// Recurring Services (Module 31) — subscriptions for repeat bookings
// ("clean my house every 2 weeks"). Backed by the real /recurring domain:
// list/create/pause/resume/cancel. Service picking mirrors book.tsx's real
// category -> catalogSearch flow so every created plan points at a real
// service_id, never an invented one.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CheckCircle2, Clock, Pause, PauseCircle, Play, Plus, Repeat, XCircle } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableFilterBar, TableCard, TableScroll, TableHead, TablePagination } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { fmtDate } from "@/lib/format";
import {
  bookingApi,
  recurringApi,
  type Address,
  type CatalogCategory,
  type CatalogServiceResult,
  type RecurringRow,
} from "@/lib/api-client";

export const Route = createFileRoute("/recurring")({
  component: RecurringPage,
});

const FREQUENCIES = ["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY"] as const;
// Backend `time_window` is a free-form string capped at 12 chars — these three
// values match the ones already used for one-off bookings in routes/book.tsx.
const TIME_WINDOWS = ["MORNING", "AFTERNOON", "EVENING"] as const;
const PAGE_SIZE = 10;
const NONE = "none";

function statusStyle(status: RecurringRow["status"]) {
  if (status === "ACTIVE") return "bg-success/15 text-success";
  if (status === "PAUSED") return "bg-amber-500/15 text-amber-600";
  return "bg-muted text-muted-foreground";
}

function RecurringPage() {
  const { t } = useTranslation("recurring");
  const { access_token, loading, logout, customer } = useAuth();

  const [subs, setSubs] = useState<RecurringRow[] | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[] | null>(null);
  const [addresses, setAddresses] = useState<Address[] | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [showCreate, setShowCreate] = useState(false);
  const [cancelling, setCancelling] = useState<RecurringRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // The backend paginates /recurring, but a customer's subscription list is
  // small — fetch up to the API's max page size once and filter/paginate
  // client-side, matching the pattern already used for charges in payments.tsx.
  const load = useCallback(() => {
    void recurringApi.list(1, 50).then(setSubs).catch(() => setSubs((prev) => prev ?? []));
  }, []);

  useEffect(() => {
    if (access_token && !loading) {
      load();
      void bookingApi.catalogCategories().then(setCategories).catch(() => setCategories([]));
      void bookingApi.listAddresses().then(setAddresses).catch(() => setAddresses([]));
    }
  }, [access_token, loading, load]);

  const filtered = useMemo(() => {
    let list = subs ?? [];
    if (statusFilter !== "all") list = list.filter((s) => s.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((s) => (s.service_name ?? "").toLowerCase().includes(q));
    }
    return list;
  }, [subs, statusFilter, search]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = search.trim() !== "" || statusFilter !== "all";

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t("loading")}</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const activeCount = (subs ?? []).filter((s) => s.status === "ACTIVE").length;
  const pausedCount = (subs ?? []).filter((s) => s.status === "PAUSED").length;

  async function pauseSub(row: RecurringRow) {
    setBusyId(row.recurring_id);
    try {
      const updated = await recurringApi.pause(row.recurring_id);
      setSubs((prev) => prev?.map((s) => (s.recurring_id === updated.recurring_id ? updated : s)) ?? null);
      toast.success(t("pausedToast"));
    } catch {
      // toast emitted by client
    } finally {
      setBusyId(null);
    }
  }

  async function resumeSub(row: RecurringRow) {
    setBusyId(row.recurring_id);
    try {
      const updated = await recurringApi.resume(row.recurring_id);
      setSubs((prev) => prev?.map((s) => (s.recurring_id === updated.recurring_id ? updated : s)) ?? null);
      toast.success(t("resumedToast"));
    } catch {
      // toast emitted by client
    } finally {
      setBusyId(null);
    }
  }

  async function confirmCancel() {
    if (!cancelling) return;
    const id = cancelling.recurring_id;
    setBusyId(id);
    try {
      await recurringApi.cancel(id);
      setSubs((prev) => prev?.map((s) => (s.recurring_id === id ? { ...s, status: "CANCELLED" as const } : s)) ?? null);
      toast.success(t("cancelledToast"));
      setCancelling(null);
    } catch {
      // toast emitted by client
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageShell title={t("page.title")} subtitle={t("page.subtitle")} userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard icon={Repeat} label={t("metrics.total.label")} hint={t("metrics.total.hint")} value={subs ? String(subs.length) : "—"} />
        <MetricCard
          icon={CheckCircle2}
          label={t("metrics.active.label")}
          hint={t("metrics.active.hint", { count: activeCount })}
          value={subs ? String(activeCount) : "—"}
          tone="success"
          tintValue
        />
        <MetricCard
          icon={PauseCircle}
          label={t("metrics.paused.label")}
          hint={t("metrics.paused.hint", { count: pausedCount })}
          value={subs ? String(pausedCount) : "—"}
          tone="amber"
          tintValue
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" /> {t("newSubscription")}
        </Button>
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder={t("searchPlaceholder")}
        filters={[
          {
            value: statusFilter,
            onChange: (v) => {
              setStatusFilter(v);
              setPage(1);
            },
            placeholder: t("filterStatus"),
            options: [
              { value: "all", label: t("filterAllStatuses") },
              { value: "ACTIVE", label: t("status.ACTIVE") },
              { value: "PAUSED", label: t("status.PAUSED") },
              { value: "CANCELLED", label: t("status.CANCELLED") },
            ],
          },
        ]}
      />

      {subs === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : total === 0 ? (
        <div className="mt-6">
          {hasFilters ? (
            <EmptyState
              icon={Repeat}
              title={t("emptyFiltered.title")}
              description={t("emptyFiltered.description")}
              actionLabel={t("emptyFiltered.action")}
              onAction={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            />
          ) : (
            <EmptyState
              icon={Repeat}
              title={t("empty.title")}
              description={t("empty.description")}
              actionLabel={t("empty.action")}
              onAction={() => setShowCreate(true)}
            />
          )}
        </div>
      ) : (
        <TableCard>
          <TableScroll minWidth={880}>
            <TableHead
              columns={[
                t("columns.service"),
                t("columns.frequency"),
                t("columns.nextRun"),
                t("columns.details"),
                t("columns.status"),
                t("columns.actions"),
              ]}
            />
            <tbody>
              {paged.map((s) => (
                <tr key={s.recurring_id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Repeat className="size-4" />
                      </span>
                      <p className="font-semibold">{s.service_name ?? t("noneSet")}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{t(`frequency.${s.frequency}`)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{s.next_run_date ? fmtDate(s.next_run_date) : t("noneSet")}</td>
                  <td className="px-4 py-4 text-muted-foreground">
                    <div className="flex flex-col gap-1 text-xs">
                      {s.time_window && (
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
                          <Clock className="size-3" /> {t(`timeWindow.${s.time_window}`, { defaultValue: s.time_window })}
                        </span>
                      )}
                      {s.instructions && (
                        <span className="max-w-[220px] truncate" title={s.instructions}>
                          {s.instructions}
                        </span>
                      )}
                      {!s.time_window && !s.instructions && t("noneSet")}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(s.status)}`}>{t(`status.${s.status}`)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1">
                      {s.status === "ACTIVE" && (
                        <button
                          onClick={() => void pauseSub(s)}
                          disabled={busyId === s.recurring_id}
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                          title={t("pause")}
                        >
                          <Pause className="size-4" />
                        </button>
                      )}
                      {s.status === "PAUSED" && (
                        <button
                          onClick={() => void resumeSub(s)}
                          disabled={busyId === s.recurring_id}
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                          title={t("resume")}
                        >
                          <Play className="size-4" />
                        </button>
                      )}
                      {s.status !== "CANCELLED" && (
                        <button
                          onClick={() => setCancelling(s)}
                          disabled={busyId === s.recurring_id}
                          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                          title={t("cancelPlan")}
                        >
                          <XCircle className="size-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
          <TablePagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            from={total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
            to={Math.min(page * PAGE_SIZE, total)}
            total={total}
            itemLabel={t("itemLabel", { count: total })}
          />
        </TableCard>
      )}

      <CreateSubscriptionDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        categories={categories ?? []}
        addresses={addresses ?? []}
        onCreated={load}
      />

      <AlertDialog open={!!cancelling} onOpenChange={(v) => !v && setCancelling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("cancelDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("cancelDialog.description", { service: cancelling?.service_name ?? "" })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancelDialog.keep")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void confirmCancel()}>
              {t("cancelDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function CreateSubscriptionDialog({
  open,
  onOpenChange,
  categories,
  addresses,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  categories: CatalogCategory[];
  addresses: Address[];
  onCreated: () => void;
}) {
  const { t } = useTranslation("recurring");
  const [categoryId, setCategoryId] = useState("");
  const [services, setServices] = useState<CatalogServiceResult[] | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [addressId, setAddressId] = useState(NONE);
  const [frequency, setFrequency] = useState<(typeof FREQUENCIES)[number]>("WEEKLY");
  const [nextRunDate, setNextRunDate] = useState("");
  const [timeWindow, setTimeWindow] = useState(NONE);
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);

  const selectedCategory = useMemo(() => categories.find((c) => c.category_id === categoryId) ?? null, [categories, categoryId]);

  // Reset the form every time the dialog is (re)opened.
  useEffect(() => {
    if (!open) return;
    setCategoryId("");
    setServices(null);
    setServiceId("");
    setAddressId(NONE);
    setFrequency("WEEKLY");
    setNextRunDate("");
    setTimeWindow(NONE);
    setInstructions("");
  }, [open]);

  // Same two-step category -> service resolution as routes/book.tsx, so the
  // service_id sent to the API always refers to a real seeded catalog service.
  useEffect(() => {
    if (!selectedCategory) {
      setServices(null);
      setServiceId("");
      return;
    }
    let cancelled = false;
    setServices(null);
    setServiceId("");
    bookingApi
      .catalogSearch(selectedCategory.name)
      .then((res) => {
        if (cancelled) return;
        setServices(res.results);
        if (res.results.length === 1) setServiceId(res.results[0]!.service_id);
      })
      .catch(() => {
        if (cancelled) return;
        setServices([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  async function submit() {
    if (!serviceId) {
      toast.error(t("dialog.selectServiceError"));
      return;
    }
    setBusy(true);
    try {
      await recurringApi.create({
        service_id: serviceId,
        address_id: addressId === NONE ? null : addressId,
        frequency,
        next_run_date: nextRunDate || null,
        ...(timeWindow !== NONE ? { time_window: timeWindow } : {}),
        ...(instructions.trim() ? { instructions: instructions.trim() } : {}),
      });
      toast.success(t("dialog.createdToast"));
      onOpenChange(false);
      onCreated();
    } catch {
      // toast emitted by client
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("dialog.title")}</DialogTitle>
        </DialogHeader>
        <p className="-mt-3 text-sm text-muted-foreground">{t("dialog.subtitle")}</p>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("dialog.categoryLabel")}</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("dialog.categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.category_id} value={c.category_id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("dialog.serviceLabel")}</Label>
              <Select value={serviceId} onValueChange={setServiceId} disabled={!selectedCategory || !services?.length}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedCategory ? t("dialog.servicePlaceholder") : t("dialog.servicePlaceholderNoCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {(services ?? []).map((s) => (
                    <SelectItem key={s.service_id} value={s.service_id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("dialog.addressLabel")}</Label>
              <Select value={addressId} onValueChange={setAddressId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("dialog.addressPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{t("dialog.addressNone")}</SelectItem>
                  {addresses.map((a) => (
                    <SelectItem key={a.address_id} value={a.address_id}>
                      {a.label} — {a.street_address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("dialog.frequencyLabel")}</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as (typeof FREQUENCIES)[number])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {t(`frequency.${f}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("dialog.nextRunDateLabel")}</Label>
              <Input type="date" value={nextRunDate} onChange={(e) => setNextRunDate(e.target.value)} />
              <p className="text-xs text-muted-foreground">{t("dialog.nextRunDateHint")}</p>
            </div>
            <div className="space-y-1.5">
              <Label>{t("dialog.timeWindowLabel")}</Label>
              <Select value={timeWindow} onValueChange={setTimeWindow}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{t("dialog.timeWindowNone")}</SelectItem>
                  {TIME_WINDOWS.map((w) => (
                    <SelectItem key={w} value={w}>
                      {t(`timeWindow.${w}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("dialog.instructionsLabel")}</Label>
            <Textarea value={instructions} maxLength={500} placeholder={t("dialog.instructionsPlaceholder")} onChange={(e) => setInstructions(e.target.value)} />
            <p className="text-right text-xs text-muted-foreground">{t("dialog.instructionsHint", { count: instructions.length })}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("dialog.cancel")}
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {busy ? t("dialog.creating") : t("dialog.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
