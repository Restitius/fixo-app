// Public provider portal — "Become a Provider".
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Coins,
  Percent,
  ShieldCheck,
  Sparkles,
  UserRoundPlus,
  Wallet,
  Wrench,
} from "lucide-react";

import { commissionTiers, providerBenefits, providerRequirements, serviceCatalog } from "@/lib/mock-data";

const title = "Become a FIXO Provider — Grow Your Service Business";
const description =
  "Join FIXO as an individual handyman, technician, freelancer or registered service company. Get matched with verified customers, quote jobs and get paid securely.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JoinPage,
});

const providerTypes = [
  { label: "Individual handyman", icon: Wrench },
  { label: "Freelancer", icon: Sparkles },
  { label: "Technician", icon: BadgeCheck },
  { label: "Small service business", icon: ClipboardList },
  { label: "Registered company", icon: ShieldCheck },
  { label: "Multi-worker company", icon: UserRoundPlus },
];

const howItWorks = [
  { step: "01", title: "Register", body: "Create your provider account and verify your mobile number and email." },
  { step: "02", title: "Onboard & verify", body: "Seven guided steps: profile, business, identity, services, areas, payment, agreements." },
  { step: "03", title: "Go online", body: "Set your availability and switch to Online to start receiving matched job requests." },
  { step: "04", title: "Work & get paid", body: "Accept or quote, complete the job, get customer sign-off and receive your payout." },
];

function JoinPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-3">
          <img src="/brand/fixo-icon-mark.png" alt="FIXO" className="size-10 object-contain" />
          <div className="leading-tight">
            <span className="block text-lg font-bold tracking-tight">FIXO</span>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary">Provider</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            Start registration
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-20">
        {/* Hero */}
        <section className="mt-4 grid gap-6 rounded-[2rem] bg-card p-6 shadow-[var(--shadow-card)] sm:p-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" /> Now onboarding providers in Dar es Salaam
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Join as a professional and run your whole service business on FIXO.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              FIXO is not just a job board. It is a field-service management system connected to a marketplace of
              verified customers — requests, quotations, scheduling, dispatch, materials, invoices and payouts.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)] transition-transform hover:scale-[1.02]"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                Start registration <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted"
              >
                I already have an account
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { label: "Active providers", value: "3,400+" },
                { label: "Jobs / month", value: "18,900" },
                { label: "Avg. payout time", value: "36 hrs" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold tracking-tight text-primary">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] p-6 text-primary-foreground" style={{ backgroundImage: "var(--gradient-primary)" }}>
            <p className="text-sm font-semibold text-primary-foreground/80">This week on FIXO</p>
            <p className="mt-1 text-3xl font-extrabold">TZS 842,000</p>
            <p className="text-sm text-primary-foreground/80">average top-provider earnings</p>
            <div className="mt-6 space-y-3">
              {[
                { icon: ClipboardList, label: "New requests matched", value: "12" },
                { icon: CalendarDays, label: "Jobs scheduled", value: "7" },
                { icon: Wallet, label: "Paid out", value: "TZS 1.2M" },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-3 rounded-2xl bg-white/15 p-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-white/20">
                    <r.icon className="size-4" />
                  </span>
                  <span className="flex-1 text-sm">{r.label}</span>
                  <span className="text-sm font-bold">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Provider types */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight">Who can join</h2>
          <p className="mt-1 text-sm text-muted-foreground">Individual professionals and registered companies are both supported.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {providerTypes.map((t) => (
              <div key={t.label} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <t.icon className="size-5" />
                </span>
                <p className="text-sm font-semibold">{t.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight">How the platform works</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((s) => (
              <div key={s.step} className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
                <span className="text-sm font-extrabold text-primary">{s.step}</span>
                <h3 className="mt-2 text-base font-bold tracking-tight">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          {providerBenefits.map((b) => (
            <div key={b.title} className="flex gap-4 rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-success/15 text-success">
                <CheckCircle2 className="size-5" />
              </span>
              <div>
                <h3 className="text-base font-bold tracking-tight">{b.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Categories */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold tracking-tight">Supported service categories</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {serviceCatalog.map((c) => (
              <div key={c.category} className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
                <h3 className="text-base font-bold tracking-tight">{c.category}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.items.map((i) => (
                    <span key={i} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Commission */}
        <section className="mt-10 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Percent className="size-5" />
              </span>
              <h2 className="text-xl font-bold tracking-tight">Commission &amp; payment terms</h2>
            </div>
            <table className="mt-5 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 font-semibold">Plan</th>
                  <th className="py-2 font-semibold">Commission</th>
                  <th className="py-2 font-semibold">Payout</th>
                  <th className="py-2 font-semibold">Fee</th>
                </tr>
              </thead>
              <tbody>
                {commissionTiers.map((t) => (
                  <tr key={t.plan} className="border-b border-border/60 last:border-0">
                    <td className="py-3 font-semibold">{t.plan}</td>
                    <td className="py-3 text-primary font-semibold">{t.commission}</td>
                    <td className="py-3 text-muted-foreground">{t.payout}</td>
                    <td className="py-3 text-muted-foreground">{t.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-primary/5 p-4">
              <Coins className="mt-0.5 size-5 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Example: customer pays <strong className="text-foreground">TZS 100,000</strong> → platform commission
                10% → you receive <strong className="text-foreground">TZS 90,000</strong> in your wallet.
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <h2 className="text-xl font-bold tracking-tight">Provider requirements</h2>
            </div>
            <ul className="mt-5 space-y-3">
              {providerRequirements.map((r) => (
                <li key={r} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  <span className="text-muted-foreground">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section
          className="mt-10 flex flex-col items-center rounded-[2rem] p-10 text-center text-primary-foreground"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          <h2 className="text-3xl font-extrabold tracking-tight">Ready to start earning on FIXO?</h2>
          <p className="mt-2 max-w-lg text-sm text-primary-foreground/85">
            Registration takes about 5 minutes. Onboarding is saved automatically — you can leave and continue later.
          </p>
          <Link
            to="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/95 px-6 py-3 text-sm font-bold text-primary transition-transform hover:scale-[1.02]"
          >
            Create provider account <ArrowRight className="size-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
