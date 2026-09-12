// Disputes (Module 39) — customer-facing dispute lifecycle management across
// all of the customer's bookings. Distinct from the per-booking quick-raise
// form in BookingDetailSheet: this page lists every dispute the customer has
// ever opened, lets them track its status, attach evidence, and withdraw it.
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Clock,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Paperclip,
  Plus,
  Scale,
  ShieldCheck,
  StickyNote,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TableFilterBar, TableCard, TableScroll, TableHead, TablePagination } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  bookingApi,
  disputesApi,
  fixoSdk,
  type BookingHistoryRow,
  type DisputeEvidenceRow,
  type DisputeRow,
} from "@/lib/api-client";
import { fmtDate, fmtDateTime, humanize } from "@/lib/format";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const title = "Disputes — FIXO";
const description = "Track and manage disputes you've raised on your bookings.";

export const Route = createFileRoute("/disputes")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: DisputesPage,
});

// The category is a free string on the backend; these are the reasonable
// handyman-context options a customer would pick from when opening one.
const CATEGORIES = ["SERVICE_QUALITY", "DAMAGE", "BILLING", "NO_SHOW", "OTHER"] as const;
const EVIDENCE_KINDS = ["PHOTO", "DOCUMENT", "OTHER"] as const;

// Terminal-looking statuses (case-insensitively) bucket into "closed"; every
// other raw status value the backend might send bucket into "open" — we
// don't hardcode the full status enum since it isn't documented.
const CLOSED_STATUS_HINTS = ["RESOLVED", "CLOSED", "WITHDRAWN"];
function isClosedStatus(status: string): boolean {
  const s = status.toUpperCase();
  return CLOSED_STATUS_HINTS.some((hint) => s.includes(hint));
}
function statusBadgeClass(status: string): string {
  if (isClosedStatus(status)) {
    return status.toUpperCase().includes("WITHDRAWN") ? "bg-muted text-muted-foreground" : "bg-success/15 text-success";
  }
  return "bg-amber-500/15 text-amber-600";
}

const PAGE_SIZE = 8;

function DisputesPage() {
  const { t } = useTranslation("disputes");
  const { access_token, loading, logout, customer } = useAuth();
  const [rows, setRows] = useState<DisputeRow[] | null>(null);
  const [bookings, setBookings] = useState<BookingHistoryRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [offset, setOffset] = useState(0);
  const [showNewDispute, setShowNewDispute] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(() => {
    void disputesApi.list(100, 0).then(setRows).catch(() => setRows((prev) => prev ?? []));
  }, []);
  const loadBookings = useCallback(() => {
    void fixoSdk.bookingHistory(undefined, 100, 0).then(setBookings).catch(() => setBookings((prev) => prev ?? []));
  }, []);

  useEffect(() => {
    if (access_token && !loading) {
      load();
      loadBookings();
    }
  }, [access_token, loading, load, loadBookings]);

  const bookingMap = useMemo(() => new Map((bookings ?? []).map((b) => [b.booking_id, b])), [bookings]);

  const filtered = useMemo(
    () =>
      (rows ?? []).filter((r) => {
        const bucket = isClosedStatus(r.status) ? "closed" : "open";
        const matchesStatus = statusFilter === "all" || statusFilter === bucket;
        const bookingNumber = bookingMap.get(r.booking_id)?.booking_number ?? "";
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          [r.category, r.description, bookingNumber].some((f) => (f ?? "").toLowerCase().includes(q));
        return matchesStatus && matchesSearch;
      }),
    [rows, statusFilter, search, bookingMap],
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t("loading")}</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const total = (rows ?? []).length;
  const openCount = (rows ?? []).filter((r) => !isClosedStatus(r.status)).length;
  const closedCount = total - openCount;

  const paged = filtered.slice(offset, offset + PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const hasActiveFilters = search.trim() !== "" || statusFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setOffset(0);
  }

  function goToPage(p: number) {
    setOffset((p - 1) * PAGE_SIZE);
  }

  return (
    <PageShell title={t("page.title")} subtitle={t("page.subtitle")} userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 gap-4 sm:grid-cols-3">
          <MetricCard icon={Scale} label={t("metrics.total")} hint={t("metrics.totalHint", { count: total })} value={String(total)} />
          <MetricCard icon={Clock} label={t("metrics.open")} hint={t("metrics.openHint")} value={String(openCount)} tone="amber" tintValue />
          <MetricCard icon={ShieldCheck} label={t("metrics.closed")} hint={t("metrics.closedHint")} value={String(closedCount)} tone="success" tintValue />
        </div>
      </div>

      <TableFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setOffset(0); }}
        searchPlaceholder={t("search.placeholder")}
        filters={[
          {
            value: statusFilter,
            onChange: (v) => { setStatusFilter(v); setOffset(0); },
            placeholder: t("filters.statusPlaceholder"),
            options: [
              { value: "all", label: t("filters.all") },
              { value: "open", label: t("filters.open") },
              { value: "closed", label: t("filters.closed") },
            ],
          },
        ]}
        trailing={
          <Button onClick={() => setShowNewDispute(true)} className="gap-2">
            <Plus className="size-4" /> {t("newDispute.trigger")}
          </Button>
        }
      />

      {rows === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          {hasActiveFilters ? (
            <EmptyState
              icon={Scale}
              title={t("empty.filteredTitle")}
              description={t("empty.filteredDescription")}
              actionLabel={t("empty.clearFilters")}
              onAction={clearFilters}
            />
          ) : (
            <EmptyState
              icon={Scale}
              title={t("empty.title")}
              description={t("empty.description")}
              actionLabel={t("newDispute.trigger")}
              onAction={() => setShowNewDispute(true)}
            />
          )}
        </div>
      ) : (
        <TableCard className="grow">
          <TableScroll minWidth={760}>
            <TableHead
              columns={[
                t("columns.category"),
                t("columns.description"),
                t("columns.booking"),
                t("columns.status"),
                t("columns.created"),
              ]}
            />
            <tbody>
              {paged.map((d) => (
                <tr
                  key={d.dispute_id}
                  onClick={() => setSelectedId(d.dispute_id)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                >
                  <td className="px-6 py-4 font-semibold">{t(`categories.${d.category}`, { defaultValue: humanize(d.category) })}</td>
                  <td className="max-w-[280px] truncate px-4 py-4 text-muted-foreground">{d.description}</td>
                  <td className="px-4 py-4 font-semibold text-primary">
                    {bookingMap.get(d.booking_id)?.booking_number ?? `#${d.booking_id.slice(0, 8)}`}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(d.status)}`}>
                      {humanize(d.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtDate(d.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
          <TablePagination
            page={page}
            pageCount={pageCount}
            onPageChange={goToPage}
            from={filtered.length === 0 ? 0 : offset + 1}
            to={Math.min(offset + PAGE_SIZE, filtered.length)}
            total={filtered.length}
            itemLabel={t("itemLabel", { count: filtered.length })}
          />
        </TableCard>
      )}

      <NewDisputeDialog
        open={showNewDispute}
        onOpenChange={setShowNewDispute}
        bookings={bookings ?? []}
        onCreated={load}
      />
      <DisputeDetailSheet
        disputeId={selectedId}
        booking={selectedId ? bookingMap.get((rows ?? []).find((r) => r.dispute_id === selectedId)?.booking_id ?? "") : undefined}
        onOpenChange={(o) => !o && setSelectedId(null)}
        onChanged={load}
      />
    </PageShell>
  );
}

// ---- New Dispute dialog -----------------------------------------------------

function NewDisputeDialog({
  open,
  onOpenChange,
  bookings,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bookings: BookingHistoryRow[];
  onCreated: () => void;
}) {
  const { t } = useTranslation("disputes");
  const [bookingId, setBookingId] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setBookingId(bookings[0]?.booking_id ?? "");
      setCategory(CATEGORIES[0]);
      setDescription("");
    }
  }, [open, bookings]);

  async function submit() {
    if (!bookingId) {
      toast.error(t("newDispute.errors.pickBooking"));
      return;
    }
    const trimmed = description.trim();
    if (trimmed.length < 10 || trimmed.length > 2000) {
      toast.error(t("newDispute.errors.descriptionLength"));
      return;
    }
    setBusy(true);
    try {
      await bookingApi.openDispute(bookingId, category, trimmed);
      toast.success(t("newDispute.opened"));
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
          <DialogTitle>{t("newDispute.title")}</DialogTitle>
          <p className="text-sm text-muted-foreground">{t("newDispute.subtitle")}</p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("newDispute.bookingLabel")}</Label>
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("newDispute.noBookings")}</p>
            ) : (
              <Select value={bookingId} onValueChange={setBookingId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("newDispute.bookingPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map((b) => (
                    <SelectItem key={b.booking_id} value={b.booking_id}>
                      {b.booking_number} — {b.service_name ?? t("newDispute.serviceFallback")} ({fmtDate(b.scheduled_date)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{t("newDispute.categoryLabel")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`categories.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("newDispute.descriptionLabel")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
              placeholder={t("newDispute.descriptionPlaceholder")}
              className="min-h-28"
            />
            <p className="text-right text-xs text-muted-foreground">{t("newDispute.charCount", { count: description.length, max: 2000 })}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              {t("newDispute.cancel")}
            </Button>
            <Button className="flex-1" disabled={busy || bookings.length === 0} onClick={() => void submit()}>
              {busy ? t("newDispute.submitting") : t("newDispute.submit")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Dispute detail sheet ----------------------------------------------------

function evidenceIcon(kind: string) {
  const k = kind.toUpperCase();
  if (k === "PHOTO") return ImageIcon;
  if (k === "DOCUMENT") return FileText;
  return Paperclip;
}

function DisputeDetailSheet({
  disputeId,
  booking,
  onOpenChange,
  onChanged,
}: {
  disputeId: string | null;
  booking: BookingHistoryRow | undefined;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const { t } = useTranslation("disputes");
  const [dispute, setDispute] = useState<DisputeRow | null>(null);
  const [evidence, setEvidence] = useState<DisputeEvidenceRow[] | null>(null);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const loadDetail = useCallback((id: string) => {
    void disputesApi.get(id).then(setDispute).catch(() => setDispute(null));
    void disputesApi.listEvidence(id).then(setEvidence).catch(() => setEvidence([]));
  }, []);

  useEffect(() => {
    if (!disputeId) {
      setDispute(null);
      setEvidence(null);
      setConfirmWithdraw(false);
      return;
    }
    loadDetail(disputeId);
  }, [disputeId, loadDetail]);

  async function withdraw() {
    if (!dispute) return;
    setWithdrawing(true);
    try {
      const updated = await disputesApi.withdraw(dispute.dispute_id);
      setDispute(updated);
      toast.success(t("detail.withdrawn"));
      onChanged();
    } catch {
      // toast emitted by client
    } finally {
      setWithdrawing(false);
      setConfirmWithdraw(false);
    }
  }

  const canWithdraw = dispute ? !isClosedStatus(dispute.status) : false;

  return (
    <Sheet open={!!disputeId} onOpenChange={(o) => !o && onOpenChange(false)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("detail.title")}</SheetTitle>
        </SheetHeader>

        {!dispute ? (
          <div className="mt-4 h-64 animate-pulse rounded-2xl bg-muted/60" />
        ) : (
          <div className="mt-4 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">{t(`categories.${dispute.category}`, { defaultValue: humanize(dispute.category) })}</p>
                <p className="text-sm text-muted-foreground">{fmtDateTime(dispute.created_at)}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(dispute.status)}`}>
                {humanize(dispute.status)}
              </span>
            </div>

            <div className="space-y-2 rounded-2xl bg-muted/50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("detail.booking")}</span>
                <span className="font-medium">{booking?.booking_number ?? `#${dispute.booking_id.slice(0, 8)}`}</span>
              </div>
              {booking?.service_name && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("detail.service")}</span>
                  <span className="font-medium">{booking.service_name}</span>
                </div>
              )}
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold">{t("detail.description")}</h4>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{dispute.description}</p>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <Paperclip className="size-4" /> {t("detail.evidence")}
              </h4>
              {evidence === null ? (
                <div className="h-16 animate-pulse rounded-xl bg-muted/60" />
              ) : evidence.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("detail.noEvidence")}</p>
              ) : (
                <div className="space-y-2">
                  {evidence.map((ev) => {
                    const Icon = evidenceIcon(ev.kind);
                    return (
                      <div key={ev.evidence_id} className="flex items-start gap-2.5 rounded-xl border border-border p-3">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {t(`evidenceKinds.${ev.kind}`, { defaultValue: humanize(ev.kind) })}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(ev.created_at)}</span>
                          </div>
                          <a href={ev.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 truncate text-sm font-medium text-primary hover:underline">
                            <LinkIcon className="size-3.5 shrink-0" /> <span className="truncate">{ev.url}</span>
                          </a>
                          {ev.note && (
                            <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                              <StickyNote className="mt-0.5 size-3 shrink-0" /> {ev.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <AddEvidenceForm
                disputeId={dispute.dispute_id}
                onAdded={(row) => setEvidence((prev) => [...(prev ?? []), row])}
              />
            </div>

            <Button
              variant="outline"
              className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
              disabled={!canWithdraw}
              onClick={() => setConfirmWithdraw(true)}
            >
              <Ban className="size-4" /> {canWithdraw ? t("detail.withdraw") : t("detail.alreadyClosed")}
            </Button>
          </div>
        )}

        <AlertDialog open={confirmWithdraw} onOpenChange={setConfirmWithdraw}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("detail.withdrawConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>{t("detail.withdrawConfirmDescription")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("newDispute.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={withdrawing}
                onClick={(e) => {
                  e.preventDefault();
                  void withdraw();
                }}
              >
                {withdrawing ? t("detail.withdrawing") : t("detail.withdraw")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

function AddEvidenceForm({ disputeId, onAdded }: { disputeId: string; onAdded: (row: DisputeEvidenceRow) => void }) {
  const { t } = useTranslation("disputes");
  const [kind, setKind] = useState<string>(EVIDENCE_KINDS[0]);
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const trimmedUrl = url.trim();
    if (!trimmedUrl || trimmedUrl.length > 2000) {
      toast.error(t("detail.addEvidence.errors.url"));
      return;
    }
    setBusy(true);
    try {
      const trimmedNote = note.trim();
      const row = await disputesApi.addEvidence(
        disputeId,
        trimmedNote ? { kind, url: trimmedUrl, note: trimmedNote } : { kind, url: trimmedUrl },
      );
      toast.success(t("detail.addEvidence.added"));
      setUrl("");
      setNote("");
      onAdded(row);
    } catch {
      // toast emitted by client
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-dashed border-border p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <AlertTriangle className="size-3.5" /> {t("detail.addEvidence.title")}
      </p>
      <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EVIDENCE_KINDS.map((k) => (
              <SelectItem key={k} value={k}>
                {t(`evidenceKinds.${k}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t("detail.addEvidence.urlPlaceholder")} />
      </div>
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("detail.addEvidence.notePlaceholder")} />
      <Button size="sm" disabled={busy} onClick={() => void submit()} className="gap-1.5">
        <Plus className="size-3.5" /> {busy ? t("detail.addEvidence.adding") : t("detail.addEvidence.add")}
      </Button>
    </div>
  );
}
