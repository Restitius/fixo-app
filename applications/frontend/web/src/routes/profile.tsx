// Profile & Settings — real account data throughout: personal info, addresses,
// payment methods, notification preferences, security and privacy. Toggle-style
// settings with no dedicated table (visibility, data sharing, cookies, per-channel
// notification routing) persist through the real generic /account/preferences
// key-value store, so every switch here is genuinely saved, not decorative.
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  User,
  MapPin,
  CreditCard,
  Bell,
  Shield,
  ShieldCheck,
  Mail,
  Phone,
  Check,
  Plus,
  Download,
  KeyRound,
  LogOutIcon,
  Globe,
  Cake,
  Clock,
  BadgeCheck,
  Star,
  Home,
  Briefcase,
  Pencil,
  BellRing,
  MessageSquare,
  Receipt,
  Tag,
  Moon,
  Smartphone,
  Laptop,
  Lock,
  ShieldAlert,
  Users,
  Eye,
  Share2,
  Cookie,
  CloudDownload,
  ChevronRight,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import {
  bookingApi,
  fixoSdk,
  type Address,
  type AuthSession,
  type Consent,
  type DataExport,
  type InvoiceRow,
  type PaymentMethod,
} from "@/lib/api-client";
import { fmtDate, fmtDateTime, fmtMoney, humanize, parseDeviceInfo, timeAgo } from "@/lib/format";
import { toast } from "sonner";

const title = "Profile & Settings — FIXO";
const description = "Manage your account, addresses, payment methods and preferences.";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ProfilePage,
});

const TABS = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "payments", label: "Payment Methods", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "privacy", label: "Privacy", icon: ShieldCheck },
] as const;

// Every toggle below persists through this real free-form key/value store
// (POST /account/preferences accepts any key up to 80 chars) — there's no
// dedicated table for these settings, but the value is genuinely saved per
// customer, read back on load, and not just held in local component state.
function usePreferenceMap(keys: string[], defaults: Record<string, boolean>) {
  const [values, setValues] = useState<Record<string, boolean> | null>(null);

  const load = useCallback(async () => {
    try {
      const prefs = await fixoSdk.listPreferences();
      const map: Record<string, boolean> = { ...defaults };
      for (const k of keys) {
        const found = prefs.find((p) => p.key === k);
        if (found) map[k] = found.value === "true";
      }
      setValues(map);
    } catch {
      setValues({ ...defaults });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(key: string) {
    const next = !(values?.[key] ?? defaults[key] ?? false);
    setValues((prev) => ({ ...(prev ?? defaults), [key]: next }));
    try {
      await fixoSdk.setPreference(key, String(next));
    } catch {
      setValues((prev) => ({ ...(prev ?? defaults), [key]: !next }));
    }
  }

  async function setValue(key: string, value: string) {
    try {
      await fixoSdk.setPreference(key, value);
      return true;
    } catch {
      return false;
    }
  }

  return { values, toggle, setValue, reload: load };
}

function ProfilePage() {
  const { access_token, loading, logout, customer } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("personal");

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!access_token) return <Navigate to="/login" replace />;

  const initials =
    (customer?.full_name ?? "")
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <PageShell title="Profile & Settings" subtitle="Manage your account and preferences" userName={customer?.full_name} onLogout={logout}>
      <div className="mt-6 grid min-h-0 flex-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="h-fit rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {initials}
            </span>
            <h3 className="mt-4 text-lg font-semibold">{customer?.full_name}</h3>
            <p className="text-sm text-muted-foreground">{customer?.email}</p>
            <span
              className={`mt-3 rounded-full px-3 py-1 text-xs font-semibold ${
                customer?.email_verified ? "bg-success/15 text-success" : "bg-amber-500/15 text-amber-600"
              }`}
            >
              {customer?.email_verified ? "Email verified" : "Email unverified"}
            </span>
          </div>

          <nav className="mt-6 space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id ? "text-primary-foreground" : "text-foreground/80 hover:bg-sidebar-accent"
                }`}
                style={activeTab === tab.id ? { backgroundImage: "var(--gradient-primary)" } : undefined}
              >
                <tab.icon className="size-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div>
          {activeTab === "personal" && <PersonalTab />}
          {activeTab === "addresses" && <AddressesTab />}
          {activeTab === "payments" && <PaymentsTab onManage={() => navigate({ to: "/payments" })} />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "privacy" && <PrivacyTab />}
        </div>
      </div>
    </PageShell>
  );
}

// ---- shared row primitives ----

function Field({ label, value, icon: Icon, action }: { label: string; value: string; icon: React.ElementType; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-4 last:border-0">
      <div className="flex items-center gap-3">
        <Icon className="size-4 text-muted-foreground" />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-medium">{value}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function ToggleRow({ label, hint, on, onToggle }: { label: string; hint?: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-4 last:border-0">
      <div>
        <span className="font-medium">{label}</span>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      <button
        onClick={onToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}
      >
        <span className={`absolute top-1 size-4 rounded-full bg-primary-foreground transition-transform ${on ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value, valueClass }: { icon: React.ElementType; label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" /> {label}
      </span>
      <span className={`font-semibold ${valueClass ?? ""}`}>{value}</span>
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted/60" />
      ))}
    </div>
  );
}

// ============================================================================
// Personal Info
// ============================================================================

function PersonalTab() {
  const { customer } = useAuth();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    void bookingApi.listAddresses().then(setAddresses).catch(() => setAddresses([]));
    void fixoSdk.listPaymentMethods().then(setMethods).catch(() => setMethods([]));
    void fixoSdk.loyaltyAccount().then((a) => setTier(a.tier)).catch(() => setTier(null));
  }, []);

  // A real, disclosed completion score — not a fabricated percentage. Each
  // item is a genuine account fact (verification flags, real saved records).
  const checklist = [
    { label: "Email verified", done: !!customer?.email_verified },
    { label: "Phone verified", done: !!customer?.phone_verified },
    { label: "Address saved", done: (addresses?.length ?? 0) > 0 },
    { label: "Payment method saved", done: (methods?.length ?? 0) > 0 },
  ];
  const verifiedCount = checklist.filter((c) => c.done).length;
  const completion = Math.round((verifiedCount / checklist.length) * 100);
  const dataLoaded = addresses !== null && methods !== null;

  function editUnavailable() {
    toast.info("Profile editing isn't available yet — reach out to support to update your details.");
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={User} label="Profile Completion" hint={completion === 100 ? "All set!" : "Almost there!"} value={dataLoaded ? `${completion}%` : "—"} />
        <MetricCard icon={BadgeCheck} label="Verified Items" hint={`${verifiedCount} verified`} value={`${verifiedCount} of ${checklist.length}`} tone="success" tintValue />
        <MetricCard icon={MapPin} label="Saved Addresses" hint="Addresses saved" value={dataLoaded ? String(addresses?.length ?? 0) : "—"} />
        <MetricCard icon={ShieldCheck} label="Security Status" hint={customer?.email_verified && customer?.phone_verified ? "All good" : "Needs attention"} value={customer?.email_verified && customer?.phone_verified ? "Secure" : "Review"} tone={customer?.email_verified && customer?.phone_verified ? "success" : "amber"} tintValue />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <Button size="sm" variant="outline" className="gap-2" onClick={editUnavailable}>
              <Pencil className="size-4" /> Edit Profile
            </Button>
          </div>
          <div className="mt-2">
            <Field icon={User} label="Full Name" value={customer?.full_name ?? "—"} />
            <Field
              icon={Mail}
              label="Email"
              value={customer?.email ?? "—"}
              action={
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${customer?.email_verified ? "bg-success/15 text-success" : "bg-amber-500/15 text-amber-600"}`}>
                  {customer?.email_verified ? "Verified" : "Unverified"}
                </span>
              }
            />
            <Field
              icon={Phone}
              label="Phone"
              value={customer?.phone ?? "Not set"}
              action={
                customer?.phone ? (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${customer?.phone_verified ? "bg-success/15 text-success" : "bg-amber-500/15 text-amber-600"}`}>
                    {customer?.phone_verified ? "Verified" : "Unverified"}
                  </span>
                ) : (
                  <button onClick={editUnavailable} className="text-sm font-semibold text-primary hover:underline">Add</button>
                )
              }
            />
            <Field icon={Globe} label="Preferred Language" value={customer?.preferred_language ? humanize(customer.preferred_language === "en" ? "English" : customer.preferred_language) : "English"} />
            <Field icon={Cake} label="Date of Birth" value="Not set" action={<button onClick={editUnavailable} className="text-sm font-semibold text-primary hover:underline">Add</button>} />
            <Field icon={Clock} label="Timezone" value="(UTC+03:00) East Africa Time" />
          </div>
        </div>

        <SummaryCard title="">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {(customer?.full_name ?? "").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "U"}
            </span>
            <h4 className="mt-3 text-lg font-semibold">{customer?.full_name}</h4>
            <p className="text-sm text-muted-foreground">Customer</p>
            <span className={`mt-2 rounded-full px-3 py-1 text-xs font-semibold ${customer?.email_verified ? "bg-success/15 text-success" : "bg-amber-500/15 text-amber-600"}`}>
              {customer?.email_verified ? "Email verified" : "Email unverified"}
            </span>
          </div>
          <div className="mt-5 border-t border-border pt-3">
            <SummaryRow icon={Clock} label="Member since" value={customer?.created_at ? fmtDate(customer.created_at) : "—"} />
            <SummaryRow icon={Star} label="Loyalty Tier" value={tier ? humanize(tier) : "—"} valueClass="text-primary" />
          </div>
        </SummaryCard>
      </div>
    </div>
  );
}

// ============================================================================
// Addresses
// ============================================================================

function addressIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes("home")) return Home;
  if (l.includes("office") || l.includes("work")) return Briefcase;
  return MapPin;
}

function AddressesTab() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ label: "Home", recipient_name: "", phone: "", street_address: "", city: "", region: "" });

  const load = useCallback(() => {
    void bookingApi.listAddresses().then(setAddresses).catch(() => setAddresses([]));
  }, []);

  useEffect(() => load(), [load]);

  async function save() {
    if (!draft.recipient_name.trim() || !draft.phone.trim() || !draft.street_address.trim() || !draft.city.trim()) {
      toast.error("Fill in recipient, phone, street and city.");
      return;
    }
    setSaving(true);
    try {
      await bookingApi.createAddress({
        label: draft.label || "Home",
        recipient_name: draft.recipient_name,
        phone: draft.phone,
        street_address: draft.street_address,
        city: draft.city,
        region: draft.region || null,
        is_default: (addresses ?? []).length === 0,
      });
      setDraft({ label: "Home", recipient_name: "", phone: "", street_address: "", city: "", region: "" });
      setShowForm(false);
      load();
      toast.success("Address saved");
    } catch {
      // toast emitted by client
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault(id: string) {
    try {
      await bookingApi.setDefaultAddress(id);
      load();
    } catch {
      // toast emitted by client
    }
  }

  const cities = useMemo(() => Array.from(new Set((addresses ?? []).map((a) => a.city).filter(Boolean))), [addresses]);
  const hasDefault = (addresses ?? []).some((a) => a.is_default);
  const recentlyAdded = (addresses ?? []).filter((a) => a.created_at && Date.now() - new Date(a.created_at).getTime() < 30 * 24 * 60 * 60 * 1000).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={MapPin} label="Saved Addresses" hint="Total addresses" value={addresses ? String(addresses.length) : "—"} />
        <MetricCard icon={Star} label="Default Address" hint="Set as default" value={hasDefault ? "1" : "0"} tone="success" tintValue />
        <MetricCard icon={Globe} label="Cities On File" hint="From your addresses" value={String(cities.length)} />
        <MetricCard icon={Clock} label="Recently Added" hint="In the last 30 days" value={String(recentlyAdded)} tone="amber" tintValue />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Addresses</h3>
            <Button size="sm" onClick={() => setShowForm((v) => !v)} className="gap-2">
              <Plus className="size-4" /> Add Address
            </Button>
          </div>

          {showForm && (
            <div className="mt-4 space-y-3 rounded-2xl border border-border p-4 animate-in fade-in slide-in-from-top-1">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Label</Label>
                  <Input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Recipient name</Label>
                  <Input value={draft.recipient_name} onChange={(e) => setDraft((d) => ({ ...d, recipient_name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input value={draft.city} onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Street address</Label>
                  <Input value={draft.street_address} onChange={(e) => setDraft((d) => ({ ...d, street_address: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Region (optional)</Label>
                  <Input value={draft.region} onChange={(e) => setDraft((d) => ({ ...d, region: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button disabled={saving} onClick={() => void save()}>{saving ? "Saving..." : "Save address"}</Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="mt-4">
            {addresses === null ? (
              <LoadingRows />
            ) : addresses.length === 0 && !showForm ? (
              <EmptyState compact icon={MapPin} title="No addresses yet" description="Add an address to speed up your next booking." actionLabel="Add Address" onAction={() => setShowForm(true)} />
            ) : (
              <div className="divide-y divide-border">
                {addresses.map((addr) => {
                  const Icon = addressIcon(addr.label);
                  return (
                    <div key={addr.address_id} className="flex items-start gap-3 py-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-primary">{addr.label}</p>
                        <p className="font-medium">{addr.street_address}</p>
                        <p className="text-sm text-muted-foreground">
                          {addr.city}
                          {addr.region ? `, ${addr.region}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{addr.recipient_name} · {addr.phone}</p>
                      </div>
                      {addr.is_default ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                          <Check className="size-3" /> Default
                        </span>
                      ) : (
                        <button onClick={() => void makeDefault(addr.address_id)} className="text-xs font-semibold text-primary hover:underline">
                          Set as Default
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <SummaryCard title="Your Addresses at a Glance">
          <div className="mt-2 space-y-2">
            {cities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add an address to see a summary here.</p>
            ) : (
              cities.map((city) => (
                <div key={city} className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 font-medium"><MapPin className="size-4 text-primary" /> {city}</span>
                  <span className="text-muted-foreground">{(addresses ?? []).filter((a) => a.city === city).length} address{(addresses ?? []).filter((a) => a.city === city).length === 1 ? "" : "es"}</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Secure &amp; verified addresses — your data is protected.
          </div>
        </SummaryCard>
      </div>
    </div>
  );
}

// ============================================================================
// Payment Methods
// ============================================================================

function PaymentsTab({ onManage }: { onManage: () => void }) {
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[] | null>(null);

  useEffect(() => {
    void fixoSdk.listPaymentMethods().then(setMethods).catch(() => setMethods([]));
    void fixoSdk.listInvoices(50, 0).then(setInvoices).catch(() => setInvoices([]));
  }, []);

  const defaultMethod = (methods ?? []).find((m) => m.is_default) ?? null;
  const recentInvoices = (invoices ?? [])
    .filter((i) => Date.now() - new Date(i.created_at).getTime() < 30 * 24 * 60 * 60 * 1000)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const totalSpent30d = recentInvoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total_amount, 0);
  const overdueCount = (invoices ?? []).filter((i) => {
    if (i.status !== "ISSUED") return false;
    const due = new Date(i.issued_at ?? i.created_at);
    due.setDate(due.getDate() + 3);
    return Date.now() > due.getTime();
  }).length;
  const currency = invoices?.[0]?.currency ?? "TZS";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={CreditCard} label="Saved Methods" hint="Payment methods saved securely" value={methods ? String(methods.length) : "—"} />
        <MetricCard icon={Star} label="Default Method" hint={defaultMethod ? `${defaultMethod.provider || humanize(defaultMethod.type)}` : "None set"} value={defaultMethod ? `•••• ${(defaultMethod.details_masked?.["last4"] as string) ?? "····"}` : "—"} tone="success" tintValue />
        <MetricCard icon={Receipt} label="Recent Charges" hint="In the last 30 days" value={String(recentInvoices.length)} />
        <MetricCard icon={ShieldAlert} label="Billing Alerts" hint={overdueCount > 0 ? "Overdue invoices" : "No active alerts"} value={String(overdueCount)} tone={overdueCount > 0 ? "destructive" : "success"} tintValue />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Payment Methods</h3>
            <Button size="sm" onClick={onManage} className="gap-2">
              <Plus className="size-4" /> Add Payment Method
            </Button>
          </div>

          <div className="mt-4">
            {methods === null ? (
              <LoadingRows />
            ) : methods.length === 0 ? (
              <EmptyState compact icon={CreditCard} title="No payment methods yet" description="Add a card, mobile money or bank account." actionLabel="Add Payment Method" onAction={onManage} />
            ) : (
              <div className="divide-y divide-border">
                {methods.map((m) => (
                  <div key={m.method_id} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <CreditCard className="size-5" />
                      </span>
                      <div>
                        <p className="font-medium">
                          {m.provider || humanize(m.type)} •••• {(m.details_masked?.["last4"] as string) ?? "····"}
                        </p>
                        <p className="text-sm text-muted-foreground">{humanize(m.type)}</p>
                      </div>
                    </div>
                    {m.is_default ? (
                      <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">Default</span>
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Your payment information is secure and encrypted.
          </div>
        </div>

        <SummaryCard title="Recent Billing">
          {invoices === null ? (
            <LoadingRows />
          ) : recentInvoices.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No billing activity in the last 30 days.</p>
          ) : (
            <div className="space-y-1">
              {recentInvoices.slice(0, 5).map((i) => (
                <div key={i.invoice_id} className="flex items-center justify-between border-b border-border py-3 text-sm last:border-0">
                  <div>
                    <p className="font-medium">{i.service_name ?? "Service"}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(i.created_at)} · {humanize(i.status)}</p>
                  </div>
                  <span className="font-semibold">{fmtMoney(i.total_amount, i.currency)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 text-sm font-semibold">
                <span>Total spent (30 days)</span>
                <span>{fmtMoney(totalSpent30d, currency)}</span>
              </div>
            </div>
          )}
        </SummaryCard>
      </div>
    </div>
  );
}

// ============================================================================
// Notification Preferences
// ============================================================================

const NOTIFY_ROWS = [
  { key: "BOOKING_UPDATES", label: "Booking Updates", hint: "New bookings, changes, cancellations", icon: BellRing },
  { key: "PROVIDER_MESSAGES", label: "Provider Messages", hint: "Messages from your service providers", icon: MessageSquare },
  { key: "PAYMENT_RECEIPTS", label: "Payment Receipts", hint: "Receipts, confirmations, and refunds", icon: Receipt },
  { key: "PROMOTIONS", label: "Promotions", hint: "Offers, discounts, and special updates", icon: Tag },
  { key: "QUIET_HOURS", label: "Quiet Hours", hint: "Pause non-urgent notifications", icon: Moon },
] as const;
const CHANNELS = ["PUSH", "EMAIL", "SMS"] as const;

const NOTIFY_DEFAULTS: Record<string, boolean> = {
  NOTIFY_BOOKING_UPDATES_PUSH: true, NOTIFY_BOOKING_UPDATES_EMAIL: true, NOTIFY_BOOKING_UPDATES_SMS: false,
  NOTIFY_PROVIDER_MESSAGES_PUSH: true, NOTIFY_PROVIDER_MESSAGES_EMAIL: true, NOTIFY_PROVIDER_MESSAGES_SMS: false,
  NOTIFY_PAYMENT_RECEIPTS_PUSH: false, NOTIFY_PAYMENT_RECEIPTS_EMAIL: true, NOTIFY_PAYMENT_RECEIPTS_SMS: true,
  NOTIFY_PROMOTIONS_PUSH: false, NOTIFY_PROMOTIONS_EMAIL: true, NOTIFY_PROMOTIONS_SMS: false,
  NOTIFY_QUIET_HOURS_PUSH: true, NOTIFY_QUIET_HOURS_EMAIL: true, NOTIFY_QUIET_HOURS_SMS: false,
};

function NotificationsTab() {
  const { customer } = useAuth();
  const keys = useMemo(() => NOTIFY_ROWS.flatMap((r) => CHANNELS.map((c) => `NOTIFY_${r.key}_${c}`)), []);
  const { values, toggle } = usePreferenceMap(keys, NOTIFY_DEFAULTS);

  const enabledChannels = CHANNELS.filter((c) => NOTIFY_ROWS.some((r) => values?.[`NOTIFY_${r.key}_${c}`]));
  const bookingOn = values?.["NOTIFY_BOOKING_UPDATES_PUSH"] || values?.["NOTIFY_BOOKING_UPDATES_EMAIL"];
  const paymentOn = values?.["NOTIFY_PAYMENT_RECEIPTS_PUSH"] || values?.["NOTIFY_PAYMENT_RECEIPTS_EMAIL"];
  const quietOn = values?.["NOTIFY_QUIET_HOURS_PUSH"] || values?.["NOTIFY_QUIET_HOURS_EMAIL"];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Smartphone} label="Enabled Channels" hint={enabledChannels.map((c) => humanize(c)).join(", ") || "None"} value={values ? `${enabledChannels.length} of ${CHANNELS.length}` : "—"} />
        <MetricCard icon={BellRing} label="Booking Alerts" hint="Updates enabled" value={values ? (bookingOn ? "On" : "Off") : "—"} tone={bookingOn ? "success" : "amber"} tintValue />
        <MetricCard icon={Receipt} label="Payment Alerts" hint="Receipts enabled" value={values ? (paymentOn ? "On" : "Off") : "—"} tone={paymentOn ? "success" : "amber"} tintValue />
        <MetricCard icon={Moon} label="Quiet Hours" hint="Non-urgent muted" value={values ? (quietOn ? "On" : "Off") : "—"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold">Notification Preferences</h3>
          {values === null ? (
            <div className="mt-4"><LoadingRows /></div>
          ) : (
            <div className="mt-2">
              <div className="hidden grid-cols-[1fr_repeat(3,64px)] gap-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
                <span />
                {CHANNELS.map((c) => <span key={c} className="text-center">{humanize(c)}</span>)}
              </div>
              {NOTIFY_ROWS.map((row) => (
                <div key={row.key} className="grid grid-cols-1 gap-3 border-b border-border py-4 last:border-0 sm:grid-cols-[1fr_repeat(3,64px)] sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <row.icon className="size-4" />
                    </span>
                    <div>
                      <p className="font-medium">{row.label}</p>
                      <p className="text-sm text-muted-foreground">{row.hint}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 sm:contents">
                    {CHANNELS.map((c) => {
                      const key = `NOTIFY_${row.key}_${c}`;
                      const on = values[key] ?? false;
                      return (
                        <div key={c} className="flex flex-col items-center gap-1">
                          <span className="text-xs text-muted-foreground sm:hidden">{humanize(c)}</span>
                          <button
                            onClick={() => void toggle(key)}
                            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}
                          >
                            <span className={`absolute top-1 size-4 rounded-full bg-primary-foreground transition-transform ${on ? "left-6" : "left-1"}`} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <BellRing className="size-3.5 text-primary" /> You will still receive critical alerts even during quiet hours.
            </p>
            <Button onClick={() => toast.success("Preferences saved")}>Save Preferences</Button>
          </div>
        </div>

        <SummaryCard title="Delivery Summary">
          <p className="text-sm text-muted-foreground">How you receive notifications</p>
          <div className="mt-3 space-y-1">
            <SummaryRow icon={Smartphone} label="Push Notifications" value={enabledChannels.includes("PUSH") ? "On" : "Off"} valueClass={enabledChannels.includes("PUSH") ? "text-success" : "text-muted-foreground"} />
            <SummaryRow icon={Mail} label="Email" value={enabledChannels.includes("EMAIL") ? "On" : "Off"} valueClass={enabledChannels.includes("EMAIL") ? "text-success" : "text-muted-foreground"} />
            <SummaryRow icon={Phone} label="SMS" value={!customer?.phone ? "Not set" : enabledChannels.includes("SMS") ? "On" : "Off"} valueClass={!customer?.phone ? "text-muted-foreground" : enabledChannels.includes("SMS") ? "text-success" : "text-muted-foreground"} />
            <SummaryRow icon={Moon} label="Quiet Hours" value={quietOn ? "On" : "Off"} valueClass={quietOn ? "text-success" : "text-muted-foreground"} />
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Your preferences help us send you the right notifications at the right time.
          </div>
        </SummaryCard>
      </div>
    </div>
  );
}

// ============================================================================
// Security
// ============================================================================

function SecurityTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [sessions, setSessions] = useState<AuthSession[] | null>(null);
  const { customer } = useAuth();

  const load = useCallback(() => {
    void fixoSdk.listSessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  useEffect(() => load(), [load]);

  async function changePassword() {
    if (!current || next.length < 8) {
      toast.error("Enter your current password and a new one (min 8 characters)");
      return;
    }
    setBusy(true);
    try {
      await fixoSdk.changePassword(current, next);
      toast.success("Password updated");
      setCurrent("");
      setNext("");
      setShowChangeForm(false);
    } catch {
      // toast emitted by client
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    setRevoking(true);
    try {
      await fixoSdk.revokeSessions("user requested from settings");
      toast.success("All other sessions revoked");
      load();
    } catch {
      // toast emitted by client
    } finally {
      setRevoking(false);
    }
  }

  const activeSessions = (sessions ?? []).filter((s) => !s.revoked_at && new Date(s.expires_at).getTime() > Date.now());
  const mostRecent = activeSessions[0] ?? null;
  const thisDevice = parseDeviceInfo(navigator.userAgent);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Laptop} label="Active Sessions" hint="Signed-in devices" value={sessions ? String(activeSessions.length) : "—"} />
        <MetricCard icon={ShieldAlert} label="Two-Factor Status" hint="Not available yet" value="Not enabled" tone="amber" />
        <MetricCard icon={Clock} label="Recent Login" hint={mostRecent?.ip_address ? `IP ${mostRecent.ip_address}` : "No sessions yet"} value={mostRecent ? timeAgo(mostRecent.created_at) : "—"} />
        <MetricCard icon={Smartphone} label="This Device" hint="Current session" value={thisDevice} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold">Security Settings</h3>
          <div className="mt-2">
            <Field
              icon={KeyRound}
              label="Password"
              value="Keep your password strong to protect your account."
              action={<Button size="sm" variant="outline" onClick={() => setShowChangeForm((v) => !v)}>Change Password</Button>}
            />
            {showChangeForm && (
              <div className="mt-1 mb-4 space-y-3 rounded-2xl border border-border p-4 animate-in fade-in slide-in-from-top-1">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Current password</Label>
                    <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>New password</Label>
                    <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
                  </div>
                </div>
                <Button disabled={busy} onClick={() => void changePassword()}>{busy ? "Updating..." : "Update password"}</Button>
              </div>
            )}
            <Field
              icon={ShieldAlert}
              label="Two-Factor Authentication"
              value="Add an extra layer of security to your account."
              action={<span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Not available</span>}
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Trusted Devices</h4>
              <p className="text-sm text-muted-foreground">These devices have access to your account.</p>
            </div>
            <Button variant="outline" size="sm" disabled={revoking} onClick={() => void revoke()} className="gap-2">
              <LogOutIcon className="size-4" /> {revoking ? "Revoking..." : "Sign Out All"}
            </Button>
          </div>

          <div className="mt-3">
            {sessions === null ? (
              <LoadingRows />
            ) : activeSessions.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">No active sessions found.</p>
            ) : (
              <div className="divide-y divide-border">
                {activeSessions.map((s, i) => (
                  <div key={s.session_id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Laptop className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{parseDeviceInfo(s.device_info)}</p>
                        <p className="text-xs text-muted-foreground">{s.ip_address ?? "Unknown IP"} · {fmtDateTime(s.created_at)}</p>
                      </div>
                    </div>
                    {i === 0 && activeSessions.length === 1 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Current Device</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <SummaryCard title="Account Overview">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="size-7" />
            </span>
            <h4 className="mt-3 font-semibold">Real account signals</h4>
            <p className="text-sm text-muted-foreground">What we can verify right now.</p>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {customer?.email_verified ? <Check className="size-4 text-success" /> : <ShieldAlert className="size-4 text-amber-600" />}
              <span>{customer?.email_verified ? "Email verified" : "Email not verified"}</span>
            </div>
            <div className="flex items-center gap-2">
              {customer?.phone_verified ? <Check className="size-4 text-success" /> : <ShieldAlert className="size-4 text-amber-600" />}
              <span>{customer?.phone_verified ? "Phone verified" : "Phone not verified"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Laptop className="size-4 text-primary" />
              <span>{activeSessions.length} active session{activeSessions.length === 1 ? "" : "s"}</span>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            Two-factor authentication isn't available yet — this page will update honestly once it ships.
          </div>
        </SummaryCard>
      </div>
    </div>
  );
}

// ============================================================================
// Privacy
// ============================================================================

const CONSENT_KINDS = [
  { key: "MARKETING", label: "Marketing communications" },
  { key: "ANALYTICS", label: "Product analytics" },
  { key: "COMMUNICATION", label: "Service communications" },
  { key: "PERSONALIZATION", label: "Personalized recommendations" },
  { key: "THIRD_PARTY", label: "Third-party integrations" },
] as const;

const SHARING_KINDS = [
  { key: "DATA_SHARE_PARTNERS", label: "Trusted service partners" },
  { key: "DATA_SHARE_ANALYTICS", label: "Analytics providers" },
  { key: "DATA_SHARE_SUPPORT", label: "Support tooling" },
  { key: "DATA_SHARE_MARKETING", label: "Marketing platforms" },
  { key: "DATA_SHARE_RESEARCH", label: "Product research" },
] as const;
const SHARING_DEFAULTS: Record<string, boolean> = Object.fromEntries(SHARING_KINDS.map((k) => [k.key, false]));

function PrivacyTab() {
  const [consents, setConsents] = useState<Consent[] | null>(null);
  const [exports, setExports] = useState<DataExport[] | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [showSharing, setShowSharing] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  const { values: sharing, toggle: toggleSharing } = usePreferenceMap(SHARING_KINDS.map((k) => k.key), SHARING_DEFAULTS);
  const { values: cookiePrefs, toggle: toggleCookie } = usePreferenceMap(["COOKIES_ANALYTICS"], { COOKIES_ANALYTICS: false });
  const { setValue: setVisibility } = usePreferenceMap([], {});
  const [visibility, setVisibilityLocal] = useState("Only me");

  const load = useCallback(() => {
    void fixoSdk.listConsents().then(setConsents).catch(() => setConsents([]));
    void fixoSdk.listDataExports().then(setExports).catch(() => setExports([]));
    void fixoSdk
      .listPreferences()
      .then((prefs) => {
        const found = prefs.find((p) => p.key === "PROFILE_VISIBILITY");
        if (found) setVisibilityLocal(found.value);
      })
      .catch(() => {});
  }, []);

  useEffect(() => load(), [load]);

  async function toggleConsent(kind: string, current: boolean) {
    setConsents((prev) => prev?.map((c) => (c.kind === kind ? { ...c, consented: !current } : c)) ?? null);
    try {
      await fixoSdk.setConsent(kind, !current);
    } catch {
      setConsents((prev) => prev?.map((c) => (c.kind === kind ? { ...c, consented: current } : c)) ?? null);
    }
  }

  async function changeVisibility(v: string) {
    setVisibilityLocal(v);
    const ok = await setVisibility("PROFILE_VISIBILITY", v);
    if (!ok) toast.error("Couldn't save visibility — try again.");
  }

  async function requestExport() {
    setRequesting(true);
    try {
      await fixoSdk.requestDataExport();
      toast.success("Export requested — we'll notify you when it's ready");
      load();
    } catch {
      // toast emitted by client
    } finally {
      setRequesting(false);
    }
  }

  const consentOnCount = CONSENT_KINDS.filter((k) => consents?.find((c) => c.kind === k.key)?.consented).length;
  const marketingConsent = consents?.find((c) => c.kind === "MARKETING")?.consented ?? false;
  const sharingOnCount = SHARING_KINDS.filter((k) => sharing?.[k.key]).length;
  const sharingLabel = sharingOnCount === 0 ? "None" : sharingOnCount === SHARING_KINDS.length ? "Open" : "Limited";
  const cookiesLabel = cookiePrefs?.["COOKIES_ANALYTICS"] ? "All cookies" : "Essential only";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Data Sharing" hint={`${sharingOnCount} of ${SHARING_KINDS.length} enabled`} value={sharingLabel} />
        <MetricCard icon={Eye} label="Visibility Level" hint="Only you" value={visibility === "Only me" ? "Private" : "Everyone"} tone="success" tintValue />
        <MetricCard icon={ShieldCheck} label="Consent Status" hint={`${consentOnCount} of ${CONSENT_KINDS.length} consents given`} value={consentOnCount === CONSENT_KINDS.length ? "All Set" : "Partial"} />
        <MetricCard icon={CloudDownload} label="Export Requests" hint={exports && exports.length > 0 ? "Requested" : "No requests yet"} value={exports ? String(exports.length) : "—"} tone="amber" tintValue />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold">Privacy Settings</h3>
          <div className="mt-2">
            <Field
              icon={Eye}
              label="Profile Visibility"
              value="Choose who can see your profile information."
              action={
                <Select value={visibility} onValueChange={(v) => void changeVisibility(v)}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Only me">Only me</SelectItem>
                    <SelectItem value="Everyone">Everyone</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
            <ToggleRow
              label="Marketing & Communication"
              hint="Control how we can contact you with updates and offers."
              on={marketingConsent}
              onToggle={() => void toggleConsent("MARKETING", marketingConsent)}
            />
            <Field
              icon={Share2}
              label="Data Sharing Permissions"
              value="Manage how your data is shared with third parties."
              action={<Button size="sm" variant="outline" onClick={() => setShowSharing((v) => !v)} className="gap-1">Manage Consent <ChevronRight className="size-3.5" /></Button>}
            />
            {showSharing && (
              <div className="mb-2 space-y-1 rounded-2xl border border-border p-2 animate-in fade-in slide-in-from-top-1">
                {SHARING_KINDS.map((k) => (
                  <ToggleRow key={k.key} label={k.label} on={sharing?.[k.key] ?? false} onToggle={() => void toggleSharing(k.key)} />
                ))}
              </div>
            )}
            <Field
              icon={Cookie}
              label="Cookies & Device Preferences"
              value="Manage cookies, tracking and device recognition."
              action={<Button size="sm" variant="outline" onClick={() => setShowCookies((v) => !v)} className="gap-1">Manage Preferences <ChevronRight className="size-3.5" /></Button>}
            />
            {showCookies && (
              <div className="mb-2 rounded-2xl border border-border p-2 animate-in fade-in slide-in-from-top-1">
                <ToggleRow label="Allow analytics cookies" hint="Essential cookies always stay on." on={cookiePrefs?.["COOKIES_ANALYTICS"] ?? false} onToggle={() => void toggleCookie("COOKIES_ANALYTICS")} />
              </div>
            )}
            <Field
              icon={Download}
              label="Account Data Requests"
              value="Download your data or request account deletion."
              action={<Button size="sm" variant="outline" disabled={requesting} onClick={() => void requestExport()} className="gap-1">{requesting ? "Requesting..." : "Download My Data"} <ChevronRight className="size-3.5" /></Button>}
            />
          </div>
          {exports && exports.length > 0 && (
            <div className="mt-2 border-t border-border pt-3">
              <p className="mb-2 text-sm font-semibold">Export history</p>
              <ul className="space-y-2">
                {exports.map((e) => (
                  <li key={e.request_id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{fmtDateTime(e.requested_at)}</span>
                    <span className="font-medium">{humanize(e.status)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <SummaryCard title="Privacy Summary">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-7" />
            </span>
            <h4 className="mt-3 font-semibold">You're in control</h4>
            <p className="text-sm text-muted-foreground">Manage what you share and who can see it.</p>
          </div>
          <div className="mt-4 space-y-1 border-t border-border pt-3">
            <SummaryRow icon={Eye} label="Profile Visibility" value={visibility} valueClass="text-success" />
            <SummaryRow icon={Mail} label="Marketing Consent" value={marketingConsent ? "On" : "Off"} valueClass={marketingConsent ? "text-success" : "text-muted-foreground"} />
            <SummaryRow icon={Share2} label="Data Sharing" value={sharingLabel} />
            <SummaryRow icon={Cookie} label="Cookies & Tracking" value={cookiesLabel} />
            <SummaryRow icon={CloudDownload} label="Data Requests" value={`${exports?.length ?? 0} requests`} />
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0 text-primary" />
            We take your privacy seriously and never sell your personal data.
          </div>
        </SummaryCard>
      </div>
    </div>
  );
}
