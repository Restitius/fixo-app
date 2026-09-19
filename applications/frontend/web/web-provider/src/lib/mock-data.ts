// Mock data for the FIXO provider web app. No backend yet — every module
// reads from here so the UI can be reviewed end-to-end.

export type VerificationStatus =
  | "NOT_SUBMITTED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "MORE_INFO_REQUIRED";

export interface ProviderAccount {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  accountType: "INDIVIDUAL" | "BUSINESS";
  country: string;
  region: string;
  city: string;
  language: string;
  title: string;
  bio: string;
  yearsExperience: number;
  languages: string[];
  rating: number;
  reviewCount: number;
  completedJobs: number;
  level: "New Provider" | "Verified Provider" | "Trusted Provider" | "Top Provider" | "Elite Provider";
  verification: VerificationStatus;
  onboardingStep: number;
  onboardingTotal: number;
}

export const provider: ProviderAccount = {
  id: "PRV-10294",
  firstName: "John",
  middleName: "M",
  lastName: "Mwakalinga",
  email: "john.m@fixo.co.tz",
  phone: "+255 754 118 220",
  accountType: "BUSINESS",
  country: "Tanzania",
  region: "Dar es Salaam",
  city: "Kinondoni",
  language: "English",
  title: "Senior Electrician",
  bio: "Certified electrician with 8 years of field experience in residential wiring, solar installations and fault diagnosis. Available for emergency callouts across Dar es Salaam.",
  yearsExperience: 8,
  languages: ["English", "Swahili"],
  rating: 4.8,
  reviewCount: 214,
  completedJobs: 486,
  level: "Top Provider",
  verification: "VERIFIED",
  onboardingStep: 5,
  onboardingTotal: 7,
};

export const providerFullName = `${provider.firstName} ${provider.lastName}`;

export const onboardingSteps = [
  { key: "personal", label: "Personal information", done: true },
  { key: "business", label: "Business information", done: true },
  { key: "identity", label: "Identity verification", done: true },
  { key: "services", label: "Service configuration", done: true },
  { key: "areas", label: "Service areas", done: false },
  { key: "payment", label: "Payment information", done: false },
  { key: "agreements", label: "Agreements", done: false },
];

export const business = {
  name: "ABC Electrical & Plumbing Ltd",
  registrationNumber: "BRELA-1029384",
  taxNumber: "TIN-114-902-338",
  email: "info@abcelectrical.co.tz",
  phone: "+255 22 218 4410",
  address: "Plot 44, Mikocheni Light Industrial Area, Dar es Salaam",
  description:
    "Licensed electrical and plumbing contractor serving residential and commercial clients across Dar es Salaam since 2016.",
  established: 2016,
  employees: 12,
  website: "https://abcelectrical.co.tz",
  socials: { instagram: "@abcelectrical", facebook: "/abcelectricaltz" },
};

export interface JobRequest {
  id: string;
  service: string;
  customer: string;
  customerRating: number;
  area: string;
  distanceKm: number;
  date: string;
  time: string;
  description: string;
  propertyType: string;
  estimatedDuration: string;
  estimatedEarning: number;
  respondInSeconds: number;
  urgent: boolean;
  photos: number;
}

export const jobRequests: JobRequest[] = [
  {
    id: "REQ-88410",
    service: "Emergency socket & wiring fault",
    customer: "Amina Hassan",
    customerRating: 4.9,
    area: "Masaki, Kinondoni",
    distanceKm: 4.2,
    date: "2026-09-04",
    time: "11:30",
    description:
      "Sockets in the kitchen and living room lost power after a surge last night. Breaker keeps tripping when reset.",
    propertyType: "Apartment · 3 bedrooms",
    estimatedDuration: "2 hrs",
    estimatedEarning: 85000,
    respondInSeconds: 205,
    urgent: true,
    photos: 3,
  },
  {
    id: "REQ-88407",
    service: "Solar inverter installation",
    customer: "Peter Lyimo",
    customerRating: 4.6,
    area: "Mbezi Beach",
    distanceKm: 11.8,
    date: "2026-09-06",
    time: "09:00",
    description: "Install 5kVA hybrid inverter and connect to existing panel array on the roof.",
    propertyType: "House · 4 bedrooms",
    estimatedDuration: "6 hrs",
    estimatedEarning: 320000,
    respondInSeconds: 3600,
    urgent: false,
    photos: 5,
  },
  {
    id: "REQ-88399",
    service: "Ceiling fan installation (x3)",
    customer: "Grace Mollel",
    customerRating: 5,
    area: "Mikocheni B",
    distanceKm: 2.1,
    date: "2026-09-05",
    time: "14:00",
    description: "Three ceiling fans supplied by customer, need mounting and switch wiring.",
    propertyType: "House · 3 bedrooms",
    estimatedDuration: "3 hrs",
    estimatedEarning: 135000,
    respondInSeconds: 7200,
    urgent: false,
    photos: 2,
  },
  {
    id: "REQ-88388",
    service: "Full electrical inspection",
    customer: "Kilimani Properties Ltd",
    customerRating: 4.7,
    area: "Upanga West",
    distanceKm: 7.6,
    date: "2026-09-08",
    time: "08:30",
    description: "Annual compliance inspection for a 12-unit apartment block. Report required.",
    propertyType: "Commercial · 12 units",
    estimatedDuration: "8 hrs",
    estimatedEarning: 480000,
    respondInSeconds: 10800,
    urgent: false,
    photos: 0,
  },
];

export type QuoteStatus = "DRAFT" | "SUBMITTED" | "VIEWED" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "WITHDRAWN";

export interface Quote {
  id: string;
  requestId: string;
  customer: string;
  service: string;
  labour: number;
  materials: number;
  transport: number;
  tax: number;
  discount: number;
  total: number;
  duration: string;
  startDate: string;
  expiresOn: string;
  status: QuoteStatus;
}

export const quotes: Quote[] = [
  {
    id: "QTE-4471",
    requestId: "REQ-88407",
    customer: "Peter Lyimo",
    service: "Solar inverter installation",
    labour: 220000,
    materials: 95000,
    transport: 15000,
    tax: 32400,
    discount: 0,
    total: 362400,
    duration: "6 hrs",
    startDate: "2026-09-06",
    expiresOn: "2026-09-05",
    status: "SUBMITTED",
  },
  {
    id: "QTE-4468",
    requestId: "REQ-88388",
    customer: "Kilimani Properties Ltd",
    service: "Full electrical inspection",
    labour: 480000,
    materials: 0,
    transport: 25000,
    tax: 45000,
    discount: 20000,
    total: 530000,
    duration: "8 hrs",
    startDate: "2026-09-08",
    expiresOn: "2026-09-07",
    status: "VIEWED",
  },
  {
    id: "QTE-4460",
    requestId: "REQ-88301",
    customer: "Neema Shirima",
    service: "Rewiring — 2 bedroom flat",
    labour: 640000,
    materials: 380000,
    transport: 20000,
    tax: 90000,
    discount: 40000,
    total: 1090000,
    duration: "3 days",
    startDate: "2026-09-10",
    expiresOn: "2026-09-09",
    status: "ACCEPTED",
  },
  {
    id: "QTE-4452",
    requestId: "REQ-88277",
    customer: "Hotel Bahari",
    service: "Generator servicing contract",
    labour: 900000,
    materials: 210000,
    transport: 40000,
    tax: 135000,
    discount: 0,
    total: 1285000,
    duration: "2 days",
    startDate: "2026-08-30",
    expiresOn: "2026-08-29",
    status: "EXPIRED",
  },
  {
    id: "QTE-4449",
    requestId: "REQ-88255",
    customer: "Salma Juma",
    service: "Water heater replacement",
    labour: 120000,
    materials: 260000,
    transport: 10000,
    tax: 34000,
    discount: 0,
    total: 424000,
    duration: "4 hrs",
    startDate: "2026-09-02",
    expiresOn: "2026-09-01",
    status: "REJECTED",
  },
];

export type BookingStage =
  | "CONFIRMED"
  | "PREPARING"
  | "TRAVELING"
  | "ARRIVED"
  | "WORK_STARTED"
  | "WORK_COMPLETED"
  | "CUSTOMER_CONFIRMATION"
  | "PAID"
  | "CANCELLED";

export const bookingStages: BookingStage[] = [
  "CONFIRMED",
  "PREPARING",
  "TRAVELING",
  "ARRIVED",
  "WORK_STARTED",
  "WORK_COMPLETED",
  "CUSTOMER_CONFIRMATION",
  "PAID",
];

export interface Booking {
  id: string;
  customer: string;
  service: string;
  address: string;
  property: string;
  date: string;
  time: string;
  price: number;
  paymentStatus: "AUTHORIZED" | "PAID" | "PENDING" | "REFUNDED";
  stage: BookingStage;
  assignedTo: string;
  notes: string;
  jobPin: string;
}

export const bookings: Booking[] = [
  {
    id: "FX12390",
    customer: "Neema Shirima",
    service: "Rewiring — 2 bedroom flat",
    address: "House 18, Msasani Peninsula, Dar es Salaam",
    property: "Apartment · 2 bedrooms",
    date: "2026-09-04",
    time: "09:00",
    price: 1090000,
    paymentStatus: "AUTHORIZED",
    stage: "WORK_STARTED",
    assignedTo: "Plumber A — Said Bakari",
    notes: "Gate code 4410. Dog on the compound, call before entering.",
    jobPin: "4812",
  },
  {
    id: "FX12388",
    customer: "Grace Mollel",
    service: "Ceiling fan installation (x3)",
    address: "Mikocheni B, Plot 221",
    property: "House · 3 bedrooms",
    date: "2026-09-04",
    time: "14:00",
    price: 135000,
    paymentStatus: "AUTHORIZED",
    stage: "CONFIRMED",
    assignedTo: "John M",
    notes: "Fans already purchased by the customer.",
    jobPin: "7734",
  },
  {
    id: "FX12381",
    customer: "Amina Hassan",
    service: "Emergency wiring fault",
    address: "Masaki, Toure Drive Apt 6B",
    property: "Apartment · 3 bedrooms",
    date: "2026-09-04",
    time: "11:30",
    price: 85000,
    paymentStatus: "PENDING",
    stage: "TRAVELING",
    assignedTo: "John M",
    notes: "Parking available in basement.",
    jobPin: "2098",
  },
  {
    id: "FX12360",
    customer: "Hotel Bahari",
    service: "Quarterly AC maintenance",
    address: "Kivukoni Front, Dar es Salaam",
    property: "Commercial · Hotel",
    date: "2026-09-02",
    time: "08:00",
    price: 620000,
    paymentStatus: "PAID",
    stage: "PAID",
    assignedTo: "Technician — Baraka Joseph",
    notes: "Report to the maintenance office at reception.",
    jobPin: "5521",
  },
  {
    id: "FX12344",
    customer: "Salma Juma",
    service: "Water heater replacement",
    address: "Kigamboni, Block C",
    property: "House · 2 bedrooms",
    date: "2026-08-29",
    time: "10:00",
    price: 424000,
    paymentStatus: "PAID",
    stage: "PAID",
    assignedTo: "Plumber B — Rehema Kessy",
    notes: "",
    jobPin: "1180",
  },
  {
    id: "FX12330",
    customer: "Kilimani Properties Ltd",
    service: "Electrical inspection",
    address: "Upanga West, Ocean Road",
    property: "Commercial · 12 units",
    date: "2026-08-24",
    time: "08:30",
    price: 480000,
    paymentStatus: "PAID",
    stage: "PAID",
    assignedTo: "John M",
    notes: "",
    jobPin: "6602",
  },
];

export const jobChecklist = [
  { task: "Inspect distribution board", done: true },
  { task: "Check electrical connections", done: true },
  { task: "Isolate faulty circuit", done: true },
  { task: "Replace damaged wiring", done: false },
  { task: "Test all sockets", done: false },
  { task: "Run full system test", done: false },
];

export const jobTimeline = [
  { at: "09:02", label: "Booking confirmed", done: true },
  { at: "09:20", label: "Trip started", done: true },
  { at: "09:41", label: "Arrived on site · PIN verified", done: true },
  { at: "09:48", label: "Work started", done: true },
  { at: "—", label: "Work completed", done: false },
  { at: "—", label: "Customer sign-off", done: false },
];

export const materials = [
  { item: "PVC pipe 20mm", qty: 2, amount: 15000 },
  { item: "Connector", qty: 4, amount: 8000 },
  { item: "Sealant", qty: 1, amount: 7000 },
  { item: "Twin & earth cable 2.5mm (roll)", qty: 1, amount: 68000 },
];

export const messages = [
  { id: "m1", from: "customer" as const, text: "The leaking pipe is underneath the kitchen sink.", at: "09:12" },
  {
    id: "m2",
    from: "provider" as const,
    text: "Understood. Please send a photo so I can determine which fittings may be required.",
    at: "09:14",
  },
  { id: "m3", from: "customer" as const, text: "Sent two photos just now.", at: "09:16" },
  { id: "m4", from: "system" as const, text: "Provider started the trip · ETA 21 min", at: "09:20" },
  { id: "m5", from: "provider" as const, text: "I have the right fittings with me. On my way.", at: "09:21" },
];

export const conversations = [
  { id: "c1", customer: "Neema Shirima", booking: "FX12390", last: "I have the right fittings with me.", at: "09:21", unread: 0 },
  { id: "c2", customer: "Amina Hassan", booking: "FX12381", last: "Please call when you arrive at the gate.", at: "08:55", unread: 2 },
  { id: "c3", customer: "Hotel Bahari", booking: "FX12360", last: "Invoice received, thank you.", at: "Yesterday", unread: 0 },
  { id: "c4", customer: "Grace Mollel", booking: "FX12388", last: "Can we move it to 3pm?", at: "Yesterday", unread: 1 },
];

export interface ServiceOffering {
  id: string;
  category: string;
  name: string;
  pricingModel: "FIXED" | "STARTING" | "HOURLY" | "INSPECTION" | "QUOTE";
  price: number;
  minimumCharge: number;
  duration: string;
  emergency: boolean;
  warranty: string;
  status: "APPROVED" | "PENDING" | "PAUSED";
}

export const services: ServiceOffering[] = [
  { id: "SVC-01", category: "Electrical", name: "Ceiling fan installation", pricingModel: "FIXED", price: 45000, minimumCharge: 45000, duration: "1 hr", emergency: false, warranty: "3 months", status: "APPROVED" },
  { id: "SVC-02", category: "Electrical", name: "Socket installation", pricingModel: "FIXED", price: 25000, minimumCharge: 25000, duration: "45 min", emergency: true, warranty: "3 months", status: "APPROVED" },
  { id: "SVC-03", category: "Electrical", name: "Wiring & rewiring", pricingModel: "QUOTE", price: 0, minimumCharge: 100000, duration: "Varies", emergency: false, warranty: "12 months", status: "APPROVED" },
  { id: "SVC-04", category: "Electrical", name: "Fault diagnosis callout", pricingModel: "HOURLY", price: 20000, minimumCharge: 20000, duration: "1–3 hrs", emergency: true, warranty: "1 month", status: "APPROVED" },
  { id: "SVC-05", category: "Electrical", name: "Electrical inspection", pricingModel: "INSPECTION", price: 40000, minimumCharge: 40000, duration: "2 hrs", emergency: false, warranty: "—", status: "APPROVED" },
  { id: "SVC-06", category: "Solar", name: "Solar installation", pricingModel: "QUOTE", price: 0, minimumCharge: 250000, duration: "1–2 days", emergency: false, warranty: "24 months", status: "APPROVED" },
  { id: "SVC-07", category: "Solar", name: "Generator installation", pricingModel: "STARTING", price: 300000, minimumCharge: 300000, duration: "1 day", emergency: false, warranty: "12 months", status: "PENDING" },
  { id: "SVC-08", category: "Plumbing", name: "Leak repair", pricingModel: "STARTING", price: 30000, minimumCharge: 30000, duration: "1–2 hrs", emergency: true, warranty: "3 months", status: "APPROVED" },
  { id: "SVC-09", category: "Plumbing", name: "Water heater replacement", pricingModel: "STARTING", price: 120000, minimumCharge: 120000, duration: "4 hrs", emergency: false, warranty: "6 months", status: "PAUSED" },
];

export const serviceCatalog = [
  {
    category: "Electrical",
    items: ["Wiring", "Socket installation", "Lighting installation", "Electrical inspection", "Circuit breaker repair", "Generator installation", "Solar installation"],
  },
  { category: "Plumbing", items: ["Leak repair", "Pipe replacement", "Drain unblocking", "Water heater", "Tap & fittings"] },
  { category: "Air conditioning", items: ["AC servicing", "AC installation", "Gas refill", "Duct cleaning"] },
  { category: "Carpentry", items: ["Door repair", "Furniture assembly", "Cabinet fitting", "Roof timber"] },
];

export const serviceAreas = [
  { area: "Kinondoni", region: "Dar es Salaam", travelFee: 0, radiusKm: 8, active: true },
  { area: "Ilala", region: "Dar es Salaam", travelFee: 8000, radiusKm: 12, active: true },
  { area: "Temeke", region: "Dar es Salaam", travelFee: 12000, radiusKm: 18, active: true },
  { area: "Kigamboni", region: "Dar es Salaam", travelFee: 15000, radiusKm: 22, active: false },
  { area: "Ubungo", region: "Dar es Salaam", travelFee: 8000, radiusKm: 14, active: true },
];

export const availability = [
  { day: "Monday", from: "08:00", to: "18:00", available: true },
  { day: "Tuesday", from: "08:00", to: "18:00", available: true },
  { day: "Wednesday", from: "08:00", to: "18:00", available: true },
  { day: "Thursday", from: "08:00", to: "18:00", available: true },
  { day: "Friday", from: "08:00", to: "18:00", available: true },
  { day: "Saturday", from: "09:00", to: "15:00", available: true },
  { day: "Sunday", from: "—", to: "—", available: false },
];

export const customers = [
  { id: "CUS-3301", name: "Hotel Bahari", type: "Business", jobs: 14, lastService: "2026-09-02", frequency: "Quarterly AC maintenance", nextVisit: "2026-12-02", revenue: 4820000 },
  { id: "CUS-3288", name: "Kilimani Properties Ltd", type: "Business", jobs: 9, lastService: "2026-08-24", frequency: "Annual inspection", nextVisit: "2027-08-24", revenue: 3240000 },
  { id: "CUS-3210", name: "Neema Shirima", type: "Residential", jobs: 5, lastService: "2026-09-04", frequency: "On demand", nextVisit: "—", revenue: 1810000 },
  { id: "CUS-3188", name: "Grace Mollel", type: "Residential", jobs: 4, lastService: "2026-08-18", frequency: "Monthly cleaning referral", nextVisit: "2026-09-18", revenue: 540000 },
  { id: "CUS-3120", name: "Amina Hassan", type: "Residential", jobs: 3, lastService: "2026-09-04", frequency: "On demand", nextVisit: "—", revenue: 265000 },
];

export const walletSummary = {
  available: 1840000,
  pending: 620000,
  reserved: 180000,
  totalEarned: 18420000,
  withdrawn: 15780000,
};

export const walletTransactions = [
  { id: "TRX-9921", booking: "FX12360", label: "Booking payout", gross: 620000, commission: 62000, net: 558000, date: "2026-09-02", type: "EARNING" },
  { id: "TRX-9918", booking: "FX12344", label: "Booking payout", gross: 424000, commission: 42400, net: 381600, date: "2026-08-29", type: "EARNING" },
  { id: "TRX-9910", booking: "—", label: "Withdrawal to CRDB ****4471", gross: 1200000, commission: 0, net: -1200000, date: "2026-08-28", type: "WITHDRAWAL" },
  { id: "TRX-9902", booking: "FX12330", label: "Booking payout", gross: 480000, commission: 48000, net: 432000, date: "2026-08-24", type: "EARNING" },
  { id: "TRX-9890", booking: "—", label: "Weekend promotion bonus", gross: 50000, commission: 0, net: 50000, date: "2026-08-22", type: "BONUS" },
  { id: "TRX-9881", booking: "FX12299", label: "Refund deduction", gross: 90000, commission: 0, net: -90000, date: "2026-08-19", type: "ADJUSTMENT" },
];

export const earningsTrend = [
  { label: "Mar", value: 2100000 },
  { label: "Apr", value: 2480000 },
  { label: "May", value: 2260000 },
  { label: "Jun", value: 3120000 },
  { label: "Jul", value: 2890000 },
  { label: "Aug", value: 3640000 },
  { label: "Sep", value: 1180000 },
];

export const earningsByService = [
  { label: "Rewiring", value: 6200000 },
  { label: "Solar", value: 4800000 },
  { label: "Inspections", value: 3100000 },
  { label: "Plumbing", value: 2600000 },
  { label: "Fans & sockets", value: 1720000 },
];

export const payoutMethods = [
  { id: "PM-1", type: "Bank account", holder: "ABC Electrical & Plumbing Ltd", detail: "CRDB Bank ****4471", currency: "TZS", primary: true },
  { id: "PM-2", type: "Mobile money", holder: "John M Mwakalinga", detail: "M-Pesa +255 754 ***220", currency: "TZS", primary: false },
];

export const payouts = [
  { id: "PO-5521", method: "CRDB ****4471", amount: 1200000, requested: "2026-08-28", status: "PAID" },
  { id: "PO-5498", method: "M-Pesa ***220", amount: 450000, requested: "2026-08-21", status: "PAID" },
  { id: "PO-5477", method: "CRDB ****4471", amount: 900000, requested: "2026-09-03", status: "PROCESSING" },
  { id: "PO-5455", method: "M-Pesa ***220", amount: 300000, requested: "2026-08-11", status: "FAILED" },
];

export const invoices = [
  { id: "INV-20941", booking: "FX12360", customer: "Hotel Bahari", amount: 620000, date: "2026-09-02", status: "PAID", kind: "Customer invoice" },
  { id: "STM-00312", booking: "—", customer: "FIXO", amount: 3640000, date: "2026-08-31", status: "ISSUED", kind: "Earnings statement" },
  { id: "COM-00312", booking: "—", customer: "FIXO", amount: 364000, date: "2026-08-31", status: "ISSUED", kind: "Commission statement" },
  { id: "INV-20918", booking: "FX12344", customer: "Salma Juma", amount: 424000, date: "2026-08-29", status: "PAID", kind: "Customer invoice" },
  { id: "RCT-08871", booking: "—", customer: "CRDB Bank", amount: 1200000, date: "2026-08-28", status: "PAID", kind: "Withdrawal receipt" },
];

export const reviews = [
  { id: "RV-1", customer: "Neema Shirima", rating: 5, date: "2026-09-03", text: "Very professional, arrived on time and explained everything clearly.", replied: true },
  { id: "RV-2", customer: "Hotel Bahari", rating: 5, date: "2026-09-02", text: "Serviced all 14 units in one day. Excellent coordination.", replied: false },
  { id: "RV-3", customer: "Salma Juma", rating: 4, date: "2026-08-29", text: "Good work, though he arrived 30 minutes later than agreed.", replied: true },
  { id: "RV-4", customer: "Grace Mollel", rating: 5, date: "2026-08-18", text: "Neat installation and cleaned up afterwards.", replied: false },
];

export const ratingBreakdown = [
  { label: "Quality", value: 4.9 },
  { label: "Professionalism", value: 4.8 },
  { label: "Communication", value: 4.7 },
  { label: "Punctuality", value: 4.6 },
  { label: "Value", value: 4.8 },
];

export const performance = {
  offered: 312,
  accepted: 268,
  rejected: 44,
  completed: 254,
  cancelled: 14,
  acceptanceRate: 86,
  completionRate: 95,
  cancellationRate: 5,
  responseMinutes: 6,
  repeatCustomers: 38,
};

export const team = [
  { id: "T-1", name: "John M Mwakalinga", role: "Owner", jobs: 96, rating: 4.9, status: "Active" },
  { id: "T-2", name: "Grace Kimario", role: "Dispatcher", jobs: 0, rating: 0, status: "Active" },
  { id: "T-3", name: "Said Bakari", role: "Technician", jobs: 132, rating: 4.7, status: "On a job" },
  { id: "T-4", name: "Rehema Kessy", role: "Technician", jobs: 88, rating: 4.8, status: "Active" },
  { id: "T-5", name: "Baraka Joseph", role: "Apprentice", jobs: 41, rating: 4.4, status: "Off duty" },
  { id: "T-6", name: "Neema Paul", role: "Finance officer", jobs: 0, rating: 0, status: "Active" },
];

export const equipment = [
  { id: "EQ-1", name: "Rotary hammer drill", serial: "BSH-99182", condition: "Good", assignedTo: "Said Bakari", maintenance: "2026-11-04" },
  { id: "EQ-2", name: "Pressure washer", serial: "KAR-33019", condition: "Needs service", assignedTo: "Baraka Joseph", maintenance: "2026-09-15" },
  { id: "EQ-3", name: "Insulation tester", serial: "FLK-77120", condition: "Good", assignedTo: "John M", maintenance: "2027-01-20" },
  { id: "EQ-4", name: "Pipe inspection camera", serial: "RID-22841", condition: "Good", assignedTo: "Rehema Kessy", maintenance: "2026-12-01" },
];

export const documents = [
  { id: "DOC-1", type: "National ID", number: "19870412-11029-00001-22", status: "VERIFIED" as VerificationStatus, issued: "2019-04-12", expires: "2029-04-12" },
  { id: "DOC-2", type: "Business registration certificate", number: "BRELA-1029384", status: "VERIFIED" as VerificationStatus, issued: "2016-02-01", expires: "—" },
  { id: "DOC-3", type: "Professional licence (Electrical)", number: "EWURA-EL-3391", status: "VERIFIED" as VerificationStatus, issued: "2024-10-04", expires: "2026-10-04" },
  { id: "DOC-4", type: "Public liability insurance", number: "JUB-INS-77120", status: "UNDER_REVIEW" as VerificationStatus, issued: "2026-01-15", expires: "2027-01-15" },
  { id: "DOC-5", type: "Tax certificate", number: "TIN-114-902-338", status: "MORE_INFO_REQUIRED" as VerificationStatus, issued: "2026-01-02", expires: "2026-12-31" },
  { id: "DOC-6", type: "Police clearance", number: "—", status: "NOT_SUBMITTED" as VerificationStatus, issued: "—", expires: "—" },
];

export const portfolio = [
  { id: "P-1", title: "Full villa rewiring — Masaki", category: "Electrical", date: "2026-07-18", description: "Complete replacement of a 1990s wiring loom across 5 bedrooms with a new consumer unit." },
  { id: "P-2", title: "8kVA solar hybrid system", category: "Solar", date: "2026-06-02", description: "Roof array, hybrid inverter and lithium storage for an off-grid guesthouse." },
  { id: "P-3", title: "Restaurant kitchen power upgrade", category: "Electrical", date: "2026-04-27", description: "Three-phase supply upgrade and dedicated circuits for commercial kitchen equipment." },
];

export const notifications = [
  { id: "N-1", title: "New service request", body: "Emergency wiring fault · Masaki · TZS 85,000", at: "4 min ago", type: "request", unread: true },
  { id: "N-2", title: "Quote viewed", body: "Peter Lyimo opened quote QTE-4471", at: "1 hr ago", type: "quote", unread: true },
  { id: "N-3", title: "Payment received", body: "TZS 558,000 credited for booking FX12360", at: "Yesterday", type: "payment", unread: false },
  { id: "N-4", title: "New review", body: "Hotel Bahari rated you 5.0", at: "Yesterday", type: "review", unread: false },
  { id: "N-5", title: "Document expiring", body: "Electrical licence expires in 30 days", at: "2 days ago", type: "verification", unread: false },
  { id: "N-6", title: "Withdrawal completed", body: "TZS 1,200,000 paid to CRDB ****4471", at: "3 days ago", type: "payout", unread: false },
];

export const activityLog = [
  { at: "02 Sep 2026 — 09:21", text: "Booking #FX1932 accepted.", actor: "John M" },
  { at: "02 Sep 2026 — 08:45", text: "TZS 180,000 payment received.", actor: "System" },
  { at: "01 Sep 2026 — 17:14", text: "Service price updated — Ceiling fan installation.", actor: "Grace Kimario" },
  { at: "01 Sep 2026 — 11:02", text: "Technician Said Bakari assigned to FX12390.", actor: "Grace Kimario" },
  { at: "31 Aug 2026 — 19:40", text: "Payout PO-5521 requested.", actor: "Neema Paul" },
];

export const supportTickets = [
  { id: "TKT-2201", subject: "Customer refused final payment", category: "Dispute", status: "Under review", updated: "2026-09-03" },
  { id: "TKT-2188", subject: "Payout PO-5455 failed", category: "Payout", status: "Awaiting your reply", updated: "2026-08-30" },
  { id: "TKT-2140", subject: "Cannot upload insurance document", category: "Verification", status: "Closed", updated: "2026-08-12" },
];

export const disputes = [
  { id: "DSP-441", booking: "FX12299", reason: "Customer claims incomplete work", stage: "Under review", opened: "2026-08-19", amount: 90000 },
  { id: "DSP-430", booking: "FX12211", reason: "Material reimbursement", stage: "Closed — resolved", opened: "2026-07-30", amount: 46000 },
];

export const promotions = [
  { id: "PRM-1", name: "10% Weekend Discount", funding: "Shared 50/50", period: "Sep 2026", impact: "-5% net per booking", joined: true },
  { id: "PRM-2", name: "First Booking Discount", funding: "Platform funded", period: "Ongoing", impact: "No impact on earnings", joined: true },
  { id: "PRM-3", name: "Emergency response boost", funding: "Provider funded", period: "Oct 2026", impact: "-8% net per booking", joined: false },
];

export const plans = [
  { name: "Starter", price: 0, categories: 2, radius: "10 km", employees: 1, commission: "12%", current: false },
  { name: "Professional", price: 45000, categories: 5, radius: "25 km", employees: 5, commission: "10%", current: true },
  { name: "Business", price: 120000, categories: 12, radius: "50 km", employees: 20, commission: "8%", current: false },
  { name: "Enterprise", price: 350000, categories: 0, radius: "Unlimited", employees: 100, commission: "6%", current: false },
];

export const dashboardStats = {
  todayJobs: 3,
  pendingRequests: jobRequests.length,
  earningsToday: 265000,
  rating: provider.rating,
};

export const weekLoad = [
  { label: "Mon", value: 4 },
  { label: "Tue", value: 3 },
  { label: "Wed", value: 5 },
  { label: "Thu", value: 2 },
  { label: "Fri", value: 6 },
  { label: "Sat", value: 3 },
  { label: "Sun", value: 0 },
];

export const providerBenefits = [
  { title: "Steady job flow", body: "Verified customers matched to you by category, distance and availability." },
  { title: "Fast, protected payouts", body: "Customer funds are authorized before you travel and settle to your wallet after sign-off." },
  { title: "Run your whole business", body: "Team dispatch, calendar, quotations, materials and invoices in one place." },
  { title: "Grow your reputation", body: "Ratings, portfolio and provider levels that push you higher in search results." },
];

export const providerRequirements = [
  "Valid national ID, passport or driving licence",
  "Proof of skill: trade certificate or professional licence where the trade requires it",
  "Business registration certificate for company accounts",
  "Working smartphone with location enabled during jobs",
  "Own tools for your declared service categories",
  "Clean background check where the service category requires it",
];

export const commissionTiers = [
  { plan: "Starter", commission: "12%", payout: "Weekly", note: "No subscription fee" },
  { plan: "Professional", commission: "10%", payout: "Twice weekly", note: "TZS 45,000 / month" },
  { plan: "Business", commission: "8%", payout: "Daily", note: "TZS 120,000 / month" },
];
