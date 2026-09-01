import { Link, createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Hammer, PackageCheck, Users, Wrench } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { JobsChart } from "@/components/dashboard/JobsChart";
import { ServiceStatistic } from "@/components/dashboard/ServiceStatistic";
import { CoverageGrowth } from "@/components/dashboard/CoverageGrowth";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const title = "FIXO — Handyman Services";
const description =
  "Book trusted handyman providers, track jobs in real time and manage your home maintenance.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Home,
});

// Entry point: landing for guests, dashboard for signed-in customers.
function Home() {
  const { customer, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return customer ? (
    <Dashboard customerName={customer.full_name} onLogout={logout} />
  ) : (
    <Landing />
  );
}

function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Hammer className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">FIXO</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Create account</Link>
          </Button>
        </nav>
      </header>

      <main className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Home repairs,{" "}
          <span className="text-primary">handled by pros you can trust</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Book verified handyman providers, follow every job live and keep your
          whole home in one place.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="h-12 px-8 text-base">
            <Link to="/register">Get started free</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
            <Link to="/login">I already have an account</Link>
          </Button>
        </div>

        <div className="mt-20 grid w-full max-w-3xl gap-6 sm:grid-cols-3">
          {[
            { icon: Wrench, t: "Book a pro", d: "Pick a service and get matched in minutes." },
            { icon: ClipboardList, t: "Track live", d: "Follow arrival, work and completion." },
            { icon: PackageCheck, t: "Pay safely", d: "Funds released only when you confirm." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border bg-card p-6 text-left">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} FIXO. All rights reserved.
      </footer>
    </div>
  );
}

function Dashboard({ customerName, onLogout }: { customerName: string; onLogout: () => void }) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <PageShell
      title={`Welcome back, ${customerName.split(" ")[0]}`}
      subtitle={today}
      userName={customerName}
      onLogout={onLogout}
    >
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <StatCard
              highlight
              icon={Wrench}
              label="Total Spend"
              value="$612.917"
              caption="Services vs last month"
              delta="+2.08%"
            />
            <StatCard
              icon={ClipboardList}
              label="Total Bookings"
              value="34.760"
              caption="Bookings vs last month"
              delta="+6.2%"
            />
            <StatCard
              icon={Users}
              label="Providers Hired"
              value="14.987"
              caption="Providers vs last month"
              delta="-2.08%"
              deltaPositive={false}
            />
            <StatCard
              icon={PackageCheck}
              label="Jobs Completed"
              value="12.987"
              caption="Jobs vs last month"
              delta="+7.6%"
            />
          </div>

          <JobsChart />
        </div>

        <div className="space-y-6">
          <ServiceStatistic />
          <CoverageGrowth />
        </div>
      </div>
    </PageShell>
  );
}
