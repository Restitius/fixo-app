// Login page — email/password form with OTP fallback.
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const title = "Login — Fixo";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

type LoginValues = z.infer<typeof loginSchema> & { password?: string };

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title }, { name: "description", content: "Log in to your Fixo account." }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation("auth");
  const { login, requestOtp } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { isSubmitting, errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginValues) => {
    setPasswordError(null);
    try {
      if (isOtpMode) {
        const otp = await requestOtp(values.email);
        if (otp) {
          toast.success(`Your OTP code is: ${otp}`, {
            description: "Use this code to verify your email",
          });
        }
        navigate({ to: "/verify-otp", search: { email: values.email } });
      } else {
        const password = getValues("password");
        if (!password || password.length < 6) {
          setPasswordError(t("login.passwordTooShort"));
          return;
        }
        await login(values.email, password, navigator.userAgent);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("login.genericError"));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t("login.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("login.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">{t("login.emailLabel")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder={t("login.emailPlaceholder")}
                className="pl-10"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {!isOtpMode && (
            <div className="space-y-2">
              <Label htmlFor="password">{t("login.passwordLabel")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-muted-foreground"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-destructive">{passwordError}</p>
              )}
              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  {t("login.forgotPasswordCta")}
                </Link>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? t("login.submittingCta")
              : isOtpMode
                ? t("login.submitCtaOtp")
                : t("login.submitCta")}
          </Button>
        </form>

        <div className="text-center text-sm">
          <button
            onClick={() => setIsOtpMode(!isOtpMode)}
            className="text-primary hover:underline"
          >
            {isOtpMode
              ? t("login.usePasswordInstead")
              : t("login.useOtpInstead")}
          </button>
        </div>

        <div className="text-center text-sm">
          {t("login.noAccount")}{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            {t("login.createOneCta")}
          </Link>
        </div>
      </div>
    </div>
  );
}
