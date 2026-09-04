import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Crown, Lock, Smartphone } from "lucide-react";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fmtMoney } from "@/lib/format";
import { plans, provider } from "@/lib/mock-data";
import { useProviderAuth } from "@/lib/provider-auth";

const title = "Settings — FIXO Provider";
const description = "Account preferences, security, subscription plan, data privacy and account closure.";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SettingsPage,
});

const inputCls =
  "h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30";

function SettingsPage() {
  const { logout } = useProviderAuth();
  const [confirm, setConfirm] = useState("");

  return (
    <ProviderPage title="Settings" subtitle="Account, security, subscription and privacy.">
      <div className="mt-6 grid gap-4 pb-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Panel title="Preferences">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Language</span>
                <select defaultValue={provider.language} className={inputCls}>
                  <option>English</option>
                  <option>Swahili</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Currency</span>
                <select className={inputCls}>
                  <option>TZS — Tanzanian Shilling</option>
                  <option>USD — US Dollar</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Time zone</span>
                <select className={inputCls}>
                  <option>Africa/Dar_es_Salaam (EAT)</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Distance unit</span>
                <select className={inputCls}>
                  <option>Kilometres</option>
                  <option>Miles</option>
                </select>
              </label>
            </div>
          </Panel>

          <Panel title="Security">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Current password</span>
                <input type="password" className={inputCls} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">New password</span>
                <input type="password" className={inputCls} />
              </label>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <label className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="flex items-center gap-2">
                  <Lock className="size-4 text-primary" /> Two-factor authentication (SMS)
                </span>
                <input type="checkbox" defaultChecked className="size-4 accent-[var(--primary)]" />
              </label>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="flex items-center gap-2">
                  <Smartphone className="size-4 text-primary" /> Active session — Chrome, Dar es Salaam
                </span>
                <StatusPill tone="success" label="This device" />
              </div>
            </div>
            <button
              className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Update security
            </button>
          </Panel>

          <Panel title="Subscription plan">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {plans.map((p) => (
                <div
                  key={p.name}
                  className={`rounded-2xl p-4 ${p.current ? "bg-primary/5 ring-2 ring-primary/30" : "bg-muted/50"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{p.name}</p>
                    {p.current && <Crown className="size-4 text-primary" />}
                  </div>
                  <p className="mt-1 text-lg font-bold">{p.price === 0 ? "Free" : fmtMoney(p.price)}</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <li>{p.categories} categories</li>
                    <li>{p.radius} radius</li>
                    <li>{p.employees} team seats</li>
                    <li>{p.commission} commission</li>
                  </ul>
                  <button
                    disabled={p.current}
                    className={`mt-3 w-full rounded-xl py-2 text-xs font-semibold ${
                      p.current ? "bg-muted text-muted-foreground" : "border border-border bg-card hover:bg-muted"
                    }`}
                  >
                    {p.current ? "Current plan" : "Switch"}
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Privacy & data">
            <div className="space-y-3 text-sm">
              {["Show my profile in search", "Share my location while on a job", "Allow marketing emails"].map((s, i) => (
                <label key={s} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                  {s} <input type="checkbox" defaultChecked={i < 2} className="size-4 accent-[var(--primary)]" />
                </label>
              ))}
            </div>
            <button className="mt-3 w-full rounded-xl border border-border bg-card py-2.5 text-sm font-semibold hover:bg-muted">
              Download my data
            </button>
          </Panel>

          <Panel title="Sign out">
            <button
              onClick={logout}
              className="w-full rounded-xl border border-border bg-card py-2.5 text-sm font-semibold hover:bg-muted"
            >
              Sign out of this device
            </button>
          </Panel>

          <Panel title="Close account">
            <div className="flex items-start gap-3 rounded-2xl bg-destructive/10 p-4 text-destructive">
              <AlertTriangle className="size-5 shrink-0" />
              <p className="text-xs">
                Closing your account cancels upcoming bookings, withdraws your remaining balance and permanently removes
                your public profile. Open disputes must be settled first.
              </p>
            </div>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs text-muted-foreground">Type CLOSE to confirm</span>
              <input value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
            </label>
            <button
              disabled={confirm !== "CLOSE"}
              className="mt-3 w-full rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground disabled:opacity-40"
            >
              Close my account
            </button>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}
