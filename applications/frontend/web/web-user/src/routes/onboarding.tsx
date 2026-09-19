// Customer Onboarding (Module 03) — a one-time checklist shown after
// registration: verify contact, set a location, optionally add a property.
// Gated centrally from routes/__root.tsx's OnboardingGate.
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle, PartyPopper } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bookingApi, onboardingApi, propertiesApi, type OnboardingStatus } from "@/lib/api-client";

const title = "Get Started — FIXO";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { t } = useTranslation("onboarding");
  const { access_token, loading, customer } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [busyStep, setBusyStep] = useState<string | null>(null);

  const load = useCallback(() => {
    void onboardingApi.status().then(setStatus).catch(() => setStatus(null));
  }, []);

  useEffect(() => load(), [load]);

  // Auto-complete VERIFY_CONTACT once the account already shows a verified channel.
  useEffect(() => {
    if (!status) return;
    const step = status.steps.find((s) => s.code === "VERIFY_CONTACT");
    if (step && !step.completed && (customer?.email_verified || customer?.phone_verified)) {
      void onboardingApi.completeStep("VERIFY_CONTACT").then(setStatus).catch(() => {});
    }
  }, [status, customer?.email_verified, customer?.phone_verified]);

  async function completeStep(code: string) {
    setBusyStep(code);
    try {
      const next = await onboardingApi.completeStep(code);
      setStatus(next);
    } finally {
      setBusyStep(null);
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center">{t("loading")}</div>;
  if (!access_token) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          {status && (
            <p className="mt-3 text-xs font-medium text-primary">
              {t("progress", { done: status.progress.split("/")[0], total: status.progress.split("/")[1] })}
            </p>
          )}
        </div>

        {!status ? (
          <div className="h-40 animate-pulse rounded-3xl bg-muted/60" />
        ) : status.completed ? (
          <div className="space-y-6 rounded-3xl bg-card p-8 text-center shadow-[var(--shadow-card)]">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <PartyPopper className="size-8" />
            </span>
            <div>
              <h2 className="text-lg font-bold">{t("allDoneTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("allDoneSubtitle")}</p>
            </div>
            <Button className="w-full" onClick={() => navigate({ to: "/" })}>
              {t("continueCta")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {status.steps.map((step) =>
              step.code === "VERIFY_CONTACT" ? (
                <VerifyContactCard key={step.code} step={step} t={t} onMarkDone={() => completeStep(step.code)} busy={busyStep === step.code} />
              ) : step.code === "SET_LOCATION" ? (
                <SetLocationCard key={step.code} step={step} t={t} onSaved={() => completeStep(step.code)} />
              ) : step.code === "ADD_PROPERTY" ? (
                <AddPropertyCard key={step.code} step={step} t={t} onSaved={() => completeStep(step.code)} onSkip={() => completeStep(step.code)} />
              ) : (
                <GenericStepCard key={step.code} step={step} />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StepShell({
  done,
  required,
  title,
  description,
  t,
  children,
}: {
  done: boolean;
  required: boolean;
  title: string;
  description: string;
  t: (k: string) => string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-3xl border p-5 shadow-[var(--shadow-card)] ${done ? "border-success/30 bg-success/5" : "border-border bg-card"}`}>
      <div className="flex items-start gap-3">
        {done ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" /> : <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {required ? t("required") : t("optional")}
            </span>
            {done && <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">{t("completed")}</span>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          {!done && children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </div>
  );
}

function VerifyContactCard({ step, t, onMarkDone, busy }: { step: { completed: boolean; is_required: boolean }; t: (k: string, o?: any) => string; onMarkDone: () => void; busy: boolean }) {
  return (
    <StepShell done={step.completed} required={step.is_required} title={t("steps.VERIFY_CONTACT.title")} description={t("steps.VERIFY_CONTACT.description")} t={t}>
      <p className="mb-3 text-xs text-muted-foreground">{t("steps.VERIFY_CONTACT.unverifiedNote")}</p>
      <Button size="sm" disabled={busy} onClick={onMarkDone}>
        {t("steps.VERIFY_CONTACT.markDone")}
      </Button>
    </StepShell>
  );
}

function SetLocationCard({ step, t, onSaved }: { step: { completed: boolean; is_required: boolean }; t: (k: string, o?: any) => string; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ label: "Home", recipient_name: "", phone: "", street_address: "", city: "", region: "" });

  async function save() {
    if (!draft.recipient_name.trim() || !draft.phone.trim() || !draft.street_address.trim() || !draft.city.trim()) {
      toast.error(t("steps.SET_LOCATION.fillRequired"));
      return;
    }
    setSaving(true);
    try {
      await bookingApi.createAddress({ ...draft, region: draft.region || null, is_default: true });
      toast.success(t("steps.SET_LOCATION.saved"));
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <StepShell done={step.completed} required={step.is_required} title={t("steps.SET_LOCATION.title")} description={t("steps.SET_LOCATION.description")} t={t}>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1"><Label>{t("steps.SET_LOCATION.recipientNameLabel")}</Label><Input value={draft.recipient_name} onChange={(e) => setDraft((d) => ({ ...d, recipient_name: e.target.value }))} /></div>
        <div className="space-y-1"><Label>{t("steps.SET_LOCATION.phoneLabel")}</Label><Input value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} /></div>
        <div className="space-y-1"><Label>{t("steps.SET_LOCATION.cityLabel")}</Label><Input value={draft.city} onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))} /></div>
        <div className="space-y-1"><Label>{t("steps.SET_LOCATION.regionLabel")}</Label><Input value={draft.region} onChange={(e) => setDraft((d) => ({ ...d, region: e.target.value }))} /></div>
        <div className="space-y-1 sm:col-span-2"><Label>{t("steps.SET_LOCATION.streetLabel")}</Label><Input value={draft.street_address} onChange={(e) => setDraft((d) => ({ ...d, street_address: e.target.value }))} /></div>
      </div>
      <Button size="sm" className="mt-3" disabled={saving} onClick={() => void save()}>
        {saving ? t("steps.SET_LOCATION.saving") : t("steps.SET_LOCATION.save")}
      </Button>
    </StepShell>
  );
}

function AddPropertyCard({ step, t, onSaved, onSkip }: { step: { completed: boolean; is_required: boolean }; t: (k: string, o?: any) => string; onSaved: () => void; onSkip: () => void }) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [propertyType, setPropertyType] = useState("HOUSE");

  async function save() {
    if (!name.trim()) {
      toast.error(t("steps.ADD_PROPERTY.fillRequired"));
      return;
    }
    setSaving(true);
    try {
      await propertiesApi.create({ name, property_type: propertyType });
      toast.success(t("steps.ADD_PROPERTY.saved"));
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <StepShell done={step.completed} required={step.is_required} title={t("steps.ADD_PROPERTY.title")} description={t("steps.ADD_PROPERTY.description")} t={t}>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>{t("steps.ADD_PROPERTY.nameLabel")}</Label>
          <Input placeholder={t("steps.ADD_PROPERTY.namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>{t("steps.ADD_PROPERTY.typeLabel")}</Label>
          <Select value={propertyType} onValueChange={setPropertyType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["HOUSE", "APARTMENT", "CONDO", "OFFICE", "OTHER"] as const).map((v) => (
                <SelectItem key={v} value={v}>{t(`steps.ADD_PROPERTY.types.${v}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" disabled={saving} onClick={() => void save()}>
          {saving ? t("steps.ADD_PROPERTY.saving") : t("steps.ADD_PROPERTY.save")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onSkip}>
          {t("steps.ADD_PROPERTY.skip")}
        </Button>
      </div>
    </StepShell>
  );
}

function GenericStepCard({ step }: { step: { title: string; description: string; completed: boolean; is_required: boolean } }) {
  return (
    <StepShell done={step.completed} required={step.is_required} title={step.title} description={step.description} t={() => ""} />
  );
}
