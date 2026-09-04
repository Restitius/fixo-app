import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Building2, ShieldCheck, User } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { business, documents, provider, providerFullName } from "@/lib/mock-data";

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

const inputCls =
  "h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30";

function Field({ label, value, type = "text" }: { label: string; value: string | number; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <input type={type} defaultValue={String(value)} className={inputCls} />
    </label>
  );
}

function ProfilePage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("personal");

  return (
    <ProviderPage title="Profile" subtitle="Keep your identity, business and credentials up to date.">
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
        <span
          className="flex size-16 items-center justify-center rounded-2xl text-xl font-bold text-primary-foreground shadow-[var(--shadow-glow)]"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          {provider.firstName[0]}
          {provider.lastName[0]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">{providerFullName}</h2>
            <StatusPill status={provider.verification} />
            <StatusPill tone="primary" label={provider.level} />
          </div>
          <p className="text-sm text-muted-foreground">
            {provider.title} · {provider.city}, {provider.region} · {provider.rating}★ ({provider.reviewCount})
          </p>
        </div>
        <button className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted">
          Change photo
        </button>
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
              <Field label="First name" value={provider.firstName} />
              <Field label="Middle name" value={provider.middleName} />
              <Field label="Last name" value={provider.lastName} />
              <Field label="Email" value={provider.email} />
              <Field label="Phone" value={provider.phone} />
              <Field label="Country" value={provider.country} />
              <Field label="Region" value={provider.region} />
              <Field label="City / District" value={provider.city} />
              <Field label="Professional title" value={provider.title} />
              <Field label="Years of experience" value={provider.yearsExperience} type="number" />
            </div>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs text-muted-foreground">Bio</span>
              <textarea
                defaultValue={provider.bio}
                rows={4}
                className="w-full rounded-xl border border-input bg-card p-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </label>
            <p className="mt-2 text-xs text-muted-foreground">Languages: {provider.languages.join(", ")}</p>
            <button
              className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Save changes
            </button>
          </Panel>
        )}

        {tab === "business" && (
          <Panel title="Business profile">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business name" value={business.name} />
              <Field label="Registration number" value={business.registrationNumber} />
              <Field label="Tax (TIN) number" value={business.taxNumber} />
              <Field label="Business email" value={business.email} />
              <Field label="Business phone" value={business.phone} />
              <Field label="Website" value={business.website} />
              <Field label="Year established" value={business.established} type="number" />
              <Field label="Employees" value={business.employees} type="number" />
              <Field label="Instagram" value={business.socials.instagram} />
              <Field label="Facebook" value={business.socials.facebook} />
            </div>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs text-muted-foreground">Address</span>
              <input defaultValue={business.address} className={inputCls} />
            </label>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs text-muted-foreground">Description</span>
              <textarea
                defaultValue={business.description}
                rows={3}
                className="w-full rounded-xl border border-input bg-card p-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </label>
            <button
              className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Save business profile
            </button>
          </Panel>
        )}

        {tab === "identity" && (
          <Panel title="Identity verification">
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-primary/5 p-4">
              <BadgeCheck className="size-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Your identity is <strong className="text-foreground">verified</strong>. Verified providers rank higher and
                unlock high-value jobs.
              </p>
            </div>
            <div className="space-y-3">
              {documents.slice(0, 4).map((d) => (
                <div key={d.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-muted/50 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{d.type}</p>
                    <p className="text-xs text-muted-foreground">{d.number}</p>
                  </div>
                  <StatusPill status={d.status} />
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {["ID front", "ID back", "Selfie with ID"].map((s) => (
                <div key={s} className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  {s}
                  <p className="mt-1 text-xs">Uploaded</p>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </ProviderPage>
  );
}
