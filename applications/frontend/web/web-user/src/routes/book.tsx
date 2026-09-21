import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
  AlertTriangle,
  Award,
  Bug,
  Banknote,
  BadgeCheck,
  Briefcase,
  Calendar as CalendarIcon,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Gauge,
  Hammer,
  Landmark,
  Leaf,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Paintbrush,
  Plus,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  Truck,
  Tv,
  UserX,
  Users,
  Wallet as WalletIcon,
  Wind,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { fmtMoney } from "@/lib/format";
import {
  bookingApi,
  fixoSdk,
  type Address,
  type BookingRow,
  type CatalogCategory,
  type CatalogServiceResult,
  type MatchCandidate,
  type PaymentMethod,
  type ProviderListing,
  type ProviderProfile,
  type Quote,
  type ServiceRequestRow,
  type WalletBalance,
} from "@/lib/api-client";
import { useTranslation } from "react-i18next";

const title = "Book a Service — FIXO";
const description = "Request a service, get matched with providers and confirm your booking.";

const bookSearchSchema = z.object({
  category: z.string().optional(),
  categoryId: z.string().optional(),
  providerId: z.string().optional(),
  providerName: z.string().optional(),
  path: z.enum(["direct", "find-provider"]).optional(),
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

const ICONS: Record<string, LucideIcon> = {
  wrench: Wrench, zap: Zap, sparkles: Sparkles, hammer: Hammer, paintbrush: Paintbrush,
  tv: Tv, wind: Wind, leaf: Leaf, bug: Bug, truck: Truck, siren: AlertTriangle, tool: Wrench,
};
function iconFor(name: string): LucideIcon {
  return ICONS[name?.toLowerCase?.()] ?? Wrench;
}

const TIME_WINDOWS = [
  { value: "MORNING", labelKey: "morning" },
  { value: "AFTERNOON", labelKey: "afternoon" },
  { value: "EVENING", labelKey: "evening" },
] as const;

const SORT_LABEL_KEY: Record<"Best Match" | "Fastest" | "Lowest Price", string> = {
  "Best Match": "bestMatch",
  Fastest: "fastest",
  "Lowest Price": "lowestPrice",
};

const STEPS = ["Service", "Details", "Address", "Review", "Provider", "Payment", "Done"] as const;
type Step = (typeof STEPS)[number];
type Path = "direct" | "find-provider";

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isSameDay(a: Date, b: Date) {
  return formatDate(a) === formatDate(b);
}
function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
}
function formatPriceRange(range: { min: number; max: number }) {
  return range.min === range.max ? fmtMoney(range.min) : `${fmtMoney(range.min)} – ${fmtMoney(range.max)}`;
}
function displayDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function BookPage() {
  const { t } = useTranslation("booking");
  const navigate = useNavigate();
  const { access_token, loading, customer, logout } = useAuth();
  const search = Route.useSearch();

  const [stepIndex, setStepIndex] = useState(0);
  const step: Step = STEPS[stepIndex]!;

  const [path, setPath] = useState<Path>(search.path ?? (search.providerId ? "find-provider" : "direct"));

  // Real category list — powers the "no category yet" picker and category_id lookups.
  const [categories, setCategories] = useState<CatalogCategory[] | null>(null);
  const [pickedCategory, setPickedCategory] = useState<CatalogCategory | null>(null);
  const categoryName = search.category ?? pickedCategory?.name ?? null;

  // Step 1: service
  const [services, setServices] = useState<CatalogServiceResult[] | null>(null);
  const [selectedService, setSelectedService] = useState<CatalogServiceResult | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);

  // Pre-selected provider (Find Provider First, arriving from the Providers directory).
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [categoryProviders, setCategoryProviders] = useState<ProviderListing[] | null>(null);

  // Step 2: details
  const [jobDescription, setJobDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: address + schedule
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
  const [preferredDate, setPreferredDate] = useState<Date | undefined>(undefined);
  const [timeWindow, setTimeWindow] = useState<(typeof TIME_WINDOWS)[number]["value"] | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  // Step 4: review / submit
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState<ServiceRequestRow | null>(null);
  const [reviewIssue, setReviewIssue] = useState<{ status: string; notes: string | null } | null>(null);

  // Step 5: matching / quotes ("Provider")
  const [matching, setMatching] = useState(false);
  const [matchOutcome, setMatchOutcome] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchCandidate[] | null>(null);
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null);
  const [providerSort, setProviderSort] = useState<"Best Match" | "Fastest" | "Lowest Price">("Best Match");

  // Step 6: payment
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [authorizing, setAuthorizing] = useState(false);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[] | null>(null);
  const [selectedPaymentKey, setSelectedPaymentKey] = useState<string | null>(null);
  const [selectedPaymentLabel, setSelectedPaymentLabel] = useState<string | null>(null);

  // Step 7: done
  const [messageBody, setMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [showMessageBox, setShowMessageBox] = useState(false);

  const searchTerm = categoryName ? (CATEGORY_SEARCH_TERM[categoryName] ?? categoryName) : null;

  // Real category list — needed for the empty-entry picker and to resolve category_id.
  useEffect(() => {
    if (!(access_token && !loading)) return;
    bookingApi.catalogCategories().then(setCategories).catch(() => setCategories([]));
  }, [access_token, loading]);

  const resolvedCategory = useMemo(
    () => categories?.find((c) => c.name === categoryName || c.code === categoryName) ?? null,
    [categories, categoryName],
  );

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
        setServiceError(t("service.loadErrorDescription", { category: categoryName }));
      });
    return () => {
      cancelled = true;
    };
  }, [searchTerm]);

  // Real per-provider pricing across the category — powers the honest "estimated price" range.
  useEffect(() => {
    const catId = search.categoryId ?? resolvedCategory?.category_id;
    if (!catId) return;
    bookingApi.listProvidersByCategory(catId).then(setCategoryProviders).catch(() => setCategoryProviders([]));
  }, [search.categoryId, resolvedCategory]);

  // Real provider profile when arriving with a pre-selected provider (Find Provider First).
  useEffect(() => {
    if (!search.providerId) return;
    bookingApi.getProviderProfile(search.providerId).then(setProviderProfile).catch(() => setProviderProfile(null));
  }, [search.providerId]);

  // Addresses are needed from Address step onward, but also for the Details/Review summaries.
  useEffect(() => {
    if (!(access_token && !loading) || addresses !== null) return;
    bookingApi.listAddresses().then((rows) => {
      setAddresses(rows);
      const def = rows.find((a) => a.is_default) ?? rows[0];
      if (def) setSelectedAddressId(def.address_id);
      else setShowAddressForm(true);
    });
  }, [access_token, loading, addresses]);

  useEffect(() => {
    if (step !== "Provider" || !request) return;
    if (matchOutcome !== null) return;
    setMatching(true);
    bookingApi
      .runMatching(request.request_id)
      .then(async (res) => {
        setMatchOutcome(res.outcome);
        setMatches(res.matches);
        if (res.outcome === "MATCHING") {
          const q = await bookingApi.listQuotes(request.request_id);
          setQuotes(q);
        }
      })
      .catch(() => setMatchOutcome("ERROR"))
      .finally(() => setMatching(false));
  }, [step, request, matchOutcome]);

  // Real wallet balance + saved payment methods for the Payment step.
  useEffect(() => {
    if (step !== "Payment") return;
    fixoSdk.walletBalance().then(setWallet).catch(() => setWallet(null));
    fixoSdk.listPaymentMethods().then(setPaymentMethods).catch(() => setPaymentMethods([]));
  }, [step]);

  function goTo(name: Step) {
    setStepIndex(STEPS.indexOf(name));
  }
  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function chooseCategory(c: CatalogCategory) {
    setPickedCategory(c);
  }

  function findProviderFirst() {
    const catId = search.categoryId ?? resolvedCategory?.category_id;
    if (!catId || !categoryName) return;
    navigate({ to: "/providers", search: { category_id: catId, category_name: categoryName } });
  }

  async function saveNewAddress() {
    if (
      !addrDraft.recipient_name.trim() ||
      !addrDraft.phone.trim() ||
      !addrDraft.street_address.trim() ||
      !addrDraft.city.trim()
    ) {
      toast.error(t("address.fillRequiredFields"));
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

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files).filter((f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024);
    if (next.length < files.length) toast.error(t("details.photoSizeError"));
    setPhotos((prev) => [...prev, ...next].slice(0, 5));
  }

  async function submitRequest() {
    if (!selectedService || !selectedAddressId) return;
    setSubmitting(true);
    setReviewIssue(null);
    try {
      const fullDescription = notes.trim()
        ? `${jobDescription.trim()}\n\n${t("details.additionalNotesPrefix", { notes: notes.trim() })}`
        : jobDescription.trim();
      const created = await bookingApi.createServiceRequest({
        service_id: selectedService.service_id,
        description: fullDescription,
        address_id: selectedAddressId,
        ...(preferredDate ? { preferred_date: formatDate(preferredDate) } : {}),
        ...(timeWindow ? { time_window: timeWindow } : {}),
      });
      for (const file of photos) {
        try {
          await bookingApi.uploadEvidence(created.request_id, file);
        } catch {
          // apiClient already toasts the error; keep submitting the request itself
        }
      }
      const submitted = await bookingApi.submitServiceRequest(created.request_id);
      setRequest(submitted);
      if (submitted.status === "VALID") {
        goTo("Provider");
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

  async function sendMessage() {
    if (!booking || !messageBody.trim()) return;
    setSendingMessage(true);
    try {
      await bookingApi.sendBookingMessage(booking.booking_id, messageBody.trim());
      setMessageSent(true);
      setMessageBody("");
      toast.success(t("done.messageSentToast"));
    } catch {
      // apiClient already toasts the error
    } finally {
      setSendingMessage(false);
    }
  }

  const canLeaveService = !!selectedService;
  const canLeaveDetails = jobDescription.trim().length >= 10;
  const canLeaveAddress = !!selectedAddressId && !showAddressForm;

  const selectedAddress = addresses?.find((a) => a.address_id === selectedAddressId) ?? null;

  const priceRange = useMemo(() => {
    if (!categoryProviders || categoryProviders.length === 0) return null;
    const amounts = categoryProviders.map((p) => p.base_amount);
    return { min: Math.min(...amounts), max: Math.max(...amounts) };
  }, [categoryProviders]);

  const preferredProviderPrice = useMemo(() => {
    if (!providerProfile || !selectedService) return null;
    return providerProfile.services.find((s) => s.service_id === selectedService.service_id)?.base_amount ?? null;
  }, [providerProfile, selectedService]);

  const sortedQuotes = useMemo(() => {
    if (!quotes) return [];
    const list = [...quotes];
    if (providerSort === "Fastest") list.sort((a, b) => a.lead_time_days - b.lead_time_days);
    else if (providerSort === "Lowest Price") list.sort((a, b) => a.amount - b.amount);
    if (search.providerId) {
      const idx = list.findIndex((q) => q.provider_id === search.providerId);
      if (idx > 0) list.unshift(list.splice(idx, 1)[0]!);
    }
    return list;
  }, [quotes, providerSort, search.providerId]);

  const preferredProviderMatched = useMemo(() => {
    if (!search.providerId) return "n/a" as const;
    if (quotes?.some((q) => q.provider_id === search.providerId)) return "quoted" as const;
    if (matches?.some((m) => m.provider_id === search.providerId)) return "matched" as const;
    return "unmatched" as const;
  }, [search.providerId, quotes, matches]);

  const avgMatchRating = useMemo(() => {
    if (!matches || matches.length === 0) return 0;
    return matches.reduce((s, m) => s + m.rating_avg, 0) / matches.length;
  }, [matches]);
  const fastestLeadDays = useMemo(
    () => (quotes && quotes.length > 0 ? Math.min(...quotes.map((q) => q.lead_time_days)) : null),
    [quotes],
  );
  const lowestQuote = useMemo(
    () => (quotes && quotes.length > 0 ? Math.min(...quotes.map((q) => q.amount)) : null),
    [quotes],
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">{t("common.loading")}</div>;
  }

  return (
    <PageShell
      title={t("page.title")}
      subtitle={
        categoryName
          ? path === "find-provider"
            ? t("page.subtitleFindProvider", { category: categoryName })
            : t("page.subtitleChooseAddress", { category: categoryName })
          : t("page.subtitleDefault")
      }
      userName={customer?.full_name}
      onLogout={logout}
    >
      <div className="mt-2 flex items-center gap-3">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {t("path.badge", { mode: path === "find-provider" ? t("path.findProviderFirst") : t("path.bookDirectly") })}
        </span>
      </div>

      <Stepper current={stepIndex} />

      <div className="mt-6 rounded-3xl bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
        {step === "Service" && (
          <section className="animate-in fade-in slide-in-from-bottom-2">
            {!categoryName ? (
              <>
                <h2 className="text-lg font-semibold">{t("service.chooseCategoryTitle")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("service.chooseCategorySubtitle")}</p>
                {categories === null ? (
                  <LoadingRows />
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((c) => {
                      const Icon = iconFor(c.icon);
                      return (
                        <button
                          key={c.category_id}
                          onClick={() => chooseCategory(c)}
                          className="flex items-start gap-3 rounded-2xl bg-card p-4 text-left shadow-[var(--shadow-xs)] transition-all duration-200 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-[var(--shadow-sm)]"
                        >
                          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon className="size-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold">{c.name}</p>
                            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                            {c.min_price != null && (
                              <p className="mt-1 text-xs font-semibold text-primary">{t("service.fromPrice", { price: fmtMoney(c.min_price) })}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold">{t("service.chooseTaskTitle", { category: categoryName.toLowerCase() })}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("service.chooseTaskSubtitle")}</p>

                {serviceError ? (
                  <div className="mt-6">
                    <EmptyState
                      icon={AlertTriangle}
                      title={t("service.loadErrorTitle")}
                      description={serviceError}
                      actionLabel={t("service.backToServices")}
                      actionTo="/services"
                    />
                  </div>
                ) : services === null ? (
                  <LoadingRows />
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((s) => {
                      const Icon = iconFor(s.icon);
                      const active = selectedService?.service_id === s.service_id;
                      return (
                        <button
                          key={s.service_id}
                          onClick={() => setSelectedService(s)}
                          className={`rounded-2xl border p-4 text-left transition-all duration-200 ease-[var(--ease-premium)] ${
                            active ? "border-primary bg-primary/5 shadow-[var(--shadow-xs)]" : "border-border shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-[var(--shadow-sm)]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <Icon className="size-5" />
                            </span>
                            {active && <Check className="size-4 text-primary" />}
                          </div>
                          <p className="mt-3 font-semibold">{s.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {!search.providerId && (
                  <>
                    <h3 className="mt-8 text-sm font-semibold">{t("service.choosePathTitle")}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t("service.choosePathSubtitle")}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <button
                        onClick={() => setPath("direct")}
                        className={`rounded-2xl border p-4 text-left transition-all duration-200 ease-[var(--ease-premium)] ${
                          path === "direct" ? "border-primary bg-primary/5 shadow-[var(--shadow-xs)]" : "border-border shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-[var(--shadow-sm)]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <CalendarIcon className="size-5" />
                          </span>
                          {path === "direct" && <Check className="size-4 text-primary" />}
                        </div>
                        <p className="mt-3 font-semibold">{t("path.bookDirectly")}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t("service.bookDirectlyDesc")}</p>
                      </button>
                      <button
                        onClick={() => setPath("find-provider")}
                        className={`rounded-2xl border p-4 text-left transition-all duration-200 ease-[var(--ease-premium)] ${
                          path === "find-provider" ? "border-primary bg-primary/5 shadow-[var(--shadow-xs)]" : "border-border shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-[var(--shadow-sm)]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Users className="size-5" />
                          </span>
                          {path === "find-provider" && <Check className="size-4 text-primary" />}
                        </div>
                        <p className="mt-3 font-semibold">{t("path.findProviderFirst")}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t("service.findProviderDesc")}</p>
                      </button>
                    </div>
                  </>
                )}

                <StepFooter>
                  <div />
                  <NextButton
                    disabled={!canLeaveService}
                    onClick={() => (path === "find-provider" && !search.providerId ? findProviderFirst() : goTo("Details"))}
                  />
                </StepFooter>
              </>
            )}
          </section>
        )}

        {step === "Details" && (
          <section className="animate-in fade-in slide-in-from-bottom-2">
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="min-w-0">
                {search.providerId && (
                  <div className="mb-5 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                    {providerProfile ? (
                      <div className="flex items-center gap-3">
                        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
                          {initials(providerProfile.display_name)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{providerProfile.display_name}</p>
                            {providerProfile.rating_avg >= 4.8 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                <Award className="size-3" /> {t("details.topRated")}
                              </span>
                            )}
                          </div>
                          <p className="flex items-center gap-1 text-sm">
                            <Star className="size-3.5 fill-current text-[#FFB800]" /> {providerProfile.rating_avg.toFixed(1)}
                            <span className="text-muted-foreground"> {t("details.reviewsCount", { count: providerProfile.rating_count, formatted: providerProfile.rating_count.toLocaleString() })}</span>
                          </p>
                          <p className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Briefcase className="size-3" /> {t("details.jobsDone", { count: providerProfile.jobs_completed, formatted: providerProfile.jobs_completed.toLocaleString() })}</span>
                            <span className="flex items-center gap-1"><CalendarIcon className="size-3" /> {t("details.since", { year: new Date(providerProfile.created_at).getFullYear() })}</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-14 animate-pulse rounded-xl bg-muted/60" />
                    )}
                  </div>
                )}

                <h2 className="text-lg font-semibold">{t("details.title")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("details.subtitle")}</p>

                <label className="mt-4 block text-sm font-medium">{t("details.describeIssueLabel")}</label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder={t("details.describePlaceholder")}
                  className="mt-2 min-h-28 rounded-2xl"
                  maxLength={2000}
                />
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {t("details.minCharacters", { count: jobDescription.trim().length })}
                </p>

                <label className="mt-4 block text-sm font-medium">{t("details.notesLabel")}</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("details.notesPlaceholder")}
                  className="mt-2 min-h-20 rounded-2xl"
                  maxLength={300}
                />

                <label className="mt-4 block text-sm font-medium">{t("details.photosLabel")}</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addPhotos(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border py-8 text-center hover:bg-muted/40"
                >
                  <Camera className="size-6 text-muted-foreground" />
                  <span className="text-sm font-semibold text-primary">{t("details.clickToUpload")}</span>
                  <span className="text-xs text-muted-foreground">{t("details.photoHint")}</span>
                </button>
                {photos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {photos.map((f, i) => (
                      <span key={i} className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">
                        {f.name.length > 20 ? `${f.name.slice(0, 17)}...` : f.name}
                        <button onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <StepFooter>
                  <BackButton onClick={back} />
                  <NextButton disabled={!canLeaveDetails} onClick={() => goTo("Address")} />
                </StepFooter>
              </div>

              <DetailsSummary
                selectedService={selectedService}
                categoryName={categoryName}
                priceRange={priceRange}
                preferredProviderPrice={preferredProviderPrice}
                providerId={search.providerId}
              />
            </div>
          </section>
        )}

        {step === "Address" && (
          <section className="animate-in fade-in slide-in-from-bottom-2">
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">{t("address.title")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("address.subtitle")}</p>

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
                        className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 ease-[var(--ease-premium)] ${
                          selectedAddressId === a.address_id && !showAddressForm
                            ? "border-primary bg-primary/5 shadow-[var(--shadow-xs)]"
                            : "border-border shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-[var(--shadow-sm)]"
                        }`}
                      >
                        <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">
                            {a.label}
                            {a.is_default && (
                              <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                                {t("address.default")}
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
                        <Plus className="size-4" /> {t("address.addNewAddress")}
                      </button>
                    ) : (
                      <div className="rounded-2xl bg-card shadow-[var(--shadow-xs)] p-4">
                        <p className="mb-3 text-sm font-semibold">{t("address.newAddressTitle")}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            value={addrDraft.label}
                            onChange={(e) => setAddrDraft((d) => ({ ...d, label: e.target.value }))}
                            placeholder={t("address.labelPlaceholder")}
                            className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm outline-none"
                          />
                          <input
                            value={addrDraft.recipient_name}
                            onChange={(e) => setAddrDraft((d) => ({ ...d, recipient_name: e.target.value }))}
                            placeholder={t("address.recipientNamePlaceholder")}
                            className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm outline-none"
                          />
                          <input
                            value={addrDraft.phone}
                            onChange={(e) => setAddrDraft((d) => ({ ...d, phone: e.target.value }))}
                            placeholder={t("address.phonePlaceholder")}
                            className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm outline-none"
                          />
                          <input
                            value={addrDraft.city}
                            onChange={(e) => setAddrDraft((d) => ({ ...d, city: e.target.value }))}
                            placeholder={t("address.cityPlaceholder")}
                            className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm outline-none"
                          />
                          <input
                            value={addrDraft.street_address}
                            onChange={(e) => setAddrDraft((d) => ({ ...d, street_address: e.target.value }))}
                            placeholder={t("address.streetPlaceholder")}
                            className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm outline-none sm:col-span-2"
                          />
                          <input
                            value={addrDraft.region}
                            onChange={(e) => setAddrDraft((d) => ({ ...d, region: e.target.value }))}
                            placeholder={t("address.regionPlaceholder")}
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
                            {savingAddress ? t("address.saving") : t("address.saveAddress")}
                          </button>
                          {(addresses ?? []).length > 0 && (
                            <button
                              onClick={() => setShowAddressForm(false)}
                              className="rounded-xl px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50"
                            >
                              {t("address.cancel")}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <h3 className="mt-8 text-sm font-semibold">{t("address.scheduleTitle")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("address.scheduleSubtitle")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => { setPreferredDate(new Date()); setShowCalendar(false); }}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                      preferredDate && isSameDay(preferredDate, new Date()) ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground/80 hover:bg-muted/50"
                    }`}
                  >
                    {t("address.today")}
                  </button>
                  <button
                    onClick={() => { const t = new Date(); t.setDate(t.getDate() + 1); setPreferredDate(t); setShowCalendar(false); }}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                      preferredDate && (() => { const t = new Date(); t.setDate(t.getDate() + 1); return isSameDay(preferredDate, t); })()
                        ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground/80 hover:bg-muted/50"
                    }`}
                  >
                    {t("address.tomorrow")}
                  </button>
                  <button
                    onClick={() => setShowCalendar((v) => !v)}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted/50"
                  >
                    {preferredDate && !isSameDay(preferredDate, new Date()) && !(() => { const t2 = new Date(); t2.setDate(t2.getDate() + 1); return isSameDay(preferredDate, t2); })()
                      ? formatDate(preferredDate)
                      : t("address.pickDate")}
                  </button>
                </div>
                {showCalendar && (
                  <div className="mt-3 rounded-2xl bg-card shadow-[var(--shadow-xs)] p-2">
                    <Calendar mode="single" selected={preferredDate} onSelect={setPreferredDate} disabled={{ before: new Date() }} />
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
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
                      {t(`address.timeWindows.${w.labelKey}.label`)}
                      <span className="ml-1.5 text-xs text-muted-foreground">{t(`address.timeWindows.${w.labelKey}.hint`)}</span>
                    </button>
                  ))}
                </div>

                <StepFooter>
                  <BackButton onClick={back} />
                  <NextButton disabled={!canLeaveAddress} onClick={() => goTo("Review")} />
                </StepFooter>
              </div>

              <DetailsSummary
                selectedService={selectedService}
                categoryName={categoryName}
                priceRange={priceRange}
                preferredProviderPrice={preferredProviderPrice}
                providerId={search.providerId}
              />
            </div>
          </section>
        )}

        {step === "Review" && selectedService && (
          <section className="animate-in fade-in slide-in-from-bottom-2">
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">{t("review.title")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("review.subtitle")}</p>

                <div className="mt-5 divide-y divide-border rounded-2xl bg-card shadow-[var(--shadow-xs)]">
                  <ReviewRow label={t("review.serviceLabel")} value={`${selectedService.name} (${categoryName ?? ""})`} onEdit={() => goTo("Service")} />
                  <ReviewRow label={t("review.jobDetailsLabel")} value={jobDescription} onEdit={() => goTo("Details")} />
                  {photos.length > 0 && (
                    <ReviewRow label={t("review.photosLabel")} value={t("review.photosAttached", { count: photos.length })} onEdit={() => goTo("Details")} />
                  )}
                  <ReviewRow
                    label={t("review.addressLabel")}
                    value={selectedAddress ? `${selectedAddress.street_address}, ${selectedAddress.city}` : ""}
                    onEdit={() => goTo("Address")}
                  />
                  <ReviewRow
                    label={t("review.scheduleLabel")}
                    value={
                      [preferredDate ? formatDate(preferredDate) : null, timeWindow]
                        .filter(Boolean)
                        .join(" · ") || t("review.noPreference")
                    }
                    onEdit={() => goTo("Address")}
                  />
                </div>

                {reviewIssue && (
                  <div className="mt-4 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
                    <div>
                      <p className="font-semibold text-destructive">
                        {reviewIssue.status === "OUTSIDE_SERVICE_AREA"
                          ? t("review.outsideServiceArea")
                          : t("review.needMoreInfo")}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {reviewIssue.notes ?? t("review.reviewAndRetry")}
                      </p>
                      <button
                        onClick={() => goTo("Address")}
                        className="mt-2 text-sm font-semibold text-primary hover:underline"
                      >
                        {t("review.changeAddress")}
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
                    {submitting ? t("review.submitting") : t("review.continueToProvider")}
                  </button>
                </StepFooter>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-card shadow-[var(--shadow-xs)] p-5">
                  <div className="flex items-center gap-2 font-semibold"><Tag className="size-4 text-primary" /> {t("review.pricingEstimate")}</div>
                  {preferredProviderPrice != null ? (
                    <p className="mt-2 text-2xl font-bold text-primary">{fmtMoney(preferredProviderPrice)}</p>
                  ) : priceRange ? (
                    <p className="mt-2 text-2xl font-bold text-primary">{formatPriceRange(priceRange)}</p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">{t("review.pricingPending")}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">{t("review.finalAmountNote")}</p>
                </div>
                <div className="rounded-2xl bg-primary/5 p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("review.bookingPath")}</p>
                  <p className="mt-1 font-semibold text-primary">{path === "find-provider" ? t("path.findProviderFirst") : t("path.bookDirectly")}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {path === "find-provider"
                      ? t("review.pathNoteFindProvider")
                      : t("review.pathNoteDirect")}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {step === "Provider" && (
          <section className="animate-in fade-in slide-in-from-bottom-2">
            <h2 className="text-lg font-semibold">{t("provider.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {matching ? t("provider.findingPros") : t("provider.realMatches", { service: selectedService?.name ?? t("provider.yourRequestFallback") })}
            </p>

            {matching ? (
              <div className="mt-10 flex flex-col items-center justify-center py-10 text-center">
                <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="size-7 animate-pulse" />
                </span>
                <p className="mt-4 font-medium">{t("provider.searching")}</p>
              </div>
            ) : matchOutcome === "NO_PROVIDER_AVAILABLE" ? (
              <div className="mt-6">
                <EmptyState
                  icon={UserX}
                  title={t("provider.noProvidersTitle")}
                  description={t("provider.noProvidersDesc")}
                  actionLabel={t("provider.chooseDifferentService")}
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
                  title={t("provider.errorTitle")}
                  description={t("provider.errorDesc")}
                  actionLabel={t("provider.retry")}
                  onAction={() => setMatchOutcome(null)}
                />
              </div>
            ) : quotes === null ? (
              <LoadingRows />
            ) : quotes.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  icon={UserX}
                  title={t("provider.noQuotesTitle")}
                  description={t("provider.noQuotesDesc")}
                  actionLabel={t("provider.backToBookings")}
                  actionTo="/bookings"
                />
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard icon={Users} label={t("provider.metrics.providersFound")} hint={t("provider.metrics.providersFoundHint")} value={String(matches?.length ?? 0)} />
                  <MetricCard icon={Star} label={t("provider.metrics.averageRating")} hint={t("provider.metrics.averageRatingHint")} value={avgMatchRating ? avgMatchRating.toFixed(1) : "—"} tone="amber" tintValue />
                  <MetricCard icon={Gauge} label={t("provider.metrics.fastestLeadTime")} hint={t("provider.metrics.fastestLeadTimeHint")} value={fastestLeadDays != null ? t("provider.metrics.leadTimeValue", { count: fastestLeadDays }) : "—"} tone="success" tintValue />
                  <MetricCard icon={Tag} label={t("provider.metrics.startingFrom")} hint={t("provider.metrics.startingFromHint")} value={lowestQuote != null ? fmtMoney(lowestQuote, quotes[0]?.currency) : "—"} />
                </div>

                {search.providerId && preferredProviderMatched === "unmatched" && (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
                    <p className="text-sm text-muted-foreground">
                      {t("provider.unmatchedNotice", { name: search.providerName ?? t("provider.yourChosenProvider") })}
                    </p>
                  </div>
                )}
                {search.providerId && preferredProviderMatched === "matched" && (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
                    <p className="text-sm text-muted-foreground">
                      {t("provider.matchedNoQuoteNotice", { name: search.providerName ?? t("provider.yourChosenProvider") })}
                    </p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-1 rounded-xl bg-muted p-1">
                    {(["Best Match", "Fastest", "Lowest Price"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setProviderSort(s)}
                        className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                          providerSort === s ? "bg-card text-primary shadow-[var(--shadow-card)]" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t(`provider.sort.${SORT_LABEL_KEY[s]}`)}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => sortedQuotes[0] && chooseQuote(sortedQuotes[0])}
                    disabled={acceptingQuoteId !== null}
                    className="flex items-center gap-2 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-60"
                  >
                    <Sparkles className="size-4" /> {t("provider.autoAssignNow")}
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {sortedQuotes.map((q) => {
                    const isPreferred = search.providerId === q.provider_id;
                    return (
                      <div
                        key={q.quote_id}
                        className={`rounded-2xl border p-4 ${isPreferred ? "border-primary bg-primary/5" : "border-border"}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
                              {initials(q.display_name)}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{q.display_name}</p>
                                <BadgeCheck className="size-4 text-primary" />
                                {isPreferred && (
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                    {t("provider.yourPick")}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{q.headline}</p>
                              <p className="mt-0.5 flex items-center gap-1 text-sm">
                                <Star className="size-3.5 fill-current text-[#FFB800]" />
                                {q.rating_avg}
                                <span className="text-muted-foreground"> · {t("provider.leadTime", { count: q.lead_time_days })}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">{fmtMoney(q.amount, q.currency)}</p>
                            <button
                              onClick={() => chooseQuote(q)}
                              disabled={acceptingQuoteId !== null}
                              className="mt-2 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                              style={{ backgroundImage: "var(--gradient-primary)" }}
                            >
                              {acceptingQuoteId === q.quote_id && <Loader2 className="size-4 animate-spin" />}
                              {t("provider.acceptAndContinue")}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {step === "Payment" && booking && (
          <PaymentStep
            booking={booking}
            wallet={wallet}
            paymentMethods={paymentMethods}
            selectedPaymentKey={selectedPaymentKey}
            setSelectedPaymentKey={setSelectedPaymentKey}
            setSelectedPaymentLabel={setSelectedPaymentLabel}
            authorizing={authorizing}
            onAuthorize={authorizePayment}
          />
        )}

        {step === "Done" && booking && (
          <DoneStep
            booking={booking}
            paymentLabel={selectedPaymentLabel}
            messageBody={messageBody}
            setMessageBody={setMessageBody}
            sendingMessage={sendingMessage}
            messageSent={messageSent}
            showMessageBox={showMessageBox}
            setShowMessageBox={setShowMessageBox}
            onSendMessage={sendMessage}
            onViewBookings={() => navigate({ to: "/bookings" })}
            onViewInvoices={() => navigate({ to: "/invoices" })}
            onBookAnother={() => navigate({ to: "/services" })}
          />
        )}
      </div>
    </PageShell>
  );
}

function DetailsSummary({
  selectedService,
  categoryName,
  priceRange,
  preferredProviderPrice,
  providerId,
}: {
  selectedService: CatalogServiceResult | null;
  categoryName: string | null;
  priceRange: { min: number; max: number } | null;
  preferredProviderPrice: number | null;
  providerId?: string | undefined;
}) {
  const { t } = useTranslation("booking");
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card shadow-[var(--shadow-xs)] p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("summary.yourSelection")}</p>
        <p className="mt-2 font-semibold">{selectedService?.name ?? categoryName ?? "—"}</p>
        {selectedService?.description && <p className="mt-1 text-sm text-muted-foreground">{selectedService.description}</p>}
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">{providerId ? t("summary.providersPrice") : t("summary.estimatedPrice")}</p>
          <p className="text-lg font-bold text-primary">
            {preferredProviderPrice != null
              ? fmtMoney(preferredProviderPrice)
              : priceRange
                ? formatPriceRange(priceRange)
                : "—"}
          </p>
        </div>
      </div>
      <div className="rounded-2xl bg-primary/5 p-5">
        <h3 className="flex items-center gap-2 font-semibold text-primary"><MessageCircle className="size-4" /> {t("common.needHelp")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("common.needHelpDesc")}</p>
        <a href="/help" className="mt-3 inline-flex items-center gap-2 rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5">
          <MessageCircle className="size-4" /> {t("common.chatWithUs")}
        </a>
      </div>
    </div>
  );
}

function PaymentStep({
  booking,
  wallet,
  paymentMethods,
  selectedPaymentKey,
  setSelectedPaymentKey,
  setSelectedPaymentLabel,
  authorizing,
  onAuthorize,
}: {
  booking: BookingRow;
  wallet: WalletBalance | null;
  paymentMethods: PaymentMethod[] | null;
  selectedPaymentKey: string | null;
  setSelectedPaymentKey: (k: string) => void;
  setSelectedPaymentLabel: (l: string) => void;
  authorizing: boolean;
  onAuthorize: () => void;
}) {
  const { t } = useTranslation("booking");
  function methodIcon(type: string) {
    if (type === "mpesa") return Smartphone;
    if (type === "bank") return Landmark;
    return CreditCard;
  }

  function pick(key: string, label: string) {
    setSelectedPaymentKey(key);
    setSelectedPaymentLabel(label);
  }

  return (
    <section className="animate-in fade-in slide-in-from-bottom-2">
      <h2 className="text-lg font-semibold">{t("payment.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("payment.subtitle")}</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0">
          <div className="rounded-2xl bg-card shadow-[var(--shadow-xs)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{t("payment.selectedProvider")}</p>
                <p className="font-semibold">{booking.provider_name ?? "—"}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-muted-foreground">{t("payment.serviceLabel")}</p>
                <p className="font-medium text-primary">{booking.service_name}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-muted-foreground">{t("payment.scheduleLabel")}</p>
                <p className="font-medium">{booking.scheduled_date}{booking.time_window ? ` · ${booking.time_window}` : ""}</p>
              </div>
            </div>
          </div>

          <h3 className="mt-6 text-sm font-semibold">{t("payment.chooseMethod")}</h3>
          <div className="mt-3 space-y-3">
            <button
              onClick={() => pick("WALLET", t("payment.fixoWallet"))}
              className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200 ease-[var(--ease-premium)] ${
                selectedPaymentKey === "WALLET" ? "border-primary bg-primary/5 shadow-[var(--shadow-xs)]" : "border-border shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-[var(--shadow-sm)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><WalletIcon className="size-5" /></span>
                <div>
                  <p className="font-semibold">{t("payment.fixoWallet")}</p>
                  <p className="text-sm text-muted-foreground">{t("payment.availableBalance", { amount: wallet ? fmtMoney(wallet.balance, wallet.currency) : "—" })}</p>
                </div>
              </div>
              <span className={`flex size-5 items-center justify-center rounded-full border-2 ${selectedPaymentKey === "WALLET" ? "border-primary bg-primary" : "border-border"}`}>
                {selectedPaymentKey === "WALLET" && <span className="size-2 rounded-full bg-white" />}
              </span>
            </button>

            {paymentMethods === null ? (
              <div className="h-16 animate-pulse rounded-2xl bg-muted/60" />
            ) : (
              paymentMethods.map((m) => {
                const Icon = methodIcon(m.type);
                const last4 = (m.details_masked?.["last4"] as string | undefined) ?? "••••";
                const label = `${m.provider || m.type} •••• ${last4}`;
                return (
                  <button
                    key={m.method_id}
                    onClick={() => pick(m.method_id, label)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200 ease-[var(--ease-premium)] ${
                      selectedPaymentKey === m.method_id ? "border-primary bg-primary/5 shadow-[var(--shadow-xs)]" : "border-border shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:bg-muted/50 hover:shadow-[var(--shadow-sm)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
                      <div>
                        <p className="font-semibold">{label}</p>
                        {m.is_default && <p className="text-sm text-muted-foreground">{t("payment.default")}</p>}
                      </div>
                    </div>
                    <span className={`flex size-5 items-center justify-center rounded-full border-2 ${selectedPaymentKey === m.method_id ? "border-primary bg-primary" : "border-border"}`}>
                      {selectedPaymentKey === m.method_id && <span className="size-2 rounded-full bg-white" />}
                    </span>
                  </button>
                );
              })
            )}

            <a
              href="/payments"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-medium text-muted-foreground hover:bg-muted/50"
            >
              <Plus className="size-4" /> {t("payment.addPaymentMethod")}
            </a>
          </div>

          <StepFooter>
            <div />
            <button
              onClick={onAuthorize}
              disabled={authorizing || !selectedPaymentKey}
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              {authorizing ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              {authorizing ? t("payment.authorizing") : t("payment.confirmBooking")}
            </button>
          </StepFooter>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-card shadow-[var(--shadow-xs)] p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("payment.totalAmount")}</p>
            <p className="mt-2 text-2xl font-bold text-primary">{fmtMoney(booking.agreed_amount, booking.currency)}</p>
            <p className="mt-2 text-xs text-muted-foreground">{t("payment.totalAmountNote")}</p>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-primary/5 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">{t("payment.holdOnlyTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("payment.holdOnlyDesc")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const NEXT_STEPS = [
  { key: "PAYMENT_AUTHORIZED", labelKey: "paymentAuthorized" },
  { key: "ON_THE_WAY", labelKey: "onTheWay" },
  { key: "STARTED", labelKey: "started" },
  { key: "CLOSED", labelKey: "closed" },
] as const;

function DoneStep({
  booking,
  paymentLabel,
  messageBody,
  setMessageBody,
  sendingMessage,
  messageSent,
  showMessageBox,
  setShowMessageBox,
  onSendMessage,
  onViewBookings,
  onViewInvoices,
  onBookAnother,
}: {
  booking: BookingRow;
  paymentLabel: string | null;
  messageBody: string;
  setMessageBody: (v: string) => void;
  sendingMessage: boolean;
  messageSent: boolean;
  showMessageBox: boolean;
  setShowMessageBox: (v: boolean) => void;
  onSendMessage: () => void;
  onViewBookings: () => void;
  onViewInvoices: () => void;
  onBookAnother: () => void;
}) {
  const { t } = useTranslation("booking");
  return (
    <section className="animate-in fade-in zoom-in-95">
      <div className="flex flex-col items-center py-4 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-success-muted text-success-foreground">
          <CheckCircle2 className="size-10" />
        </span>
        <h2 className="mt-5 text-xl font-bold">{t("done.title")}</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t("done.subtitle", { provider: booking.provider_name })}
        </p>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          <SummaryLine icon={Tag} label={t("done.bookingId")} value={booking.booking_number} />
          <SummaryLine icon={Wrench} label={t("done.serviceLabel")} value={booking.service_name ?? "—"} />
          <SummaryLine icon={Users} label={t("done.assignedProvider")} value={booking.provider_name ?? "—"} />
          <SummaryLine icon={CalendarIcon} label={t("done.scheduledTime")} value={`${booking.scheduled_date}${booking.time_window ? ` · ${booking.time_window}` : ""}`} />
          <SummaryLine icon={MapPin} label={t("done.serviceAddress")} value={`${booking.address_street ?? ""}, ${booking.address_city ?? ""}`} />

          {booking.arrival_code && (
            <div className="rounded-2xl border border-dashed border-border p-5 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("done.arrivalCode")}</p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <p className="text-3xl font-bold tracking-[0.3em]">{booking.arrival_code}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(booking.arrival_code ?? "");
                    toast.success(t("done.arrivalCodeCopied"));
                  }}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                >
                  <Copy className="size-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t("done.shareArrivalCode", { provider: booking.provider_name })}</p>
            </div>
          )}

          <h3 className="pt-2 text-sm font-semibold">{t("done.whatsNext")}</h3>
          <div className="flex items-start overflow-x-auto pb-1">
            {NEXT_STEPS.map((s, i) => {
              const done = i === 0 && booking.payment?.status === "AUTHORIZED";
              return (
                <div key={s.key} className="flex min-w-[140px] flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <div className={`h-px flex-1 ${i === 0 ? "opacity-0" : done ? "bg-success" : "bg-border"}`} />
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${done ? "bg-success text-white" : "bg-muted text-muted-foreground"}`}>
                      {done ? <Check className="size-4" /> : <span className="text-sm font-semibold">{i + 1}</span>}
                    </span>
                    <div className={`h-px flex-1 ${i === NEXT_STEPS.length - 1 ? "opacity-0" : "bg-border"}`} />
                  </div>
                  <p className="mt-2 text-sm font-semibold">{t(`done.nextSteps.${s.labelKey}.label`)}</p>
                  <p className="mt-0.5 px-1 text-xs text-muted-foreground">{t(`done.nextSteps.${s.labelKey}.desc`)}</p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onViewBookings}
              className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              <MapPin className="size-4" /> {t("done.trackBooking")}
            </button>
            <button
              onClick={() => setShowMessageBox(!showMessageBox)}
              className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium transition-colors hover:bg-muted/50"
            >
              <MessageCircle className="size-4" /> {t("done.messageProvider")}
            </button>
            <button
              onClick={onViewInvoices}
              className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium transition-colors hover:bg-muted/50"
            >
              <Tag className="size-4" /> {t("done.viewInvoice")}
            </button>
          </div>

          {showMessageBox && (
            <div className="rounded-2xl bg-card shadow-[var(--shadow-xs)] p-4">
              {messageSent ? (
                <p className="flex items-center gap-2 text-sm font-medium text-success"><CheckCircle2 className="size-4" /> {t("done.messageSentTo", { provider: booking.provider_name })}</p>
              ) : (
                <>
                  <Textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder={t("done.messagePlaceholder", { provider: booking.provider_name ?? t("done.yourProviderFallback") })}
                    className="min-h-20 rounded-xl"
                    maxLength={500}
                  />
                  <button
                    onClick={onSendMessage}
                    disabled={sendingMessage || !messageBody.trim()}
                    className="mt-2 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                    style={{ backgroundImage: "var(--gradient-primary)" }}
                  >
                    {sendingMessage ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    {t("done.send")}
                  </button>
                </>
              )}
            </div>
          )}

          <button
            onClick={onBookAnother}
            className="text-sm font-medium text-muted-foreground hover:underline"
          >
            {t("done.bookAnotherService")}
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-card shadow-[var(--shadow-xs)] p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{t("done.paymentStatus")}</p>
              <span className="rounded-full bg-success-muted px-2.5 py-1 text-xs font-semibold text-success-foreground">
                {booking.payment?.status === "AUTHORIZED" ? t("done.paid") : booking.payment?.status ?? "—"}
              </span>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">{t("done.amountLabel")}</span><span className="font-semibold">{fmtMoney(booking.agreed_amount, booking.currency)}</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">{t("done.paymentMethod")}</span><span className="font-semibold">{paymentLabel ?? "—"}</span></div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-primary/5 p-4">
            <MessageCircle className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">{t("common.needHelp")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("common.needHelpDesc")}</p>
              <a href="/help" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">{t("common.chatWithUs")}</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryLine({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card shadow-[var(--shadow-xs)] p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  const { t } = useTranslation("booking");
  return (
    <div className="mt-6 flex items-center gap-1.5 overflow-x-auto pb-1">
      {STEPS.map((s, i) => (
        <div key={s} className="flex shrink-0 items-center gap-1.5">
          <div
            className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-all duration-300 ease-[var(--ease-premium)] ${
              i < current
                ? "bg-primary/10 text-primary"
                : i === current
                  ? "text-primary-foreground shadow-[var(--shadow-glow)]"
                  : "bg-muted text-muted-foreground"
            }`}
            style={i === current ? { backgroundImage: "var(--gradient-primary)" } : undefined}
          >
            {i < current ? <Check className="size-3.5" /> : <span>{i + 1}</span>}
            {t(`stepper.${s.toLowerCase()}`)}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px w-4 shrink-0 transition-colors duration-300 ${i < current ? "bg-primary/40" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function StepFooter({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 flex items-center justify-between">{children}</div>;
}

function BackButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation("booking");
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50"
    >
      {t("common.back")}
    </button>
  );
}

function NextButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  const { t } = useTranslation("booking");
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="ml-auto flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-all duration-200 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-[var(--shadow-glow)]"
      style={{ backgroundImage: "var(--gradient-primary)" }}
    >
      {t("common.continue")}
    </button>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  const { t } = useTranslation("booking");
  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
      </div>
      <button onClick={onEdit} className="shrink-0 text-sm font-semibold text-primary hover:underline">
        {t("common.edit")}
      </button>
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
