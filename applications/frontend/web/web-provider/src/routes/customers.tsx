import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { ProviderPage } from "@/components/dashboard/ProviderPage";
import { Panel } from "@/components/dashboard/PageShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { TableCard, TableHead, TableScroll } from "@/components/dashboard/DataTable";
import { bookingsApi, businessCustomersApi, type BookingFeedRow, type BusinessCustomer, type NegotiatedRateType } from "@/lib/api-client";

const title = "Customers — FIXO Provider";
const description = "Recurring and business customers with negotiated rates.";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const [customers, setCustomers] = useState<BusinessCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  function load() {
    return businessCustomersApi.list(undefined, 50, 0).then(setCustomers);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function deactivate(c: BusinessCustomer) {
    if (!confirm(`Deactivate ${c.full_name} as a business customer?`)) return;
    try {
      await businessCustomersApi.deactivate(c.record_id);
      await load();
      toast.success("Deactivated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not deactivate.");
    }
  }

  const activeCount = customers.filter((c) => c.status === "ACTIVE").length;

  return (
    <ProviderPage title="Customers" subtitle="Your recurring and business relationships.">
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <MetricCard icon={Users} label="Business customers" value={String(customers.length)} hint={`${activeCount} active`} />
        <MetricCard icon={Users} label="Percent-discount deals" value={String(customers.filter((c) => c.negotiated_rate_type === "PERCENT_DISCOUNT").length)} hint="Of all customers" tone="success" tintValue />
      </div>

      <div className="mt-4 grid gap-4 pb-6 lg:grid-cols-[1fr_320px]">
        <TableCard className="mt-0">
          <div className="flex items-center justify-between px-6 pt-5">
            <h2 className="text-base font-bold tracking-tight">Business customers</h2>
            <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              <Plus className="size-4" /> Add
            </button>
          </div>
          {!loading && customers.length === 0 && <p className="px-6 py-10 text-center text-sm text-muted-foreground">No business customers yet. Add one from a customer you've served before.</p>}
          {customers.length > 0 && (
            <TableScroll minWidth={720}>
              <TableHead columns={["Customer", "Company", "Rate", "Status", ""]} />
              <tbody>
                {customers.map((c) => (
                  <tr key={c.record_id} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <p className="font-semibold">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{c.company_name || "—"}</td>
                    <td className="px-4 py-4">{c.negotiated_rate_type === "PERCENT_DISCOUNT" ? `${c.negotiated_rate_value}% off` : `Fixed ${c.negotiated_rate_value}`}</td>
                    <td className="px-4 py-4">
                      <StatusPill tone={c.status === "ACTIVE" ? "success" : "muted"} label={c.status} />
                    </td>
                    <td className="px-4 py-4">
                      {c.status === "ACTIVE" && (
                        <button onClick={() => void deactivate(c)} className="text-xs font-semibold text-destructive hover:underline">
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableScroll>
          )}
        </TableCard>

        <Panel title="Business account tools">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Negotiate a per-customer discount or fixed rate.</li>
            <li>Track which repeat customers get special pricing.</li>
            <li>Deactivate a deal any time — it won't apply to future bookings.</li>
          </ul>
        </Panel>
      </div>

      {adding && (
        <AddModal
          onClose={() => setAdding(false)}
          onSaved={async () => {
            setAdding(false);
            await load();
          }}
        />
      )}
    </ProviderPage>
  );
}

function AddModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [bookings, setBookings] = useState<BookingFeedRow[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [rateType, setRateType] = useState<NegotiatedRateType>("PERCENT_DISCOUNT");
  const [rateValue, setRateValue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    bookingsApi.feed(undefined, 50, 0).then(setBookings);
  }, []);

  // A customer can appear in multiple bookings — de-dupe by customer_id for the picker.
  const uniqueCustomers = useMemo(() => {
    const seen = new Map<string, BookingFeedRow>();
    for (const b of bookings) if (!seen.has(b.customer_id)) seen.set(b.customer_id, b);
    return Array.from(seen.values());
  }, [bookings]);

  async function save() {
    if (!customerId) {
      toast.error("Select a customer.");
      return;
    }
    const value = Number(rateValue);
    if (!rateValue || value < 0 || (rateType === "PERCENT_DISCOUNT" && value > 100)) {
      toast.error(rateType === "PERCENT_DISCOUNT" ? "Enter a discount between 0 and 100." : "Enter a valid rate value.");
      return;
    }
    setSaving(true);
    try {
      await businessCustomersApi.create({
        customer_id: customerId,
        company_name: companyName || undefined,
        negotiated_rate_type: rateType,
        negotiated_rate_value: value,
        notes: notes || undefined,
      });
      toast.success("Business customer added.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add business customer.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-card p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold">Add business customer</h2>
        <p className="mt-1 text-xs text-muted-foreground">Only customers you've served before can be added — there's no general customer search.</p>
        <div className="mt-4 space-y-3">
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30">
            <option value="">Select a customer…</option>
            {uniqueCustomers.map((b) => (
              <option key={b.customer_id} value={b.customer_id}>
                {b.customer_name}
              </option>
            ))}
          </select>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name (optional)" className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
          <select value={rateType} onChange={(e) => setRateType(e.target.value as NegotiatedRateType)} className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30">
            <option value="PERCENT_DISCOUNT">Percent discount</option>
            <option value="FIXED_RATE">Fixed rate</option>
          </select>
          <input
            value={rateValue}
            onChange={(e) => setRateValue(e.target.value)}
            type="number"
            placeholder={rateType === "PERCENT_DISCOUNT" ? "Discount % (0-100)" : "Fixed rate amount"}
            className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm outline-none focus:ring-2 focus:ring-ring/30"
          />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/30" />
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
