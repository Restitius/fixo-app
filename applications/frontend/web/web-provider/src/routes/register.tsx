import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2, User, Wrench } from "lucide-react";

const title = "Provider Registration — FIXO";
const description = "Create your FIXO provider account as an individual professional or a registered business.";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: RegisterPage,
});

const field =
  "h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/30";

function RegisterPage() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<"INDIVIDUAL" | "BUSINESS">("INDIVIDUAL");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    country: "Tanzania",
    region: "Dar es Salaam",
    city: "Kinondoni",
    language: "English",
    referral: "",
  });

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      setError("Please complete first name, last name, email and mobile number.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    navigate({ to: "/verify-otp" });
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Back to provider portal
        </Link>

        <div className="mt-5 rounded-[2rem] bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-2xl text-primary-foreground shadow-[var(--shadow-glow)]"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              <Wrench className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Create your provider account</h1>
              <p className="text-sm text-muted-foreground">We verify your mobile number and email in the next step.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {([
              { key: "INDIVIDUAL", label: "Individual provider", hint: "Handyman, technician or freelancer", icon: User },
              { key: "BUSINESS", label: "Business / company", hint: "Registered service company with workers", icon: Building2 },
            ] as const).map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setAccountType(o.key)}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                  accountType === o.key ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted"
                }`}
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <o.icon className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{o.label}</span>
                  <span className="block text-xs text-muted-foreground">{o.hint}</span>
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <input className={field} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </Field>
            <Field label="Middle name">
              <input className={field} value={form.middleName} onChange={(e) => set("middleName", e.target.value)} />
            </Field>
            <Field label="Last name">
              <input className={field} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </Field>
            <Field label="Email">
              <input type="email" className={field} value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Mobile number">
              <input className={field} placeholder="+255 7XX XXX XXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Preferred language">
              <select className={field} value={form.language} onChange={(e) => set("language", e.target.value)}>
                {["English", "Swahili", "French", "Arabic"].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Password">
              <input type="password" className={field} value={form.password} onChange={(e) => set("password", e.target.value)} />
            </Field>
            <Field label="Confirm password">
              <input type="password" className={field} value={form.confirm} onChange={(e) => set("confirm", e.target.value)} />
            </Field>
            <Field label="Country">
              <select className={field} value={form.country} onChange={(e) => set("country", e.target.value)}>
                {["Tanzania", "Kenya", "Uganda", "Rwanda"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Region / state">
              <input className={field} value={form.region} onChange={(e) => set("region", e.target.value)} />
            </Field>
            <Field label="City / district">
              <input className={field} value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Referral code (optional)">
              <input className={field} value={form.referral} onChange={(e) => set("referral", e.target.value)} />
            </Field>

            {error && (
              <p className="sm:col-span-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</p>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full rounded-xl py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-transform hover:scale-[1.01]"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                Continue to verification
              </button>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Already registered?{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
