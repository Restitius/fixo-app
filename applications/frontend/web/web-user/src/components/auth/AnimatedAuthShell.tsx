import type { ReactNode } from "react";

export function AnimatedAuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-wave-stage relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-[#111333]">
      <div className="auth-wave auth-wave-one" />
      <div className="auth-wave auth-wave-two" />
      <div className="auth-wave auth-wave-three" />
      <div className="auth-dot-grid left-[6%] top-[23%]" />
      <div className="auth-dot-grid bottom-[18%] right-[6%]" />
      <div className="relative z-10 w-full">{children}</div>
    </main>
  );
}

export function AuthBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <img src="/favicon-32x32.png" alt="FIXO" className={compact ? "size-11" : "size-14"} />
      <span className="text-left">
        <strong
          className={compact ? "block text-3xl leading-none" : "block text-[40px] leading-none"}
        >
          FIXO
        </strong>
        <small className="mt-1 block text-xs text-[#707493]">Home services made simple</small>
      </span>
    </div>
  );
}
