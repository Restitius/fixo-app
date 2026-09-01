const bubbles = [
  { label: "2.417", size: 104, x: 78, y: 6, opacity: 1 },
  { label: "287", size: 78, x: 0, y: 26, opacity: 0.7 },
  { label: "2.281", size: 96, x: 0, y: 92, opacity: 0.8 },
  { label: "812", size: 82, x: 84, y: 104, opacity: 0.55 },
];

const regions = [
  { name: "Dar es Salaam", code: "TZ", progress: 92 },
  { name: "Arusha", code: "TZ", progress: 68 },
  { name: "Nairobi", code: "KE", progress: 54 },
  { name: "Kampala", code: "UG", progress: 33 },
];

export function CoverageGrowth() {
  return (
    <section className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Customer Growth</h2>
          <p className="mt-1 text-sm text-muted-foreground">Track customers by location</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium">
          Today <span className="text-muted-foreground">▾</span>
        </button>
      </div>

      <div className="mt-6 flex items-center gap-8">
        <div className="relative h-52 w-48 shrink-0">
          {bubbles.map((b) => (
            <div
              key={b.label}
              className="absolute flex items-center justify-center rounded-full text-sm font-semibold text-primary-foreground"
              style={{
                width: b.size,
                height: b.size,
                left: b.x,
                top: b.y,
                backgroundColor: "var(--primary)",
                opacity: b.opacity,
              }}
            >
              {b.label}
            </div>
          ))}
        </div>

        <ul className="flex-1 space-y-4">
          {regions.map((r) => (
            <li key={r.name}>
              <div className="flex items-center gap-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {r.code}
                </span>
                <span className="text-sm font-semibold">{r.name}</span>
              </div>
              <div className="mt-2 h-1 w-full rounded-full bg-muted">
                <div
                  className="h-1 rounded-full bg-primary"
                  style={{ width: `${r.progress}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
