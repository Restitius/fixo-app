// Profile & Settings — real account data: addresses, payment methods,
// notification preferences, security and privacy.
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import {
  bookingApi,
  fixoSdk,
  type Address,
  type Consent,
  type DataExport,
  type PaymentMethod,
} from "@/lib/api-client";
import { fmtDateTime, humanize } from "@/lib/format";
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

const NOTIFY_PREFS = [
  { key: "NOTIFY_BOOKING_UPDATES", label: "Booking confirmations & updates" },
  { key: "NOTIFY_PROVIDER_MESSAGES", label: "Provider messages" },
  { key: "NOTIFY_PROMOTIONS", label: "Promotions and offers" },
  { key: "NOTIFY_PAYMENT_REMINDERS", label: "Payment reminders" },
] as const;

const CONSENT_KINDS = [
  { key: "MARKETING", label: "Marketing communications" },
  { key: "ANALYTICS", label: "Product analytics" },
  { key: "COMMUNICATION", label: "Service communications" },
] as const;

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
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
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

        <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
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

function Field({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl bg-secondary/50 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function PersonalTab() {
  const { customer } = useAuth();
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <h3 className="text-lg font-semibold">Personal Information</h3>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full Name" value={customer?.full_name ?? "—"} icon={User} />
        <Field label="Email" value={customer?.email ?? "—"} icon={Mail} />
        <Field label="Phone" value={customer?.phone ?? "Not set"} icon={Phone} />
        <Field label="Preferred Language" value={customer?.preferred_language ?? "English"} icon={User} />
      </div>
    </div>
  );
}

function AddressesTab() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    label: "Home",
    recipient_name: "",
    phone: "",
    street_address: "",
    city: "",
    region: "",
  });

  const load = useCallback(() => {
    void bookingApi.listAddresses().then(setAddresses);
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Saved Addresses</h3>
        <Button size="sm" onClick={() => setShowForm((v) => !v)} className="gap-2">
          <Plus className="size-4" /> Add Address
        </Button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-2xl border border-border p-4 animate-in fade-in slide-in-from-top-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Recipient name</Label>
              <Input
                value={draft.recipient_name}
                onChange={(e) => setDraft((d) => ({ ...d, recipient_name: e.target.value }))}
              />
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
              <Input
                value={draft.street_address}
                onChange={(e) => setDraft((d) => ({ ...d, street_address: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Region (optional)</Label>
              <Input value={draft.region} onChange={(e) => setDraft((d) => ({ ...d, region: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? "Saving..." : "Save address"}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {addresses === null ? (
        <LoadingRows />
      ) : addresses.length === 0 && !showForm ? (
        <EmptyState
          icon={MapPin}
          title="No addresses yet"
          description="Add an address to speed up your next booking."
          actionLabel="Add Address"
          onAction={() => setShowForm(true)}
          compact
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr, i) => (
            <div
              key={addr.address_id}
              style={{ animationDelay: `${i * 40}ms` }}
              className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-2xl border border-border p-4 transition-colors hover:border-primary/30"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{addr.label}</span>
                {addr.is_default ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    <Check className="size-3" />
                    Default
                  </span>
                ) : (
                  <button onClick={() => void makeDefault(addr.address_id)} className="text-xs font-semibold text-primary hover:underline">
                    Set default
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{addr.street_address}</p>
              <p className="text-sm text-muted-foreground">
                {addr.city}
                {addr.region ? `, ${addr.region}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{addr.recipient_name} · {addr.phone}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentsTab({ onManage }: { onManage: () => void }) {
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);

  useEffect(() => {
    void fixoSdk.listPaymentMethods().then(setMethods);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Payment Methods</h3>
        <Button size="sm" onClick={onManage} className="gap-2">
          <CreditCard className="size-4" /> Manage in Payments
        </Button>
      </div>

      {methods === null ? (
        <LoadingRows />
      ) : methods.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payment methods yet"
          description="Add a card, mobile money or bank account from the Payments page."
          actionLabel="Add Payment Method"
          onAction={onManage}
          compact
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {methods.map((m, i) => (
            <div
              key={m.method_id}
              style={{ animationDelay: `${i * 40}ms` }}
              className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-2xl border border-border p-4 transition-colors hover:border-primary/30"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {m.provider || humanize(m.type)} •••• {(m.details_masked?.["last4"] as string) ?? "••••"}
                </span>
                {m.is_default && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Default</span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{humanize(m.type)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationsTab() {
  const [values, setValues] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    void fixoSdk.listPreferences().then((prefs) => {
      const map: Record<string, boolean> = {};
      for (const p of NOTIFY_PREFS) {
        const found = prefs.find((pr) => pr.key === p.key);
        map[p.key] = found ? found.value === "true" : true;
      }
      setValues(map);
    });
  }, []);

  async function toggle(key: string) {
    const next = !(values?.[key] ?? true);
    setValues((prev) => ({ ...(prev ?? {}), [key]: next }));
    try {
      await fixoSdk.setPreference(key, String(next));
    } catch {
      setValues((prev) => ({ ...(prev ?? {}), [key]: !next }));
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <h3 className="text-lg font-semibold">Notification Preferences</h3>
      {values === null ? (
        <LoadingRows />
      ) : (
        <div className="space-y-4">
          {NOTIFY_PREFS.map((p) => (
            <ToggleRow key={p.key} label={p.label} on={values[p.key] ?? true} onToggle={() => void toggle(p.key)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SecurityTab() {
  const { logout } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState(false);

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
    } catch {
      // toast emitted by client
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <h3 className="text-lg font-semibold">Security Settings</h3>
      <div className="space-y-4">
        <div className="rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 font-medium">
            <KeyRound className="size-4" /> Change password
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Current password</Label>
              <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
            </div>
          </div>
          <Button className="mt-3" disabled={busy} onClick={() => void changePassword()}>
            {busy ? "Updating..." : "Update password"}
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border p-4">
          <div>
            <p className="flex items-center gap-2 font-medium">
              <LogOutIcon className="size-4" /> Active sessions
            </p>
            <p className="text-sm text-muted-foreground">Sign out everywhere except this device.</p>
          </div>
          <Button variant="outline" disabled={revoking} onClick={() => void revoke()}>
            {revoking ? "Revoking..." : "Revoke others"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PrivacyTab() {
  const [consents, setConsents] = useState<Consent[] | null>(null);
  const [exports, setExports] = useState<DataExport[] | null>(null);
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(() => {
    void fixoSdk.listConsents().then(setConsents);
    void fixoSdk.listDataExports().then(setExports);
  }, []);

  useEffect(() => load(), [load]);

  async function toggle(kind: string, current: boolean) {
    setConsents((prev) => prev?.map((c) => (c.kind === kind ? { ...c, consented: !current } : c)) ?? null);
    try {
      await fixoSdk.setConsent(kind, !current);
    } catch {
      setConsents((prev) => prev?.map((c) => (c.kind === kind ? { ...c, consented: current } : c)) ?? null);
    }
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <h3 className="text-lg font-semibold">Privacy</h3>

      {consents === null ? (
        <LoadingRows />
      ) : (
        <div className="space-y-4">
          {CONSENT_KINDS.map((c) => {
            const found = consents.find((x) => x.kind === c.key);
            const on = found?.consented ?? false;
            return <ToggleRow key={c.key} label={c.label} on={on} onToggle={() => void toggle(c.key, on)} />;
          })}
        </div>
      )}

      <div className="rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-2 font-medium">
              <Download className="size-4" /> Export your data
            </p>
            <p className="text-sm text-muted-foreground">Request a copy of your account data.</p>
          </div>
          <Button variant="outline" disabled={requesting} onClick={() => void requestExport()}>
            {requesting ? "Requesting..." : "Request export"}
          </Button>
        </div>
        {exports && exports.length > 0 && (
          <ul className="mt-3 space-y-2 border-t border-border pt-3">
            {exports.map((e) => (
              <li key={e.request_id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{fmtDateTime(e.requested_at)}</span>
                <span className="font-medium">{humanize(e.status)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ToggleRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border p-4">
      <span className="font-medium">{label}</span>
      <button
        onClick={onToggle}
        className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`absolute top-1 size-4 rounded-full bg-primary-foreground transition-transform ${
            on ? "left-6" : "left-1"
          }`}
        />
      </button>
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
