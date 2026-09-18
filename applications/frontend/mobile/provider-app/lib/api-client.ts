// Lightweight API client — JSON, bearer header, one silent refresh on 401.
// Ported field-for-field from web-provider's own api-client.ts (verified
// against the real backend across every provider domain this session) —
// only this shell differs: fetch works identically in React Native, so
// every typed method below needed no changes beyond the base URL/client-ID
// sourcing (env var + expo-constants instead of Vite's import.meta.env).
import Constants from "expo-constants";

const BASE_URL = process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:8000/api/v1";

// Client ids are per-platform, not per-app — the registry has no
// provider/user split (see app/clients/definitions.py), matching
// user-app's own CLT-MOBILE-* sourcing.
const CLIENT_ID = Constants.platform?.android
  ? "CLT-MOBILE-ANDROID"
  : Constants.platform?.ios
    ? "CLT-MOBILE-IOS"
    : "CLT-MOBILE";
const CLIENT_VERSION = Constants.expoConfig?.version ?? "dev";

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
  name: string;
  description?: string | null | undefined;
  is_required: boolean;
  sort_order?: number | undefined;
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
  verification_status: string;
  documents_total: number;
  documents_verified: number;
  documents_pending: number;
  documents_rejected: number;
  documents_more_info: number;
  required_total: number;
  required_missing: string[];
  documents_expiring_soon: number;
}

export interface CatalogServiceOption {
  service_id: string;
  name: string;
  slug?: string | null | undefined;
  description?: string | null | undefined;
  category_code?: string | null | undefined;
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
  status?: string | null | undefined;
  service_name?: string | null | undefined;
  service_slug?: string | null | undefined;
  category_code?: string | null | undefined;
  category_name?: string | null | undefined;
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

export interface RNFile {
  uri: string;
  name: string;
  type: string;
}

export const onboardingApi = {
  // -- shared upload (profile photos, logos, verification docs) -------------
  // React Native has no browser File — expo-image-picker/expo-document-picker
  // results give a local file {uri, name, mimeType}, which FormData.append
  // accepts directly as a third "file descriptor" argument on RN (unlike web,
  // where FormData only takes a real File/Blob).
  uploadFile: (file: RNFile) => {
    const form = new FormData();
    form.append("file", { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
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
    issue_date?: string | undefined;
    expiry_date?: string | undefined;
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
  submitService: (serviceId: string) =>
    apiClient.post<ProviderServiceConfig>(`/providers/services/${serviceId}/submit`).then((r) => r.data),

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
// Account settings: preferences, security, privacy, closure.
// Field names read directly from settings_router.py / provider_settings_service.py.
// ---------------------------------------------------------------------------

export interface ProviderPreference {
  key: string;
  value: string;
  updated_at: string;
}

export interface ProviderConsent {
  kind: "MARKETING" | "ANALYTICS" | "COMMUNICATION";
  consented: boolean;
  consented_at?: string | null | undefined;
  revoked_at?: string | null | undefined;
}

export interface ProviderExportRequest {
  request_id: string;
  status: string;
  requested_at: string;
  completed_at?: string | null | undefined;
  file_path?: string | null | undefined;
}

export const settingsApi = {
  listPreferences: () => apiClient.get<ProviderPreference[]>("/providers/me/settings/preferences").then((r) => r.data),
  setPreference: (key: string, value: string) =>
    apiClient.put<ProviderPreference>("/providers/me/settings/preferences", { key, value }).then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient
      .post("/providers/me/settings/security/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      })
      .then((r) => r.data),
  revokeSessions: () => apiClient.post("/providers/me/settings/security/revoke-sessions").then((r) => r.data),

  listConsents: () => apiClient.get<ProviderConsent[]>("/providers/me/settings/privacy/consents").then((r) => r.data),
  setConsent: (kind: ProviderConsent["kind"], consented: boolean) =>
    apiClient.put<ProviderConsent>("/providers/me/settings/privacy/consents", { kind, consented }).then((r) => r.data),
  requestExport: () => apiClient.post<ProviderExportRequest>("/providers/me/settings/privacy/export-requests").then((r) => r.data),
  listExports: () => apiClient.get<ProviderExportRequest[]>("/providers/me/settings/privacy/export-requests").then((r) => r.data),

  scheduleClosure: () => apiClient.post("/providers/me/settings/closure").then((r) => r.data),
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

// ---------------------------------------------------------------------------
// Bookings + job execution (arrival, tracking, checklist, evidence,
// materials, change-requests, completion). Field names read directly from
// each router's real request/response schema and governed SQL this session.
// ---------------------------------------------------------------------------

export interface BookingFeedRow {
  booking_id: string;
  booking_number: string;
  status: string;
  scheduled_date: string;
  time_window?: string | null;
  agreed_amount: number;
  currency: string;
  payment_attempts?: number;
  created_at: string;
  updated_at?: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  service_name: string;
  street_address?: string | null;
  city?: string | null;
  region?: string | null;
  acknowledged_at?: string | null;
}

export interface BookingDetail extends BookingFeedRow {
  service_description?: string | null;
  district?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  ack_notes?: string | null;
  request_number?: string;
  arrived_at?: string | null;
  verified_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface BookingTimelineEvent {
  timeline_id: string;
  event: string;
  detail?: string | null;
  created_at: string;
}

export interface ArrivalStatus {
  booking_id: string;
  status: string;
  arrived_at?: string | null;
  verified_at?: string | null;
  arrival_latitude?: number | null;
  arrival_longitude?: number | null;
}

export interface ChecklistItem {
  item_id: string;
  booking_id: string;
  task_title: string;
  position: number;
  is_completed: boolean;
  completed_at?: string | null;
  created_at?: string;
}

export interface ChecklistProgress {
  booking_id: string;
  total_items: number;
  completed_items: number;
  pct: number;
}

export interface EvidenceItem {
  evidence_id: string;
  booking_id: string;
  phase: string;
  kind: string;
  title?: string | null;
  body?: string | null;
  media_url?: string | null;
  quantity?: number | null;
  unit?: string | null;
  created_at: string;
}

export interface MaterialItem {
  material_id: string;
  booking_id: string;
  item_name: string;
  quantity: number;
  unit_cost?: number | null;
  amount?: number | null;
  currency: string;
  note?: string | null;
  attachment_url?: string | null;
  attachment_kind?: string | null;
  created_at: string;
}

export interface ChangeRequestItem {
  change_id: string;
  booking_id: string;
  change_type: string;
  proposed_value: string;
  reason?: string | null;
  status?: string;
  created_at?: string;
}

export interface CompletionReport {
  completion_id: string;
  booking_id: string;
  completion_notes?: string | null;
  work_performed?: string | null;
  materials_summary?: string | null;
  before_after_evidence?: string[] | null;
  warranty_details?: string | null;
  recommended_followup?: string | null;
  maintenance_recommendations?: string | null;
  created_at: string;
  booking_status: string;
}

export const bookingsApi = {
  feed: (status?: string, limit = 20, offset = 0) =>
    apiClient.get<BookingFeedRow[]>(`/providers/me/bookings${qs({ status, limit, offset })}`).then((r) => r.data),
  get: (bookingId: string) => apiClient.get<BookingFeedRow>(`/providers/me/bookings/${bookingId}`).then((r) => r.data),
  details: (bookingId: string) => apiClient.get<BookingDetail>(`/providers/me/bookings/${bookingId}/details`).then((r) => r.data),
  timeline: (bookingId: string) => apiClient.get<BookingTimelineEvent[]>(`/providers/me/bookings/${bookingId}/timeline`).then((r) => r.data),
  acknowledge: (bookingId: string) => apiClient.post(`/providers/me/bookings/${bookingId}/acknowledge`).then((r) => r.data),
  startService: (bookingId: string, gps?: { gps_lat: number; gps_lng: number }) =>
    apiClient.post(`/providers/me/bookings/${bookingId}/start`, gps ?? {}).then((r) => r.data),
};

export const trackingApi = {
  startTrip: (bookingId: string) => apiClient.post<{ booking_id: string; trip_started_at: string }>(`/providers/me/tracking/bookings/${bookingId}/start-trip`).then((r) => r.data),
  endTrip: (bookingId: string) => apiClient.post(`/providers/me/tracking/bookings/${bookingId}/end-trip`).then((r) => r.data),
};

export const arrivalApi = {
  arrive: (bookingId: string, latitude: number, longitude: number) =>
    apiClient.post<ArrivalStatus>(`/providers/me/bookings/${bookingId}/arrive${qs({ latitude, longitude })}`).then((r) => r.data),
  verifyPin: (bookingId: string, code: string) =>
    apiClient.post<{ booking_id: string; verified_at: string }>(`/providers/me/bookings/${bookingId}/verify-pin${qs({ code })}`).then((r) => r.data),
  status: (bookingId: string) => apiClient.get<ArrivalStatus>(`/providers/me/bookings/${bookingId}/arrival-status`).then((r) => r.data),
};

export const checklistApi = {
  instantiate: (bookingId: string, serviceId: string) =>
    apiClient.post<{ booking_id: string; items: ChecklistItem[]; already_instantiated: boolean }>(
      `/providers/me/checklist/bookings/${bookingId}/instantiate`,
      { service_id: serviceId },
    ).then((r) => r.data),
  listForBooking: (bookingId: string) => apiClient.get<ChecklistItem[]>(`/providers/me/checklist/bookings/${bookingId}`).then((r) => r.data),
  setCompleted: (bookingId: string, itemId: string, isCompleted = true) =>
    apiClient.post<ChecklistItem>(`/providers/me/checklist/bookings/${bookingId}/items/${itemId}/complete`, { is_completed: isCompleted }).then((r) => r.data),
  progress: (bookingId: string) => apiClient.get<ChecklistProgress>(`/providers/me/checklist/bookings/${bookingId}/progress`).then((r) => r.data),
};

export const evidenceApi = {
  add: (bookingId: string, data: { phase: string; kind: string; title?: string; media_url?: string }) =>
    apiClient.post<EvidenceItem>(`/providers/me/evidence/bookings/${bookingId}`, data).then((r) => r.data),
  list: (bookingId: string) => apiClient.get<EvidenceItem[]>(`/providers/me/evidence/bookings/${bookingId}`).then((r) => r.data),
  delete: (bookingId: string, evidenceId: string) => apiClient.delete(`/providers/me/evidence/bookings/${bookingId}/${evidenceId}`).then((r) => r.data),
};

export const materialsApi = {
  add: (bookingId: string, data: { item_name: string; quantity: number; amount?: number; currency?: string }) =>
    apiClient.post<MaterialItem>(`/providers/me/materials/bookings/${bookingId}`, data).then((r) => r.data),
  list: (bookingId: string) => apiClient.get<MaterialItem[]>(`/providers/me/materials/bookings/${bookingId}`).then((r) => r.data),
  delete: (bookingId: string, materialId: string) => apiClient.delete(`/providers/me/materials/bookings/${bookingId}/${materialId}`).then((r) => r.data),
};

export const changeRequestsApi = {
  submit: (bookingId: string, data: { change_type: string; proposed_value: string; reason?: string }) =>
    apiClient.post<ChangeRequestItem>(`/providers/me/change-requests/bookings/${bookingId}`, data).then((r) => r.data),
  list: (bookingId: string) => apiClient.get<ChangeRequestItem[]>(`/providers/me/change-requests/bookings/${bookingId}`).then((r) => r.data),
};

export const completionApi = {
  complete: (bookingId: string, data: { completion_notes?: string; work_performed?: string }) =>
    apiClient.post<CompletionReport>(`/providers/me/completion/bookings/${bookingId}/complete`, data).then((r) => r.data),
  getReport: (bookingId: string) => apiClient.get<CompletionReport>(`/providers/me/completion/bookings/${bookingId}`).then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Calendar + availability. Field names read directly from
// provider_calendar_service.py / availability_router.py and their governed
// SQL this session.
// ---------------------------------------------------------------------------

export interface CalendarEvent {
  source: "booking" | "blocked" | "unavailable";
  event_id: string;
  title: string;
  start_at: string;
  end_at: string;
  status: string;
  details?: Record<string, unknown>;
}

export interface WorkingHoursRow {
  hours_id?: string;
  day_of_week: number;
  is_available: boolean;
  start_time?: string | null;
  end_time?: string | null;
}

export interface AvailabilitySettings {
  is_online: boolean;
  accepts_emergency: boolean;
  accepts_same_day: boolean;
  accepts_holidays: boolean;
  vacation_mode: boolean;
  vacation_from?: string | null;
  vacation_until?: string | null;
  timezone: string;
  notes?: string | null;
}

export interface TimeOffRow {
  time_off_id: string;
  reason?: string | null;
  starts_at: string;
  ends_at: string;
}

export const calendarApi = {
  // month_view/agenda_view wrap their event list in {..., events} rather
  // than returning a bare array (see calendar_router.py) — unwrap here so
  // callers get the plain CalendarEvent[] the type promises.
  month: (year: number, month: number) =>
    apiClient
      .get<{ year: number; month: number; events: CalendarEvent[] }>(`/providers/me/calendar/month/${year}/${month}`)
      .then((r) => r.data.events),
  week: (date: string) =>
    apiClient.get<{ week_start: string; days: { date: string; events: CalendarEvent[] }[] }>(`/providers/me/calendar/week/${date}`).then((r) => r.data),
  agenda: (fromDate: string, limit = 20) =>
    apiClient
      .get<{ from_date: string; events: CalendarEvent[] }>(`/providers/me/calendar/agenda${qs({ from_date: fromDate, limit })}`)
      .then((r) => r.data.events),
};

export const availabilityApi = {
  getSettings: () => apiClient.get<AvailabilitySettings>("/providers/availability/settings").then((r) => r.data),
  saveSettings: (data: Partial<AvailabilitySettings>) =>
    apiClient.put<AvailabilitySettings>("/providers/availability/settings", data).then((r) => r.data),
  listHours: () => apiClient.get<WorkingHoursRow[]>("/providers/availability/hours").then((r) => r.data),
  setDay: (dayOfWeek: number, data: { is_available: boolean; start_time?: string | undefined; end_time?: string | undefined }) =>
    apiClient.put<WorkingHoursRow>(`/providers/availability/hours/${dayOfWeek}`, data).then((r) => r.data),
  listTimeOff: () => apiClient.get<TimeOffRow[]>("/providers/availability/time-off").then((r) => r.data),
  addTimeOff: (data: { reason?: string; starts_at: string; ends_at: string }) =>
    apiClient.post<TimeOffRow>("/providers/availability/time-off", data).then((r) => r.data),
  removeTimeOff: (timeOffId: string) => apiClient.delete(`/providers/availability/time-off/${timeOffId}`).then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Wallet transactions + payouts (payout methods are already in onboardingApi
// — reused here rather than duplicated). Field names read directly from
// provider_wallet_service.py's _encode_tx and provider_payout_service.py.
// ---------------------------------------------------------------------------

export interface WalletTransaction {
  entry_id: string;
  entry_type: string;
  amount: number;
  running_balance: number;
  currency: string;
  reference_type?: string | null;
  reference_id?: string | null;
  booking_number?: string | null;
  description?: string | null;
  created_at: string;
}

export interface PayoutRow {
  payout_id: string;
  payout_number: string;
  method_id: string;
  amount: number;
  currency: string;
  status: string;
  failure_reason?: string | null;
  requested_at?: string | null;
  processed_at?: string | null;
  completed_at?: string | null;
  method_type?: string | null;
  provider_name?: string | null;
  destination?: string | null;
}

export const walletApi = {
  overview: () => apiClient.get<WalletOverview>("/providers/me/wallet").then((r) => r.data),
  transactions: (limit = 20, offset = 0) =>
    apiClient
      .get<{ transactions: WalletTransaction[]; limit: number; offset: number }>(`/providers/me/wallet/transactions${qs({ limit, offset })}`)
      .then((r) => r.data.transactions),
};

export const payoutsApi = {
  listMethods: () => apiClient.get<PayoutMethod[]>("/providers/me/payouts/methods").then((r) => r.data),
  addMethod: (data: {
    method_type: string;
    provider_name?: string | undefined;
    account_holder?: string | undefined;
    account_number?: string | undefined;
    mobile_number?: string | undefined;
    currency: string;
    is_default: boolean;
  }) => apiClient.post<PayoutMethod>("/providers/me/payouts/methods", data).then((r) => r.data),
  setDefaultMethod: (methodId: string) => apiClient.post(`/providers/me/payouts/methods/${methodId}/default`).then((r) => r.data),
  deleteMethod: (methodId: string) => apiClient.delete(`/providers/me/payouts/methods/${methodId}`).then((r) => r.data),
  withdraw: (data: { method_id: string; amount: number; currency: string }) =>
    apiClient.post<PayoutRow>("/providers/me/payouts/withdraw", data).then((r) => r.data),
  list: (limit = 20, offset = 0) =>
    apiClient
      .get<{ payouts: PayoutRow[]; limit: number; offset: number }>(`/providers/me/payouts${qs({ limit, offset })}`)
      .then((r) => r.data.payouts),
  get: (payoutId: string) => apiClient.get<PayoutRow>(`/providers/me/payouts/${payoutId}`).then((r) => r.data),
  cancel: (payoutId: string) => apiClient.post<PayoutRow>(`/providers/me/payouts/${payoutId}/cancel`).then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Invoices — periodic earnings statements, not per-booking customer
// invoices. Field names read directly from provider_invoices_service.py's
// _encode_invoice/_encode_summary this session.
// ---------------------------------------------------------------------------

export interface InvoiceRow {
  id: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  gross_amount: number;
  commission_amount: number;
  tax_amount: number;
  net_amount: number;
  currency: string;
  status: string;
  issued_at?: string | null;
  due_at?: string | null;
  paid_at?: string | null;
}

export interface InvoiceSummary {
  total_count: number;
  total_gross: number;
  total_commission: number;
  total_tax: number;
  total_net: number;
  overdue_count: number;
}

export const invoicesApi = {
  list: (limit = 50, offset = 0) =>
    apiClient
      .get<{ invoices: InvoiceRow[]; limit: number; offset: number }>(`/providers/me/invoices/${qs({ limit, offset })}`)
      .then((r) => r.data.invoices),
  summary: () => apiClient.get<InvoiceSummary>("/providers/me/invoices/summary").then((r) => r.data),
  get: (invoiceId: string) => apiClient.get<InvoiceRow>(`/providers/me/invoices/${invoiceId}`).then((r) => r.data),
};