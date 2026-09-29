import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Calendar,
  ClipboardList,
  Clock,
  CreditCard,
  Droplets,
  Hammer,
  PackageCheck,
  Paintbrush,
  Sparkles,
  Truck,
  Users,
  Wallet as WalletIcon,
  Wind,
  Wrench,
  Search,
  Bell,
  Grid2X2,
  Heart,
  House,
  UserRound,
  ChevronRight,
  Bolt,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/button";
import { LandingPage } from "@/components/landing/LandingPage";
import { AnimatedAuthShell, AuthBrand } from "@/components/auth/AnimatedAuthShell";
import { useAuth } from "@/lib/auth-context";
import {
  bookingApi,
  fixoSdk,
  type ActivityEvent,
  type BookingHistoryRow,
  type CatalogCategory,
  type HomeDashboard,
  type WalletBalance,
} from "@/lib/api-client";
import { fmtDate, fmtMoney, humanize, timeAgo } from "@/lib/format";

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

// The public root is always the marketing landing page. Authenticated customers
// enter the application through /dashboard so a saved session cannot replace
// the public homepage with the legacy dashboard.
function Home() {
  return <Landing />;
}

function Landing() {
  return <LandingPage />;
}

export function CustomerQuickHome({
  customerName,
  onLogout,
}: {
  customerName: string;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const firstName = customerName.trim().split(/\s+/)[0] || "there";
  const [home, setHome] = useState<HomeDashboard | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void fixoSdk
      .homeDashboard()
      .then(setHome)
      .catch(() => setHome(null));
    void bookingApi
      .catalogCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const submitSearch = () => {
    const q = query.trim();
    void navigate({ to: "/search", search: q ? { q } : {} });
  };
  const unread = home?.quick_stats.unread_notifications ?? 0;
  const activeBooking = home?.active_bookings[0];
  const actions = [
    {
      icon: ClipboardList,
      title: "Book a service",
      copy: "Find and hire trusted pros.",
      to: "/services",
    },
    { icon: Grid2X2, title: "Browse services", copy: "Explore all categories.", to: "/services" },
    { icon: Calendar, title: "Track bookings", copy: "View your upcoming jobs.", to: "/bookings" },
    { icon: Heart, title: "Saved providers", copy: "Keep your favorite pros.", to: "/bookmarks" },
  ];
  // Real catalogue data: the four categories with the most providers, priced from
  // the cheapest active offer (no invented prices).
  const services = [...categories]
    .filter((c) => c.min_price != null)
    .sort((a, b) => (b.provider_count ?? 0) - (a.provider_count ?? 0))
    .slice(0, 4)
    .map((c, index) => ({
      icon: iconForService(c.name),
      title: c.name,
      price: `From ${fmtMoney(c.min_price ?? 0, "TZS")}`,
      color: [
        "text-[#7828ef] bg-[#f0e8ff]",
        "text-blue-500 bg-blue-50",
        "text-orange-500 bg-orange-50",
        "text-pink-500 bg-pink-50",
      ][index % 4]!,
    }));

  return (
    <AnimatedAuthShell>
      <section className="mx-auto w-full max-w-[570px] overflow-hidden rounded-[30px] bg-white/95 shadow-[0_28px_90px_rgba(54,30,116,.16)]">
        <div className="relative px-8 pb-5 pt-7">
          <div className="flex items-center justify-between">
            <AuthBrand compact />
            <button
              type="button"
              onClick={() => navigate({ to: "/notifications" })}
              className="relative flex size-11 items-center justify-center rounded-full bg-[#f4efff]"
            >
              <Bell className="size-5" />
              {unread > 0 && (
                <span
                  data-testid="home-unread-badge"
                  className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-[#6b1cf4] px-1 text-[11px] font-bold text-white"
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
          </div>
          <div className="relative mt-7 min-h-[120px]">
            <p className="text-lg text-[#666d90]">Welcome to FIXO,</p>
            <h1 className="text-4xl font-extrabold">{firstName} 👋</h1>
            <p className="mt-1 max-w-[300px] text-lg text-[#747997]">
              Find trusted professionals for your home or office.
            </p>
            <House className="absolute bottom-0 right-4 size-28 fill-[#eee6ff] text-[#7a35ed] opacity-90" />
          </div>
          <div className="mt-5 flex h-16 items-center rounded-2xl border border-[#e4e1ee] bg-white px-5 shadow-lg">
            <Search className="size-6 text-[#651cf4]" />
            <input
              className="ml-4 min-w-0 flex-1 text-lg outline-none"
              placeholder="What service do you need?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch();
              }}
            />
            <button
              type="button"
              aria-label="Search"
              onClick={submitSearch}
              className="flex size-11 items-center justify-center rounded-full bg-[#651cf4] text-white"
            >
              <ArrowRight />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Cleaning", "Plumbing", "Electrical", "Painting"].map((item) => (
              <button
                key={item}
                onClick={() => navigate({ to: "/search", search: { q: item } })}
                className="rounded-full bg-[#f5f1fc] px-5 py-2 text-sm"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 px-5">
          {actions.map(({ icon: Icon, title, copy, to }) => (
            <button
              key={title}
              onClick={() => navigate({ to })}
              className="flex min-h-[120px] items-center gap-4 rounded-2xl border border-[#e2e1ea] p-4 text-left"
            >
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#f0e8ff] text-[#651cf4]">
                <Icon />
              </span>
              <span className="min-w-0">
                <strong className="block leading-5">{title}</strong>
                <small className="mt-1 block text-[#767b98]">{copy}</small>
              </span>
              <ChevronRight className="ml-auto size-5 shrink-0 text-[#8a90aa]" />
            </button>
          ))}
        </div>
        {activeBooking && (
          <button
            type="button"
            data-testid="home-active-booking"
            onClick={() => navigate({ to: "/bookings" })}
            className="mx-5 mt-5 flex w-[calc(100%-2.5rem)] items-center gap-4 rounded-2xl bg-[#f5f1fc] p-4 text-left"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-[#651cf4]">
              <Calendar />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate">
                {activeBooking.service_name ?? "Your booking"}
                {activeBooking.provider_name ? ` · ${activeBooking.provider_name}` : ""}
              </strong>
              <small className="text-[#767b98]">
                {humanize(activeBooking.status)}
                {activeBooking.scheduled_date ? ` · ${fmtDate(activeBooking.scheduled_date)}` : ""}
                {(home?.quick_stats.active_bookings ?? 0) > 1
                  ? ` · +${(home?.quick_stats.active_bookings ?? 1) - 1} more`
                  : ""}
              </small>
            </span>
            <ChevronRight className="size-5 shrink-0 text-[#8a90aa]" />
          </button>
        )}
        <div className="px-5 pb-5 pt-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Popular services</h2>
            <button
              onClick={() => navigate({ to: "/services" })}
              className="font-semibold text-[#651cf4]"
            >
              See all ›
            </button>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {services.map(({ icon: Icon, title, price, color }) => (
              <button
                key={title}
                onClick={() => navigate({ to: "/services" })}
                className="rounded-2xl border border-[#e2e1ea] p-3 text-left"
              >
                <span className={`flex size-12 items-center justify-center rounded-xl ${color}`}>
                  <Icon />
                </span>
                <strong className="mt-2 block text-sm leading-4">{title}</strong>
                <small className="mt-1 block text-[#777c99]">{price}</small>
              </button>
            ))}
          </div>
        </div>
        <nav className="grid grid-cols-4 rounded-t-[28px] border-t border-[#ebe8f2] bg-white px-4 py-3 shadow-[0_-8px_25px_rgba(40,30,90,.06)]">
          <NavButton icon={<House />} label="Home" active />
          <NavButton
            icon={<Calendar />}
            label="Bookings"
            onClick={() => navigate({ to: "/bookings" })}
          />
          <NavButton
            icon={<Heart />}
            label="Saved"
            onClick={() => navigate({ to: "/bookmarks" })}
          />
          <NavButton
            icon={<UserRound />}
            label="Profile"
            onClick={() => navigate({ to: "/profile" })}
          />
        </nav>
      </section>
    </AnimatedAuthShell>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-xs ${active ? "bg-[#f1eaff] font-bold text-[#651cf4]" : "text-[#777c99]"}`}
    >
      {icon}
      {label}
    </button>
  );
}

// ---- Dashboard — every number below is derived from the customer's real
// bookingHistory/wallet/activity data, aggregated client-side (there's no
// analytics endpoint) rather than fabricated. -------------------------------

const ACTIVE_STATUSES = new Set([
  "CONFIRMED",
  "PAYMENT_AUTHORIZED",
  "ON_THE_WAY",
  "ARRIVED",
  "STARTED",
  "IN_PROGRESS",
  "COMPLETION_REQUESTED",
  "CUSTOMER_CONFIRMED",
  "PAID",
]);

function iconForService(name?: string | null) {
  const n = (name ?? "").toLowerCase();
  if (n.includes("plumb") || n.includes("leak") || n.includes("water") || n.includes("pipe"))
    return Droplets;
  if (n.includes("electr") || n.includes("wiring")) return Sparkles;
  if (n.includes("clean")) return Sparkles;
  if (n.includes("paint")) return Paintbrush;
  if (n.includes("mov")) return Truck;
  if (n.includes("ac") || n.includes("air")) return Wind;
  return Hammer;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function lastNMonths(n: number) {
  const out: { key: string; label: string; year: number; month: number }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: monthKey(d),
      label: d.toLocaleString("en-US", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return out;
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

function StatCard({
  icon: Icon,
  label,
  value,
  pct,
  series,
  highlight,
}: {
  icon: typeof Wrench;
  label: string;
  value: string;
  pct: number;
  series: { v: number }[];
  highlight?: boolean;
}) {
  const { t } = useTranslation("home");
  const positive = pct >= 0;
  return (
    <div
      className={`rounded-3xl p-5 shadow-[var(--shadow-card)] ${highlight ? "text-primary-foreground" : "bg-card"}`}
      style={highlight ? { backgroundImage: "var(--gradient-primary)" } : undefined}
    >
      <div className="flex items-center justify-between">
        <span
          className={`flex size-10 items-center justify-center rounded-xl ${highlight ? "bg-white/15" : "bg-primary/10 text-primary"}`}
        >
          <Icon className="size-5" />
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            highlight
              ? "bg-white/20"
              : positive
                ? "bg-success-muted text-success-foreground"
                : "bg-destructive text-destructive-foreground"
          }`}
        >
          {positive ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
        </span>
      </div>
      <p
        className={`mt-4 text-sm ${highlight ? "text-primary-foreground/90" : "text-muted-foreground"}`}
      >
        {label}
      </p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <div className="mt-1 h-8">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <Area
              type="monotone"
              dataKey="v"
              stroke={highlight ? "white" : "var(--primary)"}
              fill={highlight ? "white" : "var(--primary)"}
              fillOpacity={highlight ? 0.25 : 0.15}
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p
        className={`text-xs ${highlight ? "text-primary-foreground/70" : "text-muted-foreground"}`}
      >
        {t("dashboard.vsLastMonth")}
      </p>
    </div>
  );
}

function Dashboard({ customerName, onLogout }: { customerName: string; onLogout: () => void }) {
  const { t, i18n } = useTranslation("home");
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingHistoryRow[] | null>(null);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [walletCreditedThisMonth, setWalletCreditedThisMonth] = useState(0);
  const [activity, setActivity] = useState<ActivityEvent[] | null>(null);

  useEffect(() => {
    void fixoSdk
      .bookingHistory(undefined, 100, 0)
      .then(setBookings)
      .catch(() => setBookings([]));
    void fixoSdk
      .walletBalance()
      .then(setWallet)
      .catch(() => setWallet(null));
    void fixoSdk
      .walletTransactions(100, 0)
      .then((txns) => {
        const now = new Date();
        const sum = txns
          .filter(
            (t) =>
              t.entry_type === "CREDIT" &&
              new Date(t.created_at).getMonth() === now.getMonth() &&
              new Date(t.created_at).getFullYear() === now.getFullYear(),
          )
          .reduce((s, t) => s + t.amount, 0);
        setWalletCreditedThisMonth(sum);
      })
      .catch(() => setWalletCreditedThisMonth(0));
    void fixoSdk
      .activityFeed(undefined, 50, 0)
      .then(setActivity)
      .catch(() => setActivity([]));
  }, []);

  const dataLoaded = bookings !== null;
  const months6 = useMemo(() => lastNMonths(6), []);

  const monthly = useMemo(() => {
    const buckets = months6.map((m) => ({
      ...m,
      bookings: 0,
      spend: 0,
      providers: new Set<string>(),
      completed: 0,
    }));
    for (const b of bookings ?? []) {
      const key = monthKey(new Date(b.created_at));
      const bucket = buckets.find((m) => m.key === key);
      if (!bucket) continue;
      bucket.bookings += 1;
      if (b.status !== "CANCELLED" && b.status !== "PAYMENT_FAILED")
        bucket.spend += b.agreed_amount;
      if (b.provider_name) bucket.providers.add(b.provider_name);
      if (b.status === "CLOSED") bucket.completed += 1;
    }
    return buckets.map((b) => ({ ...b, providerCount: b.providers.size }));
  }, [bookings, months6]);

  const last = monthly[monthly.length - 1]!;
  const prev = monthly[monthly.length - 2]!;
  const totalSpend = (bookings ?? [])
    .filter((b) => b.status !== "CANCELLED" && b.status !== "PAYMENT_FAILED")
    .reduce((s, b) => s + b.agreed_amount, 0);
  const totalBookings = (bookings ?? []).length;
  const activeProviderCount = new Set((bookings ?? []).map((b) => b.provider_name).filter(Boolean))
    .size;
  const completedJobs = (bookings ?? []).filter((b) => b.status === "CLOSED").length;
  const currency = bookings?.[0]?.currency ?? "TZS";

  // "Bookings Overview" — full current calendar year, Completed vs Requested (every real booking created).
  const yearMonths = useMemo(() => {
    const out: { month: string; year: number; idx: number }[] = [];
    const year = new Date().getFullYear();
    for (let m = 0; m < 12; m++)
      out.push({
        month: new Date(year, m, 1).toLocaleString(i18n.language, { month: "short" }),
        year,
        idx: m,
      });
    return out;
  }, [i18n.language]);
  const yearData = useMemo(() => {
    const buckets = yearMonths.map((m) => ({ month: m.month, requested: 0, completed: 0 }));
    for (const b of bookings ?? []) {
      const d = new Date(b.created_at);
      if (d.getFullYear() !== yearMonths[0]!.year) continue;
      buckets[d.getMonth()]!.requested += 1;
      if (b.status === "CLOSED") buckets[d.getMonth()]!.completed += 1;
    }
    return buckets;
  }, [bookings, yearMonths]);
  const maxYearValue = Math.max(1, ...yearData.map((d) => Math.max(d.requested, d.completed)));

  // Service Distribution — real service_name breakdown across all real bookings.
  const distribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of bookings ?? []) {
      const name = b.service_name ?? "Other";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 4);
    const rest = sorted.slice(4).reduce((s, [, c]) => s + c, 0);
    if (rest > 0) top.push(["Other", rest]);
    const total = top.reduce((s, [, c]) => s + c, 0) || 1;
    const colors = [
      "var(--chart-1)",
      "var(--chart-3)",
      "var(--chart-2)",
      "var(--primary)",
      "var(--muted-foreground)",
    ];
    return top.map(([name, count], i) => ({
      name,
      count,
      pct: Math.round((count / total) * 100),
      color: colors[i % colors.length],
    }));
  }, [bookings]);

  const upcoming = useMemo(
    () =>
      (bookings ?? [])
        .filter(
          (b) =>
            ACTIVE_STATUSES.has(b.status) &&
            b.scheduled_date &&
            new Date(b.scheduled_date) >= new Date(new Date().toDateString()),
        )
        .sort(
          (a, b) => new Date(a.scheduled_date!).getTime() - new Date(b.scheduled_date!).getTime(),
        )
        .slice(0, 3),
    [bookings],
  );

  const favoriteServices = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of bookings ?? []) {
      if (!b.service_name) continue;
      counts.set(b.service_name, (counts.get(b.service_name) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({ name, count }));
  }, [bookings]);

  const today = new Date().toLocaleDateString(i18n.language, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <PageShell
      title={t("dashboard.welcomeBack", { name: customerName.split(" ")[0] })}
      subtitle={today}
      userName={customerName}
      onLogout={onLogout}
    >
      <div className="mt-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            highlight
            icon={WalletIcon}
            label={t("dashboard.statTotalSpend")}
            value={dataLoaded ? fmtMoney(totalSpend, currency) : "—"}
            pct={dataLoaded ? pctChange(last.spend, prev.spend) : 0}
            series={monthly.map((m) => ({ v: m.spend }))}
          />
          <StatCard
            icon={ClipboardList}
            label={t("dashboard.statTotalBookings")}
            value={dataLoaded ? String(totalBookings) : "—"}
            pct={dataLoaded ? pctChange(last.bookings, prev.bookings) : 0}
            series={monthly.map((m) => ({ v: m.bookings }))}
          />
          <StatCard
            icon={Users}
            label={t("dashboard.statActiveProviders")}
            value={dataLoaded ? String(activeProviderCount) : "—"}
            pct={dataLoaded ? pctChange(last.providerCount, prev.providerCount) : 0}
            series={monthly.map((m) => ({ v: m.providerCount }))}
          />
          <StatCard
            icon={PackageCheck}
            label={t("dashboard.statCompletedJobs")}
            value={dataLoaded ? String(completedJobs) : "—"}
            pct={dataLoaded ? pctChange(last.completed, prev.completed) : 0}
            series={monthly.map((m) => ({ v: m.completed }))}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  {t("dashboard.bookingsOverview")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("dashboard.trackBookingActivity")}
                </p>
              </div>
              <span className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium">
                {t("dashboard.thisYear")} <span className="text-muted-foreground">▾</span>
              </span>
            </div>
            <div className="mt-4 flex items-center gap-6 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2.5 rounded-full bg-primary" /> {t("dashboard.completed")}
              </span>
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2.5 rounded-full bg-[var(--chart-4)]" />{" "}
                {t("dashboard.requested")}
              </span>
            </div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={yearData}
                  barGap={4}
                  margin={{ top: 8, right: 0, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    dy={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    domain={[0, maxYearValue]}
                    allowDecimals={false}
                  />
                  <Bar
                    dataKey="requested"
                    radius={[999, 999, 999, 999]}
                    barSize={14}
                    fill="var(--chart-4)"
                  />
                  <Bar
                    dataKey="completed"
                    radius={[999, 999, 999, 999]}
                    barSize={14}
                    fill="var(--primary)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-bold tracking-tight">
              {t("dashboard.serviceDistribution")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("dashboard.breakdownOfServices")}
            </p>
            {!dataLoaded ? (
              <div className="mt-6 h-40 animate-pulse rounded-2xl bg-muted/60" />
            ) : distribution.length === 0 ? (
              <p className="mt-8 text-center text-sm text-muted-foreground">
                {t("dashboard.noBookingsYet")}
              </p>
            ) : (
              <>
                <div className="relative mx-auto mt-2 h-44 w-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribution}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {distribution.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-2xl font-bold">{totalBookings}</p>
                    <p className="text-xs text-muted-foreground">{t("dashboard.totalJobs")}</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-2">
                  {distribution.map((d) => (
                    <li key={d.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="min-w-0 flex-1 truncate">{d.name}</span>
                      <span className="text-muted-foreground">{d.pct}%</span>
                      <span className="w-10 text-right font-semibold">{d.count}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate({ to: "/history" })}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-sm font-semibold text-primary hover:bg-primary/15"
                >
                  {t("dashboard.viewAllServices")} <ArrowRight className="size-4" />
                </button>
              </>
            )}
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">{t("dashboard.upcomingBookings")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.yourScheduleAtGlance")}
                </p>
              </div>
              <button
                onClick={() => navigate({ to: "/bookings" })}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {t("dashboard.viewAll")}
              </button>
            </div>
            {!dataLoaded ? (
              <div className="mt-4 h-32 animate-pulse rounded-2xl bg-muted/60" />
            ) : upcoming.length === 0 ? (
              <EmptyState
                compact
                icon={Calendar}
                title={t("dashboard.nothingScheduled")}
                description={t("dashboard.bookServiceToSeeHere")}
                actionLabel={t("dashboard.browseServices")}
                actionTo="/services"
              />
            ) : (
              <div className="mt-4 space-y-3">
                {upcoming.map((b) => {
                  const Icon = iconForService(b.service_name);
                  return (
                    <div key={b.booking_id} className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {b.service_name ?? t("dashboard.serviceFallback")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fmtDate(b.scheduled_date)}
                          {b.time_window ? ` · ${humanize(b.time_window)}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-600">
                        {humanize(b.status)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">{t("dashboard.recentActivity")}</h3>
                <p className="text-sm text-muted-foreground">{t("dashboard.yourLatestUpdates")}</p>
              </div>
              <button
                onClick={() => navigate({ to: "/activity" })}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {t("dashboard.viewAll")}
              </button>
            </div>
            {activity === null ? (
              <div className="mt-4 h-32 animate-pulse rounded-2xl bg-muted/60" />
            ) : activity.length === 0 ? (
              <EmptyState
                compact
                icon={Clock}
                title={t("dashboard.noActivityYet")}
                description={t("dashboard.bookingEventsShowHere")}
              />
            ) : (
              <div className="mt-4 space-y-3">
                {activity.slice(0, 3).map((ev, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{humanize(ev.event)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {ev.detail ?? ev.service_name ?? ev.booking_number}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(ev.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold">{t("dashboard.walletSnapshot")}</h3>
                <p className="text-sm text-muted-foreground">{t("dashboard.manageBalance")}</p>
              </div>
              <button
                onClick={() => navigate({ to: "/wallet" })}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {t("dashboard.topUp")}
              </button>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary/5 p-4">
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-primary-foreground"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                <CreditCard className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{t("dashboard.currentBalance")}</p>
                <p className="text-lg font-bold">
                  {wallet ? fmtMoney(wallet.balance, wallet.currency) : "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t("dashboard.thisMonth")}</p>
                <p className="text-sm font-semibold text-success">
                  ▲ {fmtMoney(walletCreditedThisMonth, wallet?.currency ?? currency)}
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">{t("dashboard.favoriteServices")}</h3>
              <p className="text-sm text-muted-foreground">{t("dashboard.quickAccess")}</p>
            </div>
            <button
              onClick={() => navigate({ to: "/services" })}
              className="text-sm font-semibold text-primary hover:underline"
            >
              {t("dashboard.manage")}
            </button>
          </div>
          {!dataLoaded ? (
            <div className="mt-4 h-24 animate-pulse rounded-2xl bg-muted/60" />
          ) : favoriteServices.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {t("dashboard.bookToSeeFavorites")}
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {favoriteServices.map((s) => {
                const Icon = iconForService(s.name);
                return (
                  <button
                    key={s.name}
                    onClick={() => navigate({ to: "/services" })}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-border p-4 text-center hover:bg-muted/40"
                  >
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("dashboard.bookingCount", { count: s.count })}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
