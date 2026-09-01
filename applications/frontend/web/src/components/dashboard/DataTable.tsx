// Shared table shell + filter bar — the exact visual pattern from My
// Bookings (search + pill selects, rounded card table, prev/page/next
// footer), reused across every module so lists look and behave identically.
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TableSelectFilter {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  width?: string;
}

interface TableFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  filters?: TableSelectFilter[];
  trailing?: ReactNode;
}

export function TableFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  trailing,
}: TableFilterBarProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-3xl bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="relative min-w-[220px] flex-1">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-11 w-full rounded-xl bg-muted pl-4 pr-11 text-sm outline-none placeholder:text-muted-foreground"
        />
        <Search className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {filters.map((f, i) => (
        <Select key={i} value={f.value} onValueChange={f.onChange}>
          <SelectTrigger className={`h-11 ${f.width ?? "w-[170px]"} rounded-xl border-0 bg-muted`}>
            <SelectValue placeholder={f.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {f.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {trailing}
    </div>
  );
}

export function TableCard({ children }: { children: ReactNode }) {
  return <div className="mt-6 overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-card)]">{children}</div>;
}

export function TableScroll({ children, minWidth = 720 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ columns }: { columns: string[] }) {
  return (
    <thead>
      <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {columns.map((c, i) => (
          <th key={c} className={i === 0 ? "px-6 py-4 font-semibold" : "px-4 py-4 font-semibold"}>
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

interface TablePaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (p: number) => void;
  from: number;
  to: number;
  total: number;
  itemLabel: string;
}

export function TablePagination({ page, pageCount, onPageChange, from, to, total, itemLabel }: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <p className="text-sm text-muted-foreground">
        Showing {from} to {to} of {total} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {page}
        </span>
        <button
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page === pageCount}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
