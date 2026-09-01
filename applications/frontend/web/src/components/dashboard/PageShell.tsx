import { Bell, LogOut, Search } from "lucide-react";

import { DashboardSidebar } from "./DashboardSidebar";

interface PageShellProps {
  title: string;
  subtitle?: string;
  userName?: string | undefined;
  onLogout?: () => void;
  children: React.ReactNode;
}

export function PageShell({ title, subtitle, userName, onLogout, children }: PageShellProps) {
  const initials = (userName ?? "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="min-h-screen w-full bg-background p-4 lg:p-6">
      <div className="flex w-full gap-6">
        <DashboardSidebar />

        <main className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <input
                  placeholder="Search here..."
                  className="h-12 w-64 rounded-2xl bg-card pl-5 pr-12 text-sm outline-none placeholder:text-muted-foreground"
                />
                <Search className="absolute right-4 top-1/2 size-5 -translate-y-1/2 text-foreground" />
              </div>
              <button className="relative flex size-12 items-center justify-center rounded-2xl bg-card">
                <Bell className="size-5" />
                <span className="absolute right-3 top-3 size-2 rounded-full bg-destructive" />
              </button>
              {userName && (
                <div className="flex items-center gap-3 rounded-2xl bg-card p-2 pr-4">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
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
                  className="flex size-12 items-center justify-center rounded-2xl bg-card transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="size-5" />
                </button>
              )}
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
