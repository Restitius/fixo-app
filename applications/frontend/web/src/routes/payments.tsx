// Payments — saved payment methods and charge history across bookings.
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  FilterX,
  Landmark,
  Lock,
  MoreVertical,
  Plus,
  Receipt,
  ShieldCheck,
  Smartphone,
  Star,
  Trash2,
  TrendingUp,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { BookingDetailSheet } from "@/components/dashboard/BookingDetailSheet";
import { TableFilterBar, TableCard, TableScroll, TableHead, TablePagination } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { fixoSdk, type BookingHistoryRow, type PaymentMethod } from "@/lib/api-client";
import { fmtDate, fmtMoney, humanize } from "@/lib/format";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const title = "Payments — FIXO";
const description = "Manage your saved payment methods and review charges from past bookings.";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PaymentsPage,
});

const MOBILE_PROVIDERS = ["Tigo Pesa", "M-Pesa", "Airtel Money", "HaloPesa"] as const;
const PAGE_SIZE = 6;

function brandFromCardNumber(num: string) {
  return num.startsWith("4") ? "Visa" : num.startsWith("5") ? "Mastercard" : "Card";
}

function methodIcon(type: string) {
  if (type === "mpesa") return Smartphone;
  if (type === "bank") return Landmark;
  return CreditCard;
}

function chargeStatusStyle(status: string) {
  const s = status.toUpperCase();
  if (["PAID", "CLOSED"].includes(s)) return "bg-success/15 text-success";
  if (["CANCELLED", "FAILED", "DISPUTED"].includes(s)) return "bg-destructive/15 text-destructive";
  return "bg-amber-500/15 text-amber-600";
}

function PaymentsPage() {
  const { t } = useTranslation("billing");
  const { access_token, loading, logout, customer } = useAuth();
  const navigate = useNavigate();
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [charges, setCharges] = useState<BookingHistoryRow[] | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [openBookingId, setOpenBookingId] = useState<string | null>(null);

  const [methodSearch, setMethodSearch] = useState("");
  const [methodTypeFilter, setMethodTypeFilter] = useState("all");

  const [chargeSearch, setChargeSearch] = useState("");
  const [chargeStatusFilter, setChargeStatusFilter] = useState("all");
  const [chargePage, setChargePage] = useState(1);

  const load = useCallback(async () => {
    try {
      const [m, c] = await Promise.all([
        fixoSdk.listPaymentMethods(),
        fixoSdk.bookingHistory(undefined, 100, 0),
      ]);
      setMethods(m);
      setCharges(c);
    } catch {
      setMethods((prev) => prev ?? []);
      setCharges((prev) => prev ?? []);
    }
  }, []);

  useEffect(() => {
    if (access_token && !loading) void load();
  }, [access_token, loading, load]);

  const filteredMethods = useMemo(
    () =>
      (methods ?? []).filter((m) => {
        const matchesType = methodTypeFilter === "all" || m.type === methodTypeFilter;
        const matchesSearch = !methodSearch || (m.provider ?? "").toLowerCase().includes(methodSearch.toLowerCase());
        return matchesType && matchesSearch;
      }),
    [methods, methodTypeFilter, methodSearch],
  );

  const filteredCharges = useMemo(
    () =>
      (charges ?? []).filter((c) => {
        const matchesStatus = chargeStatusFilter === "all" || c.status === chargeStatusFilter;
        const matchesSearch =
          !chargeSearch ||
          [c.service_name, c.booking_number, c.provider_name].some((f) => (f ?? "").toLowerCase().includes(chargeSearch.toLowerCase()));
        return matchesStatus && matchesSearch;
      }),
    [charges, chargeStatusFilter, chargeSearch],
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t("payments.loading")}</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  async function setDefault(id: string) {
    try {
      await fixoSdk.setDefaultPaymentMethod(id);
      setMethods((prev) => prev?.map((m) => ({ ...m, is_default: m.method_id === id })) ?? null);
      toast.success(t("payments.toast.defaultUpdated"));
    } catch {
      // toast emitted by client
    }
  }

  async function removeMethod(id: string) {
    try {
      await fixoSdk.removePaymentMethod(id);
      setMethods((prev) => prev?.filter((m) => m.method_id !== id) ?? null);
      toast.success(t("payments.toast.methodRemoved"));
    } catch {
      // toast emitted by client
    }
  }

  const now = new Date();
  const thisMonthCharges = (charges ?? []).filter((c) => {
    const d = new Date(c.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const pending = (charges ?? []).filter((c) => c.status === "PAYMENT_AUTHORIZED");
  const defaultCount = (methods ?? []).filter((m) => m.is_default).length;
  const backupCount = (methods ?? []).length - defaultCount;

  const chargePaged = filteredCharges.slice((chargePage - 1) * PAGE_SIZE, chargePage * PAGE_SIZE);
  const chargePageCount = Math.max(1, Math.ceil(filteredCharges.length / PAGE_SIZE));
  const chargeHasFilters = chargeSearch.trim() !== "" || chargeStatusFilter !== "all";
  const methodHasFilters = methodSearch.trim() !== "" || methodTypeFilter !== "all";

  return (
    <PageShell
      title={t("payments.page.title")}
      subtitle={t("payments.page.subtitle")}
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={CreditCard}
          label={t("payments.metrics.savedMethods")}
          value={String((methods ?? []).length)}
          hint={methods && methods.length > 0 ? t("payments.metrics.savedMethodsHint", { default: defaultCount, backup: backupCount }) : t("payments.metrics.noMethodsYet")}
        />
        <MetricCard
          icon={TrendingUp}
          label={t("payments.metrics.thisMonthCharges")}
          value={fmtMoney(thisMonthCharges.reduce((s, c) => s + c.agreed_amount, 0), thisMonthCharges[0]?.currency ?? "TZS")}
          hint={t("payments.metrics.acrossBookings", { count: thisMonthCharges.length })}
        />
        <MetricCard
          icon={ShieldCheck}
          label={t("payments.metrics.pendingAuthorizations")}
          value={fmtMoney(pending.reduce((s, c) => s + c.agreed_amount, 0), pending[0]?.currency ?? "TZS")}
          hint={t("payments.metrics.authorizationCount", { count: pending.length })}
        />
      </div>

      {/* Payment methods */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{t("payments.methods.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("payments.methods.subtitle")}</p>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="size-4" /> {t("payments.methods.addMethod")}
        </Button>
      </div>

      <TableFilterBar
        search={methodSearch}
        onSearchChange={setMethodSearch}
        searchPlaceholder={t("payments.methods.searchPlaceholder")}
        filters={[
          {
            value: methodTypeFilter,
            onChange: setMethodTypeFilter,
            placeholder: t("payments.methods.filterType"),
            options: [
              { value: "all", label: t("payments.methods.filterAllTypes") },
              { value: "card", label: t("payments.methods.filterCard") },
              { value: "mpesa", label: t("payments.methods.filterMobileMoney") },
              { value: "bank", label: t("payments.methods.filterBank") },
            ],
            width: "w-[160px]",
          },
        ]}
      />

      {methods === null ? (
        <div className="mt-6 h-40 animate-pulse rounded-3xl bg-muted/60" />
      ) : filteredMethods.length === 0 ? (
        <div className="mt-6">
          {methodHasFilters ? (
            <EmptyState icon={FilterX} title={t("payments.methods.emptyFilteredTitle")} description={t("payments.methods.emptyFilteredDescription")} actionLabel={t("payments.methods.clearFilters")} onAction={() => { setMethodSearch(""); setMethodTypeFilter("all"); }} />
          ) : (
            <EmptyState
              icon={CreditCard}
              title={t("payments.methods.emptyTitle")}
              description={t("payments.methods.emptyDescription")}
              actionLabel={t("payments.methods.addPaymentMethod")}
              onAction={() => setShowAddDialog(true)}
            />
          )}
        </div>
      ) : (
        <TableCard>
          <TableScroll minWidth={640}>
            <TableHead columns={[t("payments.methods.columns.method"), t("payments.methods.columns.type"), t("payments.methods.columns.status"), t("payments.methods.columns.actions")]} />
            <tbody>
              {filteredMethods.map((m) => {
                const Icon = methodIcon(m.type);
                const masked = (m.details_masked?.["last4"] as string | undefined) ?? "••••";
                const expiry = m.details_masked?.["expiry"] as string | undefined;
                return (
                  <tr key={m.method_id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon className="size-5" />
                        </span>
                        <div>
                          <p className="font-semibold">{m.provider || humanize(m.type)} •••• {masked}</p>
                          <p className="text-xs text-muted-foreground">{expiry ? t("payments.methods.expires", { date: expiry }) : "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{humanize(m.type)}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${m.is_default ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {m.is_default ? t("payments.methods.default") : t("payments.methods.backup")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
                            <MoreVertical className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!m.is_default && (
                            <DropdownMenuItem onClick={() => void setDefault(m.method_id)} className="gap-2">
                              <Star className="size-4" /> {t("payments.methods.setAsDefault")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => void removeMethod(m.method_id)}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4" /> {t("payments.methods.remove")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableScroll>
        </TableCard>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-muted/50 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0" />
        {t("payments.methods.secureFooter")}
      </div>

      {/* Recent charges */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold">{t("payments.charges.title")}</h3>
        <p className="text-sm text-muted-foreground">{t("payments.charges.subtitle")}</p>
      </div>

      <TableFilterBar
        search={chargeSearch}
        onSearchChange={(v) => { setChargeSearch(v); setChargePage(1); }}
        searchPlaceholder={t("payments.charges.searchPlaceholder")}
        filters={[
          {
            value: chargeStatusFilter,
            onChange: (v) => { setChargeStatusFilter(v); setChargePage(1); },
            placeholder: t("payments.charges.filterStatus"),
            options: [
              { value: "all", label: t("payments.charges.filterAllStatuses") },
              { value: "PAYMENT_AUTHORIZED", label: t("payments.charges.filterAuthorized") },
              { value: "PAID", label: t("payments.charges.filterPaid") },
              { value: "CLOSED", label: t("payments.charges.filterClosed") },
            ],
          },
        ]}
      />

      {charges === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filteredCharges.length === 0 ? (
        <div className="mt-6">
          {chargeHasFilters ? (
            <EmptyState icon={FilterX} title={t("payments.charges.emptyFilteredTitle")} description={t("payments.charges.emptyFilteredDescription")} actionLabel={t("payments.charges.clearFilters")} onAction={() => { setChargeSearch(""); setChargeStatusFilter("all"); }} />
          ) : (
            <EmptyState icon={Receipt} title={t("payments.charges.emptyTitle")} description={t("payments.charges.emptyDescription")} actionLabel={t("payments.charges.browseServices")} actionTo="/services" />
          )}
        </div>
      ) : (
        <TableCard className="grow">
          <TableScroll minWidth={720}>
            <TableHead columns={[
              t("payments.charges.columns.service"),
              t("payments.charges.columns.bookingId"),
              t("payments.charges.columns.date"),
              t("payments.charges.columns.provider"),
              t("payments.charges.columns.status"),
              t("payments.charges.columns.amount"),
            ]} />
            <tbody>
              {chargePaged.map((b) => (
                <tr
                  key={b.booking_id}
                  onClick={() => setOpenBookingId(b.booking_id)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                >
                  <td className="px-6 py-4 font-semibold">{b.service_name ?? t("payments.charges.serviceFallback")}</td>
                  <td className="px-4 py-4 text-primary font-semibold">{b.booking_number}</td>
                  <td className="px-4 py-4 text-muted-foreground">{fmtDate(b.scheduled_date)}</td>
                  <td className="px-4 py-4">{b.provider_name ?? "—"}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${chargeStatusStyle(b.status)}`}>
                      {humanize(b.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold">{fmtMoney(b.agreed_amount, b.currency)}</td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
          <TablePagination
            page={chargePage}
            pageCount={chargePageCount}
            onPageChange={setChargePage}
            from={(chargePage - 1) * PAGE_SIZE + 1}
            to={Math.min(chargePage * PAGE_SIZE, filteredCharges.length)}
            total={filteredCharges.length}
            itemLabel={t("payments.charges.itemLabel")}
          />
        </TableCard>
      )}
      {filteredCharges.length > 0 && (
        <button
          onClick={() => navigate({ to: "/history", search: { category: "payments" } })}
          className="mt-3 text-sm font-semibold text-primary hover:underline"
        >
          {t("payments.viewFullHistory")}
        </button>
      )}

      <AddPaymentMethodDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        isFirst={(methods ?? []).length === 0}
        onAdded={(created) => setMethods((prev) => [...(prev ?? []), created])}
      />

      <BookingDetailSheet
        bookingId={openBookingId}
        onOpenChange={(o) => !o && setOpenBookingId(null)}
        title={t("payments.chargeDetailsTitle")}
      />
    </PageShell>
  );
}

function AddPaymentMethodDialog({
  open,
  onOpenChange,
  isFirst,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isFirst: boolean;
  onAdded: (m: PaymentMethod) => void;
}) {
  const { t } = useTranslation("billing");
  const [tab, setTab] = useState<"card" | "mpesa" | "bank">("card");
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvv: "" });
  const [mobile, setMobile] = useState({ provider: MOBILE_PROVIDERS[0] as string, phone: "" });
  const [bank, setBank] = useState({ bankName: "", account: "" });
  const [makeDefault, setMakeDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  function reset() {
    setCard({ name: "", number: "", expiry: "", cvv: "" });
    setMobile({ provider: MOBILE_PROVIDERS[0], phone: "" });
    setBank({ bankName: "", account: "" });
    setMakeDefault(false);
    setTab("card");
  }

  async function save() {
    let provider: string;
    let details: Record<string, unknown>;

    if (tab === "card") {
      const digits = card.number.replace(/\s/g, "");
      if (!card.name.trim() || digits.length < 4 || !card.expiry.trim()) {
        toast.error(t("payments.dialog.errors.cardRequired"));
        return;
      }
      provider = brandFromCardNumber(digits);
      details = { last4: digits.slice(-4), expiry: card.expiry.trim(), cardholder: card.name.trim() };
    } else if (tab === "mpesa") {
      if (mobile.phone.trim().length < 7) {
        toast.error(t("payments.dialog.errors.invalidPhone"));
        return;
      }
      provider = mobile.provider;
      details = { last4: mobile.phone.trim().slice(-4) };
    } else {
      if (!bank.bankName.trim() || bank.account.trim().length < 4) {
        toast.error(t("payments.dialog.errors.bankRequired"));
        return;
      }
      provider = bank.bankName.trim();
      details = { last4: bank.account.trim().slice(-4) };
    }

    setSaving(true);
    try {
      const created = await fixoSdk.addPaymentMethod(tab, provider, details, makeDefault || isFirst);
      onAdded({ ...created, is_default: makeDefault || isFirst });
      toast.success(t("payments.dialog.methodAdded"));
      reset();
      onOpenChange(false);
    } catch {
      // toast emitted by client
    } finally {
      setSaving(false);
    }
  }

  function handleOpenChange(v: boolean) {
    onOpenChange(v);
    if (!v) reset();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("payments.dialog.title")}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="card" className="gap-1.5">
              <CreditCard className="size-4" /> {t("payments.dialog.tabCard")}
            </TabsTrigger>
            <TabsTrigger value="mpesa" className="gap-1.5">
              <Smartphone className="size-4" /> {t("payments.dialog.tabMobileMoney")}
            </TabsTrigger>
            <TabsTrigger value="bank" className="gap-1.5">
              <Landmark className="size-4" /> {t("payments.dialog.tabBank")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {tab === "card" && (
            <>
              <div className="space-y-1.5">
                <Label>{t("payments.dialog.labels.cardholderName")}</Label>
                <Input
                  placeholder={t("payments.dialog.placeholders.cardholderName")}
                  value={card.name}
                  onChange={(e) => setCard((d) => ({ ...d, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("payments.dialog.labels.cardNumber")}</Label>
                <Input
                  placeholder={t("payments.dialog.placeholders.cardNumber")}
                  value={card.number}
                  onChange={(e) => setCard((d) => ({ ...d, number: e.target.value }))}
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("payments.dialog.labels.expiryDate")}</Label>
                  <Input
                    placeholder={t("payments.dialog.placeholders.expiryDate")}
                    value={card.expiry}
                    onChange={(e) => setCard((d) => ({ ...d, expiry: e.target.value }))}
                    maxLength={7}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("payments.dialog.labels.cvv")}</Label>
                  <Input
                    placeholder={t("payments.dialog.placeholders.cvv")}
                    value={card.cvv}
                    onChange={(e) => setCard((d) => ({ ...d, cvv: e.target.value }))}
                    maxLength={4}
                  />
                </div>
              </div>
            </>
          )}

          {tab === "mpesa" && (
            <>
              <div className="space-y-1.5">
                <Label>{t("payments.dialog.labels.provider")}</Label>
                <Select value={mobile.provider} onValueChange={(v) => setMobile((d) => ({ ...d, provider: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOBILE_PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("payments.dialog.labels.billingPhone")}</Label>
                <Input
                  placeholder={t("payments.dialog.placeholders.billingPhone")}
                  value={mobile.phone}
                  onChange={(e) => setMobile((d) => ({ ...d, phone: e.target.value }))}
                />
              </div>
            </>
          )}

          {tab === "bank" && (
            <>
              <div className="space-y-1.5">
                <Label>{t("payments.dialog.labels.bankName")}</Label>
                <Input
                  placeholder={t("payments.dialog.placeholders.bankName")}
                  value={bank.bankName}
                  onChange={(e) => setBank((d) => ({ ...d, bankName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("payments.dialog.labels.accountNumber")}</Label>
                <Input
                  placeholder={t("payments.dialog.placeholders.accountNumber")}
                  value={bank.account}
                  onChange={(e) => setBank((d) => ({ ...d, account: e.target.value }))}
                />
              </div>
            </>
          )}

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={makeDefault || isFirst} disabled={isFirst} onCheckedChange={(v) => setMakeDefault(!!v)} />
            {t("payments.dialog.setAsDefault")}
          </label>

          <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" />
            {t("payments.dialog.secureNote")}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              {t("payments.dialog.cancel")}
            </Button>
            <Button className="flex-1" disabled={saving} onClick={() => void save()}>
              {saving ? t("payments.dialog.saving") : t("payments.dialog.saveMethod")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
