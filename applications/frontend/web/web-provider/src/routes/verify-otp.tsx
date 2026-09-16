// Verify OTP page — email verification with a 6-digit code, wired to the
// real /providers/auth/otp/* endpoints (single email-based code — the
// backend has no separate phone-code/email-code pair, unlike this page's
// earlier demo version).
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { useProviderAuth } from "@/lib/provider-auth";
import { Label } from "@/components/ui/label";

const title = "Verify Your Account — FIXO Provider";
const description = "Confirm the one-time code sent to your email to activate your FIXO provider account.";

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
    const otp = typeof search["otp_from_register"] === "string" ? search["otp_from_register"] : undefined;
    const parsed: VerifyOtpSearch = { email };
    if (otp !== undefined) parsed.otp_from_register = otp;
    return parsed;
  },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: VerifyPage,
});

const field =
  "h-12 w-full rounded-xl border border-input bg-card px-3.5 text-center text-lg font-semibold tracking-[0.4em] outline-none focus:ring-2 focus:ring-ring/30";

function VerifyPage() {
  const { email: initialEmail, otp_from_register } = Route.useSearch();
  const { verifyOtp, requestOtp } = useProviderAuth();

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
      toast.success("Account verified — sign in to continue.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed. Check the code and try again.");
    }
  };

  const handleResend = async () => {
    if (!initialEmail) {
      toast.error("Missing email — go back to registration.");
      return;
    }
    try {
      const code = await requestOtp(initialEmail);
      if (code) toast.success(`New code sent. Dev mode code: ${code}`);
      else toast.success("A new code has been sent to your email.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend the code.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] bg-card p-7 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-bold tracking-tight">Verify your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a 6-digit code to <strong className="text-foreground">{initialEmail}</strong>.
        </p>
        {otp_from_register && (
          <p className="mt-3 rounded-xl bg-primary/5 px-4 py-3 text-sm text-primary">
            Dev mode code: <strong>{otp_from_register}</strong>
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <input type="hidden" {...register("email")} />
          <label className="block">
            <Label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
              <Mail className="size-4 text-primary" /> Verification code
            </Label>
            <input className={field} maxLength={6} inputMode="numeric" {...register("code")} />
            {errors.code && <p className="mt-1 text-xs text-destructive">{errors.code.message}</p>}
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-transform hover:scale-[1.01] disabled:opacity-60"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {isSubmitting ? "Verifying…" : "Verify & continue"}
          </button>
        </form>

        <button onClick={handleResend} className="mt-4 w-full text-center text-sm font-semibold text-primary hover:underline">
          Didn&apos;t receive a code? Resend
        </button>
      </div>
    </div>
  );
}
