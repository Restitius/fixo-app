import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Droplets,
  Hammer,
  Brush,
  Paintbrush,
  Search,
  SearchX,
  Star,
  TreePine,
  Truck,
  Wind,
  Zap,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";

const title = "Browse Services — FIXO";
const description =
  "Discover trusted handyman services for plumbing, electrical, cleaning, repairs and more.";

export const Route = createFileRoute("/services")({
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
  component: ServicesPage,
});

const FILTERS = ["All Services", "Most Popular", "Home Repair", "Cleaning", "Emergency"] as const;

const categories = [
  {
    icon: Droplets,
    name: "Plumbing",
    description: "Leak repairs, pipe fitting, fixture installation",
    price: "From $45",
    rating: 4.8,
    jobs: "1.2k",
    color: "bg-[oklch(0.93_0.04_240)] text-[oklch(0.55_0.16_240)]",
    tags: ["Home Repair", "Emergency"],
  },
  {
    icon: Zap,
    name: "Electrical",
    description: "Wiring, outlets, lighting and panel upgrades",
    price: "From $60",
    rating: 4.7,
    jobs: "890",
    color: "bg-[oklch(0.93_0.09_75)] text-[oklch(0.55_0.16_60)]",
    tags: ["Home Repair", "Emergency"],
  },
  {
    icon: Hammer,
    name: "Carpentry",
    description: "Custom woodwork, repairs and furniture assembly",
    price: "From $55",
    rating: 4.9,
    jobs: "650",
    color: "bg-success-muted text-success-foreground",
    tags: ["Home Repair"],
  },
  {
    icon: Brush,
    name: "Cleaning",
    description: "Deep cleaning, move-in/out and regular maintenance",
    price: "From $40",
    rating: 4.6,
    jobs: "2.1k",
    color: "bg-[oklch(0.92_0.06_190)] text-[oklch(0.55_0.1_190)]",
    tags: ["Cleaning"],
  },
  {
    icon: Paintbrush,
    name: "Painting",
    description: "Interior and exterior painting for homes & offices",
    price: "From $80",
    rating: 4.8,
    jobs: "540",
    color: "bg-destructive/10 text-destructive",
    tags: ["Home Repair"],
  },
  {
    icon: Wind,
    name: "HVAC",
    description: "AC service, heating repair and ventilation",
    price: "From $70",
    rating: 4.7,
    jobs: "430",
    color: "bg-primary/10 text-primary",
    tags: ["Home Repair", "Emergency"],
  },
  {
    icon: Truck,
    name: "Moving Help",
    description: "Furniture moving, packing and heavy lifting",
    price: "From $50",
    rating: 4.5,
    jobs: "320",
    color: "bg-[oklch(0.9_0.05_300)] text-[oklch(0.5_0.18_290)]",
    tags: [],
  },
  {
    icon: TreePine,
    name: "Gardening",
    description: "Lawn care, landscaping and garden maintenance",
    price: "From $35",
    rating: 4.6,
    jobs: "780",
    color: "bg-success-muted text-success-foreground",
    tags: [],
  },
];

function jobsToNumber(jobs: string) {
  return jobs.endsWith("k") ? parseFloat(jobs) * 1000 : parseFloat(jobs);
}

function ServicesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All Services");

  const filtered = useMemo(() => {
    let list = categories;
    if (filter === "Most Popular") {
      list = [...list].sort((a, b) => jobsToNumber(b.jobs) - jobsToNumber(a.jobs)).slice(0, 4);
    } else if (filter !== "All Services") {
      list = list.filter((c) => c.tags.includes(filter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    return list;
  }, [search, filter]);

  return (
    <PageShell title="Browse Services" subtitle="Find the right service for your home or office">
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="h-11 w-full rounded-xl bg-card pl-4 pr-11 text-sm shadow-[var(--shadow-card)] outline-none placeholder:text-muted-foreground"
          />
          <Search className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              filter === f ? "text-primary-foreground" : "bg-card text-foreground/80 shadow-[var(--shadow-card)] hover:bg-sidebar-accent"
            }`}
            style={filter === f ? { backgroundImage: "var(--gradient-primary)" } : undefined}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={SearchX}
            title="No services found"
            description={`We couldn't find any services matching "${search}". Try a different keyword.`}
            actionLabel="Clear Search"
            onAction={() => {
              setSearch("");
              setFilter("All Services");
            }}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((category, i) => (
            <div
              key={category.name}
              style={{ animationDelay: `${i * 60}ms` }}
              className="group animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <span className={`flex size-12 items-center justify-center rounded-2xl ${category.color}`}>
                  <category.icon className="size-6" />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
                  <Star className="size-3 fill-current text-[#FFB800]" />
                  {category.rating}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-semibold">{category.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-medium text-primary">{category.price}</span>
                <span className="text-muted-foreground">{category.jobs} jobs done</span>
              </div>

              <button
                onClick={() => navigate({ to: "/providers" })}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                Book Now
                <ArrowRight className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
