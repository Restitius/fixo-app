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
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LANGUAGE_NAMES } from "@/lib/language";
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
import { useTranslation } from "react-i18next";

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

const TAB_IDS = ["personal", "addresses", "payments", "notifications", "security", "privacy"] as const;
const TAB_ICONS = { personal: User, addresses: MapPin, payments: CreditCard, notifications: Bell, security: Shield, privacy: ShieldCheck } as const;

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
  const { t } = useTranslation("profile");
  const { access_token, loading, logout, customer } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<(typeof TAB_IDS)[number]>("personal");

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t("loading")}</div>;
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
    <PageShell title={t("page.title")} subtitle={t("page.subtitle")} userName={customer?.full_name} onLogout={logout}>
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
              {customer?.email_verified ? t("emailVerified") : t("emailUnverified")}
            </span>
          </div>

          <nav className="mt-6 space-y-1">
            {TAB_IDS.map((id) => {
              const Icon = TAB_ICONS[id];
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                    activeTab === id ? "text-primary-foreground" : "text-foreground/80 hover:bg-sidebar-accent"
                  }`}
                  style={activeTab === id ? { backgroundImage: "var(--gradient-primary)" } : undefined}
                >
                  <Icon className="size-5" />
                  {t(`tabs.${id}`)}
                </button>
              );
            })}
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
  const { t } = useTranslation("profile");
  const { customer, updateProfile } = useAuth();
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [fullNameDraft, setFullNameDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void bookingApi.listAddresses().then(setAddresses).catch(() => setAddresses([]));
    void fixoSdk.listPaymentMethods().then(setMethods).catch(() => setMethods([]));
    void fixoSdk.loyaltyAccount().then((a) => setTier(a.tier)).catch(() => setTier(null));
  }, []);

  function startEditing() {
    setFullNameDraft(customer?.full_name ?? "");
    setPhoneDraft(customer?.phone ?? "");
    setEditing(true);
  }

  async function saveProfile() {
    if (!fullNameDraft.trim()) {
      toast.error(t("personal.profileSaveError"));
      return;
    }
    setSaving(true);
    try {
      const trimmedPhone = phoneDraft.trim();
      await updateProfile(trimmedPhone ? { full_name: fullNameDraft.trim(), phone: trimmedPhone } : { full_name: fullNameDraft.trim() });
      toast.success(t("personal.profileSaved"));
      setEditing(false);
    } catch {
      toast.error(t("personal.profileSaveError"));
    } finally {
      setSaving(false);
    }
  }

  // A real, disclosed completion score — not a fabricated percentage. Each
  // item is a genuine account fact (verification flags, real saved records).
  const checklist = [
    { label: t("personal.checklistEmailVerified"), done: !!customer?.email_verified },
    { label: t("personal.checklistPhoneVerified"), done: !!customer?.phone_verified },
    { label: t("personal.checklistAddressSaved"), done: (addresses?.length ?? 0) > 0 },
    { label: t("personal.checklistPaymentMethodSaved"), done: (methods?.length ?? 0) > 0 },
  ];
  const verifiedCount = checklist.filter((c) => c.done).length;
  const completion = Math.round((verifiedCount / checklist.length) * 100);
  const dataLoaded = addresses !== null && methods !== null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={User} label={t("personal.profileCompletion")} hint={completion === 100 ? t("personal.allSet") : t("personal.almostThere")} value={dataLoaded ? `${completion}%` : "—"} />
        <MetricCard icon={BadgeCheck} label={t("personal.verifiedItems")} hint={t("personal.verifiedCount", { count: verifiedCount })} value={t("personal.verifiedOf", { count: verifiedCount, total: checklist.length })} tone="success" tintValue />
        <MetricCard icon={MapPin} label={t("personal.savedAddresses")} hint={t("personal.addressesSaved")} value={dataLoaded ? String(addresses?.length ?? 0) : "—"} />
        <MetricCard icon={ShieldCheck} label={t("personal.securityStatus")} hint={customer?.email_verified && customer?.phone_verified ? t("personal.allGood") : t("personal.needsAttention")} value={customer?.email_verified && customer?.phone_verified ? t("personal.secure") : t("personal.review")} tone={customer?.email_verified && customer?.phone_verified ? "success" : "amber"} tintValue />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t("personal.personalInformation")}</h3>
            {!editing && (
              <Button size="sm" variant="outline" className="gap-2" onClick={startEditing}>
                <Pencil className="size-4" /> {t("personal.editProfile")}
              </Button>
            )}
          </div>
          {editing ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-border p-4 animate-in fade-in slide-in-from-top-1">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t("personal.fullName")}</Label>
                  <Input value={fullNameDraft} onChange={(e) => setFullNameDraft(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("personal.phone")}</Label>
                  <Input value={phoneDraft} onChange={(e) => setPhoneDraft(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button disabled={saving} onClick={() => void saveProfile()}>{saving ? t("personal.saving") : t("personal.saveChanges")}</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>{t("personal.cancel")}</Button>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <Field icon={User} label={t("personal.fullName")} value={customer?.full_name ?? "—"} />
              <Field
                icon={Mail}
                label={t("personal.email")}
                value={customer?.email ?? "—"}
                action={
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${customer?.email_verified ? "bg-success/15 text-success" : "bg-amber-500/15 text-amber-600"}`}>
                    {customer?.email_verified ? t("verified") : t("unverified")}
                  </span>
                }
              />
              <Field
                icon={Phone}
                label={t("personal.phone")}
                value={customer?.phone ?? t("notSet")}
                action={
                  customer?.phone ? (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${customer?.phone_verified ? "bg-success/15 text-success" : "bg-amber-500/15 text-amber-600"}`}>
                      {customer?.phone_verified ? t("verified") : t("unverified")}
                    </span>
                  ) : (
                    <button onClick={startEditing} className="text-sm font-semibold text-primary hover:underline">{t("add")}</button>
                  )
                }
              />
              <Field
                icon={Globe}
                label={t("preferredLanguage")}
                value={LANGUAGE_NAMES[customer?.preferred_language as keyof typeof LANGUAGE_NAMES] ?? "English"}
                action={<LanguageSwitcher />}
              />
              <Field
                icon={Cake}
                label={t("personal.dateOfBirth")}
                value={t("notSet")}
                action={
                  <button onClick={() => toast.info(t("personal.dobUnavailable"))} className="text-sm font-semibold text-muted-foreground hover:underline">
                    {t("add")}
                  </button>
                }
              />
              <Field icon={Clock} label={t("personal.timezone")} value={t("personal.timezoneValue")} />
            </div>
          )}
        </div>

        <SummaryCard title="">
          <div className="flex flex-col items-center text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {(customer?.full_name ?? "").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "U"}
            </span>
            <h4 className="mt-3 text-lg font-semibold">{customer?.full_name}</h4>
            <p className="text-sm text-muted-foreground">{t("page.customer")}</p>
            <span className={`mt-2 rounded-full px-3 py-1 text-xs font-semibold ${customer?.email_verified ? "bg-success/15 text-success" : "bg-amber-500/15 text-amber-600"}`}>
              {customer?.email_verified ? t("emailVerified") : t("emailUnverified")}
            </span>
          </div>
          <div className="mt-5 border-t border-border pt-3">
            <SummaryRow icon={Clock} label={t("personal.memberSince")} value={customer?.created_at ? fmtDate(customer.created_at) : "—"} />
            <SummaryRow icon={Star} label={t("personal.loyaltyTier")} value={tier ? humanize(tier) : "—"} valueClass="text-primary" />
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
  const { t } = useTranslation("profile");
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
      toast.error(t("addresses.fillRequiredFields"));
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
      toast.success(t("addresses.addressSaved"));
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
        <MetricCard icon={MapPin} label={t("addresses.savedAddresses")} hint={t("addresses.totalAddresses")} value={addresses ? String(addresses.length) : "—"} />
        <MetricCard icon={Star} label={t("addresses.defaultAddress")} hint={t("addresses.setAsDefaultHint")} value={hasDefault ? "1" : "0"} tone="success" tintValue />
        <MetricCard icon={Globe} label={t("addresses.citiesOnFile")} hint={t("addresses.fromYourAddresses")} value={String(cities.length)} />
        <MetricCard icon={Clock} label={t("addresses.recentlyAdded")} hint={t("addresses.inLast30Days")} value={String(recentlyAdded)} tone="amber" tintValue />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t("addresses.yourAddresses")}</h3>
            <Button size="sm" onClick={() => setShowForm((v) => !v)} className="gap-2">
              <Plus className="size-4" /> {t("addresses.addAddress")}
            </Button>
          </div>

          {showForm && (
            <div className="mt-4 space-y-3 rounded-2xl border border-border p-4 animate-in fade-in slide-in-from-top-1">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t("addresses.label")}</Label>
                  <Input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("addresses.recipientName")}</Label>
                  <Input value={draft.recipient_name} onChange={(e) => setDraft((d) => ({ ...d, recipient_name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("addresses.phone")}</Label>
                  <Input value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("addresses.city")}</Label>
                  <Input value={draft.city} onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t("addresses.streetAddress")}</Label>
                  <Input value={draft.street_address} onChange={(e) => setDraft((d) => ({ ...d, street_address: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("addresses.region")}</Label>
                  <Input value={draft.region} onChange={(e) => setDraft((d) => ({ ...d, region: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button disabled={saving} onClick={() => void save()}>{saving ? t("addresses.saving") : t("addresses.saveAddress")}</Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>{t("addresses.cancel")}</Button>
              </div>
            </div>
          )}

          <div className="mt-4">
            {addresses === null ? (
              <LoadingRows />
            ) : addresses.length === 0 && !showForm ? (
              <EmptyState compact icon={MapPin} title={t("addresses.noAddressesYet")} description={t("addresses.addAddressToSpeedUp")} actionLabel={t("addresses.addAddress")} onAction={() => setShowForm(true)} />
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
                          <Check className="size-3" /> {t("addresses.default")}
                        </span>
                      ) : (
                        <button onClick={() => void makeDefault(addr.address_id)} className="text-xs font-semibold text-primary hover:underline">
                          {t("addresses.setAsDefault")}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <SummaryCard title={t("addresses.atAGlance")}>
          <div className="mt-2 space-y-2">
            {cities.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("addresses.addToSeeSummary")}</p>
            ) : (
              cities.map((city) => (
                <div key={city} className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 font-medium"><MapPin className="size-4 text-primary" /> {city}</span>
                  <span className="text-muted-foreground">{t("addresses.addressCount", { count: (addresses ?? []).filter((a) => a.city === city).length })}</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {t("addresses.secureFooter")}
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
  const { t } = useTranslation("profile");
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
        <MetricCard icon={CreditCard} label={t("payments.savedMethods")} hint={t("payments.savedSecurely")} value={methods ? String(methods.length) : "—"} />
        <MetricCard icon={Star} label={t("payments.defaultMethod")} hint={defaultMethod ? `${defaultMethod.provider || humanize(defaultMethod.type)}` : t("payments.noneSet")} value={defaultMethod ? `•••• ${(defaultMethod.details_masked?.["last4"] as string) ?? "····"}` : "—"} tone="success" tintValue />
        <MetricCard icon={Receipt} label={t("payments.recentCharges")} hint={t("payments.inLast30Days")} value={String(recentInvoices.length)} />
        <MetricCard icon={ShieldAlert} label={t("payments.billingAlerts")} hint={overdueCount > 0 ? t("payments.overdueInvoices") : t("payments.noActiveAlerts")} value={String(overdueCount)} tone={overdueCount > 0 ? "destructive" : "success"} tintValue />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t("payments.paymentMethods")}</h3>
            <Button size="sm" onClick={onManage} className="gap-2">
              <Plus className="size-4" /> {t("payments.addPaymentMethod")}
            </Button>
          </div>

          <div className="mt-4">
            {methods === null ? (
              <LoadingRows />
            ) : methods.length === 0 ? (
              <EmptyState compact icon={CreditCard} title={t("payments.noPaymentMethodsYet")} description={t("payments.addCardOrAccount")} actionLabel={t("payments.addPaymentMethod")} onAction={onManage} />
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
                      <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">{t("payments.default")}</span>
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
            {t("payments.secureFooter")}
          </div>
        </div>

        <SummaryCard title={t("payments.recentBilling")}>
          {invoices === null ? (
            <LoadingRows />
          ) : recentInvoices.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{t("payments.noBillingActivity")}</p>
          ) : (
            <div className="space-y-1">
              {recentInvoices.slice(0, 5).map((i) => (
                <div key={i.invoice_id} className="flex items-center justify-between border-b border-border py-3 text-sm last:border-0">
                  <div>
                    <p className="font-medium">{i.service_name ?? t("payments.serviceFallback")}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(i.created_at)} · {humanize(i.status)}</p>
                  </div>
                  <span className="font-semibold">{fmtMoney(i.total_amount, i.currency)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 text-sm font-semibold">
                <span>{t("payments.totalSpent30Days")}</span>
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
  { key: "BOOKING_UPDATES", labelKey: "bookingUpdates", hintKey: "bookingUpdatesHint", icon: BellRing },
  { key: "PROVIDER_MESSAGES", labelKey: "providerMessages", hintKey: "providerMessagesHint", icon: MessageSquare },
  { key: "PAYMENT_RECEIPTS", labelKey: "paymentReceipts", hintKey: "paymentReceiptsHint", icon: Receipt },
  { key: "PROMOTIONS", labelKey: "promotions", hintKey: "promotionsHint", icon: Tag },
  { key: "QUIET_HOURS", labelKey: "quietHours", hintKey: "quietHoursHint", icon: Moon },
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
  const { t } = useTranslation("profile");
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
        <MetricCard icon={Smartphone} label={t("notifications.enabledChannels")} hint={enabledChannels.map((c) => humanize(c)).join(", ") || t("notifications.none")} value={values ? t("notifications.enabledOfTotal", { count: enabledChannels.length, total: CHANNELS.length }) : "—"} />
        <MetricCard icon={BellRing} label={t("notifications.bookingAlerts")} hint={t("notifications.updatesEnabled")} value={values ? (bookingOn ? t("notifications.on") : t("notifications.off")) : "—"} tone={bookingOn ? "success" : "amber"} tintValue />
        <MetricCard icon={Receipt} label={t("notifications.paymentAlerts")} hint={t("notifications.receiptsEnabled")} value={values ? (paymentOn ? t("notifications.on") : t("notifications.off")) : "—"} tone={paymentOn ? "success" : "amber"} tintValue />
        <MetricCard icon={Moon} label={t("notifications.quietHours")} hint={t("notifications.nonUrgentMuted")} value={values ? (quietOn ? t("notifications.on") : t("notifications.off")) : "—"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold">{t("notifications.notificationPreferences")}</h3>
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
                      <p className="font-medium">{t(`notifications.${row.labelKey}`)}</p>
                      <p className="text-sm text-muted-foreground">{t(`notifications.${row.hintKey}`)}</p>
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
              <BellRing className="size-3.5 text-primary" /> {t("notifications.criticalAlertsNote")}
            </p>
            <Button onClick={() => toast.success(t("notifications.preferencesSaved"))}>{t("notifications.savePreferences")}</Button>
          </div>
        </div>

        <SummaryCard title={t("notifications.deliverySummary")}>
          <p className="text-sm text-muted-foreground">{t("notifications.howYouReceive")}</p>
          <div className="mt-3 space-y-1">
            <SummaryRow icon={Smartphone} label={t("notifications.pushNotifications")} value={enabledChannels.includes("PUSH") ? t("notifications.on") : t("notifications.off")} valueClass={enabledChannels.includes("PUSH") ? "text-success" : "text-muted-foreground"} />
            <SummaryRow icon={Mail} label={t("notifications.email")} value={enabledChannels.includes("EMAIL") ? t("notifications.on") : t("notifications.off")} valueClass={enabledChannels.includes("EMAIL") ? "text-success" : "text-muted-foreground"} />
            <SummaryRow icon={Phone} label={t("notifications.sms")} value={!customer?.phone ? t("notifications.notSet") : enabledChannels.includes("SMS") ? t("notifications.on") : t("notifications.off")} valueClass={!customer?.phone ? "text-muted-foreground" : enabledChannels.includes("SMS") ? "text-success" : "text-muted-foreground"} />
            <SummaryRow icon={Moon} label={t("notifications.quietHours")} value={quietOn ? t("notifications.on") : t("notifications.off")} valueClass={quietOn ? "text-success" : "text-muted-foreground"} />
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {t("notifications.footer")}
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
  const { t } = useTranslation("profile");
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
      toast.error(t("security.passwordRequirements"));
      return;
    }
    setBusy(true);
    try {
      await fixoSdk.changePassword(current, next);
      toast.success(t("security.passwordUpdated"));
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
      toast.success(t("security.allSessionsRevoked"));
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
        <MetricCard icon={Laptop} label={t("security.activeSessions")} hint={t("security.signedInDevices")} value={sessions ? String(activeSessions.length) : "—"} />
        <MetricCard icon={ShieldAlert} label={t("security.twoFactorStatus")} hint={t("security.notAvailableYet")} value={t("security.notEnabled")} tone="amber" />
        <MetricCard icon={Clock} label={t("security.recentLogin")} hint={mostRecent?.ip_address ? t("security.ipLabel", { ip: mostRecent.ip_address }) : t("security.noSessionsYet")} value={mostRecent ? timeAgo(mostRecent.created_at) : "—"} />
        <MetricCard icon={Smartphone} label={t("security.thisDevice")} hint={t("security.currentSession")} value={thisDevice} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold">{t("security.securitySettings")}</h3>
          <div className="mt-2">
            <Field
              icon={KeyRound}
              label={t("security.password")}
              value={t("security.passwordHint")}
              action={<Button size="sm" variant="outline" onClick={() => setShowChangeForm((v) => !v)}>{t("security.changePassword")}</Button>}
            />
            {showChangeForm && (
              <div className="mt-1 mb-4 space-y-3 rounded-2xl border border-border p-4 animate-in fade-in slide-in-from-top-1">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{t("security.currentPassword")}</Label>
                    <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("security.newPassword")}</Label>
                    <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
                  </div>
                </div>
                <Button disabled={busy} onClick={() => void changePassword()}>{busy ? t("security.updating") : t("security.updatePassword")}</Button>
              </div>
            )}
            <Field
              icon={ShieldAlert}
              label={t("security.twoFactorAuth")}
              value={t("security.twoFactorHint")}
              action={<span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{t("security.notAvailable")}</span>}
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div>
              <h4 className="font-semibold">{t("security.trustedDevices")}</h4>
              <p className="text-sm text-muted-foreground">{t("security.trustedDevicesHint")}</p>
            </div>
            <Button variant="outline" size="sm" disabled={revoking} onClick={() => void revoke()} className="gap-2">
              <LogOutIcon className="size-4" /> {revoking ? t("security.revoking") : t("security.signOutAll")}
            </Button>
          </div>

          <div className="mt-3">
            {sessions === null ? (
              <LoadingRows />
            ) : activeSessions.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">{t("security.noActiveSessions")}</p>
            ) : (
              <div className="divide-y divide-border">
                {activeSessions.map((s, i) => (
                  <div key={s.session_id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Laptop className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{parseDeviceInfo(s.device_info)}</p>
                        <p className="text-xs text-muted-foreground">{s.ip_address ?? t("security.unknownIp")} · {fmtDateTime(s.created_at)}</p>
                      </div>
                    </div>
                    {i === 0 && activeSessions.length === 1 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{t("security.currentDevice")}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <SummaryCard title={t("security.accountOverview")}>
          <div className="flex flex-col items-center text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Shield className="size-7" />
            </span>
            <h4 className="mt-3 font-semibold">{t("security.realAccountSignals")}</h4>
            <p className="text-sm text-muted-foreground">{t("security.whatWeCanVerify")}</p>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {customer?.email_verified ? <Check className="size-4 text-success" /> : <ShieldAlert className="size-4 text-amber-600" />}
              <span>{customer?.email_verified ? t("security.emailVerified") : t("security.emailNotVerified")}</span>
            </div>
            <div className="flex items-center gap-2">
              {customer?.phone_verified ? <Check className="size-4 text-success" /> : <ShieldAlert className="size-4 text-amber-600" />}
              <span>{customer?.phone_verified ? t("security.phoneVerified") : t("security.phoneNotVerified")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Laptop className="size-4 text-primary" />
              <span>{t("security.activeSessionCount", { count: activeSessions.length })}</span>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            {t("security.twoFactorFooter")}
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
  { key: "MARKETING", labelKey: "consentMarketing" },
  { key: "ANALYTICS", labelKey: "consentAnalytics" },
  { key: "COMMUNICATION", labelKey: "consentCommunication" },
  { key: "PERSONALIZATION", labelKey: "consentPersonalization" },
  { key: "THIRD_PARTY", labelKey: "consentThirdParty" },
] as const;

const SHARING_KINDS = [
  { key: "DATA_SHARE_PARTNERS", labelKey: "sharingPartners" },
  { key: "DATA_SHARE_ANALYTICS", labelKey: "sharingAnalytics" },
  { key: "DATA_SHARE_SUPPORT", labelKey: "sharingSupport" },
  { key: "DATA_SHARE_MARKETING", labelKey: "sharingMarketing" },
  { key: "DATA_SHARE_RESEARCH", labelKey: "sharingResearch" },
] as const;
const SHARING_DEFAULTS: Record<string, boolean> = Object.fromEntries(SHARING_KINDS.map((k) => [k.key, false]));

function PrivacyTab() {
  const { t } = useTranslation("profile");
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
    if (!ok) toast.error(t("privacy.couldntSaveVisibility"));
  }

  async function requestExport() {
    setRequesting(true);
    try {
      await fixoSdk.requestDataExport();
      toast.success(t("privacy.exportRequested"));
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
  const sharingLabel = sharingOnCount === 0 ? t("privacy.sharingNone") : sharingOnCount === SHARING_KINDS.length ? t("privacy.sharingOpen") : t("privacy.sharingLimited");
  const cookiesLabel = cookiePrefs?.["COOKIES_ANALYTICS"] ? t("privacy.allCookies") : t("privacy.essentialOnly");
  const visibilityLabel = visibility === "Only me" ? t("privacy.onlyMe") : t("privacy.everyone");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label={t("privacy.dataSharing")} hint={t("privacy.enabledOfTotal", { count: sharingOnCount, total: SHARING_KINDS.length })} value={sharingLabel} />
        <MetricCard icon={Eye} label={t("privacy.visibilityLevel")} hint={t("privacy.onlyYou")} value={visibility === "Only me" ? t("privacy.private") : t("privacy.everyone")} tone="success" tintValue />
        <MetricCard icon={ShieldCheck} label={t("privacy.consentStatus")} hint={t("privacy.consentsGiven", { count: consentOnCount, total: CONSENT_KINDS.length })} value={consentOnCount === CONSENT_KINDS.length ? t("privacy.allSet") : t("privacy.partial")} />
        <MetricCard icon={CloudDownload} label={t("privacy.exportRequests")} hint={exports && exports.length > 0 ? t("privacy.requested") : t("privacy.noRequestsYet")} value={exports ? String(exports.length) : "—"} tone="amber" tintValue />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold">{t("privacy.privacySettings")}</h3>
          <div className="mt-2">
            <Field
              icon={Eye}
              label={t("privacy.profileVisibility")}
              value={t("privacy.chooseWhoCanSee")}
              action={
                <Select value={visibility} onValueChange={(v) => void changeVisibility(v)}>
                  <SelectTrigger className="w-[140px]"><SelectValue>{visibilityLabel}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Only me">{t("privacy.onlyMe")}</SelectItem>
                    <SelectItem value="Everyone">{t("privacy.everyone")}</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
            <ToggleRow
              label={t("privacy.marketingAndCommunication")}
              hint={t("privacy.marketingHint")}
              on={marketingConsent}
              onToggle={() => void toggleConsent("MARKETING", marketingConsent)}
            />
            <Field
              icon={Share2}
              label={t("privacy.dataSharingPermissions")}
              value={t("privacy.manageDataSharingHint")}
              action={<Button size="sm" variant="outline" onClick={() => setShowSharing((v) => !v)} className="gap-1">{t("privacy.manageConsent")} <ChevronRight className="size-3.5" /></Button>}
            />
            {showSharing && (
              <div className="mb-2 space-y-1 rounded-2xl border border-border p-2 animate-in fade-in slide-in-from-top-1">
                {SHARING_KINDS.map((k) => (
                  <ToggleRow key={k.key} label={t(`privacy.${k.labelKey}`)} on={sharing?.[k.key] ?? false} onToggle={() => void toggleSharing(k.key)} />
                ))}
              </div>
            )}
            <Field
              icon={Cookie}
              label={t("privacy.cookiesAndDevice")}
              value={t("privacy.manageCookiesHint")}
              action={<Button size="sm" variant="outline" onClick={() => setShowCookies((v) => !v)} className="gap-1">{t("privacy.managePreferences")} <ChevronRight className="size-3.5" /></Button>}
            />
            {showCookies && (
              <div className="mb-2 rounded-2xl border border-border p-2 animate-in fade-in slide-in-from-top-1">
                <ToggleRow label={t("privacy.allowAnalyticsCookies")} hint={t("privacy.essentialCookiesHint")} on={cookiePrefs?.["COOKIES_ANALYTICS"] ?? false} onToggle={() => void toggleCookie("COOKIES_ANALYTICS")} />
              </div>
            )}
            <Field
              icon={Download}
              label={t("privacy.accountDataRequests")}
              value={t("privacy.downloadOrDeleteHint")}
              action={<Button size="sm" variant="outline" disabled={requesting} onClick={() => void requestExport()} className="gap-1">{requesting ? t("privacy.requesting") : t("privacy.downloadMyData")} <ChevronRight className="size-3.5" /></Button>}
            />
          </div>
          {exports && exports.length > 0 && (
            <div className="mt-2 border-t border-border pt-3">
              <p className="mb-2 text-sm font-semibold">{t("privacy.exportHistory")}</p>
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

        <SummaryCard title={t("privacy.privacySummary")}>
          <div className="flex flex-col items-center text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-7" />
            </span>
            <h4 className="mt-3 font-semibold">{t("privacy.inControl")}</h4>
            <p className="text-sm text-muted-foreground">{t("privacy.manageWhatYouShare")}</p>
          </div>
          <div className="mt-4 space-y-1 border-t border-border pt-3">
            <SummaryRow icon={Eye} label={t("privacy.profileVisibility")} value={visibilityLabel} valueClass="text-success" />
            <SummaryRow icon={Mail} label={t("privacy.marketingConsent")} value={marketingConsent ? t("notifications.on") : t("notifications.off")} valueClass={marketingConsent ? "text-success" : "text-muted-foreground"} />
            <SummaryRow icon={Share2} label={t("privacy.dataSharingLabel")} value={sharingLabel} />
            <SummaryRow icon={Cookie} label={t("privacy.cookiesAndTracking")} value={cookiesLabel} />
            <SummaryRow icon={CloudDownload} label={t("privacy.dataRequests")} value={t("privacy.requestCount", { count: exports?.length ?? 0 })} />
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {t("privacy.footer")}
          </div>
        </SummaryCard>
      </div>
    </div>
  );
}
