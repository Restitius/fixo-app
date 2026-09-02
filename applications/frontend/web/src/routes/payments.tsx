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
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  async function setDefault(id: string) {
    try {
      await fixoSdk.setDefaultPaymentMethod(id);
      setMethods((prev) => prev?.map((m) => ({ ...m, is_default: m.method_id === id })) ?? null);
      toast.success("Default payment method updated");
    } catch {
      // toast emitted by client
    }
  }

  async function removeMethod(id: string) {
    try {
      await fixoSdk.removePaymentMethod(id);
      setMethods((prev) => prev?.filter((m) => m.method_id !== id) ?? null);
      toast.success("Payment method removed");
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
      title="Payments"
      subtitle="Manage saved methods and track charges"
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={CreditCard}
          label="Saved Methods"
          value={String((methods ?? []).length)}
          hint={methods && methods.length > 0 ? `${defaultCount} default · ${backupCount} backup` : "No methods yet"}
        />
        <MetricCard
          icon={TrendingUp}
          label="This Month Charges"
          value={fmtMoney(thisMonthCharges.reduce((s, c) => s + c.agreed_amount, 0), thisMonthCharges[0]?.currency ?? "TZS")}
          hint={`Across ${thisMonthCharges.length} booking${thisMonthCharges.length === 1 ? "" : "s"}`}
        />
        <MetricCard
          icon={ShieldCheck}
          label="Pending Authorizations"
          value={fmtMoney(pending.reduce((s, c) => s + c.agreed_amount, 0), pending[0]?.currency ?? "TZS")}
          hint={`${pending.length} authorization${pending.length === 1 ? "" : "s"}`}
        />
      </div>

      {/* Payment methods */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Payment methods</h3>
          <p className="text-sm text-muted-foreground">Saved methods for faster, secure payments</p>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="size-4" /> Add Method
        </Button>
      </div>

      <TableFilterBar
        search={methodSearch}
        onSearchChange={setMethodSearch}
        searchPlaceholder="Search payment methods..."
        filters={[
          {
            value: methodTypeFilter,
            onChange: setMethodTypeFilter,
            placeholder: "Type",
            options: [
              { value: "all", label: "All Types" },
              { value: "card", label: "Card" },
              { value: "mpesa", label: "Mobile Money" },
              { value: "bank", label: "Bank" },
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
            <EmptyState icon={FilterX} title="No matching methods" description="Try adjusting your search or filters." actionLabel="Clear Filters" onAction={() => { setMethodSearch(""); setMethodTypeFilter("all"); }} />
          ) : (
            <EmptyState
              icon={CreditCard}
              title="No payment methods yet"
              description="Add a card, mobile money or bank account to speed up checkout."
              actionLabel="Add Payment Method"
              onAction={() => setShowAddDialog(true)}
            />
          )}
        </div>
      ) : (
        <TableCard>
          <TableScroll minWidth={640}>
            <TableHead columns={["Method", "Type", "Status", "Actions"]} />
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
                          <p className="text-xs text-muted-foreground">{expiry ? `Expires ${expiry}` : "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{humanize(m.type)}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${m.is_default ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {m.is_default ? "Default" : "Backup"}
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
                              <Star className="size-4" /> Set as default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => void removeMethod(m.method_id)}
                            className="gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4" /> Remove
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
        Your payment details are encrypted and only masked information is stored.
      </div>

      {/* Recent charges */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold">Recent charges</h3>
        <p className="text-sm text-muted-foreground">Latest charges and authorizations</p>
      </div>

      <TableFilterBar
        search={chargeSearch}
        onSearchChange={(v) => { setChargeSearch(v); setChargePage(1); }}
        searchPlaceholder="Search charges..."
        filters={[
          {
            value: chargeStatusFilter,
            onChange: (v) => { setChargeStatusFilter(v); setChargePage(1); },
            placeholder: "Status",
            options: [
              { value: "all", label: "All Statuses" },
              { value: "PAYMENT_AUTHORIZED", label: "Authorized" },
              { value: "PAID", label: "Paid" },
              { value: "CLOSED", label: "Closed" },
            ],
          },
        ]}
      />

      {charges === null ? (
        <div className="mt-6 h-64 animate-pulse rounded-3xl bg-muted/60" />
      ) : filteredCharges.length === 0 ? (
        <div className="mt-6">
          {chargeHasFilters ? (
            <EmptyState icon={FilterX} title="No matching charges" description="Try adjusting your search or filters." actionLabel="Clear Filters" onAction={() => { setChargeSearch(""); setChargeStatusFilter("all"); }} />
          ) : (
            <EmptyState icon={Receipt} title="No charges yet" description="Once you complete a booking and authorize payment, it will show up here." actionLabel="Browse Services" actionTo="/services" />
          )}
        </div>
      ) : (
        <TableCard className="grow">
          <TableScroll minWidth={720}>
            <TableHead columns={["Service", "Booking ID", "Date", "Provider", "Status", "Amount"]} />
            <tbody>
              {chargePaged.map((b) => (
                <tr
                  key={b.booking_id}
                  onClick={() => setOpenBookingId(b.booking_id)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                >
                  <td className="px-6 py-4 font-semibold">{b.service_name ?? "Service"}</td>
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
            itemLabel="charges"
          />
        </TableCard>
      )}
      {filteredCharges.length > 0 && (
        <button
          onClick={() => navigate({ to: "/history", search: { category: "payments" } })}
          className="mt-3 text-sm font-semibold text-primary hover:underline"
        >
          View full payment history in History →
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
        title="Charge details"
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
        toast.error("Fill in cardholder name, card number and expiry date");
        return;
      }
      provider = brandFromCardNumber(digits);
      details = { last4: digits.slice(-4), expiry: card.expiry.trim(), cardholder: card.name.trim() };
    } else if (tab === "mpesa") {
      if (mobile.phone.trim().length < 7) {
        toast.error("Enter a valid phone number");
        return;
      }
      provider = mobile.provider;
      details = { last4: mobile.phone.trim().slice(-4) };
    } else {
      if (!bank.bankName.trim() || bank.account.trim().length < 4) {
        toast.error("Enter bank name and account number");
        return;
      }
      provider = bank.bankName.trim();
      details = { last4: bank.account.trim().slice(-4) };
    }

    setSaving(true);
    try {
      const created = await fixoSdk.addPaymentMethod(tab, provider, details, makeDefault || isFirst);
      onAdded({ ...created, is_default: makeDefault || isFirst });
      toast.success("Payment method added");
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
          <DialogTitle>Add payment method</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="card" className="gap-1.5">
              <CreditCard className="size-4" /> Card
            </TabsTrigger>
            <TabsTrigger value="mpesa" className="gap-1.5">
              <Smartphone className="size-4" /> Mobile Money
            </TabsTrigger>
            <TabsTrigger value="bank" className="gap-1.5">
              <Landmark className="size-4" /> Bank
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {tab === "card" && (
            <>
              <div className="space-y-1.5">
                <Label>Cardholder name</Label>
                <Input
                  placeholder="e.g. Restitius Rushambya"
                  value={card.name}
                  onChange={(e) => setCard((d) => ({ ...d, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Card number</Label>
                <Input
                  placeholder="1234 5678 9012 3456"
                  value={card.number}
                  onChange={(e) => setCard((d) => ({ ...d, number: e.target.value }))}
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Expiry date</Label>
                  <Input
                    placeholder="MM / YY"
                    value={card.expiry}
                    onChange={(e) => setCard((d) => ({ ...d, expiry: e.target.value }))}
                    maxLength={7}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>CVV</Label>
                  <Input
                    placeholder="123"
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
                <Label>Provider</Label>
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
                <Label>Billing phone</Label>
                <Input
                  placeholder="+255 712 345 678"
                  value={mobile.phone}
                  onChange={(e) => setMobile((d) => ({ ...d, phone: e.target.value }))}
                />
              </div>
            </>
          )}

          {tab === "bank" && (
            <>
              <div className="space-y-1.5">
                <Label>Bank name</Label>
                <Input
                  placeholder="e.g. CRDB Bank"
                  value={bank.bankName}
                  onChange={(e) => setBank((d) => ({ ...d, bankName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Account number</Label>
                <Input
                  placeholder="0123456789"
                  value={bank.account}
                  onChange={(e) => setBank((d) => ({ ...d, account: e.target.value }))}
                />
              </div>
            </>
          )}

          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={makeDefault || isFirst} disabled={isFirst} onCheckedChange={(v) => setMakeDefault(!!v)} />
            Set as default payment method
          </label>

          <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" />
            Your payment details are encrypted and securely stored.
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={saving} onClick={() => void save()}>
              {saving ? "Saving..." : "Save Method"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
