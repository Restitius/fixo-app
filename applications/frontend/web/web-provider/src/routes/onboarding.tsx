// Provider onboarding — the real 7-step catalogue confirmed this session
// (queried PROVIDER_ONBOARDING_STEPS directly): PERSONAL_INFO, BUSINESS_INFO
// (optional), IDENTITY_VERIFICATION, SERVICE_CONFIGURATION, SERVICE_AREAS,
// PAYMENT_INFORMATION, AGREEMENTS. Onboarding itself has no data store of its
// own — /providers/onboarding/steps/{code} just tracks progress; each step's
// actual data lives in the real domain it curates (profile, business,
// verification, services+pricing, areas, payout methods). Availability is
// NOT one of the 7 steps (it's its own always-editable settings area), so
// it's been removed from what was previously step 4's UI.
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  onboardingApi,
  type AreaSettings,
  type CatalogServiceOption,
  type PayoutMethod,
  type ProviderBusinessProfile,
  type ProviderProfile,
  type ProviderServiceConfig,
  type ServiceArea,
  type VerificationDocType,
  type VerificationDocument,
} from "@/lib/api-client";

const title = "Provider Onboarding — FIXO";
const description = "Complete the seven onboarding steps to activate your FIXO provider account and start receiving jobs.";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: OnboardingPage,
});

const STEP_CODES = [
  "PERSONAL_INFO",
  "BUSINESS_INFO",
  "IDENTITY_VERIFICATION",
  "SERVICE_CONFIGURATION",
  "SERVICE_AREAS",
  "PAYMENT_INFORMATION",
  "AGREEMENTS",
] as const;

const field =
  "h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function FileUploadBox({ label, hint, url, onUploaded }: { label: string; hint: string; url?: string | null; onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await onboardingApi.uploadFile(file);
      onUploaded(uploaded.url);
      toast.success(`${label} uploaded.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center hover:bg-muted/60">
      <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={handleChange} disabled={uploading} />
      {uploading ? (
        <Loader2 className="size-6 animate-spin text-primary" />
      ) : url ? (
        <Check className="size-6 text-success" />
      ) : (
        <Upload className="size-6 text-primary" />
      )}
      <p className="mt-2 text-sm font-semibold">{url ? `${label} — uploaded` : label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </label>
  );
}

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Step 0 — personal info
  const [profile, setProfile] = useState<Partial<ProviderProfile>>({});
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Step 1 — business info
  const [business, setBusiness] = useState<Partial<ProviderBusinessProfile>>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Step 2 — identity verification
  const [docTypes, setDocTypes] = useState<VerificationDocType[]>([]);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [frontUrl, setFrontUrl] = useState<string | null>(null);
  const [backUrl, setBackUrl] = useState<string | null>(null);

  // Step 3 — services + pricing
  const [catalog, setCatalog] = useState<CatalogServiceOption[]>([]);
  const [myServices, setMyServices] = useState<ProviderServiceConfig[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [pricingModel, setPricingModel] = useState("FIXED");
  const [baseAmount, setBaseAmount] = useState(45000);
  const [minimumCharge, setMinimumCharge] = useState(25000);

  // Step 4 — service areas
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [areaSettings, setAreaSettings] = useState<Partial<AreaSettings>>({});

  // Step 5 — payout methods
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [methodType, setMethodType] = useState<"BANK" | "MOBILE_MONEY">("MOBILE_MONEY");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [payoutProviderName, setPayoutProviderName] = useState("");

  // Step 6 — agreements
  const AGREEMENTS = [
    "Provider Terms of Service",
    "Commission and payment agreement",
    "Code of conduct",
    "Cancellation policy",
    "Data protection and privacy policy",
    "Insurance and liability declaration",
  ];
  const [agreed, setAgreed] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const [status, prof, doctypes] = await Promise.all([
          onboardingApi.status(),
          onboardingApi.getProfile().catch(() => null),
          onboardingApi.docTypes().catch(() => []),
        ]);
        setCompletedSteps(new Set(status.steps.filter((s) => s.completed).map((s) => s.code)));
        if (status.current_step) {
          const idx = STEP_CODES.indexOf(status.current_step as (typeof STEP_CODES)[number]);
          if (idx >= 0) setStep(idx);
        }
        if (prof) {
          setProfile(prof);
          setPhotoUrl(prof.profile_photo_url ?? null);
        }
        setDocTypes(doctypes);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not load onboarding progress.");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Lazy per-step data load.
  useEffect(() => {
    if (!loaded) return;
    const code = STEP_CODES[step]!;
    if (code === "BUSINESS_INFO") {
      onboardingApi.getBusiness().then((b) => {
        setBusiness(b);
        setLogoUrl(b.logo_url ?? null);
      }).catch(() => {});
    } else if (code === "IDENTITY_VERIFICATION") {
      onboardingApi.documents().then(setDocuments).catch(() => {});
    } else if (code === "SERVICE_CONFIGURATION") {
      Promise.all([onboardingApi.serviceCatalog(), onboardingApi.myServices()]).then(([cat, mine]) => {
        setCatalog(cat);
        setMyServices(mine);
        setSelectedServiceIds(new Set(mine.map((m) => m.service_id)));
      }).catch(() => {});
    } else if (code === "SERVICE_AREAS") {
      Promise.all([onboardingApi.listAreas(), onboardingApi.getAreaSettings().catch(() => null)]).then(([a, settings]) => {
        setAreas(a);
        if (settings) setAreaSettings(settings);
      }).catch(() => {});
    } else if (code === "PAYMENT_INFORMATION") {
      onboardingApi.listPayoutMethods().then(setPayoutMethods).catch(() => {});
    }
  }, [step, loaded]);

  async function saveCurrentStep(): Promise<boolean> {
    const code = STEP_CODES[step]!;
    try {
      if (code === "PERSONAL_INFO") {
        await onboardingApi.updateProfile({ ...profile, profile_photo_url: photoUrl ?? undefined });
      } else if (code === "BUSINESS_INFO") {
        if (business.business_name) {
          await onboardingApi.upsertBusiness({ ...business, business_name: business.business_name, logo_url: logoUrl ?? undefined });
        }
      } else if (code === "IDENTITY_VERIFICATION") {
        if (docType && frontUrl) {
          await onboardingApi.addDocument({
            doc_type: docType,
            front_image_url: frontUrl,
            back_image_url: backUrl ?? undefined,
            doc_number: docNumber || undefined,
          });
        }
      } else if (code === "SERVICE_CONFIGURATION") {
        for (const serviceId of selectedServiceIds) {
          await onboardingApi.configureService(serviceId, {
            pricing_model: pricingModel,
            minimum_charge: minimumCharge,
          });
          await onboardingApi.upsertPricing(serviceId, {
            pricing_model: pricingModel,
            base_amount: baseAmount,
          });
        }
      } else if (code === "SERVICE_AREAS") {
        await onboardingApi.saveAreaSettings(areaSettings);
      } else if (code === "PAYMENT_INFORMATION") {
        if (accountHolder || accountNumber || mobileNumber) {
          await onboardingApi.addPayoutMethod({
            method_type: methodType,
            provider_name: payoutProviderName || undefined,
            account_holder: accountHolder || undefined,
            account_number: accountNumber || undefined,
            mobile_number: mobileNumber || undefined,
            currency: "TZS",
            is_default: payoutMethods.length === 0,
          });
        }
      }
      await onboardingApi.completeStep(code, {});
      setCompletedSteps((prev) => new Set(prev).add(code));
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save this step.");
      return false;
    }
  }

  async function handleNext() {
    setSaving(true);
    const ok = await saveCurrentStep();
    setSaving(false);
    if (!ok) return;
    if (step === STEP_CODES.length - 1) {
      navigate({ to: "/dashboard" });
    } else {
      setStep((s) => s + 1);
    }
  }

  function toggleArea(areaId: string, isActive: boolean) {
    setAreas((prev) => prev.map((a) => (a.area_id === areaId ? { ...a, is_active: isActive } : a)));
    onboardingApi.updateArea(areaId, { is_active: isActive }).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Could not update area.");
    });
  }

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const total = STEP_CODES.length;
  const STEP_LABELS: Record<(typeof STEP_CODES)[number], string> = {
    PERSONAL_INFO: "Personal information",
    BUSINESS_INFO: "Business information",
    IDENTITY_VERIFICATION: "Identity verification",
    SERVICE_CONFIGURATION: "Service configuration",
    SERVICE_AREAS: "Service areas",
    PAYMENT_INFORMATION: "Payment information",
    AGREEMENTS: "Agreements",
  };
  const code = STEP_CODES[step]!;

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight">Complete your provider profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Step {step + 1} of {total} — your progress is saved automatically.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-3xl bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${((step + 1) / total) * 100}%`, backgroundImage: "var(--gradient-primary)" }}
              />
            </div>
            <ol className="space-y-1">
              {STEP_CODES.map((c, i) => (
                <li key={c}>
                  <button
                    onClick={() => setStep(i)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                      i === step ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        i < step || completedSteps.has(c) ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i < step || completedSteps.has(c) ? <Check className="size-3.5" /> : i + 1}
                    </span>
                    {STEP_LABELS[c]}
                  </button>
                </li>
              ))}
            </ol>
          </aside>

          <section className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-xl font-bold tracking-tight">{STEP_LABELS[code]}</h2>

            <div className="mt-5">
              {code === "PERSONAL_INFO" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Professional title">
                    <input
                      className={field}
                      value={profile.professional_title ?? ""}
                      onChange={(e) => setProfile((p) => ({ ...p, professional_title: e.target.value }))}
                    />
                  </Field>
                  <Field label="Years of experience">
                    <input
                      className={field}
                      type="number"
                      value={profile.years_experience ?? ""}
                      onChange={(e) => setProfile((p) => ({ ...p, years_experience: Number(e.target.value) }))}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Languages spoken">
                      <input
                        className={field}
                        placeholder="English, Swahili"
                        value={profile.languages ?? ""}
                        onChange={(e) => setProfile((p) => ({ ...p, languages: e.target.value }))}
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Professional bio">
                      <textarea
                        className="min-h-28 w-full rounded-xl border border-input bg-card p-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                        value={profile.bio ?? ""}
                        onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <FileUploadBox label="Upload profile photo" hint="Clear headshot, JPG or PNG, max 5 MB" url={photoUrl} onUploaded={setPhotoUrl} />
                  </div>
                </div>
              )}

              {code === "BUSINESS_INFO" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <p className="sm:col-span-2 text-xs text-muted-foreground">Optional — skip if you operate as an individual.</p>
                  <Field label="Business name">
                    <input className={field} value={business.business_name ?? ""} onChange={(e) => setBusiness((b) => ({ ...b, business_name: e.target.value }))} />
                  </Field>
                  <Field label="Registration number">
                    <input className={field} value={business.registration_number ?? ""} onChange={(e) => setBusiness((b) => ({ ...b, registration_number: e.target.value }))} />
                  </Field>
                  <Field label="Tax / TIN number">
                    <input className={field} value={business.tax_number ?? ""} onChange={(e) => setBusiness((b) => ({ ...b, tax_number: e.target.value }))} />
                  </Field>
                  <Field label="Year established">
                    <input className={field} type="number" value={business.year_established ?? ""} onChange={(e) => setBusiness((b) => ({ ...b, year_established: Number(e.target.value) }))} />
                  </Field>
                  <Field label="Business email">
                    <input className={field} value={business.business_email ?? ""} onChange={(e) => setBusiness((b) => ({ ...b, business_email: e.target.value }))} />
                  </Field>
                  <Field label="Business phone">
                    <input className={field} value={business.business_phone ?? ""} onChange={(e) => setBusiness((b) => ({ ...b, business_phone: e.target.value }))} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Business address">
                      <input className={field} value={business.address ?? ""} onChange={(e) => setBusiness((b) => ({ ...b, address: e.target.value }))} />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <FileUploadBox label="Upload business logo" hint="PDF, JPG or PNG" url={logoUrl} onUploaded={setLogoUrl} />
                  </div>
                </div>
              )}

              {code === "IDENTITY_VERIFICATION" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {documents.length > 0 && (
                    <div className="sm:col-span-2 space-y-2">
                      {documents.map((d) => (
                        <div key={d.doc_id} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5 text-sm">
                          <span className="font-medium">{d.doc_type}</span>
                          <span className="text-muted-foreground">{d.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Field label="ID type">
                    <select className={field} value={docType} onChange={(e) => setDocType(e.target.value)}>
                      <option value="">Select…</option>
                      {docTypes.map((t) => (
                        <option key={t.code} value={t.code}>{t.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="ID number">
                    <input className={field} value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
                  </Field>
                  <FileUploadBox label="ID front" hint="Readable photo of the front" url={frontUrl} onUploaded={setFrontUrl} />
                  <FileUploadBox label="ID back" hint="Readable photo of the back" url={backUrl} onUploaded={setBackUrl} />
                  <div className="sm:col-span-2 rounded-2xl bg-primary/5 p-4 text-sm text-muted-foreground">
                    Verification usually takes 24–48 hours. You can continue onboarding while we review your documents.
                  </div>
                </div>
              )}

              {code === "SERVICE_CONFIGURATION" && (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2">
                    {catalog.map((s) => {
                      const selected = selectedServiceIds.has(s.service_id);
                      return (
                        <label key={s.service_id} className="flex cursor-pointer items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
                          <input
                            type="checkbox"
                            className="size-3.5 accent-[var(--primary)]"
                            checked={selected}
                            onChange={(e) =>
                              setSelectedServiceIds((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) next.add(s.service_id);
                                else next.delete(s.service_id);
                                return next;
                              })
                            }
                          />
                          {s.name}
                        </label>
                      );
                    })}
                    {catalog.length === 0 && <p className="text-sm text-muted-foreground">No catalogue services available yet.</p>}
                  </div>
                  {myServices.length > 0 && (
                    <p className="text-xs text-muted-foreground">Already configured: {myServices.map((s) => s.display_name || s.service_id).join(", ")}</p>
                  )}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Pricing model">
                      <select className={field} value={pricingModel} onChange={(e) => setPricingModel(e.target.value)}>
                        {["FIXED", "STARTING", "HOURLY", "INSPECTION_THEN_QUOTE", "CUSTOM_QUOTATION"].map((o) => (
                          <option key={o} value={o}>{o.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Base price (TZS)">
                      <input className={field} type="number" value={baseAmount} onChange={(e) => setBaseAmount(Number(e.target.value))} />
                    </Field>
                    <Field label="Minimum charge (TZS)">
                      <input className={field} type="number" value={minimumCharge} onChange={(e) => setMinimumCharge(Number(e.target.value))} />
                    </Field>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Applies to every service selected above. Set different pricing per service later from Pricing in the sidebar.
                  </p>
                </div>
              )}

              {code === "SERVICE_AREAS" && (
                <div className="space-y-4">
                  {areas.map((a) => (
                    <div key={a.area_id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/50 p-4">
                      <div>
                        <p className="text-sm font-semibold">{a.label || `${a.city ?? ""} ${a.region ?? ""}`.trim() || a.area_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.area_type === "RADIUS" ? `${a.radius_km ?? "—"} km radius` : [a.city, a.region].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <input type="checkbox" checked={a.is_active} onChange={(e) => toggleArea(a.area_id, e.target.checked)} className="size-5 accent-[var(--primary)]" />
                    </div>
                  ))}
                  {areas.length === 0 && <p className="text-sm text-muted-foreground">No service areas added yet — add them from Service Areas in the sidebar after onboarding, or set your travel policy below.</p>}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Maximum travel distance (km)">
                      <input
                        className={field}
                        type="number"
                        value={areaSettings.max_travel_km ?? ""}
                        onChange={(e) => setAreaSettings((s) => ({ ...s, max_travel_km: Number(e.target.value) }))}
                      />
                    </Field>
                    <Field label="Travel fee (TZS)">
                      <input
                        className={field}
                        type="number"
                        value={areaSettings.travel_fee ?? ""}
                        onChange={(e) => setAreaSettings((s) => ({ ...s, travel_fee: Number(e.target.value) }))}
                      />
                    </Field>
                  </div>
                </div>
              )}

              {code === "PAYMENT_INFORMATION" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {payoutMethods.length > 0 && (
                    <div className="sm:col-span-2 space-y-2">
                      {payoutMethods.map((m) => (
                        <div key={m.method_id} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5 text-sm">
                          <span className="font-medium">{m.method_type}</span>
                          <span className="text-muted-foreground">{m.mobile_number || m.account_number || m.provider_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Field label="Payout method">
                    <select className={field} value={methodType} onChange={(e) => setMethodType(e.target.value as "BANK" | "MOBILE_MONEY")}>
                      <option value="MOBILE_MONEY">Mobile money</option>
                      <option value="BANK">Bank account</option>
                    </select>
                  </Field>
                  {methodType === "MOBILE_MONEY" ? (
                    <>
                      <Field label="Mobile money provider">
                        <input className={field} placeholder="M-Pesa, Tigo Pesa…" value={payoutProviderName} onChange={(e) => setPayoutProviderName(e.target.value)} />
                      </Field>
                      <Field label="Mobile number">
                        <input className={field} value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="Account holder name">
                        <input className={field} value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
                      </Field>
                      <Field label="Bank / provider">
                        <input className={field} value={payoutProviderName} onChange={(e) => setPayoutProviderName(e.target.value)} />
                      </Field>
                      <Field label="Account number">
                        <input className={field} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                      </Field>
                    </>
                  )}
                </div>
              )}

              {code === "AGREEMENTS" && (
                <div className="space-y-3">
                  {AGREEMENTS.map((t) => (
                    <label key={t} className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4 text-sm">
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 accent-[var(--primary)]"
                        checked={agreed.has(t)}
                        onChange={(e) =>
                          setAgreed((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(t);
                            else next.delete(t);
                            return next;
                          })
                        }
                      />
                      <span>
                        I have read and accept the <strong className="font-semibold">{t}</strong>.
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-7 flex items-center justify-between gap-3">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-40"
              >
                <ChevronLeft className="size-4" /> Back
              </button>
              <button
                onClick={handleNext}
                disabled={saving || (code === "AGREEMENTS" && agreed.size < AGREEMENTS.length)}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {step === total - 1 ? "Submit for review" : "Save & continue"} <ChevronRight className="size-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
