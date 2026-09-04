// Lightweight API client — JSON, bearer header, one silent refresh on 401.
// Mirrors applications/frontend/web/web-user/src/lib/api-client.ts field-for-field so
// screens ported from web can reuse the same shapes.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'

interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: { type: string; title: string; body: string }
}

export class ApiError extends Error {}

class ApiClient {
  private token: string | null = null
  private _onUnauthorized: (() => Promise<boolean>) | null = null

  setAuthToken(token: string | null) {
    this.token = token
  }

  // AuthProvider registers its refresh flow; we retry once before giving up.
  onUnauthorized(cb: () => Promise<boolean>) {
    this._onUnauthorized = cb
  }

  private headers(sendJsonHeader = true): HeadersInit {
    const h: Record<string, string> = {}
    if (sendJsonHeader) h['Content-Type'] = 'application/json'
    if (this.token) h['Authorization'] = `Bearer ${this.token}`
    return h
  }

  private async request<T>(path: string, init: RequestInit, sendJsonHeader = true): Promise<ApiResponse<T>> {
    let res = await fetch(`${BASE_URL}${path}`, { ...init, headers: this.headers(sendJsonHeader) })

    if (res.status === 401 && this._onUnauthorized && (await this._onUnauthorized())) {
      res = await fetch(`${BASE_URL}${path}`, { ...init, headers: this.headers(sendJsonHeader) })
    }

    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.success) {
      const msg = json?.message?.body || json?.message?.title || `Request failed (${res.status})`
      throw new ApiError(msg)
    }
    return json as ApiResponse<T>
  }

  get<T = any>(path: string) {
    return this.request<T>(path, { method: 'GET' })
  }

  post<T = any>(path: string, body: unknown = {}) {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) })
  }

  patch<T = any>(path: string, body: unknown = {}) {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
  }

  put<T = any>(path: string, body: unknown = {}) {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
  }

  delete<T = any>(path: string) {
    return this.request<T>(path, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()

// ---------------------------------------------------------------------------
// Typed feature methods — wallet / promotions / loyalty / history / activity /
// notifications / invoices / favorites / catalog / bookings. 1:1 with the web
// client so mobile screens can be wired using the exact same field names the
// mock data (data/mock.ts) was already modeled on.
// ---------------------------------------------------------------------------

interface QueryParams {
  [key: string]: string | number | boolean | null | undefined
}

function qs(params?: QueryParams): string {
  if (!params) return ''
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export interface WalletTxn {
  entry_id?: string
  entry_type: string
  amount: number
  running_balance: number
  currency: string
  created_at: string
}

export interface WalletBalance {
  wallet_id?: string
  balance: number
  currency: string
  updated_at?: string
}

export interface Promotion {
  promo_id: string
  code: string
  name: string
  description?: string | null
  discount_type: string
  discount_value: number
  min_amount?: number | null
  max_discount?: number | null
  usage_limit?: number | null
  used_count?: number
  valid_from: string
  valid_until: string
}

export interface PromotionValidation extends Promotion {
  discount_amount: number
}

export interface LoyaltyAccount {
  loyalty_id?: string
  points_balance: number
  tier: string
  updated_at?: string
}

export interface LoyaltyTxn {
  txn_id?: string
  points: number
  running_total: number
  activity: string
  reference_id?: string | null
  created_at: string
}

export interface BookingHistoryRow {
  booking_id: string
  booking_number: string
  status: string
  scheduled_date?: string | null
  time_window?: string | null
  agreed_amount: number
  currency: string
  created_at: string
  completed_at?: string | null
  service_name?: string | null
  provider_name?: string | null
}

export interface SupportTicket {
  ticket_id: string
  ticket_number: string
  subject: string
  category: string
  priority: string
  status: string
  resolution?: string | null
  created_at: string
  updated_at: string
  message_count?: number
  first_response_at?: string | null
  last_support_message_at?: string | null
}

export interface TicketMessage {
  message_id: string
  ticket_id?: string
  sender: string
  body: string
  created_at: string
}

export interface BookingRating {
  rating_id: string
  booking_id: string
  provider_id: string
  rating: number
  comment?: string | null
  created_at: string
  updated_at?: string
  booking_number?: string
  agreed_amount?: number
  currency?: string
  scheduled_date?: string | null
  provider_name?: string | null
  service_name?: string | null
}

export interface TimelineEvent {
  event: string
  detail?: string | null
  created_at: string
}

export interface ActivityEvent {
  booking_id?: string
  booking_number: string
  service_name?: string | null
  event: string
  detail?: string | null
  created_at: string
}

export interface NotificationRow {
  notification_id: string
  type: string
  title: string
  body?: string | null
  ref_type?: string | null
  ref_id?: string | null
  read_at?: string | null
  created_at: string
}

export interface AccountPreference {
  key: string
  value: string
  updated_at?: string
}

export interface PaymentMethod {
  method_id: string
  type: string
  provider?: string | null
  details_masked: Record<string, unknown>
  is_default: boolean
  created_at?: string
  updated_at?: string
}

export interface InvoiceRow {
  invoice_id: string
  invoice_number: string
  total_amount: number
  currency: string
  status: string
  issued_at?: string | null
  paid_at?: string | null
  created_at: string
  booking_number: string
  provider_name: string
  service_name?: string | null
}

export interface InvoiceItem {
  item_id: string
  description: string
  quantity: number
  unit_amount: number
  line_total: number
}

export interface InvoiceDetail extends InvoiceRow {
  subtotal: number
  tax_amount: number
  scheduled_date?: string | null
  category_name?: string | null
  address_city?: string | null
  address_region?: string | null
  items: InvoiceItem[]
}

export const fixoSdk = {
  // ---- Wallet -------------------------------------------------------------
  walletBalance: () => apiClient.get<WalletBalance>('/wallet/balance').then((r) => r.data),
  walletTransactions: (limit = 20, offset = 0) =>
    apiClient.get<WalletTxn[]>(`/wallet/transactions${qs({ limit, offset })}`).then((r) => r.data),
  walletCredit: (amount: number) => apiClient.post<WalletTxn>(`/wallet/credit${qs({ amount })}`).then((r) => r.data),
  walletDebit: (amount: number) => apiClient.post<WalletTxn>(`/wallet/debit${qs({ amount })}`).then((r) => r.data),

  // ---- Promotions ---------------------------------------------------------
  listPromotions: (limit = 20, offset = 0) =>
    apiClient.get<Promotion[]>(`/promotions${qs({ limit, offset })}`).then((r) => r.data),
  validatePromotion: (code: string, amount: number) =>
    apiClient.post<PromotionValidation>(`/promotions/validate${qs({ code, amount })}`).then((r) => r.data),
  usePromotion: (promoId: string) => apiClient.post<Promotion>(`/promotions/${promoId}/use`).then((r) => r.data),

  // ---- Loyalty ------------------------------------------------------------
  loyaltyAccount: () => apiClient.get<LoyaltyAccount>('/loyalty/account').then((r) => r.data),
  loyaltyTransactions: (limit = 20, offset = 0) =>
    apiClient.get<LoyaltyTxn[]>(`/loyalty/transactions${qs({ limit, offset })}`).then((r) => r.data),
  loyaltySpend: (points: number, activity = 'REDEMPTION') =>
    apiClient.post<LoyaltyTxn>(`/loyalty/spend${qs({ points, activity })}`).then((r) => r.data),

  // ---- History / Activity ---------------------------------------------------
  bookingHistory: (status?: string, limit = 50, offset = 0) =>
    apiClient.get<BookingHistoryRow[]>(`/history/bookings${qs({ status, limit, offset })}`).then((r) => r.data),
  bookingTimeline: (bookingId: string) =>
    apiClient.get<TimelineEvent[]>(`/history/bookings/${bookingId}/timeline`).then((r) => r.data),
  activityFeed: (event?: string, limit = 50, offset = 0) =>
    apiClient.get<ActivityEvent[]>(`/history/activity${qs({ event, limit, offset })}`).then((r) => r.data),

  // ---- Ratings --------------------------------------------------------------
  submitRating: (bookingId: string, rating: number, comment?: string) =>
    apiClient.post<BookingRating>(`/ratings/${bookingId}`, { rating, comment: comment || undefined }).then((r) => r.data),
  listMyRatings: () => apiClient.get<BookingRating[]>('/ratings').then((r) => r.data),

  // ---- Notifications ------------------------------------------------------
  notifications: (unreadOnly = false, limit = 50, offset = 0) =>
    apiClient.get<NotificationRow[]>(`/notifications${qs({ unread_only: unreadOnly, limit, offset })}`).then((r) => r.data),
  notificationUnread: () => apiClient.get<{ unread_count: number }>('/notifications/unread-count').then((r) => r.data),
  markNotificationRead: (id: string) => apiClient.post<{ marked: number }>(`/notifications/${id}/read`).then((r) => r.data),
  markAllNotificationsRead: () => apiClient.post<{ marked: number }>('/notifications/read-all').then((r) => r.data),

  // ---- Account / Preferences ----------------------------------------------
  listPreferences: () => apiClient.get<AccountPreference[]>('/account/preferences').then((r) => r.data),
  setPreference: (key: string, value: string) => apiClient.post<AccountPreference>('/account/preferences', { key, value }).then((r) => r.data),

  // ---- Payment methods -----------------------------------------------------
  listPaymentMethods: () => apiClient.get<PaymentMethod[]>('/account/payment-methods').then((r) => r.data),
  addPaymentMethod: (type: string, provider: string | null, details_masked: Record<string, unknown>, make_default: boolean) =>
    apiClient.post<PaymentMethod>('/account/payment-methods', { type, provider, details_masked, make_default }).then((r) => r.data),
  setDefaultPaymentMethod: (methodId: string) =>
    apiClient.post<PaymentMethod>(`/account/payment-methods/${methodId}/set-default`).then((r) => r.data),
  removePaymentMethod: (methodId: string) => apiClient.delete<null>(`/account/payment-methods/${methodId}`).then((r) => r.data),

  // ---- Invoices -------------------------------------------------------------
  listInvoices: (limit = 20, offset = 0) => apiClient.get<InvoiceRow[]>(`/invoices${qs({ limit, offset })}`).then((r) => r.data),
  getInvoice: (invoiceId: string) => apiClient.get<InvoiceDetail>(`/invoices/${invoiceId}`).then((r) => r.data),

  // ---- Security ------------------------------------------------------------
  changePassword: (current_password: string, new_password: string) =>
    apiClient.post<null>('/account/security/change-password', { current_password, new_password }).then((r) => r.data),

  // ---- Support --------------------------------------------------------------
  listTickets: (limit = 20, offset = 0) => apiClient.get<SupportTicket[]>(`/support/tickets${qs({ limit, offset })}`).then((r) => r.data),
  createTicket: (subject: string, category: string, priority: string) =>
    apiClient.post<SupportTicket>('/support/tickets', { subject, category, priority }).then((r) => r.data),
  listTicketMessages: (ticketId: string, limit = 100, offset = 0) =>
    apiClient.get<TicketMessage[]>(`/support/tickets/${ticketId}/messages${qs({ limit, offset })}`).then((r) => r.data),
  addTicketMessage: (ticketId: string, body: string) =>
    apiClient.post<TicketMessage>(`/support/tickets/${ticketId}/messages`, { body }).then((r) => r.data),
}

// ---------------------------------------------------------------------------
// Booking flow — catalog browsing, addresses, service requests, matching,
// quotations and bookings. Same shapes as web's bookingApi.
// ---------------------------------------------------------------------------

export interface CatalogCategory {
  category_id: string
  code: string
  name: string
  description: string
  icon: string
  service_count: number
  min_price?: number | null
  avg_rating?: number | null
  total_jobs?: number | null
  provider_count?: number | null
}

export interface ProviderListing {
  provider_id: string
  display_name: string
  headline?: string | null
  city?: string | null
  region?: string | null
  rating_avg: number
  rating_count: number
  jobs_completed: number
  base_amount: number
}

export interface ProviderProfile extends Omit<ProviderListing, 'base_amount'> {
  bio?: string | null
  created_at: string
  services: { service_id: string; slug: string; name: string; base_amount: number }[]
}

export interface CatalogServiceResult {
  service_id: string
  slug: string
  name: string
  description: string
  icon: string
  category_code: string
  category_name: string
  score?: number
}

export interface Address {
  address_id: string
  label: string
  recipient_name: string
  phone: string
  street_address: string
  city: string
  region?: string | null
  postal_code?: string | null
  latitude?: number | null
  longitude?: number | null
  delivery_instructions?: string | null
  is_default: boolean
  created_at?: string
}

export interface ServiceRequestRow {
  request_id: string
  request_number: string
  status: string
  description: string
  preferred_date?: string | null
  time_window?: string | null
  validation_notes?: string | null
  submitted_at?: string | null
  service_id: string
  service_name?: string
  service_slug?: string
  address_id?: string | null
  address_label?: string | null
  address_city?: string | null
  address_region?: string | null
  selected_provider_id?: string | null
}

export interface MatchCandidate {
  match_id: string
  provider_id: string
  strategy: string
  score: number
  rank_pos: number
  reasons: string
  display_name: string
  headline: string
  city: string
  rating_avg: number
  jobs_completed: number
}

export interface Quote {
  quote_id: string
  provider_id: string
  amount: number
  currency: string
  lead_time_days: number
  message: string
  status: string
  valid_until: string
  created_at: string
  display_name: string
  headline: string
  rating_avg: number
  request_status?: string
}

export interface BookingRow {
  booking_id: string
  booking_number: string
  status: string
  agreed_amount: number
  currency: string
  scheduled_date: string
  time_window?: string | null
  arrival_code?: string
  selected_provider_id: string
  provider_name?: string
  provider_headline?: string
  service_name?: string
  request_number?: string
  address_label?: string
  address_street?: string
  address_city?: string
  payment?: { payment_id: string; status: string; gateway_ref?: string | null }
}

export interface BookingMessage {
  message_id: string
  from_provider: boolean
  body: string
  read_at?: string | null
  created_at: string
}

export const bookingApi = {
  catalogCategories: () => apiClient.get<CatalogCategory[]>('/catalog/categories').then((r) => r.data),
  catalogSearch: (q: string) =>
    apiClient.get<{ term: string; count: number; results: CatalogServiceResult[] }>(`/catalog/search${qs({ q })}`).then((r) => r.data),

  listProvidersByCategory: (categoryId: string) =>
    apiClient.get<ProviderListing[]>(`/providers${qs({ category_id: categoryId })}`).then((r) => r.data),
  listProvidersByService: (slug: string) =>
    apiClient.get<ProviderListing[]>(`/providers${qs({ service: slug })}`).then((r) => r.data),
  getProviderProfile: (providerId: string) => apiClient.get<ProviderProfile>(`/providers/${providerId}`).then((r) => r.data),

  listAddresses: () => apiClient.get<Address[]>('/locations/addresses').then((r) => r.data),
  createAddress: (payload: Omit<Address, 'address_id' | 'created_at'>) =>
    apiClient.post<Address>('/locations/addresses', payload).then((r) => r.data),
  setDefaultAddress: (addressId: string) => apiClient.post<Address>(`/locations/addresses/${addressId}/set-default`).then((r) => r.data),

  createServiceRequest: (payload: { service_id: string; description: string; address_id?: string; preferred_date?: string; time_window?: string }) =>
    apiClient.post<ServiceRequestRow>('/service-requests', payload).then((r) => r.data),
  submitServiceRequest: (id: string) => apiClient.post<ServiceRequestRow>(`/service-requests/${id}/submit`).then((r) => r.data),

  runMatching: (id: string) =>
    apiClient.post<{ strategy: string; outcome: string; matches: MatchCandidate[] }>(`/service-requests/${id}/match`).then((r) => r.data),
  selectProvider: (id: string, providerId: string) =>
    apiClient.post<ServiceRequestRow>(`/service-requests/${id}/select-provider`, { provider_id: providerId }).then((r) => r.data),
  listQuotes: (id: string) => apiClient.get<Quote[]>(`/service-requests/${id}/quotes`).then((r) => r.data),
  acceptQuote: (quoteId: string) => apiClient.post<Quote>(`/quotes/${quoteId}/accept`).then((r) => r.data),

  confirmBooking: (quoteId: string) => apiClient.post<BookingRow>('/bookings', { quote_id: quoteId }).then((r) => r.data),
  authorizeBookingPayment: (bookingId: string) => apiClient.post<BookingRow>(`/bookings/${bookingId}/authorize-payment`).then((r) => r.data),
  cancelBooking: (bookingId: string) => apiClient.post<BookingRow>(`/bookings/${bookingId}/cancel`).then((r) => r.data),
  getBooking: (bookingId: string) => apiClient.get<BookingRow>(`/bookings/${bookingId}`).then((r) => r.data),

  sendBookingMessage: (bookingId: string, body: string) =>
    apiClient.post<{ message_id: string }>(`/bookings/${bookingId}/messages`, { body }).then((r) => r.data),
  listBookingMessages: (bookingId: string, limit = 50, offset = 0) =>
    apiClient
      .get<{ conversation_id: string; unread_count: number; messages: BookingMessage[] }>(`/bookings/${bookingId}/messages${qs({ limit, offset })}`)
      .then((r) => r.data),

  openDispute: (bookingId: string, category: string, description: string) =>
    apiClient.post<{ dispute_id: string }>('/disputes', { booking_id: bookingId, category, description }).then((r) => r.data),
}

export interface FavoriteProvider {
  favorite_id: string
  provider_id: string
  display_name: string
  headline?: string | null
  city?: string | null
  rating_avg: number
  rating_count: number
  jobs_completed: number
  created_at: string
}

export const favoritesApi = {
  list: (page = 1, limit = 20) => apiClient.get<FavoriteProvider[]>(`/favorites${qs({ page, limit })}`).then((r) => r.data),
  toggle: (providerId: string) =>
    apiClient.post<{ is_favorite: boolean; favorites_count: number }>(`/favorites/${providerId}/toggle`).then((r) => r.data),
}
