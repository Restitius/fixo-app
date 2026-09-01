// Lightweight API client — JSON, bearer header, one silent refresh on 401.
import { toast } from "sonner";

const BASE_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:8000/api/v1";

interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: { type: string; title: string; body: string };
}

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

  private headers(): HeadersInit {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    return h;
  }

  private async request<T>(path: string, init: RequestInit): Promise<ApiResponse<T>> {
    let res = await fetch(`${BASE_URL}${path}`, { ...init, headers: this.headers() });

    if (res.status === 401 && this._onUnauthorized && (await this._onUnauthorized())) {
      res = await fetch(`${BASE_URL}${path}`, { ...init, headers: this.headers() });
    }

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      const msg =
        json?.message?.body || json?.message?.title || `Request failed (${res.status})`;
      toast.error(msg);
      throw new Error(msg);
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
}

export const apiClient = new ApiClient();

// ---------------------------------------------------------------------------
// Typed feature methods — wallet / promotions / loyalty / history / activity /
// notifications. All map 1:1 onto registered governed queries.
// ---------------------------------------------------------------------------

interface QueryParams {
  [key: string]: string | number | boolean | null | undefined;
}

function qs(params?: QueryParams): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export interface WalletTxn {
  entry_id?: string;
  entry_type: string;
  amount: number;
  running_balance: number;
  currency: string;
  created_at: string;
}

export interface WalletBalance {
  wallet_id?: string;
  balance: number;
  currency: string;
  updated_at?: string;
}

export interface Promotion {
  promo_id: string;
  code: string;
  name: string;
  discount_type: string;
  discount_value: number;
  valid_from: string;
  valid_until: string;
}

export interface PromotionValidation extends Promotion {
  discount_amount: number;
}

export interface LoyaltyAccount {
  loyalty_id?: string;
  points_balance: number;
  tier: string;
  updated_at?: string;
}

export interface LoyaltyTxn {
  txn_id?: string;
  points: number;
  running_total: number;
  activity: string;
  reference_id?: string | null;
  created_at: string;
}

export interface BookingHistoryRow {
  booking_id: string;
  booking_number: string;
  status: string;
  scheduled_date?: string | null;
  time_window?: string | null;
  agreed_amount: number;
  currency: string;
  created_at: string;
  completed_at?: string | null;
  service_name?: string | null;
  provider_name?: string | null;
}

export interface TimelineEvent {
  event: string;
  detail?: string | null;
  created_at: string;
}

export interface ActivityEvent {
  booking_number: string;
  service_name?: string | null;
  event: string;
  detail?: string | null;
  created_at: string;
}

export interface NotificationRow {
  notification_id: string;
  type: string;
  title: string;
  body?: string | null;
  ref_type?: string | null;
  ref_id?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface AccountPreference {
  key: string;
  value: string;
  updated_at?: string;
}

export interface PaymentMethod {
  method_id: string;
  type: string;
  provider?: string | null;
  details_masked: Record<string, unknown>;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Consent {
  kind: string;
  consented: boolean;
  consented_at?: string;
  revoked_at?: string | null;
}

export interface DataExport {
  request_id: string;
  status: string;
  requested_at: string;
  completed_at?: string | null;
  file_path?: string | null;
}

export const fixoSdk = {
  // ---- Wallet -------------------------------------------------------------
  walletBalance: () =>
    apiClient.get<WalletBalance>("/wallet/balance").then((r) => r.data),
  walletTransactions: (limit = 20, offset = 0) =>
    apiClient
      .get<WalletTxn[]>(`/wallet/transactions${qs({ limit, offset })}`)
      .then((r) => r.data),
  walletCredit: (amount: number) =>
    apiClient
      .post<WalletTxn>(`/wallet/credit${qs({ amount })}`)
      .then((r) => r.data),
  walletDebit: (amount: number) =>
    apiClient
      .post<WalletTxn>(`/wallet/debit${qs({ amount })}`)
      .then((r) => r.data),

  // ---- Promotions ---------------------------------------------------------
  listPromotions: (limit = 20, offset = 0) =>
    apiClient
      .get<Promotion[]>(`/promotions${qs({ limit, offset })}`)
      .then((r) => r.data),
  validatePromotion: (code: string, amount: number) =>
    apiClient
      .post<PromotionValidation>(`/promotions/validate${qs({ code, amount })}`)
      .then((r) => r.data),
  usePromotion: (promoId: string) =>
    apiClient
      .post<Promotion>(`/promotions/${promoId}/use`)
      .then((r) => r.data),

  // ---- Loyalty ------------------------------------------------------------
  loyaltyAccount: () =>
    apiClient.get<LoyaltyAccount>("/loyalty/account").then((r) => r.data),
  loyaltyTransactions: (limit = 20, offset = 0) =>
    apiClient
      .get<LoyaltyTxn[]>(`/loyalty/transactions${qs({ limit, offset })}`)
      .then((r) => r.data),
  loyaltyEarn: (points: number, activity = "MANUAL") =>
    apiClient
      .post<LoyaltyTxn>(`/loyalty/earn${qs({ points, activity })}`)
      .then((r) => r.data),
  loyaltySpend: (points: number, activity = "REDEMPTION") =>
    apiClient
      .post<LoyaltyTxn>(`/loyalty/spend${qs({ points, activity })}`)
      .then((r) => r.data),

  // ---- History / Activity -------------------------------------------------
  bookingHistory: (status?: string, limit = 50, offset = 0) =>
    apiClient
      .get<BookingHistoryRow[]>(
        `/history/bookings${qs({ status, limit, offset })}`,
      )
      .then((r) => r.data),
  bookingTimeline: (bookingId: string) =>
    apiClient
      .get<TimelineEvent[]>(`/history/bookings/${bookingId}/timeline`)
      .then((r) => r.data),
  activityFeed: (event?: string, limit = 50, offset = 0) =>
    apiClient
      .get<ActivityEvent[]>(`/history/activity${qs({ event, limit, offset })}`)
      .then((r) => r.data),

  // ---- Notifications ------------------------------------------------------
  notifications: (unreadOnly = false, limit = 50, offset = 0) =>
    apiClient
      .get<NotificationRow[]>(
        `/notifications${qs({ unread_only: unreadOnly, limit, offset })}`,
      )
      .then((r) => r.data),
  notificationUnread: () =>
    apiClient
      .get<{ unread_count: number }>("/notifications/unread-count")
      .then((r) => r.data),
  markNotificationRead: (id: string) =>
    apiClient
      .post<{ marked: number }>(`/notifications/${id}/read`)
      .then((r) => r.data),
  markAllNotificationsRead: () =>
    apiClient
      .post<{ marked: number }>("/notifications/read-all")
      .then((r) => r.data),

  // ---- Account / Preferences ----------------------------------------------
  listPreferences: () =>
    apiClient.get<AccountPreference[]>("/account/preferences").then((r) => r.data),
  setPreference: (key: string, value: string) =>
    apiClient
      .post<AccountPreference>("/account/preferences", { key, value })
      .then((r) => r.data),

  // ---- Payment methods -----------------------------------------------------
  listPaymentMethods: () =>
    apiClient.get<PaymentMethod[]>("/account/payment-methods").then((r) => r.data),
  addPaymentMethod: (type: string, provider: string | null, details_masked: Record<string, unknown>, make_default: boolean) =>
    apiClient
      .post<PaymentMethod>("/account/payment-methods", { type, provider, details_masked, make_default })
      .then((r) => r.data),
  setDefaultPaymentMethod: (methodId: string) =>
    apiClient
      .post<PaymentMethod>(`/account/payment-methods/${methodId}/set-default`)
      .then((r) => r.data),
  removePaymentMethod: (methodId: string) =>
    apiClient.delete<null>(`/account/payment-methods/${methodId}`).then((r) => r.data),

  // ---- Security ------------------------------------------------------------
  changePassword: (current_password: string, new_password: string) =>
    apiClient
      .post<null>("/account/security/change-password", { current_password, new_password })
      .then((r) => r.data),
  revokeSessions: (reason = "security") =>
    apiClient
      .post<{ revocation_id: string }>("/account/security/revoke-sessions", { reason })
      .then((r) => r.data),

  // ---- Privacy / consents --------------------------------------------------
  listConsents: () =>
    apiClient.get<Consent[]>("/account/consents").then((r) => r.data),
  setConsent: (kind: string, consented: boolean) =>
    apiClient
      .post<Consent>("/account/consents", { kind, consented })
      .then((r) => r.data),
  requestDataExport: () =>
    apiClient
      .post<{ request_id: string; status: string }>("/account/privacy/export")
      .then((r) => r.data),
  listDataExports: () =>
    apiClient.get<DataExport[]>("/account/privacy/exports").then((r) => r.data),
};

export const apiClientInstance = apiClient;
