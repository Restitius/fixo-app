// Real provider session — wired to /providers/auth/*. Registration/OTP
// verification (register.tsx, verify-otp.tsx) is still a separate demo
// walkthrough; only login/refresh/logout are real so far.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { apiClient } from "./api-client";

const TOKEN_STORAGE = "fixo.provider.session";
const ONLINE_KEY = "fixo.provider.online";

interface ProviderProfile {
  provider_id: string;
  first_name?: string;
  last_name?: string;
  display_name?: string | null;
  email: string;
  phone?: string;
  account_type: "INDIVIDUAL" | "BUSINESS";
  [key: string]: unknown;
}

interface ProviderAuthState {
  access_token: string | null;
  refresh_token: string | null;
  provider: ProviderProfile | null;
  loading: boolean;
}

interface ProviderAuthValue extends ProviderAuthState {
  session: ProviderProfile | null;
  online: boolean;
  setOnline: (v: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
}

const Ctx = createContext<ProviderAuthValue | null>(null);

export function ProviderAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProviderAuthState>({
    access_token: null,
    refresh_token: null,
    provider: null,
    loading: true,
  });
  const [online, setOnlineState] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE);
      if (stored) {
        const parsed = JSON.parse(stored);
        setState((prev) => ({
          ...prev,
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
          provider: parsed.provider,
        }));
      }
      setOnlineState(localStorage.getItem(ONLINE_KEY) !== "false");
    } catch {
      localStorage.removeItem(TOKEN_STORAGE);
    }
    setState((prev) => ({ ...prev, loading: false }));
  }, []);

  useEffect(() => {
    if (state.access_token && state.refresh_token) {
      localStorage.setItem(
        TOKEN_STORAGE,
        JSON.stringify({
          access_token: state.access_token,
          refresh_token: state.refresh_token,
          provider: state.provider,
        }),
      );
    } else {
      localStorage.removeItem(TOKEN_STORAGE);
    }
  }, [state.access_token, state.refresh_token, state.provider]);

  useEffect(() => {
    apiClient.setAuthToken(state.access_token);
  }, [state.access_token]);

  useEffect(() => {
    apiClient.onUnauthorized(async () => refreshAccessToken());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.refresh_token]);

  // See web-user's auth-context.tsx for why concurrent 401s are deduped onto
  // one in-flight refresh (rotating refresh tokens: a second racing refresh
  // would replay an already-rotated token and fail).
  const refreshInFlight = useRef<Promise<boolean> | null>(null);

  const refreshAccessToken = (): Promise<boolean> => {
    if (refreshInFlight.current) return refreshInFlight.current;

    const run = async (): Promise<boolean> => {
      if (!state.refresh_token) return false;
      try {
        const resp = await apiClient.post("/providers/auth/token/refresh", {
          refresh_token: state.refresh_token,
        });
        const { access_token, refresh_token, provider } = resp.data;
        apiClient.setAuthToken(access_token);
        setState((prev) => ({
          ...prev,
          access_token,
          refresh_token,
          provider: prev.provider ?? provider,
        }));
        return true;
      } catch {
        setState({ access_token: null, refresh_token: null, provider: null, loading: false });
        return false;
      }
    };

    const promise = run().finally(() => {
      refreshInFlight.current = null;
    });
    refreshInFlight.current = promise;
    return promise;
  };

  const login = useCallback(async (email: string, password: string) => {
    const resp = await apiClient.post("/providers/auth/login", { email, password });
    const { access_token, refresh_token, provider } = resp.data;
    setState({ access_token, refresh_token, provider, loading: false });
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/providers/auth/logout");
    } catch {
      // ignore — clear local state regardless
    }
    setState({ access_token: null, refresh_token: null, provider: null, loading: false });
  }, []);

  const setOnline = useCallback((v: boolean) => {
    localStorage.setItem(ONLINE_KEY, String(v));
    setOnlineState(v);
  }, []);

  const value = useMemo<ProviderAuthValue>(
    () => ({
      ...state,
      session: state.provider,
      online,
      setOnline,
      login,
      logout,
      refreshAccessToken,
    }),
    [state, online, setOnline, login, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProviderAuth(): ProviderAuthValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProviderAuth must be used inside ProviderAuthProvider");
  return ctx;
}
