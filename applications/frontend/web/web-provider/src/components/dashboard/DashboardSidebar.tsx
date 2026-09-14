import {
  Activity,
  BadgeCheck,
  Bell,
  Briefcase,
  CalendarDays,
  ClipboardList,
  FileText,
  Gauge,
  HelpCircle,
  Images,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  MapPinned,
  MessageCircle,
  Receipt,
  Settings,
  Star,
  Tags,
  Users,
  Wallet,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useProviderAuth } from "@/lib/provider-auth";
import { fixoSdk } from "@/lib/api-client";

const groups = [
  {
    label: "Work",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
      { title: "Requests", icon: Inbox, to: "/requests" },
      { title: "Quotes", icon: FileText, to: "/quotes" },
      { title: "Bookings", icon: ClipboardList, to: "/bookings" },
      { title: "Calendar", icon: CalendarDays, to: "/calendar" },
      { title: "Messages", icon: MessageCircle, to: "/messages" },
    ],
  },
  {
    label: "Business",
    items: [
      { title: "Services", icon: Wrench, to: "/services" },
      { title: "Pricing", icon: Tags, to: "/pricing" },
      { title: "Service Areas", icon: MapPinned, to: "/service-areas" },
      { title: "Availability", icon: Zap, to: "/availability" },
      { title: "Customers", icon: Users, to: "/customers" },
      { title: "Team", icon: Briefcase, to: "/team" },
    ],
  },
  {
    label: "Money",
    items: [
      { title: "Wallet", icon: Wallet, to: "/wallet" },
      { title: "Earnings", icon: Gauge, to: "/earnings" },
      { title: "Payouts", icon: Receipt, to: "/payouts" },
      { title: "Invoices", icon: FileText, to: "/invoices" },
    ],
  },
  {
    label: "Reputation",
    items: [
      { title: "Reviews", icon: Star, to: "/reviews" },
      { title: "Performance", icon: Activity, to: "/performance" },
      { title: "Portfolio", icon: Images, to: "/portfolio" },
      { title: "Profile", icon: BadgeCheck, to: "/profile" },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Documents", icon: BadgeCheck, to: "/documents" },
      { title: "Notifications", icon: Bell, to: "/notifications" },
      { title: "Support", icon: LifeBuoy, to: "/support" },
      { title: "Settings", icon: Settings, to: "/settings" },
    ],
  },
];

function useUnreadNotificationCount(): number {
  const { access_token, loading } = useProviderAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!access_token || loading) return;
    let cancelled = false;
    const poll = () => {
      fixoSdk
        .notificationUnread()
        .then((r) => {
          if (!cancelled) setCount(r.unread_count);
        })
        .catch(() => {
          // non-fatal — badge just stays at its last known value
        });
    };
    poll();
    const interval = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [access_token, loading]);

  return count;
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const unreadCount = useUnreadNotificationCount();
  return (
    <>
      <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-0.5 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.title} onClick={onNavigate}>
                  <Link
                    to={item.to}
                    activeProps={{
                      className:
                        "flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] transition-all duration-200 ease-[var(--ease-premium)]",
                      style: { backgroundImage: "var(--gradient-primary)" },
                    }}
                    inactiveProps={{
                      className:
                        "flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-sm font-medium text-foreground/80 transition-all duration-200 ease-[var(--ease-premium)] hover:translate-x-0.5 hover:bg-sidebar-accent",
                    }}
                  >
                    <item.icon className="size-[18px] shrink-0" />
                    <span className="flex-1">{item.title}</span>
                    {item.to === "/notifications" && unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-destructive-foreground">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <Link
        to="/support"
        onClick={onNavigate}
        className="mt-2 flex shrink-0 items-center gap-3 rounded-2xl bg-primary/5 p-2.5 text-left shadow-[var(--shadow-xs)] transition-all duration-200 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HelpCircle className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Provider support</p>
          <p className="text-xs font-medium text-primary">Get help →</p>
        </div>
      </Link>
    </>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex size-9 items-center justify-center rounded-xl text-primary-foreground shadow-[var(--shadow-glow)]"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      >
        <Wrench className="size-5" />
      </span>
      <div className="leading-tight">
        <span className="block text-xl font-bold tracking-tight">FIXO</span>
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-primary">Provider</span>
      </div>
    </div>
  );
}

export function DashboardSidebar({
  mobileOpen = false,
  onMobileOpenChange,
}: {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}) {
  return (
    <>
      <aside className="hidden h-full w-60 shrink-0 flex-col rounded-3xl bg-card p-4 shadow-[var(--shadow-card)] lg:flex">
        <div className="shrink-0 px-2 pb-3 pt-1">
          <Logo />
        </div>
        <SidebarBody />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-in fade-in bg-black/50 duration-200"
            onClick={() => onMobileOpenChange?.(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] animate-in slide-in-from-left flex-col bg-card p-4 shadow-[var(--shadow-lg)] duration-300 ease-[var(--ease-premium)]">
            <div className="flex shrink-0 items-center justify-between px-2 pb-4 pt-1">
              <Logo />
              <button
                onClick={() => onMobileOpenChange?.(false)}
                className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <SidebarBody onNavigate={() => onMobileOpenChange?.(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
