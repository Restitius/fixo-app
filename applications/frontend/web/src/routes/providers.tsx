import { createFileRoute } from "@tanstack/react-router";
import { Star, MapPin, BadgeCheck, Heart, ArrowRight, SlidersHorizontal } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";

const title = "Find Professionals — HandyDeck";
const description =
  "Browse verified handymen, contractors and service professionals near you.";

export const Route = createFileRoute("/providers")({
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
  component: ProvidersPage,
});

const professionals = [
  {
    name: "Mike Ross",
    role: "Master Plumber",
    rating: 4.9,
    reviews: 128,
    jobs: 342,
    rate: "$45/hr",
    distance: "1.2 miles",
    verified: true,
    initials: "MR",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    name: "Sarah Lin",
    role: "Licensed Electrician",
    rating: 4.8,
    reviews: 96,
    jobs: 215,
    rate: "$60/hr",
    distance: "2.4 miles",
    verified: true,
    initials: "SL",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    name: "Tom Hardy",
    role: "Carpenter & Assembler",
    rating: 4.7,
    reviews: 84,
    jobs: 198,
    rate: "$55/hr",
    distance: "3.1 miles",
    verified: false,
    initials: "TH",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    name: "Elena Gomez",
    role: "Cleaning Specialist",
    rating: 4.9,
    reviews: 210,
    jobs: 567,
    rate: "$40/hr",
    distance: "0.8 miles",
    verified: true,
    initials: "EG",
    color: "bg-cyan-500/10 text-cyan-600",
  },
  {
    name: "David Kim",
    role: "HVAC Technician",
    rating: 4.6,
    reviews: 72,
    jobs: 156,
    rate: "$70/hr",
    distance: "4.5 miles",
    verified: true,
    initials: "DK",
    color: "bg-sky-500/10 text-sky-600",
  },
  {
    name: "Lisa Chen",
    role: "Painter & Decorator",
    rating: 4.8,
    reviews: 115,
    jobs: 289,
    rate: "$50/hr",
    distance: "2.0 miles",
    verified: true,
    initials: "LC",
    color: "bg-rose-500/10 text-rose-600",
  },
];

function ProvidersPage() {
  return (
    <PageShell title="Find Professionals" subtitle="Browse verified handymen near your location">
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button className="inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium shadow-[var(--shadow-card)]">
          <SlidersHorizontal className="size-4" />
          Filters
        </button>
        {["All", "Top Rated", "Nearest", "Available Now"].map((filter) => (
          <button
            key={filter}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              filter === "All"
                ? "text-primary-foreground"
                : "bg-card text-foreground/80 hover:bg-sidebar-accent"
            }`}
            style={filter === "All" ? { backgroundImage: "var(--gradient-primary)" } : undefined}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {professionals.map((pro) => (
          <div
            key={pro.name}
            className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <span className={`flex size-14 items-center justify-center rounded-2xl text-lg font-bold ${pro.color}`}>
                  {pro.initials}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{pro.name}</h3>
                    {pro.verified && <BadgeCheck className="size-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{pro.role}</p>
                </div>
              </div>
              <button className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent">
                <Heart className="size-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-secondary/50 p-3">
              <div className="text-center">
                <p className="text-sm font-semibold">{pro.rating}</p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">{pro.reviews}</p>
                <p className="text-xs text-muted-foreground">Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">{pro.jobs}</p>
                <p className="text-xs text-muted-foreground">Jobs</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-4" />
                {pro.distance}
              </span>
              <span className="font-semibold text-primary">{pro.rate}</span>
            </div>

            <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Hire Now
              <ArrowRight className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
