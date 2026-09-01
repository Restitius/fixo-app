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
  Crown,
  Sparkles,
  Ticket,
  History,
  Activity,
  Bell,
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
      { title: "Help", icon: HelpCircle },
    ],
  },
];

export function DashboardSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col justify-between rounded-3xl bg-card p-5 lg:flex">
      <div>
        <div className="mb-8 flex items-center gap-3 px-2 pt-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wrench className="size-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">FIXO</span>
        </div>

        <nav className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) =>
                  item.to ? (
                    <li key={item.title}>
                      <Link
                        to={item.to}
                        activeProps={{
                          className:
                            "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-card)]",
                          style: { backgroundImage: "var(--gradient-primary)" },
                        }}
                        inactiveProps={{
                          className:
                            "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-sidebar-accent",
                        }}
                      >
                        <item.icon className="size-5" />
                        {item.title}
                      </Link>
                    </li>
                  ) : (
                    <li key={item.title}>
                      <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-sidebar-accent">
                        <item.icon className="size-5" />
                        {item.title}
                      </button>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-8 rounded-2xl bg-foreground p-5 text-background">
        <span className="mb-4 flex size-9 items-center justify-center rounded-xl bg-background/15">
          <Crown className="size-4 text-[oklch(0.85_0.16_85)]" />
        </span>
        <p className="text-base font-semibold">Upgrade Pro</p>
        <p className="mt-1 text-xs text-background/70">
          Priority handymen and same-day emergency callouts.
        </p>
        <button
          className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-primary-foreground"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          Upgrade $30
        </button>
      </div>
    </aside>
  );
}
