// Verify OTP page — email verification with 6-digit code.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const title = "Verify Your Email — Fixo";

const otpSchema = z.object({
  email: z.string().email("Enter a valid email"),
  code: z.string().min(4, "Enter the verification code"),
});

type OtpValues = z.infer<typeof otpSchema>;

interface VerifyOtpSearch {
  email: string;
  otp_from_register?: string;
}

export const Route = createFileRoute("/verify-otp")({
  validateSearch: (search: Record<string, unknown>): VerifyOtpSearch => {
    const email = typeof search["email"] === "string" ? search["email"] : "";
    const otp =
      typeof search["otp_from_register"] === "string"
        ? search["otp_from_register"]
        : undefined;
    const parsed: VerifyOtpSearch = { email };
    if (otp !== undefined) parsed.otp_from_register = otp;
    return parsed;
  },
  head: () => ({
    meta: [{ title }, { name: "description", content: "Verify your email address." }],
  }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const { t } = useTranslation("auth");
  const { email: initialEmail, otp_from_register } = Route.useSearch();
  const { verifyOtp, requestOtp } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: initialEmail },
  });

  const onSubmit = async (values: OtpValues) => {
    try {
      await verifyOtp(values.email, values.code);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("verifyOtp.genericError"));
    }
  };

  const handleResend = async () => {
    const currentEmail = initialEmail || "you@example.com";
    const code = await requestOtp(currentEmail);
    if (code) toast.success(t("verifyOtp.resentToast", { code }));
    else toast.success(t("verifyOtp.sentToast"));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{t("verifyOtp.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("verifyOtp.subtitlePrefix")} <strong>{initialEmail}</strong>
          </p>
          {otp_from_register && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("verifyOtp.devModeCode")} <strong>{otp_from_register}</strong>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code">{t("verifyOtp.codeLabel")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="code"
                type="text"
                placeholder={t("verifyOtp.codePlaceholder")}
                className="pl-10 text-center text-lg tracking-widest"
                maxLength={6}
                {...register("code")}
              />
            </div>
            {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t("verifyOtp.submittingCta") : t("verifyOtp.submitCta")}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={handleResend}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("verifyOtp.resendPrompt")}
          </button>
        </div>
      </div>
    </div>
  );
}
