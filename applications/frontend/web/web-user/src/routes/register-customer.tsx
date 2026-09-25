import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Apple, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AnimatedAuthShell, AuthBrand } from "@/components/auth/AnimatedAuthShell";
import { useAuth } from "@/lib/auth-context";

const schema = z
  .object({
    full_name: z.string().trim().min(2, "Enter your full name"),
    phone: z.string().trim().min(9, "Enter a valid phone number"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirm_password: z.string(),
    terms_accepted: z.boolean().refine((value) => value, "Accept the terms to continue"),
  })
  .refine((values) => values.password === values.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  });

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/register-customer")({
  head: () => ({ meta: [{ title: "Create your FIXO account" }] }),
  component: RegisterCustomerPage,
});

function RegisterCustomerPage() {
  const { register: registerCustomer } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { terms_accepted: false },
  });

  const submit = async (values: FormValues) => {
    try {
      await registerCustomer({
        full_name: values.full_name,
        phone: values.phone,
        email: values.email,
        password: values.password,
        terms_accepted: true,
        privacy_accepted: true,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We could not create your account.");
    }
  };

  return (
    <AnimatedAuthShell>
      <section className="mx-auto w-full max-w-[590px] rounded-[26px] bg-white/95 px-6 py-6 shadow-[0_28px_90px_rgba(54,30,116,.16)] backdrop-blur md:px-10">
        <AuthBrand compact />
        <header className="mt-5 text-center">
          <h1 className="text-3xl font-extrabold tracking-[-.035em]">Create your FIXO account</h1>
          <p className="mt-2 text-lg text-[#737795]">
            One account for customers and service providers.
          </p>
        </header>
        <form onSubmit={handleSubmit(submit)} className="mt-5 space-y-3">
          <Field label="Full Name" error={errors.full_name?.message} icon={<UserRound />}>
            <input {...register("full_name")} autoComplete="name" placeholder="John Doe" />
          </Field>
          <Field label="Phone Number" error={errors.phone?.message} icon={<Phone />}>
            <TanzaniaFlag />
            <input
              {...register("phone")}
              autoComplete="tel"
              inputMode="tel"
              placeholder="+255 700 000 000"
            />
          </Field>
          <Field label="Email Address" error={errors.email?.message} icon={<Mail />}>
            <input
              {...register("email")}
              autoComplete="email"
              type="email"
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Password" error={errors.password?.message} icon={<LockKeyhole />}>
            <input
              {...register("password")}
              autoComplete="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
            />
            <RevealButton shown={showPassword} onClick={() => setShowPassword((value) => !value)} />
          </Field>
          <Field
            label="Confirm Password"
            error={errors.confirm_password?.message}
            icon={<LockKeyhole />}
          >
            <input
              {...register("confirm_password")}
              autoComplete="new-password"
              type={showConfirmation ? "text" : "password"}
              placeholder="Confirm your password"
            />
            <RevealButton
              shown={showConfirmation}
              onClick={() => setShowConfirmation((value) => !value)}
            />
          </Field>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-[#666b8a]">
            <input
              {...register("terms_accepted")}
              type="checkbox"
              className="mt-0.5 size-5 accent-[#651cf4]"
            />
            <span>
              I agree to the{" "}
              <a href="/terms" className="font-semibold text-[#5b18ed]">
                Terms of Use
              </a>{" "}
              and{" "}
              <a href="/privacy" className="font-semibold text-[#5b18ed]">
                Privacy Policy
              </a>
              .
            </span>
          </label>
          {errors.terms_accepted && (
            <p className="text-xs text-red-600">{errors.terms_accepted.message}</p>
          )}
          <button
            disabled={isSubmitting}
            className="flex h-14 w-full items-center justify-center gap-4 rounded-2xl bg-gradient-to-r from-[#a149ff] to-[#4f00e7] text-lg font-bold text-white shadow-[0_11px_24px_rgba(91,0,237,.25)] disabled:opacity-60"
          >
            {isSubmitting ? "Creating account…" : "Create Account"}
            <ArrowRight className="size-6" />
          </button>
        </form>
        <div className="my-5 flex items-center gap-4 text-sm text-[#777b98]">
          <span className="h-px flex-1 bg-[#deddea]" />
          or continue with
          <span className="h-px flex-1 bg-[#deddea]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SocialButton label="Google" icon={<GoogleIcon />} />
          <SocialButton label="Apple" icon={<Apple className="size-5 fill-current" />} />
        </div>
        <p className="mt-5 text-center text-sm text-[#717694]">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-[#5b18ed]">
            Log in
          </Link>
        </p>
      </section>
    </AnimatedAuthShell>
  );
}

function Field({
  label,
  error,
  icon,
  children,
}: {
  label: string;
  error: string | undefined;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      <span className="flex h-12 items-center rounded-xl border border-[#d9dbea] bg-white px-4 text-[#747b9e] [&>svg]:mr-3 [&>svg]:size-5 [&>input]:min-w-0 [&>input]:flex-1 [&>input]:bg-transparent [&>input]:text-[#111333] [&>input]:outline-none [&>input]:placeholder:text-[#8f94af]">
        {icon}
        {children}
      </span>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function RevealButton({ shown, onClick }: { shown: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={shown ? "Hide password" : "Show password"}
      className="ml-2"
    >
      {shown ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
    </button>
  );
}

function TanzaniaFlag() {
  return (
    <svg
      viewBox="0 0 30 20"
      aria-label="Tanzania"
      className="mr-3 h-4 w-6 shrink-0 rounded-[2px] shadow-sm"
    >
      <path fill="#1eb53a" d="M0 0h30v20H0z" />
      <path fill="#00a3dd" d="M0 20 30 0v20z" />
      <path stroke="#fcd116" strokeWidth="8" d="M-2 22 32-2" />
      <path stroke="#000" strokeWidth="5" d="M-2 22 32-2" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.6 12.23c0-.75-.07-1.47-.19-2.16H12v4.09h5.95a5.08 5.08 0 0 1-2.2 3.33v2.66h3.56c2.08-1.92 3.29-4.74 3.29-7.92Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.67l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.87 0-5.3-1.94-6.17-4.54H2.15v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.83 14.09A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.44.35-2.09V7.07H2.15A11 11 0 0 0 1 12c0 1.77.42 3.44 1.15 4.93l3.68-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.37c1.62 0 3.06.56 4.2 1.64l3.15-3.15A10.56 10.56 0 0 0 12 1a11 11 0 0 0-9.85 6.07l3.68 2.84C6.7 7.31 9.13 5.37 12 5.37Z"
      />
    </svg>
  );
}

function SocialButton({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => toast.info(`${label} sign-in is coming soon.`)}
      className="flex h-14 items-center justify-center gap-3 rounded-xl border border-[#d9dbea] bg-white font-semibold"
    >
      {icon}
      {label}
    </button>
  );
}
