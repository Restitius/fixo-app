// Profile — wired to the real backend across profile/business/verification.
// Real gap confirmed this session: /providers/profile (ProfileUpdateRequest)
// has no first_name/last_name/email/phone/country/region/city fields — those
// live on the account record set at registration, with no provider-facing
// update endpoint. Shown read-only from the session instead of pretending
// they're editable here (the old mock let you "save" fields nothing real
// would ever receive).
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Building2, Loader2, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { useProviderAuth } from "@/lib/provider-auth";
import {
  onboardingApi,
  type ProviderBusinessProfile,
  type ProviderProfile,
  type VerificationDocType,
  type VerificationDocument,
  type VerificationStatus,
} from "@/lib/api-client";

const title = "Profile — FIXO Provider";
const description = "Personal details, business profile and identity verification status for your FIXO provider account.";

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

const tabs = [
  { key: "personal", label: "Personal", icon: User },
  { key: "business", label: "Business", icon: Building2 },
  { key: "identity", label: "Identity", icon: ShieldCheck },
] as const;

const inputCls = "h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30";

function ProfilePage() {
  const { session } = useProviderAuth();
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("personal");
  const [profile, setProfile] = useState<Partial<ProviderProfile>>({});
  const [business, setBusiness] = useState<Partial<ProviderBusinessProfile>>({});
  const [docTypes, setDocTypes] = useState<VerificationDocType[]>([]);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      onboardingApi.getProfile(),
      onboardingApi.getBusiness().catch(() => null),
      onboardingApi.docTypes(),
      onboardingApi.documents(),
      onboardingApi.verificationStatus().catch(() => null),
    ])
      .then(([p, b, dt, docs, v]) => {
        setProfile(p);
        if (b) setBusiness(b);
        setDocTypes(dt);
        setDocuments(docs);
        setVerification(v);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not load your profile."))
      .finally(() => setLoading(false));
  }, []);

  async function savePersonal() {
    setSaving(true);
    try {
      const updated = await onboardingApi.updateProfile(profile);
      setProfile(updated);
      toast.success("Profile saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function saveBusiness() {
    if (!business.business_name) {
      toast.error("Business name is required.");
      return;
    }
    setSaving(true);
    try {
      const updated = await onboardingApi.upsertBusiness({ ...business, business_name: business.business_name });
      setBusiness(updated);
      toast.success("Business profile saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save business profile.");
    } finally {
      setSaving(false);
    }
  }

  const initials = `${session?.first_name?.[0] ?? ""}${session?.last_name?.[0] ?? ""}`.toUpperCase() || "P";

  if (loading) {
    return (
      <ProviderPage title="Profile" subtitle="Keep your identity, business and credentials up to date.">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </ProviderPage>
    );
  }

  return (
    <ProviderPage title="Profile" subtitle="Keep your identity, business and credentials up to date.">
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
        <span
          className="flex size-16 items-center justify-center rounded-2xl text-xl font-bold text-primary-foreground shadow-[var(--shadow-glow)]"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">
              {session?.first_name} {session?.last_name}
            </h2>
            {verification && <StatusPill status={verification.status} />}
          </div>
          <p className="text-sm text-muted-foreground">
            {profile.professional_title ?? "—"} {session?.email ? `· ${session.email}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.key ? "text-primary-foreground" : "bg-card hover:bg-muted"
            }`}
            style={tab === t.key ? { backgroundImage: "var(--gradient-primary)" } : undefined}
          >
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 pb-6">
        {tab === "personal" && (
          <Panel title="Personal information">
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="First name" value={session?.first_name ?? "—"} />
              <ReadOnlyField label="Last name" value={session?.last_name ?? "—"} />
              <ReadOnlyField label="Email" value={session?.email ?? "—"} />
              <ReadOnlyField label="Phone" value={session?.phone ?? "—"} />
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Professional title</span>
                <input
                  className={inputCls}
                  value={profile.professional_title ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, professional_title: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Years of experience</span>
                <input
                  type="number"
                  className={inputCls}
                  value={profile.years_experience ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p, years_experience: Number(e.target.value) }))}
                />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs text-muted-foreground">Bio</span>
              <textarea
                value={profile.bio ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                rows={4}
                className="w-full rounded-xl border border-input bg-card p-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs text-muted-foreground">Languages (comma separated)</span>
              <input
                className={inputCls}
                value={profile.languages ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p, languages: e.target.value }))}
              />
            </label>
            <button
              onClick={savePersonal}
              disabled={saving}
              className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </Panel>
        )}

        {tab === "business" && (
          <Panel title="Business profile">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Business name" value={business.business_name} onChange={(v) => setBusiness((b) => ({ ...b, business_name: v }))} />
              <TextField label="Registration number" value={business.registration_number} onChange={(v) => setBusiness((b) => ({ ...b, registration_number: v }))} />
              <TextField label="Tax (TIN) number" value={business.tax_number} onChange={(v) => setBusiness((b) => ({ ...b, tax_number: v }))} />
              <TextField label="Business email" value={business.business_email} onChange={(v) => setBusiness((b) => ({ ...b, business_email: v }))} />
              <TextField label="Business phone" value={business.business_phone} onChange={(v) => setBusiness((b) => ({ ...b, business_phone: v }))} />
              <TextField label="Website" value={business.website} onChange={(v) => setBusiness((b) => ({ ...b, website: v }))} />
              <TextField
                label="Year established"
                type="number"
                value={business.year_established?.toString()}
                onChange={(v) => setBusiness((b) => ({ ...b, year_established: Number(v) }))}
              />
              <TextField
                label="Employees"
                type="number"
                value={business.num_employees?.toString()}
                onChange={(v) => setBusiness((b) => ({ ...b, num_employees: Number(v) }))}
              />
            </div>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs text-muted-foreground">Address</span>
              <input className={inputCls} value={business.address ?? ""} onChange={(e) => setBusiness((b) => ({ ...b, address: e.target.value }))} />
            </label>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs text-muted-foreground">Description</span>
              <textarea
                value={business.description ?? ""}
                onChange={(e) => setBusiness((b) => ({ ...b, description: e.target.value }))}
                rows={3}
                className="w-full rounded-xl border border-input bg-card p-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </label>
            <button
              onClick={saveBusiness}
              disabled={saving}
              className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              {saving ? "Saving…" : "Save business profile"}
            </button>
          </Panel>
        )}

        {tab === "identity" && (
          <Panel title="Identity verification">
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-primary/5 p-4">
              <BadgeCheck className="size-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Status: <strong className="text-foreground">{verification?.status ?? "NOT_SUBMITTED"}</strong>
                {verification && verification.required_missing.length > 0 && ` — missing: ${verification.required_missing.join(", ")}`}
              </p>
            </div>
            <div className="space-y-3">
              {documents.length === 0 && <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>}
              {documents.map((d) => (
                <div key={d.doc_id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/50 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{docTypes.find((t) => t.code === d.doc_type)?.label ?? d.doc_type}</p>
                    <p className="text-xs text-muted-foreground">{d.doc_number ?? "—"}</p>
                  </div>
                  <StatusPill status={d.status} />
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </ProviderPage>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <div className="h-11 w-full rounded-xl border border-input bg-muted/40 px-3.5 text-sm leading-[2.75rem] text-muted-foreground">{value}</div>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value?: string | null | undefined;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </label>
  );
}
