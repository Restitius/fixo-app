import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  Home,
  Repeat2,
  UserRound,
  Wrench,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { AnimatedAuthShell, AuthBrand } from "@/components/auth/AnimatedAuthShell";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Choose how to use FIXO" }] }),
  component: RegistrationRolePage,
});

type Role = "customer" | "provider";
const PROVIDER_APP_URL = import.meta.env["VITE_PROVIDER_APP_URL"] ?? "http://localhost:5190";

function RegistrationRolePage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("customer");

  const continueRegistration = () => {
    if (role === "provider") return void window.location.assign(`${PROVIDER_APP_URL}/register`);
    void navigate({ to: "/register-customer" });
  };

  return (
    <AnimatedAuthShell>
      <section className="mx-auto w-full max-w-[720px] rounded-[26px] bg-white/95 px-5 py-7 shadow-[0_28px_90px_rgba(54,30,116,.16)] backdrop-blur md:px-9 md:py-8">
        <AuthBrand />
        <div className="mt-7 text-center">
          <h1 className="text-3xl font-extrabold tracking-[-.035em] md:text-4xl">
            How would you like to use FIXO?
          </h1>
          <p className="mt-2 text-xl text-[#727694]">
            One account. Choose how you want to continue.
          </p>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {[
            {
              id: "customer" as const,
              icon: UserRound,
              title: "I need services",
              copy: "Book trusted professionals for your home or office.",
              tags: [
                [Home, "Home"],
                [Building2, "Office"],
                [Wrench, "Repairs"],
              ] as const,
            },
            {
              id: "provider" as const,
              icon: BriefcaseBusiness,
              title: "I provide services",
              copy: "Set up your profile and start receiving jobs.",
              tags: [
                [Zap, "Get jobs"],
                [Building2, "Grow"],
                [UserRound, "Earn"],
              ] as const,
            },
          ].map((option) => {
            const selected = role === option.id;
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setRole(option.id)}
                className={`relative min-h-[300px] overflow-hidden rounded-[20px] border-2 p-5 text-center transition md:p-6 ${selected ? "border-[#7a2cff] bg-[#fbf8ff] shadow-[0_16px_40px_rgba(104,24,246,.15)]" : "border-[#e0deea] bg-white hover:border-[#a66cff]"}`}
              >
                <span
                  className={`absolute right-5 top-5 flex size-9 items-center justify-center rounded-full border-2 ${selected ? "border-[#6b1cf4] bg-[#6b1cf4] text-white" : "border-[#abb0c5]"}`}
                >
                  {selected && <Check className="size-5" strokeWidth={3} />}
                </span>
                <span className="mx-auto mt-1 flex size-20 items-center justify-center rounded-[24px] bg-[#efe4ff]">
                  <Icon className="size-10 text-[#651cf4]" strokeWidth={2.2} />
                </span>
                <strong className="mt-6 block text-2xl">{option.title}</strong>
                <p className="mx-auto mt-2 max-w-[290px] text-lg leading-7 text-[#737795]">
                  {option.copy}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {option.tags.map(([TagIcon, label]) => (
                    <span
                      key={label}
                      className="flex items-center gap-2 rounded-full bg-[#f2edff] px-4 py-2 text-sm"
                    >
                      <TagIcon className="size-4 text-[#651cf4]" />
                      {label}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        <button
          onClick={continueRegistration}
          className="mt-6 flex h-14 w-full items-center justify-center gap-4 rounded-2xl bg-gradient-to-r from-[#a149ff] to-[#4f00e7] text-lg font-bold text-white shadow-[0_12px_28px_rgba(91,0,237,.28)]"
        >
          Continue <ArrowRight className="size-7" />
        </button>
        <button
          onClick={() => navigate({ to: "/" })}
          className="mt-4 h-[58px] w-full rounded-2xl border-2 border-[#ddd9e8] text-lg font-bold text-[#651cf4]"
        >
          Maybe later
        </button>
        <p className="mt-6 flex items-center justify-center gap-3 text-center text-sm text-[#707493] md:gap-4">
          <Repeat2 className="size-8 text-[#651cf4]" />
          You can add another role or switch between customer and provider later from your account.
        </p>
      </section>
    </AnimatedAuthShell>
  );
}
