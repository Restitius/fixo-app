import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ArrowRight, BadgeCheck, Heart, MapPin, Search, SlidersHorizontal, Star, UserX, X } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";

const title = "Find Professionals — FIXO";
const description = "Browse verified handymen, contractors and service professionals near you.";

const providersSearchSchema = z.object({
  category: z.string().optional(),
});

export const Route = createFileRoute("/providers")({
  validateSearch: providersSearchSchema,
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
    category: "Plumbing",
    rating: 4.9,
    reviews: 128,
    jobs: 342,
    rate: "$45/hr",
    distanceMi: 1.2,
    verified: true,
    available: true,
    initials: "MR",
    color: "bg-[oklch(0.93_0.04_240)] text-[oklch(0.55_0.16_240)]",
  },
  {
    name: "Sarah Lin",
    role: "Licensed Electrician",
    category: "Electrical",
    rating: 4.8,
    reviews: 96,
    jobs: 215,
    rate: "$60/hr",
    distanceMi: 2.4,
    verified: true,
    available: false,
    initials: "SL",
    color: "bg-[oklch(0.93_0.09_75)] text-[oklch(0.55_0.16_60)]",
  },
  {
    name: "Tom Hardy",
    role: "Carpenter & Assembler",
    category: "Carpentry",
    rating: 4.7,
    reviews: 84,
    jobs: 198,
    rate: "$55/hr",
    distanceMi: 3.1,
    verified: false,
    available: true,
    initials: "TH",
    color: "bg-success-muted text-success-foreground",
  },
  {
    name: "Elena Gomez",
    role: "Cleaning Specialist",
    category: "Cleaning",
    rating: 4.9,
    reviews: 210,
    jobs: 567,
    rate: "$40/hr",
    distanceMi: 0.8,
    verified: true,
    available: true,
    initials: "EG",
    color: "bg-[oklch(0.92_0.06_190)] text-[oklch(0.55_0.1_190)]",
  },
  {
    name: "David Kim",
    role: "HVAC Technician",
    category: "HVAC",
    rating: 4.6,
    reviews: 72,
    jobs: 156,
    rate: "$70/hr",
    distanceMi: 4.5,
    verified: true,
    available: false,
    initials: "DK",
    color: "bg-primary/10 text-primary",
  },
  {
    name: "Lisa Chen",
    role: "Painter & Decorator",
    category: "Painting",
    rating: 4.8,
    reviews: 115,
    jobs: 289,
    rate: "$50/hr",
    distanceMi: 2.0,
    verified: true,
    available: true,
    initials: "LC",
    color: "bg-destructive/10 text-destructive",
  },
  {
    name: "Marcus Reed",
    role: "Moving & Hauling Crew Lead",
    category: "Moving Help",
    rating: 4.5,
    reviews: 61,
    jobs: 140,
    rate: "$50/hr",
    distanceMi: 3.6,
    verified: true,
    available: true,
    initials: "MR",
    color: "bg-[oklch(0.9_0.05_300)] text-[oklch(0.5_0.18_290)]",
  },
  {
    name: "Priya Nair",
    role: "Landscaping & Garden Care",
    category: "Gardening",
    rating: 4.6,
    reviews: 88,
    jobs: 203,
    rate: "$35/hr",
    distanceMi: 1.9,
    verified: false,
    available: true,
    initials: "PN",
    color: "bg-success-muted text-success-foreground",
  },
];

const SORTS = ["All", "Top Rated", "Nearest", "Available Now"] as const;

function ProvidersPage() {
  const navigate = useNavigate();
  const { category } = Route.useSearch();
  const [sort, setSort] = useState<(typeof SORTS)[number]>("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = professionals;
    if (category) list = list.filter((p) => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q));
    }
    if (sort === "Top Rated") list = [...list].sort((a, b) => b.rating - a.rating);
    else if (sort === "Nearest") list = [...list].sort((a, b) => a.distanceMi - b.distanceMi);
    else if (sort === "Available Now") list = list.filter((p) => p.available);
    return list;
  }, [category, search, sort]);

  function clearCategory() {
    navigate({ to: "/providers", search: {} });
  }

  return (
    <PageShell
      title={category ? `${category} Professionals` : "Find Professionals"}
      subtitle={category ? `Verified pros for ${category.toLowerCase()} near you` : "Browse verified handymen near your location"}
    >
      {category && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 py-1.5 pl-4 pr-2 text-sm font-medium text-primary animate-in fade-in slide-in-from-top-1">
          Filtered by: {category}
          <button onClick={clearCategory} className="rounded-full p-1 hover:bg-primary/15" aria-label="Clear category filter">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search professionals..."
            className="h-11 w-full rounded-xl bg-card pl-4 pr-11 text-sm shadow-[var(--shadow-card)] outline-none placeholder:text-muted-foreground"
          />
          <Search className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <span className="inline-flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-[var(--shadow-card)]">
          <SlidersHorizontal className="size-4" />
          Sort
        </span>
        {SORTS.map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              sort === s ? "text-primary-foreground" : "bg-card text-foreground/80 shadow-[var(--shadow-card)] hover:bg-sidebar-accent"
            }`}
            style={sort === s ? { backgroundImage: "var(--gradient-primary)" } : undefined}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={UserX}
            title={category ? `No ${category.toLowerCase()} professionals right now` : "No professionals found"}
            description={
              category
                ? `We don't have anyone available for ${category.toLowerCase()} matching your filters yet. Try another service or check back soon.`
                : "Try a different search term or adjust your sort options."
            }
            actionLabel="View All Professionals"
            onAction={() => {
              setSearch("");
              setSort("All");
              if (category) clearCategory();
            }}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((pro, i) => (
            <div
              key={pro.name}
              style={{ animationDelay: `${i * 60}ms` }}
              className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-1"
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
                    {pro.available && (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-success-foreground">
                        <span className="size-1.5 rounded-full bg-success" /> Available now
                      </span>
                    )}
                  </div>
                </div>
                <button className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent">
                  <Heart className="size-5" />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-secondary/50 p-3">
                <div className="text-center">
                  <p className="flex items-center justify-center gap-1 text-sm font-semibold">
                    <Star className="size-3.5 fill-current text-[#FFB800]" />
                    {pro.rating}
                  </p>
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
                  {pro.distanceMi} miles
                </span>
                <span className="font-semibold text-primary">{pro.rate}</span>
              </div>

              <button
                onClick={() =>
                  navigate({ to: "/book", search: { category: pro.category, providerName: pro.name } })
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                Hire Now
                <ArrowRight className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
