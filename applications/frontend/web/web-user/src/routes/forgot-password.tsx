// Forgot password page — request a reset code by email.
// Real codes are only ever sent by email (the backend's OTP channel is
// hardcoded to EMAIL — there's no SMS integration).
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const title = "Forgot Password — Fixo";

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

type ForgotValues = z.infer<typeof forgotSchema>;

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [{ title }, { name: "description", content: "Reset your Fixo account password." }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = async (values: ForgotValues) => {
    try {
      const otp = await forgotPassword(values.email);
      navigate({
        to: "/reset-password",
        search: otp ? { email: values.email, otp_dev: otp } : { email: values.email },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("forgotPassword.genericError"));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t("forgotPassword.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("forgotPassword.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">{t("forgotPassword.emailLabel")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder={t("forgotPassword.emailPlaceholder")} className="pl-10" {...register("email")} />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t("forgotPassword.submittingCta") : t("forgotPassword.submitCta")}
          </Button>
        </form>

        <div className="text-center text-sm">
          <button onClick={() => navigate({ to: "/login" })} className="text-primary hover:underline">
            {t("forgotPassword.backToLogin")}
          </button>
        </div>
      </div>
    </div>
  );
}
