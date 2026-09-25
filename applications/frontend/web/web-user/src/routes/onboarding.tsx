import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Bolt,
  Check,
  ChevronRight,
  Home,
  Languages,
  MapPin,
  Target,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AnimatedAuthShell, AuthBrand } from "@/components/auth/AnimatedAuthShell";
import { bookingApi, onboardingApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Set up your FIXO account" }] }),
  component: CustomerSetupPage,
});

const cities = ["Dar es Salaam", "Arusha", "Dodoma", "Mwanza", "Mbeya"];

function CustomerSetupPage() {
  const { access_token, loading, customer } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Dar es Salaam");
  const [language, setLanguage] = useState("English");
  const [notifications, setNotifications] = useState(true);
  const [useLocation, setUseLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!access_token || !customer) return;
    void onboardingApi
      .status()
      .then(async (status) => {
        const verify = status.steps.find((step) => step.code === "VERIFY_CONTACT");
        if (verify && !verify.completed && (customer.email_verified || customer.phone_verified)) {
          await onboardingApi.completeStep("VERIFY_CONTACT");
        }
      })
      .catch(() => undefined);
  }, [access_token, customer]);

  if (loading) return <div className="min-h-screen bg-[#f7f4ff]" />;
  if (!access_token || !customer) return <Navigate to="/login" replace />;

  const save = async () => {
    if (!address.trim()) return void toast.error("Enter your home address.");
    setSaving(true);
    try {
      await bookingApi.createAddress({
        label: "Home",
        recipient_name: customer.full_name,
        phone: customer.phone ?? "",
        street_address: address.trim(),
        city,
        region: city,
        postal_code: null,
        latitude: null,
        longitude: null,
        delivery_instructions: null,
        is_default: true,
      });
      await onboardingApi.completeStep("SET_LOCATION");
      toast.success("Your account setup is complete.");
      await navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your setup.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatedAuthShell>
      <section className="relative mx-auto w-full max-w-[680px] rounded-[26px] bg-white/95 px-8 py-7 shadow-[0_28px_90px_rgba(54,30,116,.16)] md:px-11">
        <button
          type="button"
          onClick={() => history.back()}
          aria-label="Go back"
          className="absolute left-7 top-7 flex size-11 items-center justify-center rounded-full bg-white shadow-md"
        >
          <ArrowLeft />
        </button>
        <AuthBrand compact />
        <div className="mx-auto mt-6 grid max-w-[390px] grid-cols-3 text-center text-sm text-[#737795]">
          <Step done label="Verify" number="✓" />
          <Step active label="Set up" number="2" />
          <Step label="Get started" number="3" />
        </div>
        <header className="mt-6 text-center">
          <h1 className="text-3xl font-extrabold">Set up your account</h1>
          <p className="mt-1 text-lg text-[#747997]">
            Tell us where you need services and how we can help.
          </p>
        </header>

        <div className="mt-6 space-y-4">
          <SetupField label="Home address" icon={<Home />}>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="123 Garden Street, Apartment 4B"
            />
          </SetupField>
          <div className="flex items-center justify-between px-1">
            <span className="flex items-center gap-3 text-sm font-medium">
              <MapPin className="size-5 text-[#737b9d]" />
              Use my current location
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={useLocation}
              onClick={() => setUseLocation((value) => !value)}
              className={`relative h-8 w-14 rounded-full transition ${useLocation ? "bg-[#6b1cf4]" : "bg-[#d9dbe6]"}`}
            >
              <span
                className={`absolute top-1 size-6 rounded-full bg-white shadow transition ${useLocation ? "left-7" : "left-1"}`}
              />
            </button>
          </div>
          <SetupField label="City / Area" icon={<MapPin />}>
            <select value={city} onChange={(event) => setCity(event.target.value)}>
              {cities.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </SetupField>
          <SetupField label="Preferred language" icon={<Languages />}>
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              <option>English</option>
              <option>Kiswahili</option>
            </select>
            <ChevronRight className="size-5" />
          </SetupField>
          <button
            type="button"
            onClick={() => setNotifications((value) => !value)}
            className="w-full text-left"
          >
            <SetupField label="Notification preferences" icon={<Bell />}>
              <span className="flex-1 text-[#747997]">
                {notifications
                  ? "Job updates, booking reminders, and special offers"
                  : "Essential account alerts only"}
              </span>
              <ChevronRight className="size-5" />
            </SetupField>
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Benefit icon={<Bolt />} title="Faster booking" copy="Get help when you need it." />
          <Benefit
            icon={<Target />}
            title="Accurate matching"
            copy="Find the right professionals nearby."
          />
          <Benefit
            icon={<Users />}
            title="Local professionals"
            copy="Trusted experts in your area."
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-6 flex h-14 w-full items-center justify-center gap-4 rounded-2xl bg-gradient-to-r from-[#a149ff] to-[#4f00e7] text-lg font-bold text-white shadow-lg disabled:opacity-60"
        >
          {saving ? "Saving…" : "Continue"}
          <ArrowRight />
        </button>
        <button
          type="button"
          onClick={() => history.back()}
          className="mt-3 h-12 w-full rounded-2xl border-2 border-[#deddea] font-bold text-[#651cf4]"
        >
          Back
        </button>
      </section>
    </AnimatedAuthShell>
  );
}

function Step({
  label,
  number,
  active,
  done,
}: {
  label: string;
  number: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center gap-1.5 before:absolute before:left-[65%] before:top-4 before:h-0.5 before:w-[70%] before:bg-[#dedfea] last:before:hidden">
      <span
        className={`relative z-10 flex size-8 items-center justify-center rounded-full border-2 font-bold ${active || done ? "border-[#6b1cf4] bg-[#6b1cf4] text-white" : "border-[#cfd2e2] bg-white"}`}
      >
        {done ? <Check className="size-4" /> : number}
      </span>
      <strong className={active ? "text-[#651cf4]" : "font-medium"}>{label}</strong>
    </div>
  );
}

function SetupField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <span className="flex h-12 items-center rounded-xl border border-[#d8dbea] px-4 text-[#737b9d] [&>svg]:mr-3 [&>svg]:size-5 [&>input]:min-w-0 [&>input]:flex-1 [&>input]:outline-none [&>select]:min-w-0 [&>select]:flex-1 [&>select]:appearance-none [&>select]:bg-transparent [&>select]:outline-none">
        {icon}
        {children}
      </span>
    </label>
  );
}

function Benefit({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[#f6f1ff] p-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eadfff] text-[#651cf4]">
        {icon}
      </span>
      <span>
        <strong className="block text-xs">{title}</strong>
        <small className="mt-0.5 block leading-4 text-[#747997]">{copy}</small>
      </span>
    </div>
  );
}
