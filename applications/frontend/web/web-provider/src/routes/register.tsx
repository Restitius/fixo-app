// Register page — provider registration form (individual or business).
import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Building2, User } from "lucide-react";
import { toast } from "sonner";

import { useProviderAuth } from "@/lib/provider-auth";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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

const registerSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Mobile number too short"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string(),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  preferred_language: z.string(),
  referral_code: z.string().optional(),
  terms_accepted: z.boolean().refine((v) => v === true, { message: "You must accept the terms and conditions" }),
  privacy_accepted: z.boolean().refine((v) => v === true, { message: "You must accept the privacy policy" }),
}).refine((data) => data.password === data.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

type RegisterValues = z.infer<typeof registerSchema>;

const field =
  "h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/30";

function RegisterPage() {
  const { register: registerProvider } = useProviderAuth();
  const [accountType, setAccountType] = useState<"INDIVIDUAL" | "BUSINESS">("INDIVIDUAL");
  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      middle_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "",
      confirm: "",
      country: "Tanzania",
      region: "Dar es Salaam",
      city: "Kinondoni",
      preferred_language: "en",
      referral_code: "",
      terms_accepted: false,
      privacy_accepted: false,
    },
  });

  const onSubmit = async (values: RegisterValues) => {
    try {
      await registerProvider({
        first_name: values.first_name,
        middle_name: values.middle_name || undefined,
        last_name: values.last_name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        account_type: accountType,
        country: values.country || undefined,
        region: values.region || undefined,
        city: values.city || undefined,
        preferred_language: values.preferred_language,
        referral_code: values.referral_code || undefined,
        terms_accepted: values.terms_accepted,
        privacy_accepted: values.privacy_accepted,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create your account. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-4" /> Back to provider portal
        </Link>

        <div className="mt-5 rounded-[2rem] bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="flex items-center gap-3">
            <img src="/brand/fixo-icon-mark.png" alt="FIXO" className="size-11 object-contain" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Create your provider account</h1>
              <p className="text-sm text-muted-foreground">We verify your email in the next step.</p>
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

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="First name" error={errors.first_name?.message}>
              <input className={field} {...register("first_name")} />
            </Field>
            <Field label="Middle name">
              <input className={field} {...register("middle_name")} />
            </Field>
            <Field label="Last name" error={errors.last_name?.message}>
              <input className={field} {...register("last_name")} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input type="email" className={field} {...register("email")} />
            </Field>
            <Field label="Mobile number" error={errors.phone?.message}>
              <input className={field} placeholder="+255 7XX XXX XXX" {...register("phone")} />
            </Field>
            <Field label="Preferred language">
              <select className={field} {...register("preferred_language")}>
                <option value="en">English</option>
                <option value="sw">Swahili</option>
                <option value="fr">French</option>
                <option value="ar">Arabic</option>
              </select>
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <input type="password" className={field} {...register("password")} />
            </Field>
            <Field label="Confirm password" error={errors.confirm?.message}>
              <input type="password" className={field} {...register("confirm")} />
            </Field>
            <Field label="Country">
              <select className={field} {...register("country")}>
                {["Tanzania", "Kenya", "Uganda", "Rwanda"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Region / state">
              <input className={field} {...register("region")} />
            </Field>
            <Field label="City / district">
              <input className={field} {...register("city")} />
            </Field>
            <Field label="Referral code (optional)">
              <input className={field} {...register("referral_code")} />
            </Field>

            <div className="sm:col-span-2 space-y-3">
              <div className="flex items-start gap-3">
                <Controller
                  name="terms_accepted"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="terms_accepted"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      className="mt-1"
                    />
                  )}
                />
                <Label htmlFor="terms_accepted" className="font-normal">
                  I agree to the <a href="#" className="text-primary">Terms and Conditions</a>
                </Label>
              </div>
              {errors.terms_accepted && <p className="text-xs text-destructive">{errors.terms_accepted.message}</p>}

              <div className="flex items-start gap-3">
                <Controller
                  name="privacy_accepted"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="privacy_accepted"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      className="mt-1"
                    />
                  )}
                />
                <Label htmlFor="privacy_accepted" className="font-normal">
                  I agree to the <a href="#" className="text-primary">Privacy Policy</a>
                </Label>
              </div>
              {errors.privacy_accepted && <p className="text-xs text-destructive">{errors.privacy_accepted.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-transform hover:scale-[1.01] disabled:opacity-60"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                {isSubmitting ? "Creating account…" : "Continue to verification"}
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

function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
