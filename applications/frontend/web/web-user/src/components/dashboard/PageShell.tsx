import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Menu, Search } from "lucide-react";

import { DashboardSidebar } from "./DashboardSidebar";

interface PageShellProps {
  title: string;
  subtitle?: string;
  userName?: string | undefined;
  onLogout?: () => void;
  children: React.ReactNode;
}

export function PageShell({ title, subtitle, userName, onLogout, children }: PageShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [headerQuery, setHeaderQuery] = useState("");
  const navigate = useNavigate();

  function runHeaderSearch() {
    if (!headerQuery.trim()) return;
    navigate({ to: "/search", search: { q: headerQuery.trim() } });
  }

  const initials = (userName ?? "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

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
                {subtitle && (
                  <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative hidden md:block">
                <input
                  value={headerQuery}
                  onChange={(e) => setHeaderQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runHeaderSearch()}
                  placeholder="Search here..."
                  className="h-12 w-64 rounded-2xl bg-card pl-5 pr-12 text-sm shadow-[var(--shadow-xs)] outline-none ring-primary/30 transition-shadow duration-200 placeholder:text-muted-foreground focus:shadow-[var(--shadow-sm)] focus:ring-2"
                />
                <button
                  onClick={runHeaderSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Search className="size-5" />
                </button>
              </div>
              <button className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-card shadow-[var(--shadow-xs)] transition-colors hover:bg-muted sm:size-12">
                <Bell className="size-5" />
                <span className="absolute right-3 top-3 size-2 rounded-full bg-destructive ring-2 ring-card" />
              </button>
              {userName && (
                <div className="flex items-center gap-3 rounded-2xl bg-card p-2 shadow-[var(--shadow-xs)] sm:pr-4">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
                    style={{ backgroundImage: "var(--gradient-primary)" }}
                  >
                    {initials}
                  </span>
                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-semibold">{userName}</p>
                    <p className="text-xs text-muted-foreground">Customer</p>
                  </div>
                </div>
              )}
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-card shadow-[var(--shadow-xs)] transition-colors hover:bg-destructive/10 hover:text-destructive sm:size-12"
                >
                  <LogOut className="size-5" />
                </button>
              )}
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-gutter:stable]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
