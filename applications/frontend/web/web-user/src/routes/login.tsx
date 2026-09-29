import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { AnimatedAuthShell, AuthBrand } from "@/components/auth/AnimatedAuthShell";
import { SystemMessageCard } from "@/components/system/SystemMessageCard";
import { ApiError, type SystemMessage } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Use at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — FIXO" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation("auth");
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [systemMessage, setSystemMessage] = useState<SystemMessage | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    setSystemMessage(null);
    try {
      await login(values.email, values.password, navigator.userAgent);
    } catch (error) {
      if (error instanceof ApiError && error.systemMessage) {
        setSystemMessage(error.systemMessage);
      } else {
        toast.error(error instanceof Error ? error.message : t("login.genericError"));
      }
    }
  };

  return (
    <AnimatedAuthShell>
      <section className="mx-auto w-full max-w-[590px] rounded-[26px] bg-white/95 px-6 py-7 shadow-[0_28px_90px_rgba(54,30,116,.16)] backdrop-blur md:px-10">
        <AuthBrand compact />
        <header className="mt-5 text-center">
          <h1 className="text-3xl font-extrabold tracking-[-.035em]">Welcome back</h1>
          <p className="mt-2 text-lg text-[#737795]">Log in to your FIXO account.</p>
        </header>

        {systemMessage && (
          <div className="mt-5">
            <SystemMessageCard message={systemMessage} onAction={() => setSystemMessage(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Field label="Email Address" error={errors.email?.message} icon={<Mail />}>
            <input {...register("email")} autoComplete="email" type="email" placeholder="you@example.com" />
          </Field>
          <Field label="Password" error={errors.password?.message} icon={<LockKeyhole />}>
            <input
              {...register("password")}
              autoComplete="current-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="ml-2"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </Field>
          <div className="text-right">
            <Link to="/forgot-password" className="text-sm font-semibold text-[#5b18ed]">
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-14 w-full items-center justify-center gap-4 rounded-2xl bg-gradient-to-r from-[#a149ff] to-[#4f00e7] text-lg font-bold text-white shadow-[0_11px_24px_rgba(91,0,237,.25)] disabled:opacity-60"
          >
            {isSubmitting ? "Logging in…" : "Log In"}
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
          <SocialButton label="Apple" icon={<AppleIcon />} />
        </div>
        <p className="mt-5 text-center text-sm text-[#717694]">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-bold text-[#5b18ed]">Create one</Link>
        </p>
      </section>
    </AnimatedAuthShell>
  );
}

function Field({ label, error, icon, children }: { label: string; error?: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      <span className="flex h-12 items-center rounded-xl border border-[#d9dbea] bg-white px-4 text-[#747b9e] [&>svg]:mr-3 [&>svg]:size-5 [&>input]:min-w-0 [&>input]:flex-1 [&>input]:bg-transparent [&>input]:text-[#111333] [&>input]:outline-none [&>input]:placeholder:text-[#8f94af]">
        {icon}{children}
      </span>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </div>
  );
}

function SocialButton({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <button type="button" onClick={() => toast.info(`${label} sign-in is coming soon.`)} className="flex h-14 items-center justify-center gap-3 rounded-xl border border-[#d9dbea] bg-white font-semibold">
      {icon}{label}
    </button>
  );
}

function AppleIcon() {
  return <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.29-.07 2.19.71 2.95.71.76 0 2.17-.96 3.65-.82 1.85.15 3.24.88 4.16 2.2-3.82 2.29-2.91 7.32.59 8.73-.7 1.84-1.61 3.66-3.35 5.15ZM12.03 7.19C11.88 4.46 14.07 2.21 16.62 2c.35 3.15-2.86 5.5-4.59 5.19Z" /></svg>;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.6 12.23c0-.75-.07-1.47-.19-2.16H12v4.09h5.95a5.08 5.08 0 0 1-2.2 3.33v2.66h3.56c2.08-1.92 3.29-4.74 3.29-7.92Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.67l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.87 0-5.3-1.94-6.17-4.54H2.15v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.83 14.09A6.6 6.6 0 0 1 5.48 12c0-.73.13-1.44.35-2.09V7.07H2.15A11 11 0 0 0 1 12c0 1.77.42 3.44 1.15 4.93l3.68-2.84Z" />
      <path fill="#EA4335" d="M12 5.37c1.62 0 3.06.56 4.2 1.64l3.15-3.15A10.56 10.56 0 0 0 12 1a11 11 0 0 0-9.85 6.07l3.68 2.84C6.7 7.31 9.13 5.37 12 5.37Z" />
    </svg>
  );
}
