import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";

const data = [
  { month: "Jan", requested: 43787, completed: 47000 },
  { month: "Feb", requested: 56000, completed: 39000 },
  { month: "Mar", requested: 22000, completed: 17000 },
  { month: "Apr", requested: 54000, completed: 32784 },
  { month: "May", requested: 30000, completed: 13000 },
  { month: "Jun", requested: 32000, completed: 24000 },
  { month: "Jul", requested: 31000, completed: 18000 },
];

const fmt = (v: number) => `${Math.round(v / 1000)}K`;

export function JobsChart() {
  return (
    <section className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Customer Habits</h2>
          <p className="mt-1 text-sm text-muted-foreground">Track your booking habits</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium">
          This year
          <span className="text-muted-foreground">▾</span>
        </button>
      </div>

      <div className="mt-6 flex items-center gap-6 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2.5 rounded-full bg-[var(--chart-4)]" /> Requested
        </span>
        <span className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2.5 rounded-full bg-primary" /> Completed
        </span>
      </div>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} margin={{ top: 8, right: 0, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 13 }}
              dy={8}
            />
            <YAxis
              tickFormatter={fmt}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 13 }}
              domain={[0, 60000]}
              ticks={[0, 15000, 30000, 45000, 60000]}
            />
            <Bar dataKey="requested" radius={[999, 999, 999, 999]} barSize={22}>
              {data.map((entry) => (
                <Cell key={entry.month} fill="var(--chart-4)" />
              ))}
            </Bar>
            <Bar dataKey="completed" radius={[999, 999, 999, 999]} barSize={22}>
              {data.map((entry) => (
                <Cell key={entry.month} fill="var(--primary)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
