import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Users,
  Wallet,
  Receipt,
  FileText,
  Settings,
  MessageSquareHeart,
  HelpCircle,
  Gift,
  Sparkles,
  Ticket,
  History,
  Activity,
  Bell,
  X,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

const groups = [
  {
    label: "Menu",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, to: "/" },
      { title: "Bookings", icon: ClipboardList, to: "/bookings" },
      { title: "Services", icon: Wrench, to: "/services" },
      { title: "Providers", icon: Users, to: "/providers" },
    ],
  },
  {
    label: "Financial",
    items: [
      { title: "Wallet", icon: Wallet, to: "/wallet" },
      { title: "Payments", icon: Receipt, to: "/payments" },
      { title: "Invoices", icon: FileText, to: "/invoices" },
      { title: "History", icon: History, to: "/history" },
    ],
  },
  {
    label: "Rewards",
    items: [
      { title: "Loyalty", icon: Sparkles, to: "/loyalty" },
      { title: "Promotions", icon: Ticket, to: "/promotions" },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "Notifications", icon: Bell, to: "/notifications" },
      { title: "Activity", icon: Activity, to: "/activity" },
      { title: "Settings", icon: Settings, to: "/profile" },
      { title: "Feedback", icon: MessageSquareHeart, to: "/feedback" },
      { title: "Help", icon: HelpCircle, to: "/help" },
    ],
  },
];

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <nav className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.title} onClick={onNavigate}>
                  <Link
                    to={item.to}
                    activeProps={{
                      className:
                        "flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-card)]",
                      style: { backgroundImage: "var(--gradient-primary)" },
                    }}
                    inactiveProps={{
                      className:
                        "flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-sidebar-accent",
                    }}
                  >
                    <item.icon className="size-[18px] shrink-0" />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <Link to="/loyalty" onClick={onNavigate} className="mt-3 flex shrink-0 items-center gap-3 rounded-2xl bg-primary/5 p-3 text-left">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Gift className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">Refer &amp; Earn</p>
          <p className="text-xs font-medium text-primary">Invite Now →</p>
        </div>
      </Link>
    </>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Wrench className="size-5" />
      </span>
      <span className="text-xl font-bold tracking-tight">FIXO</span>
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
      <aside className="hidden h-full w-60 shrink-0 flex-col rounded-3xl bg-card p-4 lg:flex">
        <div className="shrink-0 px-2 pb-4 pt-1">
          <Logo />
        </div>
        <SidebarBody />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => onMobileOpenChange?.(false)} />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-card p-4">
            <div className="flex shrink-0 items-center justify-between px-2 pb-4 pt-1">
              <Logo />
              <button
                onClick={() => onMobileOpenChange?.(false)}
                className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
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
