// Reset password page — enter the emailed reset code and a new password.
// The code isn't verified separately from the password change; the backend
// verifies it atomically together with setting the new password in one call.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const title = "Reset Password — Fixo";

const resetSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    code: z.string().min(4, "Enter the reset code"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((v) => v.new_password === v.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type ResetValues = z.infer<typeof resetSchema>;

interface ResetPasswordSearch {
  email: string;
  otp_dev?: string;
}

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => {
    const email = typeof search["email"] === "string" ? search["email"] : "";
    const otp_dev = typeof search["otp_dev"] === "string" ? search["otp_dev"] : undefined;
    const parsed: ResetPasswordSearch = { email };
    if (otp_dev !== undefined) parsed.otp_dev = otp_dev;
    return parsed;
  },
  head: () => ({
    meta: [{ title }, { name: "description", content: "Set a new password for your Fixo account." }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useTranslation("auth");
  const { email: initialEmail, otp_dev } = Route.useSearch();
  const { resetPassword, forgotPassword } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: initialEmail, code: otp_dev ?? "" },
  });

  const onSubmit = async (values: ResetValues) => {
    try {
      await resetPassword(values.email, values.code, values.new_password);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("resetPassword.genericError"));
    }
  };

  const handleResend = async () => {
    const currentEmail = initialEmail || "";
    if (!currentEmail) return;
    const code = await forgotPassword(currentEmail);
    if (code) toast.success(t("resetPassword.resentToast", { code }));
    else toast.success(t("resetPassword.sentToast"));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t("resetPassword.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("resetPassword.subtitlePrefix")} <strong>{initialEmail}</strong>
          </p>
          {otp_dev && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("resetPassword.devModeCode")} <strong>{otp_dev}</strong>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <input type="hidden" {...register("email")} />

          <div className="space-y-2">
            <Label htmlFor="code">{t("resetPassword.codeLabel")}</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="code" type="text" placeholder={t("resetPassword.codePlaceholder")} className="pl-10 text-center tracking-widest" {...register("code")} />
            </div>
            {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password">{t("resetPassword.newPasswordLabel")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="new_password" type="password" placeholder={t("resetPassword.newPasswordPlaceholder")} className="pl-10" {...register("new_password")} />
            </div>
            {errors.new_password && <p className="text-xs text-destructive">{errors.new_password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">{t("resetPassword.confirmPasswordLabel")}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="confirm_password" type="password" className="pl-10" {...register("confirm_password")} />
            </div>
            {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t("resetPassword.submittingCta") : t("resetPassword.submitCta")}
          </Button>
        </form>

        <div className="text-center">
          <button onClick={() => void handleResend()} className="text-sm font-medium text-primary hover:underline">
            {t("resetPassword.resendPrompt")}
          </button>
        </div>
      </div>
    </div>
  );
}
