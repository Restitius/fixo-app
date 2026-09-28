// Auth context — manages access/refresh tokens, customer profile, and auth state.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface CustomerProfile {
  customer_id: string;
  full_name: string;
  email: string;
  email_verified: boolean;
  phone?: string | null;
  phone_verified?: boolean;
  preferred_language?: string | null;
  created_at?: string | null;
}

interface AuthState {
  access_token: string | null;
  refresh_token: string | null;
  customer: CustomerProfile | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, device_info?: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  requestOtp: (email: string, channel?: OtpChannel) => Promise<OtpRequestResult>;
  verifyOtp: (email: string, code: string, channel?: OtpChannel) => Promise<OtpVerifyResult>;
  forgotPassword: (email: string) => Promise<string | null>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  updateProfile: (data: { full_name?: string; phone?: string; preferred_language?: string }) => Promise<{ phone_otp_code?: string | null }>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
}

export type OtpChannel = "EMAIL" | "SMS";

export interface OtpRequestResult {
  /** Dev-mode only: the code the server would have delivered. */
  code: string | null;
  /** Masked destination the code was sent to, e.g. a****@example.com. */
  destination: string | null;
}

export interface OtpVerifyResult {
  email_verified: boolean;
  phone_verified: boolean;
}

interface RegisterData {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  preferred_language?: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_STORAGE = "fixo_auth";
const EXPIRY_GRACE_SECONDS = 30;

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    access_token: null,
    refresh_token: null,
    customer: null,
    loading: true,
  });

  // Restore tokens from localStorage on mount.
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState((prev) => ({
          ...prev,
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
          customer: parsed.customer,
        }));
      } catch {
        localStorage.removeItem(TOKEN_STORAGE);
      }
    }
    setState((prev) => ({ ...prev, loading: false }));
  }, []);

  // Persist tokens whenever they change.
  useEffect(() => {
    if (state.access_token && state.refresh_token) {
      localStorage.setItem(
        TOKEN_STORAGE,
        JSON.stringify({
          access_token: state.access_token,
          refresh_token: state.refresh_token,
          customer: state.customer,
        }),
      );
    } else {
      localStorage.removeItem(TOKEN_STORAGE);
    }
  }, [state.access_token, state.refresh_token, state.customer]);

    // Set auth header on the API client.
  useEffect(() => {
    apiClient.setAuthToken(state.access_token);
  }, [state.access_token]);

  // Wire the API client's unauthorized callback to our refresh flow.
  useEffect(() => {
    apiClient.onUnauthorized(async () => refreshAccessToken());
  }, [state.refresh_token]);

  // Refresh tokens are single-use/rotating server-side. When several requests
  // 401 at once (e.g. a page firing parallel API calls right as the access
  // token expires), each would otherwise race its own refresh call — the
  // first rotates the refresh token, the second replays the now-stale one,
  // fails, and logs the user out. Dedupe concurrent callers onto one in-flight
  // refresh so only a single request actually hits the server.
  const refreshInFlight = useRef<Promise<boolean> | null>(null);

  const refreshAccessToken = (): Promise<boolean> => {
    if (refreshInFlight.current) return refreshInFlight.current;

    const run = async (): Promise<boolean> => {
      if (!state.refresh_token) return false;
      try {
        const resp = await apiClient.post("/auth/token/refresh", {
          refresh_token: state.refresh_token,
        });
        const { access_token, refresh_token, customer } = resp.data;
        // Apply the new token to the API client synchronously — the retry
        // fetch inside apiClient.request() fires immediately after this
        // resolves, before React re-renders and runs the effect below. If we
        // only relied on that effect, the retry would replay the stale token
        // and 401 again, leaving every in-flight page fetch permanently
        // unresolved (rows stuck at null, dropdowns empty, stats stuck at 0).
        apiClient.setAuthToken(access_token);
        setState((prev) => ({
          ...prev,
          access_token,
          refresh_token,
          customer: prev.customer ?? customer,
        }));
        return true;
      } catch (err) {
        console.error("Token refresh failed:", err);
        setState({
          access_token: null,
          refresh_token: null,
          customer: null,
          loading: false,
        });
        return false;
      }
    };

    const promise = run().finally(() => {
      refreshInFlight.current = null;
    });
    refreshInFlight.current = promise;
    return promise;
  };

  const login = async (
    email: string,
    password: string,
    device_info = "",
  ) => {
    const resp = await apiClient.post("/auth/login", {
      email,
      password,
      device_info,
    });
    const { access_token, refresh_token, customer } = resp.data;
    setState({
      access_token,
      refresh_token,
      customer,
      loading: false,
    });
    const postAuthPath = sessionStorage.getItem("fixo.postAuthPath");
    if (postAuthPath) {
      sessionStorage.removeItem("fixo.postAuthPath");
      window.location.assign(postAuthPath);
    } else {
      navigate({ to: "/" });
    }
  };

  const register = async (data: RegisterData) => {
    const resp = await apiClient.post("/auth/register", data);
    // In dev mode the OTP codes are returned in the response.
    navigate({
      to: "/verify-otp",
      search: {
        email: data.email,
        ...(resp.data.otp_code ? { otp_from_register: resp.data.otp_code } : {}),
        ...(resp.data.phone_otp_code ? { phone_otp_from_register: resp.data.phone_otp_code } : {}),
      },
    });
  };

  const requestOtp = async (email: string, channel: OtpChannel = "EMAIL"): Promise<OtpRequestResult> => {
    const resp = await apiClient.post("/auth/otp/request", { email, channel });
    // Dev mode returns otp_code in response.
    return { code: resp.data.otp_code ?? null, destination: resp.data.destination ?? null };
  };

  const verifyOtp = async (email: string, code: string, channel: OtpChannel = "EMAIL"): Promise<OtpVerifyResult> => {
    const resp = await apiClient.post("/auth/otp/verify", { email, code, channel });
    setState((prev) =>
      prev.customer && prev.customer.email === email
        ? {
            ...prev,
            customer: {
              ...prev.customer,
              email_verified: resp.data.email_verified,
              phone_verified: resp.data.phone_verified,
            },
          }
        : prev,
    );
    return { email_verified: !!resp.data.email_verified, phone_verified: !!resp.data.phone_verified };
  };

  const forgotPassword = async (email: string): Promise<string | null> => {
    const resp = await apiClient.post("/auth/password/forgot", { email });
    // Dev mode returns otp_code in response.
    return resp.data.otp_code ?? null;
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    await apiClient.post("/auth/password/reset", { email, code, new_password: newPassword });
    toast.success("Password reset. Log in with your new password.");
    navigate({ to: "/login" });
  };

  const updateProfile = async (data: { full_name?: string; phone?: string; preferred_language?: string }) => {
    const resp = await apiClient.patch("/auth/me", data);
    const { phone_otp_code, ...profile } = resp.data;
    setState((prev) => ({ ...prev, customer: profile }));
    return { phone_otp_code: phone_otp_code ?? null };
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // ignore errors on logout
    }
    setState({
      access_token: null,
      refresh_token: null,
      customer: null,
      loading: false,
    });
    localStorage.removeItem(TOKEN_STORAGE);
    navigate({ to: "/login" });
  };

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      requestOtp,
      verifyOtp,
      forgotPassword,
      resetPassword,
      updateProfile,
      logout,
      refreshAccessToken,
    }),
    [state, navigate],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
