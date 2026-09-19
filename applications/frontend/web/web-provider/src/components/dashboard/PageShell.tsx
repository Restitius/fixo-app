import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Menu } from "lucide-react";

import { DashboardSidebar } from "./DashboardSidebar";
import { useProviderAuth } from "@/lib/provider-auth";
import { provider } from "@/lib/mock-data";

interface PageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { session, online, setOnline, logout } = useProviderAuth();
  const navigate = useNavigate();

  const name =
    session?.display_name ||
    [session?.first_name, session?.last_name].filter(Boolean).join(" ") ||
    "Provider";
  const initials =
    name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "P";

  return (
    <div className="h-screen w-full overflow-hidden bg-background p-3 sm:p-4 lg:p-6">
      <div className="flex h-full w-full gap-4 lg:gap-6">
        <DashboardSidebar mobileOpen={mobileNavOpen} onMobileOpenChange={setMobileNavOpen} />

        <main className="flex h-full min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 lg:gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-card shadow-[var(--shadow-xs)] transition-colors hover:bg-muted lg:hidden"
              >
                <Menu className="size-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
                {subtitle && <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setOnline(!online)}
                className={`flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold shadow-[var(--shadow-xs)] transition-colors ${
                  online ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                <span className={`size-2.5 rounded-full ${online ? "bg-success" : "bg-muted-foreground"}`} />
                {online ? "Online" : "Offline"}
              </button>

              <Link
                to="/notifications"
                className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-card shadow-[var(--shadow-xs)] transition-colors hover:bg-muted"
              >
                <Bell className="size-5" />
                <span className="absolute right-3 top-3 size-2 rounded-full bg-destructive ring-2 ring-card" />
              </Link>

              <Link to="/profile" className="flex items-center gap-3 rounded-2xl bg-card p-2 shadow-[var(--shadow-xs)] sm:pr-4">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  {initials}
                </span>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">{provider.level}</p>
                </div>
              </Link>

              <button
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                }}
                title="Sign out"
                className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-card shadow-[var(--shadow-xs)] transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="size-5" />
              </button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-gutter:stable]">{children}</div>
        </main>
      </div>
    </div>
  );
}

/** Card wrapper matching the web-user surface treatment. */
export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-bold tracking-tight">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
