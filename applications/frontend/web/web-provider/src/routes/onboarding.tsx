import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, ChevronRight, Upload } from "lucide-react";

import { onboardingSteps, serviceCatalog, serviceAreas, availability, business, provider } from "@/lib/mock-data";

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

function UploadBox({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center">
      <Upload className="size-6 text-primary" />
      <p className="mt-2 text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const total = onboardingSteps.length;

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
              {onboardingSteps.map((s, i) => (
                <li key={s.key}>
                  <button
                    onClick={() => setStep(i)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                      i === step ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted"
                    }`}
                  >
                    <span
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        i < step || s.done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i < step || s.done ? <Check className="size-3.5" /> : i + 1}
                    </span>
                    {s.label}
                  </button>
                </li>
              ))}
            </ol>
          </aside>

          <section className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-xl font-bold tracking-tight">{onboardingSteps[step]?.label}</h2>

            <div className="mt-5">
              {step === 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Professional title">
                    <input className={field} defaultValue={provider.title} />
                  </Field>
                  <Field label="Years of experience">
                    <input className={field} type="number" defaultValue={provider.yearsExperience} />
                  </Field>
                  <Field label="Languages spoken">
                    <input className={field} defaultValue={provider.languages.join(", ")} />
                  </Field>
                  <Field label="Emergency contact">
                    <input className={field} placeholder="+255 ..." />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Professional bio">
                      <textarea className="min-h-28 w-full rounded-xl border border-input bg-card p-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" defaultValue={provider.bio} />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <UploadBox label="Upload profile photo" hint="Clear headshot, JPG or PNG, max 5 MB" />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Business name">
                    <input className={field} defaultValue={business.name} />
                  </Field>
                  <Field label="Registration number">
                    <input className={field} defaultValue={business.registrationNumber} />
                  </Field>
                  <Field label="Tax / TIN number">
                    <input className={field} defaultValue={business.taxNumber} />
                  </Field>
                  <Field label="Year established">
                    <input className={field} type="number" defaultValue={business.established} />
                  </Field>
                  <Field label="Business email">
                    <input className={field} defaultValue={business.email} />
                  </Field>
                  <Field label="Business phone">
                    <input className={field} defaultValue={business.phone} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Business address">
                      <input className={field} defaultValue={business.address} />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <UploadBox label="Upload business logo & registration certificate" hint="PDF, JPG or PNG" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="ID type">
                    <select className={field}>
                      {["National ID", "Passport", "Driving licence", "Voter ID"].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="ID number">
                    <input className={field} placeholder="19870412-11029-00001-22" />
                  </Field>
                  <UploadBox label="ID front" hint="Readable photo of the front" />
                  <UploadBox label="ID back" hint="Readable photo of the back" />
                  <UploadBox label="Selfie with ID" hint="Used for face matching" />
                  <UploadBox label="Trade certificate / licence" hint="Required for regulated trades" />
                  <div className="sm:col-span-2 rounded-2xl bg-primary/5 p-4 text-sm text-muted-foreground">
                    Verification usually takes 24–48 hours. You can continue onboarding while we review your documents.
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  {serviceCatalog.map((c) => (
                    <div key={c.category}>
                      <p className="text-sm font-semibold">{c.category}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {c.items.map((i) => (
                          <label key={i} className="flex cursor-pointer items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
                            <input type="checkbox" className="size-3.5 accent-[var(--primary)]" defaultChecked={c.category === "Electrical"} />
                            {i}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Pricing model">
                      <select className={field}>
                        {["Fixed price", "Starting from", "Hourly rate", "Inspection fee", "Quote only"].map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Base price (TZS)">
                      <input className={field} type="number" defaultValue={45000} />
                    </Field>
                    <Field label="Minimum charge (TZS)">
                      <input className={field} type="number" defaultValue={25000} />
                    </Field>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  {serviceAreas.map((a) => (
                    <div key={a.area} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/50 p-4">
                      <div>
                        <p className="text-sm font-semibold">{a.area}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.region} · {a.radiusKm} km radius · travel fee TZS {a.travelFee.toLocaleString()}
                        </p>
                      </div>
                      <input type="checkbox" defaultChecked={a.active} className="size-5 accent-[var(--primary)]" />
                    </div>
                  ))}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Base location">
                      <input className={field} defaultValue="Mikocheni, Kinondoni" />
                    </Field>
                    <Field label="Maximum travel distance (km)">
                      <input className={field} type="number" defaultValue={25} />
                    </Field>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">Weekly availability</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {availability.map((d) => (
                        <div key={d.day} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5 text-sm">
                          <span className="font-medium">{d.day}</span>
                          <span className="text-muted-foreground">
                            {d.available ? `${d.from} – ${d.to}` : "Unavailable"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Payout method">
                    <select className={field}>
                      {["Bank account", "Mobile money"].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Account holder name">
                    <input className={field} defaultValue={business.name} />
                  </Field>
                  <Field label="Bank / provider">
                    <input className={field} defaultValue="CRDB Bank" />
                  </Field>
                  <Field label="Account number">
                    <input className={field} defaultValue="0152 **** 4471" />
                  </Field>
                  <Field label="Currency">
                    <select className={field}>
                      {["TZS", "KES", "USD"].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Payout frequency">
                    <select className={field}>
                      {["Twice weekly", "Weekly", "Daily"].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-3">
                  {[
                    "Provider Terms of Service",
                    "Commission and payment agreement",
                    "Code of conduct",
                    "Cancellation policy",
                    "Data protection and privacy policy",
                    "Insurance and liability declaration",
                  ].map((t) => (
                    <label key={t} className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4 text-sm">
                      <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" />
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
                onClick={() => (step === total - 1 ? navigate({ to: "/dashboard" }) : setStep((s) => s + 1))}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                {step === total - 1 ? "Submit for review" : "Save & continue"} <ChevronRight className="size-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
