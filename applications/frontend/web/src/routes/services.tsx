import { createFileRoute } from "@tanstack/react-router";
import {
  Droplets,
  Zap,
  Hammer,
  Brush,
  Paintbrush,
  Wind,
  Truck,
  TreePine,
  Star,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";

const title = "Browse Services — HandyDeck";
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

const categories = [
  {
    icon: Droplets,
    name: "Plumbing",
    description: "Leak repairs, pipe fitting, fixture installation",
    price: "From $45",
    rating: 4.8,
    jobs: "1.2k",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: Zap,
    name: "Electrical",
    description: "Wiring, outlets, lighting and panel upgrades",
    price: "From $60",
    rating: 4.7,
    jobs: "890",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: Hammer,
    name: "Carpentry",
    description: "Custom woodwork, repairs and furniture assembly",
    price: "From $55",
    rating: 4.9,
    jobs: "650",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: Brush,
    name: "Cleaning",
    description: "Deep cleaning, move-in/out and regular maintenance",
    price: "From $40",
    rating: 4.6,
    jobs: "2.1k",
    color: "bg-cyan-500/10 text-cyan-600",
  },
  {
    icon: Paintbrush,
    name: "Painting",
    description: "Interior and exterior painting for homes & offices",
    price: "From $80",
    rating: 4.8,
    jobs: "540",
    color: "bg-rose-500/10 text-rose-600",
  },
  {
    icon: Wind,
    name: "HVAC",
    description: "AC service, heating repair and ventilation",
    price: "From $70",
    rating: 4.7,
    jobs: "430",
    color: "bg-sky-500/10 text-sky-600",
  },
  {
    icon: Truck,
    name: "Moving Help",
    description: "Furniture moving, packing and heavy lifting",
    price: "From $50",
    rating: 4.5,
    jobs: "320",
    color: "bg-violet-500/10 text-violet-600",
  },
  {
    icon: TreePine,
    name: "Gardening",
    description: "Lawn care, landscaping and garden maintenance",
    price: "From $35",
    rating: 4.6,
    jobs: "780",
    color: "bg-green-500/10 text-green-600",
  },
];

function ServicesPage() {
  return (
    <PageShell title="Browse Services" subtitle="Find the right service for your home or office">
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button className="inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium shadow-[var(--shadow-card)]">
          <SlidersHorizontal className="size-4" />
          Filters
        </button>
        {["All Services", "Most Popular", "Home Repair", "Cleaning", "Emergency"].map((filter) => (
          <button
            key={filter}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              filter === "All Services"
                ? "text-primary-foreground"
                : "bg-card text-foreground/80 hover:bg-sidebar-accent"
            }`}
            style={filter === "All Services" ? { backgroundImage: "var(--gradient-primary)" } : undefined}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {categories.map((category) => (
          <div
            key={category.name}
            className="group rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <span className={`flex size-12 items-center justify-center rounded-2xl ${category.color}`}>
                <category.icon className="size-6" />
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
                <Star className="size-3 fill-current" />
                {category.rating}
              </span>
            </div>

            <h3 className="mt-4 text-lg font-semibold">{category.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="font-medium text-primary">{category.price}</span>
              <span className="text-muted-foreground">{category.jobs} jobs done</span>
            </div>

            <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Book Now
              <ArrowRight className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
