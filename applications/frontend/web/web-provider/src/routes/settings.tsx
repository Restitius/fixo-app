// Settings — wired to the real backend for preferences, security and privacy.
// Real model (settings_router.py, prefix /providers/me/settings):
// arbitrary key/value preferences, change-password + revoke-all-sessions,
// three consent kinds (MARKETING/ANALYTICS/COMMUNICATION), data export
// requests (async — creates a request, no synchronous download), and
// account closure (schedules it, does not delete immediately).
// Dropped from the old mock: two-factor authentication toggle and the
// "active session — Chrome, Dar es Salaam" row (no per-session listing
// exists, only revoke-all) — replaced with a real "revoke all other
// sessions" action. Subscription plan panel stays mocked; the
// subscriptions domain is out of this project's scope.
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Crown, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { fmtMoney, fmtDate } from "@/lib/format";
import { plans } from "@/lib/mock-data";
import { useProviderAuth } from "@/lib/provider-auth";
import {
  settingsApi,
  type ProviderConsent,
  type ProviderExportRequest,
} from "@/lib/api-client";

const title = "Settings — FIXO Provider";
const description = "Account preferences, security, subscription plan and data privacy.";

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

const inputCls = "h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30";

const CONSENT_LABELS: Record<ProviderConsent["kind"], string> = {
  MARKETING: "Allow marketing emails",
  ANALYTICS: "Share usage analytics",
  COMMUNICATION: "Product & service updates",
};

function SettingsPage() {
  const { logout } = useProviderAuth();
  const [confirmClose, setConfirmClose] = useState("");
  const [prefs, setPrefs] = useState<{ language: string; currency: string; timezone: string; distance_unit: string }>({
    language: "English",
    currency: "TZS",
    timezone: "Africa/Dar_es_Salaam",
    distance_unit: "km",
  });
  const [consents, setConsents] = useState<Record<ProviderConsent["kind"], boolean>>({
    MARKETING: false,
    ANALYTICS: false,
    COMMUNICATION: false,
  });
  const [exports, setExports] = useState<ProviderExportRequest[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    Promise.all([settingsApi.listPreferences(), settingsApi.listConsents(), settingsApi.listExports()])
      .then(([p, c, e]) => {
        if (p.length) {
          setPrefs((prev) => {
            const next: Record<string, string> = { ...prev };
            for (const item of p) next[item.key] = item.value;
            return next as typeof prev;
          });
        }
        setConsents((prev) => {
          const next = { ...prev };
          for (const item of c) next[item.kind] = item.consented;
          return next;
        });
        setExports(e);
      })
      .catch(() => {});
  }, []);

  async function savePreferences() {
    setSavingPrefs(true);
    try {
      await Promise.all(Object.entries(prefs).map(([key, value]) => settingsApi.setPreference(key, value)));
      toast.success("Preferences saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  }

  async function changePassword() {
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    setChangingPassword(true);
    try {
      await settingsApi.changePassword(currentPassword, newPassword);
      toast.success("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function revokeSessions() {
    try {
      await settingsApi.revokeSessions();
      toast.success("All other sessions signed out.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not revoke sessions.");
    }
  }

  async function toggleConsent(kind: ProviderConsent["kind"]) {
    const next = !consents[kind];
    setConsents((prev) => ({ ...prev, [kind]: next }));
    try {
      await settingsApi.setConsent(kind, next);
    } catch (err) {
      setConsents((prev) => ({ ...prev, [kind]: !next }));
      toast.error(err instanceof Error ? err.message : "Could not update preference.");
    }
  }

  async function requestExport() {
    try {
      const req = await settingsApi.requestExport();
      setExports((prev) => [req, ...prev]);
      toast.success("Data export requested.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not request data export.");
    }
  }

  async function closeAccount() {
    setClosing(true);
    try {
      await settingsApi.scheduleClosure();
      toast.success("Account closure scheduled.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not schedule account closure.");
    } finally {
      setClosing(false);
    }
  }

  return (
    <ProviderPage title="Settings" subtitle="Account, security, subscription and privacy.">
      <div className="mt-6 grid gap-4 pb-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Panel title="Preferences">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Language</span>
                <select className={inputCls} value={prefs.language} onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}>
                  <option>English</option>
                  <option>Swahili</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Currency</span>
                <select className={inputCls} value={prefs.currency} onChange={(e) => setPrefs((p) => ({ ...p, currency: e.target.value }))}>
                  <option value="TZS">TZS — Tanzanian Shilling</option>
                  <option value="USD">USD — US Dollar</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Time zone</span>
                <select className={inputCls} value={prefs.timezone} onChange={(e) => setPrefs((p) => ({ ...p, timezone: e.target.value }))}>
                  <option value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam (EAT)</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Distance unit</span>
                <select className={inputCls} value={prefs.distance_unit} onChange={(e) => setPrefs((p) => ({ ...p, distance_unit: e.target.value }))}>
                  <option value="km">Kilometres</option>
                  <option value="mi">Miles</option>
                </select>
              </label>
            </div>
            <button
              onClick={savePreferences}
              disabled={savingPrefs}
              className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              {savingPrefs ? "Saving…" : "Save preferences"}
            </button>
          </Panel>

          <Panel title="Security">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">Current password</span>
                <input type="password" className={inputCls} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">New password</span>
                <input type="password" className={inputCls} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </label>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm">
              <span className="flex items-center gap-2">
                <ShieldOff className="size-4 text-primary" /> Sign out every other device
              </span>
              <button onClick={revokeSessions} className="text-xs font-semibold text-primary hover:underline">
                Revoke all
              </button>
            </div>
            <button
              onClick={changePassword}
              disabled={changingPassword || !currentPassword || !newPassword}
              className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              {changingPassword ? "Updating…" : "Update password"}
            </button>
          </Panel>

          <Panel title="Subscription plan">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {plans.map((p) => (
                <div key={p.name} className={`rounded-2xl p-4 ${p.current ? "bg-primary/5 ring-2 ring-primary/30" : "bg-muted/50"}`}>
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
              {(Object.keys(CONSENT_LABELS) as ProviderConsent["kind"][]).map((kind) => (
                <label key={kind} className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3">
                  {CONSENT_LABELS[kind]}
                  <input type="checkbox" checked={consents[kind]} onChange={() => toggleConsent(kind)} className="size-4 accent-[var(--primary)]" />
                </label>
              ))}
            </div>
            <button
              onClick={requestExport}
              className="mt-3 w-full rounded-xl border border-border bg-card py-2.5 text-sm font-semibold hover:bg-muted"
            >
              Request my data export
            </button>
            {exports.length > 0 && (
              <div className="mt-3 space-y-2">
                {exports.slice(0, 3).map((e) => (
                  <div key={e.request_id} className="flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2 text-xs">
                    <span className="text-muted-foreground">{fmtDate(e.requested_at)}</span>
                    <StatusPill status={e.status} />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Sign out">
            <button onClick={logout} className="w-full rounded-xl border border-border bg-card py-2.5 text-sm font-semibold hover:bg-muted">
              Sign out of this device
            </button>
          </Panel>

          <Panel title="Close account">
            <div className="flex items-start gap-3 rounded-2xl bg-destructive/10 p-4 text-destructive">
              <AlertTriangle className="size-5 shrink-0" />
              <p className="text-xs">Closing your account schedules its permanent closure. This cannot be undone once processed.</p>
            </div>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs text-muted-foreground">Type CLOSE to confirm</span>
              <input value={confirmClose} onChange={(e) => setConfirmClose(e.target.value)} className={inputCls} />
            </label>
            <button
              onClick={closeAccount}
              disabled={confirmClose !== "CLOSE" || closing}
              className="mt-3 w-full rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground disabled:opacity-40"
            >
              {closing ? "Scheduling…" : "Close my account"}
            </button>
          </Panel>
        </div>
      </div>
    </ProviderPage>
  );
}
