// Lightweight API client — JSON, bearer header, one silent refresh on 401.
// Scaffolded for web-provider so the provider panel uses the exact same
// envelope/header contract as web-user once it wires the real API.
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
}

export const apiClient = new ApiClient();