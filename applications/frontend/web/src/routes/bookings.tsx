import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Droplets,
  Lock,
  MapPin,
  MoreHorizontal,
  PaintRoller,
  Search,
  SlidersHorizontal,
  TrendingUp,
  WashingMachine,
  Wind,
  Zap,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const title = "My Bookings — FIXO";
const description = "View and manage your handyman bookings, appointments and service history.";

export const Route = createFileRoute("/bookings")({
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
  component: BookingsPage,
});

type Status = "Confirmed" | "Pending" | "Completed" | "Cancelled";

const STATUS_STYLES: Record<Status, string> = {
  Confirmed: "bg-success-muted text-success-foreground",
  Pending: "bg-[oklch(0.85_0.14_80)] text-[oklch(0.42_0.12_70)]",
  Completed: "bg-muted text-muted-foreground",
  Cancelled: "bg-destructive/12 text-destructive",
};

const BOOKINGS: {
  id: string;
  service: string;
  detail: string;
  icon: typeof Droplets;
  iconBg: string;
  iconColor: string;
  date: string;
  time: string;
  address: string;
  provider: string;
  rating: number;
  status: Status;
  amount: string;
}[] = [
  {
    id: "BK-1024",
    service: "Plumbing Repair",
    detail: "Leak Fix",
    icon: Droplets,
    iconBg: "bg-[oklch(0.93_0.04_240)]",
    iconColor: "text-[oklch(0.55_0.16_240)]",
    date: "Aug 26, 2026",
    time: "10:00 AM",
    address: "12 Riverside Ave, Austin, TX 78701",
    provider: "Mike Ross",
    rating: 4.8,
    status: "Confirmed",
    amount: "$85.00",
  },
  {
    id: "BK-1023",
    service: "Electrical Inspection",
    detail: "Home Inspection",
    icon: Zap,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    date: "Aug 28, 2026",
    time: "02:30 PM",
    address: "12 Riverside Ave, Austin, TX 78701",
    provider: "Sarah Lin",
    rating: 4.9,
    status: "Pending",
    amount: "$120.00",
  },
  {
    id: "BK-1022",
    service: "Bathroom Installation",
    detail: "Full Installation",
    icon: Droplets,
    iconBg: "bg-[oklch(0.93_0.04_240)]",
    iconColor: "text-[oklch(0.55_0.16_240)]",
    date: "Sep 02, 2026",
    time: "11:00 AM",
    address: "45 Maple St, Austin, TX 78703",
    provider: "David Brown",
    rating: 4.7,
    status: "Confirmed",
    amount: "$450.00",
  },
  {
    id: "BK-1021",
    service: "Wall Painting",
    detail: "2 Bedrooms",
    icon: PaintRoller,
    iconBg: "bg-[oklch(0.93_0.09_75)]",
    iconColor: "text-[oklch(0.55_0.16_60)]",
    date: "Sep 05, 2026",
    time: "09:00 AM",
    address: "98 Oak Dr, Austin, TX 78704",
    provider: "John White",
    rating: 4.6,
    status: "Confirmed",
    amount: "$300.00",
  },
  {
    id: "BK-1019",
    service: "Appliance Repair",
    detail: "Washing Machine",
    icon: WashingMachine,
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    date: "Sep 08, 2026",
    time: "04:00 PM",
    address: "12 Riverside Ave, Austin, TX 78701",
    provider: "Emily Clark",
    rating: 4.8,
    status: "Completed",
    amount: "$95.00",
  },
  {
    id: "BK-1018",
    service: "Door Lock Repair",
    detail: "Lock Replacement",
    icon: Lock,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    date: "Sep 10, 2026",
    time: "01:00 PM",
    address: "77 Pine St, Austin, TX 78702",
    provider: "James Smith",
    rating: 4.5,
    status: "Cancelled",
    amount: "$75.00",
  },
  {
    id: "BK-1017",
    service: "AC Maintenance",
    detail: "General Service",
    icon: Wind,
    iconBg: "bg-[oklch(0.92_0.06_190)]",
    iconColor: "text-[oklch(0.55_0.1_190)]",
    date: "Sep 12, 2026",
    time: "10:30 AM",
    address: "12 Riverside Ave, Austin, TX 78701",
    provider: "Chris Lee",
    rating: 4.9,
    status: "Completed",
    amount: "$135.00",
  },
];

const TABS = ["Upcoming", "Completed", "Cancelled"] as const;

const STATS = [
  { icon: Calendar, iconBg: "bg-primary/10", iconColor: "text-primary", value: "3", label: "Upcoming Bookings" },
  { icon: CheckCircle2, iconBg: "bg-success-muted", iconColor: "text-success-foreground", value: "12", label: "Completed This Month" },
  { icon: CreditCard, iconBg: "bg-[oklch(0.93_0.09_75)]", iconColor: "text-[oklch(0.55_0.16_60)]", value: "$120.00", label: "Pending Payments" },
  { icon: TrendingUp, iconBg: "bg-primary/10", iconColor: "text-primary", value: "$1,560.00", label: "Total Spent" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = ["#7210FF", "#00B894", "#0984E3", "#E17055", "#FDCB6E", "#A29BFE", "#FF6B35"];
function avatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function BookingsPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Upcoming");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  const services = useMemo(() => Array.from(new Set(BOOKINGS.map((b) => b.service))), []);

  const filtered = BOOKINGS.filter((b) => {
    const matchesTab =
      activeTab === "Upcoming" ? b.status === "Confirmed" || b.status === "Pending" : b.status === activeTab;
    const matchesSearch =
      !search ||
      [b.service, b.id, b.provider].some((f) => f.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    const matchesService = serviceFilter === "all" || b.service === serviceFilter;
    return matchesTab && matchesSearch && matchesStatus && matchesService;
  });

  return (
    <PageShell title="My Bookings" subtitle="Track your appointments and service history">
      {/* Tabs */}
      <div className="mt-6 inline-flex rounded-2xl bg-card p-1.5 shadow-[var(--shadow-card)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab ? "text-primary-foreground" : "text-foreground/70 hover:text-foreground"
            }`}
            style={activeTab === tab ? { backgroundImage: "var(--gradient-primary)" } : undefined}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]">
            <span className={`flex size-11 items-center justify-center rounded-2xl ${s.iconBg} ${s.iconColor}`}>
              <s.icon className="size-5" />
            </span>
            <p className="mt-4 text-2xl font-bold tracking-tight">{s.value}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{s.label}</p>
            <button className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              View details <ArrowRight className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-3xl bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="relative min-w-[220px] flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookings..."
            className="h-11 w-full rounded-xl bg-muted pl-4 pr-11 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Search className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-11 w-[150px] rounded-xl border-0 bg-muted">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Confirmed">Confirmed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="h-11 w-[170px] rounded-xl border-0 bg-muted">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            {services.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="h-11 w-[160px] rounded-xl border-0 bg-muted">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any time</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>

        <button className="ml-auto flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-primary-foreground" style={{ backgroundImage: "var(--gradient-primary)" }}>
          <Download className="size-4" /> Export
        </button>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-4 font-semibold">Service</th>
                <th className="px-4 py-4 font-semibold">Booking ID</th>
                <th className="px-4 py-4 font-semibold">Schedule</th>
                <th className="px-4 py-4 font-semibold">Address</th>
                <th className="px-4 py-4 font-semibold">Provider</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 font-semibold">Amount</th>
                <th className="px-4 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${b.iconBg} ${b.iconColor}`}>
                        <b.icon className="size-5" />
                      </span>
                      <div>
                        <p className="font-semibold">{b.service}</p>
                        <p className="text-xs text-muted-foreground">{b.detail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-semibold text-primary">{b.id}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      {b.date}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="size-3.5" />
                      {b.time}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-1.5 text-muted-foreground">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" />
                      <span className="max-w-[180px]">{b.address}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex size-8 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: avatarColor(b.provider) }}
                      >
                        {initials(b.provider)}
                      </span>
                      <div>
                        <p className="font-medium">{b.provider}</p>
                        <p className="text-xs text-muted-foreground">★ {b.rating}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold">{b.amount}</td>
                  <td className="px-4 py-4 text-right">
                    <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted">
                      <MoreHorizontal className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                    No bookings match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Showing 1 to {filtered.length} of {filtered.length} bookings
          </p>
          <div className="flex items-center gap-2">
            <button className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
              <ChevronLeft className="size-4" />
            </button>
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              1
            </span>
            <button className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
