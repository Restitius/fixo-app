import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MailCheck, MessageSquare } from "lucide-react";

import { provider } from "@/lib/mock-data";

const title = "Verify Your Account — FIXO Provider";
const description = "Confirm the one-time codes sent to your mobile number and email to activate your FIXO provider account.";

export const Route = createFileRoute("/verify-otp")({
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

function VerifyPage() {
  const navigate = useNavigate();
  const [phoneCode, setPhoneCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (phoneCode.length !== 6 || emailCode.length !== 6) {
      setError("Enter both 6-digit codes. Demo codes: 123456");
      return;
    }
    // Registration + OTP verification isn't wired to the real backend yet
    // (separate from the login flow this pass wired up) — this still just
    // walks the demo forward. See the follow-up task for wiring it for real.
    navigate({ to: "/onboarding" });
  }

  const field =
    "h-12 w-full rounded-xl border border-input bg-card px-3.5 text-center text-lg font-semibold tracking-[0.4em] outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] bg-card p-7 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-bold tracking-tight">Verify your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent 6-digit codes to <strong className="text-foreground">{provider.phone}</strong> and{" "}
          <strong className="text-foreground">{provider.email}</strong>.
        </p>
        <p className="mt-3 rounded-xl bg-primary/5 px-4 py-3 text-sm text-primary">Demo mode code: 123456</p>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="size-4 text-primary" /> Mobile verification code
            </span>
            <input
              className={field}
              maxLength={6}
              inputMode="numeric"
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ""))}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-sm font-medium">
              <MailCheck className="size-4 text-primary" /> Email verification code
            </span>
            <input
              className={field}
              maxLength={6}
              inputMode="numeric"
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
            />
          </label>

          {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-xl py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-transform hover:scale-[1.01]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            Verify &amp; continue
          </button>
        </form>

        <button className="mt-4 w-full text-center text-sm font-semibold text-primary hover:underline">
          Didn&apos;t receive a code? Resend
        </button>
      </div>
    </div>
  );
}
