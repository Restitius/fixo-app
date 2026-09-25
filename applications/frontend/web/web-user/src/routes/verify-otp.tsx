import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Mail, MessageCircleMore, ShieldCheck, Smartphone } from "lucide-react";
import { type ClipboardEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AnimatedAuthShell, AuthBrand } from "@/components/auth/AnimatedAuthShell";
import { useAuth } from "@/lib/auth-context";

interface VerifyOtpSearch {
  email: string;
  otp_from_register?: string;
}

export const Route = createFileRoute("/verify-otp")({
  validateSearch: (search: Record<string, unknown>): VerifyOtpSearch => ({
    email: typeof search["email"] === "string" ? search["email"] : "",
    ...(typeof search["otp_from_register"] === "string"
      ? { otp_from_register: search["otp_from_register"] }
      : {}),
  }),
  head: () => ({ meta: [{ title: "Verify your FIXO account" }] }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const { email, otp_from_register } = Route.useSearch();
  const { verifyOtp, requestOtp } = useAuth();
  const navigate = useNavigate();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(45);
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (otp_from_register) toast.info(`Development verification code: ${otp_from_register}`);
  }, [otp_from_register]);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds]);

  const updateDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((item, position) => (position === index ? digit : item)));
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  };
  const keyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0)
      inputs.current[index - 1]?.focus();
  };
  const paste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    setDigits(Array.from({ length: 6 }, (_, index) => pasted[index] ?? ""));
    inputs.current[Math.min(pasted.length, 6) - 1]?.focus();
  };
  const submit = async () => {
    const code = digits.join("");
    if (!email) return void toast.error("Return to registration and enter your email address.");
    if (code.length !== 6) return void toast.error("Enter the complete 6-digit code.");
    setSubmitting(true);
    try {
      await verifyOtp(email, code);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed.");
    } finally {
      setSubmitting(false);
    }
  };
  const resend = async () => {
    if (seconds > 0 || !email) return;
    try {
      const code = await requestOtp(email);
      toast.success(code ? `New development code: ${code}` : "A new verification code was sent.");
      setSeconds(45);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resend the code.");
    }
  };

  return (
    <AnimatedAuthShell>
      <section className="mx-auto w-full max-w-[590px] overflow-hidden rounded-[26px] bg-white/95 px-7 pb-0 pt-7 shadow-[0_28px_90px_rgba(54,30,116,.16)] backdrop-blur md:px-11">
        <AuthBrand compact />
        <div className="mx-auto mt-8 flex max-w-[280px] gap-1.5">
          {Array.from({ length: 7 }, (_, index) => (
            <span
              key={index}
              className={`h-2 flex-1 rounded-full ${index < 3 ? "bg-[#7b27f5]" : "bg-[#e7e7ef]"}`}
            />
          ))}
        </div>
        <header className="mt-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-[-.035em]">Verify your account</h1>
          <p className="mx-auto mt-2 max-w-lg text-lg text-[#777b98]">
            We’ve sent a 6-digit code to
            <br />
            <strong className="text-[#363a5b]">{email || "your email address"}</strong>.
          </p>
        </header>
        <div className="mt-8 flex justify-center gap-2 md:gap-3">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(node) => {
                inputs.current[index] = node;
              }}
              value={digit}
              onChange={(event) => updateDigit(index, event.target.value)}
              onKeyDown={(event) => keyDown(index, event)}
              onPaste={paste}
              inputMode="numeric"
              aria-label={`Verification digit ${index + 1}`}
              className="size-[42px] rounded-xl border-2 border-[#dedfeb] bg-white text-center text-xl font-bold outline-none transition focus:border-[#6b1cf4] focus:shadow-[0_7px_20px_rgba(94,22,240,.16)] sm:size-[58px] md:size-[68px] md:text-2xl"
            />
          ))}
        </div>
        <p className="mt-5 text-center text-base text-[#777b98]">
          Didn’t receive the code?{" "}
          <button
            type="button"
            onClick={resend}
            disabled={seconds > 0}
            className="font-semibold text-[#5b18ed] disabled:text-[#777b98]"
          >
            Resend{seconds > 0 && ` in 00:${String(seconds).padStart(2, "0")}`}
          </button>
        </p>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="mt-8 flex h-14 w-full items-center justify-center gap-4 rounded-2xl bg-gradient-to-r from-[#a149ff] to-[#4f00e7] text-lg font-bold text-white shadow-[0_11px_24px_rgba(91,0,237,.25)] disabled:opacity-60"
        >
          {submitting ? "Verifying…" : "Verify"}
          <ArrowRight className="size-6" />
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/register-customer" })}
          className="mt-4 h-14 w-full rounded-2xl border-2 border-[#ddd9e8] text-base font-bold text-[#651cf4]"
        >
          Use a different email address
        </button>
        <div className="relative mx-auto mt-6 h-[290px] max-w-[430px]" aria-hidden="true">
          <span className="absolute left-6 top-24 flex size-20 -rotate-12 items-center justify-center rounded-2xl bg-[#8b3cff] text-white shadow-xl">
            <Mail className="size-10" />
          </span>
          <span className="absolute left-20 top-4 flex size-24 rotate-[-8deg] items-center justify-center rounded-3xl bg-[#6921ec] text-white shadow-xl">
            <MessageCircleMore className="size-12" />
          </span>
          <span className="absolute left-1/2 top-5 flex h-[300px] w-[160px] -translate-x-1/2 rotate-[8deg] items-center justify-center rounded-[38px] border-[9px] border-[#5a28bf] bg-[#f8f4ff] shadow-[0_20px_50px_rgba(87,35,181,.26)]">
            <Smartphone className="size-20 text-[#c9b4fc]" />
            <ShieldCheck className="absolute size-24 fill-[#7027e8] text-white" />
          </span>
          <span className="absolute right-8 top-32 flex size-24 rotate-6 items-center justify-center rounded-2xl bg-white text-[#6820ec] shadow-xl">
            <Check className="size-12" strokeWidth={3} />
          </span>
        </div>
      </section>
    </AnimatedAuthShell>
  );
}
