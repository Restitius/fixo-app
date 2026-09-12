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
  Bookmark,
  Calendar,
  MessageCircle,
  X,
  Home,
  Hammer,
  ShieldCheck,
  Repeat,
  Scale,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

const groups = [
  {
    label: "Menu",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, to: "/" },
      { title: "Bookings", icon: ClipboardList, to: "/bookings" },
      { title: "Calendar", icon: Calendar, to: "/calendar" },
      { title: "Services", icon: Wrench, to: "/services" },
      { title: "Providers", icon: Users, to: "/providers" },
      { title: "Bookmarks", icon: Bookmark, to: "/bookmarks" },
    ],
  },
  {
    label: "Property",
    items: [
      { title: "Properties", icon: Home, to: "/properties" },
      { title: "Maintenance", icon: Hammer, to: "/maintenance" },
      { title: "Warranties", icon: ShieldCheck, to: "/warranties" },
    ],
  },
  {
    label: "Financial",
    items: [
      { title: "Wallet", icon: Wallet, to: "/wallet" },
      { title: "Payments", icon: Receipt, to: "/payments" },
      { title: "Invoices", icon: FileText, to: "/invoices" },
      { title: "History", icon: History, to: "/history" },
      { title: "Recurring Services", icon: Repeat, to: "/recurring" },
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
      { title: "Inbox", icon: MessageCircle, to: "/inbox" },
      { title: "Notifications", icon: Bell, to: "/notifications" },
      { title: "Activity", icon: Activity, to: "/activity" },
      { title: "Disputes", icon: Scale, to: "/disputes" },
      { title: "Settings", icon: Settings, to: "/profile" },
      { title: "Feedback", icon: MessageSquareHeart, to: "/feedback" },
      { title: "Help", icon: HelpCircle, to: "/help" },
    ],
  },
];

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
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
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <Link
        to="/loyalty"
        onClick={onNavigate}
        className="mt-2 flex shrink-0 items-center gap-3 rounded-2xl bg-primary/5 p-2.5 text-left shadow-[var(--shadow-xs)] transition-all duration-200 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
      >
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
      <span
        className="flex size-9 items-center justify-center rounded-xl text-primary-foreground shadow-[var(--shadow-glow)]"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      >
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
