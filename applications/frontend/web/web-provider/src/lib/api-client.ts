// Lightweight API client — JSON, bearer header, one silent refresh on 401.
// Same envelope/header contract as web-user's own api-client.ts.
// Attribution: every request carries X-Client-ID = CLT-WEB-PROVIDER so the
// backend can tell provider-web traffic apart in logs, events, audit and jobs.
const BASE_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:8000/api/v1";

const CLIENT_ID = "CLT-WEB-PROVIDER";
const CLIENT_VERSION = import.meta.env["VITE_CLIENT_VERSION"] ?? "dev";

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: { type: string; title: string; body: string };
}

export class ApiError extends Error {}

class ApiClient {
  private token: string | null = null;
  private _onUnauthorized: (() => Promise<boolean>) | null = null;

  setAuthToken(token: string | null) {
    this.token = token;
  }

  // AuthProvider registers its refresh flow; we retry once before giving up.
  onUnauthorized(cb: () => Promise<boolean>) {
    this._onUnauthorized = cb;
  }

  private headers(sendJsonHeader = true): HeadersInit {
    const h: Record<string, string> = {};
    if (sendJsonHeader) h["Content-Type"] = "application/json";
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    h["X-Client-ID"] = CLIENT_ID;
    h["X-Client-Version"] = CLIENT_VERSION;
    return h;
  }

  private async request<T>(path: string, init: RequestInit, sendJsonHeader = true): Promise<ApiResponse<T>> {
    let res = await fetch(`${BASE_URL}${path}`, { ...init, headers: this.headers(sendJsonHeader) });

    if (res.status === 401 && this._onUnauthorized && (await this._onUnauthorized())) {
      res = await fetch(`${BASE_URL}${path}`, { ...init, headers: this.headers(sendJsonHeader) });
    }

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      const msg = json?.message?.body || json?.message?.title || `Request failed (${res.status})`;
      throw new ApiError(msg);
    }
    return json as ApiResponse<T>;
  }

  get<T = any>(path: string) {
    return this.request<T>(path, { method: "GET" });
  }

  post<T = any>(path: string, body: unknown = {}) {
    return this.request<T>(path, { method: "POST", body: JSON.stringify(body) });
  }

  patch<T = any>(path: string, body: unknown = {}) {
    return this.request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  }

  put<T = any>(path: string, body: unknown = {}) {
    return this.request<T>(path, { method: "PUT", body: JSON.stringify(body) });
  }

  delete<T = any>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }

  // multipart — sendJsonHeader=false lets the browser set its own
  // multipart/form-data boundary instead of us forcing application/json.
  postForm<T = any>(path: string, form: FormData) {
    return this.request<T>(path, { method: "POST", body: form }, false);
  }
}

export const apiClient = new ApiClient();

// ---- Typed feature methods -------------------------------------------------

export interface ProviderNotificationRow {
  id: string;
  channel: string;
  category: string;
  title: string;
  body: string;
  is_read: boolean;
  reference_type: string;
  reference_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderBookingFeedRow {
  booking_id: string;
  booking_number: string;
  status: string;
  customer_name: string;
  customer_phone?: string;
  service_name?: string;
  created_at: string;
}

export interface ProviderMessage {
  message_id: string;
  sender_role: "CUSTOMER" | "PROVIDER";
  body: string;
  created_at: string;
}

function qs(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!entries.length) return "";
  return "?" + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
}

export const fixoSdk = {
  // ---- Notifications --------------------------------------------------------
  notifications: (status: "unread" | "all" = "all", limit = 50, offset = 0) =>
    apiClient
      .get<{ notifications: ProviderNotificationRow[] }>(
        `/providers/me/notifications${qs({ status, limit, offset })}`,
      )
      .then((r) => r.data.notifications),
  notificationUnread: () =>
    apiClient.get<{ unread_count: number }>("/providers/me/notifications/unread-count").then((r) => r.data),
  markNotificationRead: (id: string) =>
    apiClient.patch(`/providers/me/notifications/${id}/read`).then((r) => r.data),

  // ---- Bookings (for the messages inbox list) --------------------------------
  bookingFeed: (limit = 50, offset = 0) =>
    apiClient
      .get<ProviderBookingFeedRow[]>(`/providers/me/bookings${qs({ limit, offset })}`)
      .then((r) => r.data),

  // ---- Messages ---------------------------------------------------------------
  getConversation: (bookingId: string) =>
    apiClient
      .get<{ conversation_id: string }>(`/providers/me/bookings/${bookingId}/messages/conversation`)
      .then((r) => r.data),
  listMessages: (bookingId: string, conversationId: string, limit = 50, offset = 0) =>
    apiClient
      .get<ProviderMessage[]>(
        `/providers/me/bookings/${bookingId}/messages${qs({ conversation_id: conversationId, limit, offset })}`,
      )
      .then((r) => r.data),
  sendMessage: (bookingId: string, conversationId: string, body: string) =>
    apiClient
      .post<ProviderMessage>(`/providers/me/bookings/${bookingId}/messages`, {
        conversation_id: conversationId,
        body,
      })
      .then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Onboarding + the domains it curates (profile, business, verification,
// services, pricing, areas). Real endpoints and field names read directly
// from applications/backend/app/domains/providers/api/*.py this session —
// onboarding.tsx has no data store of its own, it's a presentation layer
// over these.
// ---------------------------------------------------------------------------

export interface OnboardingStepDef {
  step_id: string;
  code: string;
  title: string;
  description: string;
  sort_order: number;
  is_required: boolean;
}

export interface OnboardingStatus {
  steps: (OnboardingStepDef & { completed: boolean })[];
  completed: boolean;
  progress: string;
  current_step: string | null;
}

export interface UploadedFile {
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_key: string;
  url: string;
}

export interface ProviderProfile {
  provider_id: string;
  profile_photo_url?: string | null | undefined;
  gender?: string | null | undefined;
  date_of_birth?: string | null | undefined;
  bio?: string | null | undefined;
  languages?: string | null | undefined;
  professional_title?: string | null | undefined;
  years_experience?: number | null | undefined;
  qualifications?: string[];
  certifications?: string[];
  skills?: string[];
  specializations?: string[];
  tools?: string[];
}

export interface ProviderBusinessProfile {
  business_name?: string | null | undefined;
  logo_url?: string | null | undefined;
  registration_number?: string | null | undefined;
  tax_number?: string | null | undefined;
  business_email?: string | null | undefined;
  business_phone?: string | null | undefined;
  address?: string | null | undefined;
  city?: string | null | undefined;
  region?: string | null | undefined;
  country?: string | null | undefined;
  description?: string | null | undefined;
  year_established?: number | null | undefined;
  num_employees?: number | null | undefined;
  website?: string | null | undefined;
}

export interface VerificationDocType {
  code: string;
  label: string;
  is_required: boolean;
}

export interface VerificationDocument {
  doc_id: string;
  doc_type: string;
  front_image_url: string;
  back_image_url?: string | null | undefined;
  doc_number?: string | null | undefined;
  status: string;
  issue_date?: string | null | undefined;
  expiry_date?: string | null | undefined;
}

export interface VerificationStatus {
  status: string;
  required_missing: string[];
  documents_count: number;
  expiring_soon: string[];
}

export interface CatalogServiceOption {
  service_id: string;
  name: string;
  category_name: string;
}

export interface ProviderServiceConfig {
  service_id: string;
  display_name?: string | null | undefined;
  description?: string | null | undefined;
  years_experience?: number | null | undefined;
  pricing_model: string;
  minimum_charge?: number | null | undefined;
  duration_minutes?: number | null | undefined;
  is_emergency_available: boolean;
  approval_status?: string | null | undefined;
}

export interface ProviderServicePricing {
  service_id: string;
  pricing_model: string;
  base_amount?: number | null | undefined;
  from_amount?: number | null | undefined;
  hourly_rate?: number | null | undefined;
  minimum_hours?: number | null | undefined;
  inspection_fee?: number | null | undefined;
  currency: string;
  includes_text?: string | null | undefined;
  is_negotiable: boolean;
}

export interface AreaSettings {
  base_latitude?: number | null | undefined;
  base_longitude?: number | null | undefined;
  max_travel_km?: number | null | undefined;
  travel_fee?: number | null | undefined;
  free_travel_radius_km?: number | null | undefined;
  currency: string;
  notes?: string | null | undefined;
}

export interface ServiceArea {
  area_id: string;
  area_type: "LOCATION" | "RADIUS";
  label?: string | null | undefined;
  country?: string | null | undefined;
  region?: string | null | undefined;
  city?: string | null | undefined;
  district?: string | null | undefined;
  center_latitude?: number | null | undefined;
  center_longitude?: number | null | undefined;
  radius_km?: number | null | undefined;
  is_active: boolean;
}

export interface PayoutMethod {
  method_id: string;
  method_type: string;
  provider_name?: string | null | undefined;
  account_holder?: string | null | undefined;
  account_number?: string | null | undefined;
  mobile_number?: string | null | undefined;
  currency: string;
  is_default: boolean;
}

export const onboardingApi = {
  // -- shared upload (profile photos, logos, verification docs) -------------
  uploadFile: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.postForm<UploadedFile>("/uploads", form).then((r) => r.data);
  },

  // -- onboarding progress ----------------------------------------------------
  steps: () => apiClient.get<OnboardingStepDef[]>("/providers/onboarding/steps").then((r) => r.data),
  status: () => apiClient.get<OnboardingStatus>("/providers/onboarding/status").then((r) => r.data),
  saveStep: (stepCode: string, data: Record<string, unknown>) =>
    apiClient.put<OnboardingStatus>(`/providers/onboarding/steps/${stepCode}`, { data }).then((r) => r.data),
  completeStep: (stepCode: string, data: Record<string, unknown>) =>
    apiClient.post<OnboardingStatus>(`/providers/onboarding/steps/${stepCode}/complete`, { data }).then((r) => r.data),

  // -- personal profile ---------------------------------------------------------
  getProfile: () => apiClient.get<ProviderProfile>("/providers/profile").then((r) => r.data),
  updateProfile: (data: Partial<ProviderProfile>) =>
    apiClient.patch<ProviderProfile>("/providers/profile", data).then((r) => r.data),

  // -- business profile -----------------------------------------------------
  getBusiness: () => apiClient.get<ProviderBusinessProfile>("/providers/business").then((r) => r.data),
  upsertBusiness: (data: Partial<ProviderBusinessProfile> & { business_name: string }) =>
    apiClient.put<ProviderBusinessProfile>("/providers/business", data).then((r) => r.data),

  // -- identity verification -------------------------------------------------
  docTypes: () => apiClient.get<VerificationDocType[]>("/providers/verification/doc-types").then((r) => r.data),
  documents: () => apiClient.get<VerificationDocument[]>("/providers/verification/documents").then((r) => r.data),
  addDocument: (data: {
    doc_type: string;
    front_image_url: string;
    back_image_url?: string | undefined;
    doc_number?: string | undefined;
  }) => apiClient.post<VerificationDocument>("/providers/verification/documents", data).then((r) => r.data),
  withdrawDocument: (docId: string) => apiClient.delete(`/providers/verification/documents/${docId}`).then((r) => r.data),
  verificationStatus: () => apiClient.get<VerificationStatus>("/providers/verification/status").then((r) => r.data),
  submitVerification: () => apiClient.post("/providers/verification/submit").then((r) => r.data),

  // -- services offered + pricing ---------------------------------------------
  serviceCatalog: () => apiClient.get<CatalogServiceOption[]>("/providers/services/catalog").then((r) => r.data),
  myServices: () => apiClient.get<ProviderServiceConfig[]>("/providers/services").then((r) => r.data),
  configureService: (serviceId: string, data: Partial<ProviderServiceConfig>) =>
    apiClient.put<ProviderServiceConfig>(`/providers/services/${serviceId}`, data).then((r) => r.data),
  removeService: (serviceId: string) => apiClient.delete(`/providers/services/${serviceId}`).then((r) => r.data),

  listPricing: () => apiClient.get<ProviderServicePricing[]>("/providers/pricing").then((r) => r.data),
  upsertPricing: (serviceId: string, data: Partial<ProviderServicePricing>) =>
    apiClient.put<ProviderServicePricing>(`/providers/pricing/${serviceId}`, data).then((r) => r.data),

  // -- service areas ------------------------------------------------------------
  getAreaSettings: () => apiClient.get<AreaSettings>("/providers/areas/settings").then((r) => r.data),
  saveAreaSettings: (data: Partial<AreaSettings>) =>
    apiClient.put<AreaSettings>("/providers/areas/settings", data).then((r) => r.data),
  listAreas: () => apiClient.get<ServiceArea[]>("/providers/areas").then((r) => r.data),
  addArea: (data: Partial<ServiceArea> & { area_type: "LOCATION" | "RADIUS" }) =>
    apiClient.post<ServiceArea>("/providers/areas", data).then((r) => r.data),
  updateArea: (areaId: string, data: Partial<ServiceArea>) =>
    apiClient.patch<ServiceArea>(`/providers/areas/${areaId}`, data).then((r) => r.data),
  removeArea: (areaId: string) => apiClient.delete(`/providers/areas/${areaId}`).then((r) => r.data),

  // -- payout methods (onboarding's "payment information" step) ---------------
  listPayoutMethods: () => apiClient.get<PayoutMethod[]>("/providers/me/payouts/methods").then((r) => r.data),
  addPayoutMethod: (data: {
    method_type: string;
    provider_name?: string | undefined;
    account_holder?: string | undefined;
    account_number?: string | undefined;
    mobile_number?: string | undefined;
    currency: string;
    is_default: boolean;
  }) => apiClient.post<PayoutMethod>("/providers/me/payouts/methods", data).then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Dashboard + incoming requests feed. Field names read directly from
// provider_dashboard_service.py / provider_request_service.py and their
// governed SQL this session.
// ---------------------------------------------------------------------------

export interface DashboardAttentionItem {
  code: string;
  severity: "critical" | "warning" | "info";
  message: string;
  action: string;
}

export interface DashboardQuickAction {
  code: string;
  label: string;
  method: string;
  path: string;
}

export interface DashboardOverview {
  stats: {
    todays_jobs: number;
    pending_requests: number;
    active_jobs: number;
    earnings_today: number;
    currency: string;
    rating_avg: number | null;
    rating_count: number;
    jobs_completed: number;
  };
  setup: Record<string, unknown>;
  attention: DashboardAttentionItem[];
  quick_actions: DashboardQuickAction[];
}

export interface DashboardScheduleItem {
  booking_id: string;
  booking_number: string;
  scheduled_date: string;
  time_window?: string | null;
  status: string;
  agreed_amount: number;
  currency: string;
  service_name: string;
}

export interface DashboardSchedule {
  today: DashboardScheduleItem[];
  upcoming: DashboardScheduleItem[];
}

export interface DashboardEarnings {
  collected_today: number;
  collected_week: number;
  collected_month: number;
  billed_month: number;
  currency: string;
}

export interface DashboardPerformance {
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  completion_rate: number | null;
  cancellation_rate: number | null;
  accepted_requests: number;
  declined_requests: number;
  acceptance_rate: number | null;
  response_time_minutes: number | null;
}

export interface WalletOverview {
  available_balance: number;
  pending_balance: number;
  reserved_funds: number;
  currency: string;
  withdrawals: number;
  refund_deductions: number;
  bonuses: number;
  adjustments: number;
}

export interface RequestFeedItem {
  match_id: string;
  score?: number;
  matched_at: string;
  respond_by: string;
  respond_in_seconds?: number | null;
  respond_expired?: boolean;
  request_id: string;
  request_number: string;
  description: string;
  preferred_date?: string | null;
  time_window?: string | null;
  request_status: string;
  service_name: string;
  service_slug: string;
  customer_name: string;
  property_name?: string | null;
  city?: string | null;
  region?: string | null;
  street_address?: string | null;
  estimated_earnings?: number | null;
  my_quote_id?: string | null;
  my_quote_amount?: number | null;
  my_quote_status?: string | null;
}

export const dashboardApi = {
  overview: () => apiClient.get<DashboardOverview>("/providers/dashboard").then((r) => r.data),
  schedule: () => apiClient.get<DashboardSchedule>("/providers/dashboard/schedule").then((r) => r.data),
  earnings: () => apiClient.get<DashboardEarnings>("/providers/dashboard/earnings").then((r) => r.data),
  performance: () => apiClient.get<DashboardPerformance>("/providers/dashboard/performance").then((r) => r.data),
  wallet: () => apiClient.get<WalletOverview>("/providers/me/wallet").then((r) => r.data),
  requestsFeed: () => apiClient.get<RequestFeedItem[]>("/providers/requests").then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Requests (respond) + quotations. Field names read directly from
// requests_router.py / quotations_router.py this session.
// ---------------------------------------------------------------------------

export interface QuoteRow {
  quote_id: string;
  request_id: string;
  request_number: string;
  service_name: string;
  service_slug: string;
  total_amount: number;
  currency: string;
  status: string;
  valid_until?: string | null;
  submitted_at?: string | null;
  updated_at?: string | null;
  created_at: string;
}

export interface QuoteDetail extends QuoteRow {
  labour_cost?: number | null;
  materials_cost?: number | null;
  transport_cost?: number | null;
  inspection_fee?: number | null;
  additional_charges?: number | null;
  tax_amount?: number | null;
  discount_amount?: number | null;
  platform_fee?: number | null;
  lead_time_days?: number;
  estimated_hours?: number | null;
  proposed_start_date?: string | null;
  notes?: string | null;
  terms?: string | null;
}

export const requestsApi = {
  respond: (requestId: string, data: { response_type: "ACCEPTED" | "DECLINED" | "QUESTION"; question_text?: string; response_message?: string }) =>
    apiClient.post(`/providers/requests/${requestId}/respond`, data).then((r) => r.data),
  get: (requestId: string) => apiClient.get<RequestFeedItem>(`/providers/requests/${requestId}`).then((r) => r.data),
};

export const quotesApi = {
  list: () => apiClient.get<QuoteRow[]>("/providers/quotations").then((r) => r.data),
  get: (quoteId: string) => apiClient.get<QuoteDetail>(`/providers/quotations/${quoteId}`).then((r) => r.data),
  save: (requestId: string, data: Partial<QuoteDetail> & { total_amount: number }) =>
    apiClient.post<QuoteDetail>(`/providers/quotations/${requestId}`, data).then((r) => r.data),
  submit: (quoteId: string) => apiClient.post<QuoteDetail>(`/providers/quotations/${quoteId}/submit`).then((r) => r.data),
  withdraw: (quoteId: string) => apiClient.post<QuoteDetail>(`/providers/quotations/${quoteId}/withdraw`).then((r) => r.data),
};