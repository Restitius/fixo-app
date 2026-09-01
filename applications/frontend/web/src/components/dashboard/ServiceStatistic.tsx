import { Plug, Droplets, Hammer } from "lucide-react";

const rings = [
  { radius: 92, sweep: 0.62, color: "var(--chart-4)" },
  { radius: 74, sweep: 0.34, color: "var(--chart-3)" },
  { radius: 56, sweep: 0.72, color: "var(--chart-2)" },
  { radius: 38, sweep: 0.88, color: "var(--primary)" },
];

const SIZE = 210;
const C = SIZE / 2;

function arcPath(radius: number, sweep: number) {
  const start = -100;
  const end = start + sweep * 300;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = C + radius * Math.cos(rad(start));
  const y1 = C + radius * Math.sin(rad(start));
  const x2 = C + radius * Math.cos(rad(end));
  const y2 = C + radius * Math.sin(rad(end));
  const large = end - start > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
}

const rows = [
  { icon: Plug, name: "Electrical", value: "2.487", delta: "+1.08%", positive: true },
  { icon: Droplets, name: "Plumbing", value: "1.828", delta: "+2.5%", positive: true },
  { icon: Hammer, name: "Carpentry", value: "1.463", delta: "-1.08%", positive: false },
];

export function ServiceStatistic() {
  return (
    <section className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Service Statistic</h2>
          <p className="mt-1 text-sm text-muted-foreground">Track your booked services</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium">
          Today <span className="text-muted-foreground">▾</span>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <svg width={SIZE} height={SIZE} className="shrink-0">
          {rings.map((ring) => (
            <g key={ring.radius}>
              <path
                d={arcPath(ring.radius, 1)}
                fill="none"
                stroke="var(--muted)"
                strokeWidth={13}
                strokeLinecap="round"
              />
              <path
                d={arcPath(ring.radius, ring.sweep)}
                fill="none"
                stroke={ring.color}
                strokeWidth={13}
                strokeLinecap="round"
              />
            </g>
          ))}
        </svg>

        <div className="text-right">
          <p className="text-3xl font-bold tracking-tight">9.829</p>
          <p className="mt-1 text-sm text-muted-foreground">Jobs Completed</p>
          <span className="mt-2 inline-block rounded-full bg-success-muted px-3 py-1 text-xs font-semibold text-success-foreground">
            +2.08%
          </span>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-3">
            <row.icon className="size-5 text-foreground" />
            <span className="flex-1 text-sm font-medium">{row.name}</span>
            <span className="text-sm font-semibold">{row.value}</span>
            <span
              className={
                row.positive
                  ? "rounded-full bg-success-muted px-2 py-0.5 text-xs font-semibold text-success-foreground"
                  : "rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground"
              }
            >
              {row.delta}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
