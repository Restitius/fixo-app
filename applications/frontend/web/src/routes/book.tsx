import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  Lock,
  MapPin,
  Plus,
  Sparkles,
  Star,
  UserX,
} from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import {
  bookingApi,
  type Address,
  type BookingRow,
  type CatalogServiceResult,
  type Quote,
  type ServiceRequestRow,
} from "@/lib/api-client";

const title = "Book a Service — FIXO";
const description = "Request a service, get matched with providers and confirm your booking.";

const bookSearchSchema = z.object({
  category: z.string().optional(),
  providerName: z.string().optional(),
});

export const Route = createFileRoute("/book")({
  validateSearch: bookSearchSchema,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: BookPage,
});

// Frontend category display names don't always match the seeded catalog names.
const CATEGORY_SEARCH_TERM: Record<string, string> = {
  HVAC: "Air-Conditioning",
  "Moving Help": "Moving Assistance",
  Electrical: "Electrical Services",
  Appliance: "Appliance Repair",
};

const TIME_WINDOWS = [
  { value: "MORNING", label: "Morning", hint: "8am – 12pm" },
  { value: "AFTERNOON", label: "Afternoon", hint: "12pm – 5pm" },
  { value: "EVENING", label: "Evening", hint: "5pm – 9pm" },
] as const;

const STEPS = ["Service", "Details", "Address", "Review", "Match", "Payment", "Done"] as const;
type Step = (typeof STEPS)[number];

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function money(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString()}`;
}

function BookPage() {
  const navigate = useNavigate();
  const { category, providerName } = Route.useSearch();

  const [stepIndex, setStepIndex] = useState(0);
  const step: Step = STEPS[stepIndex]!;

  // Step 1: service
  const [services, setServices] = useState<CatalogServiceResult[] | null>(null);
  const [selectedService, setSelectedService] = useState<CatalogServiceResult | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);

  // Step 2: details
  const [jobDescription, setJobDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState<Date | undefined>(undefined);
  const [timeWindow, setTimeWindow] = useState<(typeof TIME_WINDOWS)[number]["value"] | null>(null);

  // Step 3: address
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrDraft, setAddrDraft] = useState({
    label: "Home",
    recipient_name: "",
    phone: "",
    street_address: "",
    city: "",
    region: "",
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // Step 4: review / submit
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState<ServiceRequestRow | null>(null);
  const [reviewIssue, setReviewIssue] = useState<{ status: string; notes: string | null } | null>(null);

  // Step 5: matching / quotes
  const [matching, setMatching] = useState(false);
  const [matchOutcome, setMatchOutcome] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null);

  // Step 6: payment / booking
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [authorizing, setAuthorizing] = useState(false);

  const searchTerm = category ? (CATEGORY_SEARCH_TERM[category] ?? category) : null;

  useEffect(() => {
    if (!searchTerm) return;
    let cancelled = false;
    setServices(null);
    setSelectedService(null);
    setServiceError(null);
    bookingApi
      .catalogSearch(searchTerm)
      .then((res) => {
        if (cancelled) return;
        setServices(res.results);
        if (res.results.length === 1) setSelectedService(res.results[0]!);
      })
      .catch(() => {
        if (cancelled) return;
        setServiceError(`We couldn't load services for ${category} right now.`);
      });
    return () => {
      cancelled = true;
    };
  }, [searchTerm]);

  useEffect(() => {
    if (step !== "Address" || addresses !== null) return;
    bookingApi.listAddresses().then((rows) => {
      setAddresses(rows);
      const def = rows.find((a) => a.is_default) ?? rows[0];
      if (def) setSelectedAddressId(def.address_id);
      else setShowAddressForm(true);
    });
  }, [step, addresses]);

  useEffect(() => {
    if (step !== "Match" || !request) return;
    if (matchOutcome !== null) return;
    setMatching(true);
    bookingApi
      .runMatching(request.request_id)
      .then(async (res) => {
        setMatchOutcome(res.outcome);
        if (res.outcome === "MATCHING") {
          const q = await bookingApi.listQuotes(request.request_id);
          setQuotes(q);
        }
      })
      .catch(() => setMatchOutcome("ERROR"))
      .finally(() => setMatching(false));
  }, [step, request, matchOutcome]);

  function goTo(name: Step) {
    setStepIndex(STEPS.indexOf(name));
  }
  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  async function saveNewAddress() {
    if (
      !addrDraft.recipient_name.trim() ||
      !addrDraft.phone.trim() ||
      !addrDraft.street_address.trim() ||
      !addrDraft.city.trim()
    ) {
      toast.error("Fill in recipient, phone, street and city.");
      return;
    }
    setSavingAddress(true);
    try {
      const created = await bookingApi.createAddress({
        label: addrDraft.label || "Home",
        recipient_name: addrDraft.recipient_name,
        phone: addrDraft.phone,
        street_address: addrDraft.street_address,
        city: addrDraft.city,
        region: addrDraft.region || null,
        is_default: (addresses ?? []).length === 0,
      });
      setAddresses((prev) => [...(prev ?? []), created]);
      setSelectedAddressId(created.address_id);
      setShowAddressForm(false);
    } finally {
      setSavingAddress(false);
    }
  }

  async function submitRequest() {
    if (!selectedService || !selectedAddressId) return;
    setSubmitting(true);
    setReviewIssue(null);
    try {
      const created = await bookingApi.createServiceRequest({
        service_id: selectedService.service_id,
        description: jobDescription.trim(),
        address_id: selectedAddressId,
        preferred_date: preferredDate ? formatDate(preferredDate) : undefined,
        time_window: timeWindow ?? undefined,
      });
      const submitted = await bookingApi.submitServiceRequest(created.request_id);
      setRequest(submitted);
      if (submitted.status === "VALID") {
        goTo("Match");
      } else {
        setReviewIssue({ status: submitted.status, notes: submitted.validation_notes ?? null });
      }
    } catch {
      // apiClient already toasts the error
    } finally {
      setSubmitting(false);
    }
  }

  async function chooseQuote(quote: Quote) {
    if (!request) return;
    setAcceptingQuoteId(quote.quote_id);
    try {
      await bookingApi.selectProvider(request.request_id, quote.provider_id);
      await bookingApi.acceptQuote(quote.quote_id);
      const confirmed = await bookingApi.confirmBooking(quote.quote_id);
      setBooking(confirmed);
      goTo("Payment");
    } catch {
      // apiClient already toasts the error
    } finally {
      setAcceptingQuoteId(null);
    }
  }

  async function authorizePayment() {
    if (!booking) return;
    setAuthorizing(true);
    try {
      const updated = await bookingApi.authorizeBookingPayment(booking.booking_id);
      setBooking(updated);
      goTo("Done");
    } catch {
      // apiClient already toasts the error
    } finally {
      setAuthorizing(false);
    }
  }

  const canLeaveService = !!selectedService;
  const canLeaveDetails = jobDescription.trim().length >= 10;
  const canLeaveAddress = !!selectedAddressId && !showAddressForm;

  if (!category) {
    return <Navigate to="/services" />;
  }

  return (
    <PageShell title="Book a Service" subtitle={`${category} · request a provider in a few steps`}>
      <Stepper current={stepIndex} />

      <div className="mt-6 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
        {step === "Service" && (
          <section className="animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-lg font-semibold">Which service do you need?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Pick the exact job under {category}.</p>

            {serviceError ? (
              <div className="mt-6">
                <EmptyState
                  icon={AlertTriangle}
                  title="Couldn't load services"
                  description={serviceError}
                  actionLabel="Back to Services"
                  actionTo="/services"
                />
              </div>
            ) : services === null ? (
              <LoadingRows />
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {services.map((s) => (
                  <button
                    key={s.service_id}
                    onClick={() => setSelectedService(s)}
                    className={`rounded-2xl border p-4 text-left transition-colors ${
                      selectedService?.service_id === s.service_id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{s.name}</p>
                      {selectedService?.service_id === s.service_id && (
                        <Check className="size-4 text-primary" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  </button>
                ))}
              </div>
            )}

            <StepFooter>
              <div />
              <NextButton disabled={!canLeaveService} onClick={() => goTo("Details")} />
            </StepFooter>
          </section>
        )}

        {step === "Details" && (
          <section className="animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-lg font-semibold">Tell us about the job</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A clear description helps providers quote accurately.
            </p>

            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="e.g. Kitchen sink is leaking under the cabinet, needs urgent repair."
              className="mt-4 min-h-28 rounded-2xl"
              maxLength={2000}
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {jobDescription.trim().length}/10 min characters
            </p>

            <p className="mt-6 text-sm font-medium">Preferred time window (optional)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TIME_WINDOWS.map((w) => (
                <button
                  key={w.value}
                  onClick={() => setTimeWindow((cur) => (cur === w.value ? null : w.value))}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                    timeWindow === w.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-foreground/80 hover:bg-muted/50"
                  }`}
                >
                  {w.label}
                  <span className="ml-1.5 text-xs text-muted-foreground">{w.hint}</span>
                </button>
              ))}
            </div>

            <p className="mt-6 text-sm font-medium">Preferred date (optional)</p>
            <div className="mt-2 rounded-2xl border border-border p-2">
              <Calendar
                mode="single"
                selected={preferredDate}
                onSelect={setPreferredDate}
                disabled={{ before: new Date() }}
              />
            </div>

            <StepFooter>
              <BackButton onClick={back} />
              <NextButton disabled={!canLeaveDetails} onClick={() => goTo("Address")} />
            </StepFooter>
          </section>
        )}

        {step === "Address" && (
          <section className="animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-lg font-semibold">Where's the job?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose a saved address or add a new one.</p>

            {addresses === null ? (
              <LoadingRows />
            ) : (
              <div className="mt-5 space-y-3">
                {addresses.map((a) => (
                  <button
                    key={a.address_id}
                    onClick={() => {
                      setSelectedAddressId(a.address_id);
                      setShowAddressForm(false);
                    }}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                      selectedAddressId === a.address_id && !showAddressForm
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {a.label}
                        {a.is_default && (
                          <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {a.street_address}, {a.city}
                        {a.region ? `, ${a.region}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">{a.recipient_name} · {a.phone}</p>
                    </div>
                    {selectedAddressId === a.address_id && !showAddressForm && (
                      <Check className="size-5 shrink-0 text-primary" />
                    )}
                  </button>
                ))}

                {!showAddressForm ? (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-medium text-muted-foreground hover:bg-muted/50"
                  >
                    <Plus className="size-4" /> Add a new address
                  </button>
                ) : (
                  <div className="rounded-2xl border border-border p-4">
                    <p className="mb-3 text-sm font-semibold">New address</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={addrDraft.label}
                        onChange={(e) => setAddrDraft((d) => ({ ...d, label: e.target.value }))}
                        placeholder="Label (e.g. Home)"
                        className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm outline-none"
                      />
                      <input
                        value={addrDraft.recipient_name}
                        onChange={(e) => setAddrDraft((d) => ({ ...d, recipient_name: e.target.value }))}
                        placeholder="Recipient name"
                        className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm outline-none"
                      />
                      <input
                        value={addrDraft.phone}
                        onChange={(e) => setAddrDraft((d) => ({ ...d, phone: e.target.value }))}
                        placeholder="Phone"
                        className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm outline-none"
                      />
                      <input
                        value={addrDraft.city}
                        onChange={(e) => setAddrDraft((d) => ({ ...d, city: e.target.value }))}
                        placeholder="City"
                        className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm outline-none"
                      />
                      <input
                        value={addrDraft.street_address}
                        onChange={(e) => setAddrDraft((d) => ({ ...d, street_address: e.target.value }))}
                        placeholder="Street address"
                        className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm outline-none sm:col-span-2"
                      />
                      <input
                        value={addrDraft.region}
                        onChange={(e) => setAddrDraft((d) => ({ ...d, region: e.target.value }))}
                        placeholder="Region (optional)"
                        className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm outline-none"
                      />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={saveNewAddress}
                        disabled={savingAddress}
                        className="rounded-xl px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                        style={{ backgroundImage: "var(--gradient-primary)" }}
                      >
                        {savingAddress ? "Saving..." : "Save address"}
                      </button>
                      {(addresses ?? []).length > 0 && (
                        <button
                          onClick={() => setShowAddressForm(false)}
                          className="rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <StepFooter>
              <BackButton onClick={back} />
              <NextButton disabled={!canLeaveAddress} onClick={() => goTo("Review")} />
            </StepFooter>
          </section>
        )}

        {step === "Review" && selectedService && (
          <section className="animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-lg font-semibold">Review your request</h2>
            <p className="mt-1 text-sm text-muted-foreground">Double check everything before we find you a pro.</p>

            <div className="mt-5 divide-y divide-border rounded-2xl border border-border">
              <ReviewRow label="Service" value={`${selectedService.name} (${category})`} onEdit={() => goTo("Service")} />
              <ReviewRow label="Description" value={jobDescription} onEdit={() => goTo("Details")} />
              <ReviewRow
                label="Schedule"
                value={
                  [preferredDate ? formatDate(preferredDate) : null, timeWindow]
                    .filter(Boolean)
                    .join(" · ") || "No preference"
                }
                onEdit={() => goTo("Details")}
              />
              <ReviewRow
                label="Address"
                value={addresses?.find((a) => a.address_id === selectedAddressId)?.street_address ?? ""}
                onEdit={() => goTo("Address")}
              />
            </div>

            {reviewIssue && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">
                    {reviewIssue.status === "OUTSIDE_SERVICE_AREA"
                      ? "We don't serve that area yet"
                      : "We need a bit more information"}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {reviewIssue.notes ?? "Please review your details and try again."}
                  </p>
                  <button
                    onClick={() => goTo("Address")}
                    className="mt-2 text-sm font-semibold text-primary hover:underline"
                  >
                    Change address
                  </button>
                </div>
              </div>
            )}

            <StepFooter>
              <BackButton onClick={back} />
              <button
                onClick={submitRequest}
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </StepFooter>
          </section>
        )}

        {step === "Match" && (
          <section className="animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-lg font-semibold">Matching you with providers</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We're finding the best-rated pros near you for {selectedService?.name}.
            </p>

            {matching ? (
              <div className="mt-10 flex flex-col items-center justify-center py-10 text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="size-7 animate-pulse" />
                </span>
                <p className="mt-4 font-medium">Searching nearby providers...</p>
              </div>
            ) : matchOutcome === "NO_PROVIDER_AVAILABLE" ? (
              <div className="mt-6">
                <EmptyState
                  icon={UserX}
                  title="No providers available right now"
                  description="We couldn't find a provider for this service in your area yet. Try again shortly or pick a different service."
                  actionLabel="Choose a Different Service"
                  onAction={() => {
                    setMatchOutcome(null);
                    setRequest(null);
                    goTo("Service");
                  }}
                />
              </div>
            ) : matchOutcome === "ERROR" ? (
              <div className="mt-6">
                <EmptyState
                  icon={AlertTriangle}
                  title="Something went wrong"
                  description="We couldn't run matching for this request. Please try again."
                  actionLabel="Retry"
                  onAction={() => setMatchOutcome(null)}
                />
              </div>
            ) : quotes === null ? (
              <LoadingRows />
            ) : quotes.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  icon={UserX}
                  title="No instant quotes yet"
                  description="Matched providers haven't sent an estimate yet. Check back on My Bookings shortly."
                  actionLabel="Back to Bookings"
                  actionTo="/bookings"
                />
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {quotes.map((q) => {
                  const isRequested =
                    !!providerName && q.display_name.toLowerCase() === providerName.toLowerCase();
                  return (
                    <div
                      key={q.quote_id}
                      className={`rounded-2xl border p-4 ${isRequested ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
                            {q.display_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{q.display_name}</p>
                              <BadgeCheck className="size-4 text-primary" />
                              {isRequested && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                  Your pick
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{q.headline}</p>
                            <p className="mt-0.5 flex items-center gap-1 text-sm">
                              <Star className="size-3.5 fill-current text-[#FFB800]" />
                              {q.rating_avg}
                              <span className="text-muted-foreground"> · {q.lead_time_days}d lead time</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{money(q.amount, q.currency)}</p>
                          <button
                            onClick={() => chooseQuote(q)}
                            disabled={acceptingQuoteId !== null}
                            className="mt-2 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                            style={{ backgroundImage: "var(--gradient-primary)" }}
                          >
                            {acceptingQuoteId === q.quote_id && <Loader2 className="size-4 animate-spin" />}
                            Accept & Continue
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {step === "Payment" && booking && (
          <section className="animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-lg font-semibold">Confirm & authorize payment</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your booking is confirmed. Authorize payment to lock in your provider.
            </p>

            <div className="mt-5 rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{booking.service_name}</p>
                <span className="rounded-full bg-success-muted px-2.5 py-1 text-xs font-semibold text-success-foreground">
                  {booking.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Booking {booking.booking_number}</p>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <InfoRow icon={CalendarIcon} label="Scheduled" value={`${booking.scheduled_date}${booking.time_window ? ` · ${booking.time_window}` : ""}`} />
                <InfoRow icon={MapPin} label="Address" value={`${booking.address_street}, ${booking.address_city}`} />
                <InfoRow icon={BadgeCheck} label="Provider" value={`${booking.provider_name}`} />
                <InfoRow icon={Clock} label="Provider note" value={booking.provider_headline ?? "—"} />
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl bg-muted/50 p-4">
                <span className="text-sm font-medium">Total amount</span>
                <span className="text-xl font-bold text-primary">{money(booking.agreed_amount, booking.currency)}</span>
              </div>
            </div>

            <StepFooter>
              <div />
              <button
                onClick={authorizePayment}
                disabled={authorizing}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                {authorizing ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                {authorizing ? "Authorizing..." : "Authorize Payment"}
              </button>
            </StepFooter>
          </section>
        )}

        {step === "Done" && booking && (
          <section className="flex flex-col items-center py-6 text-center animate-in fade-in zoom-in-95">
            <span className="flex size-20 items-center justify-center rounded-full bg-success-muted text-success-foreground">
              <CheckCircle2 className="size-10" />
            </span>
            <h2 className="mt-5 text-xl font-bold">Booking confirmed!</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {booking.provider_name} will handle your {booking.service_name?.toLowerCase()} on {booking.scheduled_date}.
            </p>

            <div className="mt-6 w-full max-w-sm rounded-2xl border border-dashed border-border p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Arrival code</p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <p className="text-3xl font-bold tracking-[0.3em]">{booking.arrival_code}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(booking.arrival_code ?? "");
                    toast.success("Arrival code copied");
                  }}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                >
                  <Copy className="size-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Share this with {booking.provider_name} on arrival.</p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => navigate({ to: "/bookings" })}
                className="rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                View My Bookings
              </button>
              <button
                onClick={() => navigate({ to: "/services" })}
                className="rounded-xl px-6 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50"
              >
                Book Another Service
              </button>
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <div className="mt-6 flex items-center gap-1.5 overflow-x-auto pb-1">
      {STEPS.map((s, i) => (
        <div key={s} className="flex shrink-0 items-center gap-1.5">
          <div
            className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
              i < current
                ? "bg-primary/10 text-primary"
                : i === current
                  ? "text-primary-foreground"
                  : "bg-muted text-muted-foreground"
            }`}
            style={i === current ? { backgroundImage: "var(--gradient-primary)" } : undefined}
          >
            {i < current ? <Check className="size-3.5" /> : <span>{i + 1}</span>}
            {s}
          </div>
          {i < STEPS.length - 1 && <div className="h-px w-4 shrink-0 bg-border" />}
        </div>
      ))}
    </div>
  );
}

function StepFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 flex items-center justify-between">{children}</div>;
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50"
    >
      <ArrowLeft className="size-4" /> Back
    </button>
  );
}

function NextButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="ml-auto flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
      style={{ backgroundImage: "var(--gradient-primary)" }}
    >
      Continue <ArrowRight className="size-4" />
    </button>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
      </div>
      <button onClick={onEdit} className="shrink-0 text-sm font-semibold text-primary hover:underline">
        Edit
      </button>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="mt-5 space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted/60" />
      ))}
    </div>
  );
}
