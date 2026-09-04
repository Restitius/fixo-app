// Mock provider session. No backend yet — the session is kept in localStorage
// so the whole provider journey (join → register → verify → onboarding →
// dashboard) can be walked through in the preview.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { provider, providerFullName } from "./mock-data";

const SESSION_KEY = "fixo.provider.session";
const ONLINE_KEY = "fixo.provider.online";

interface ProviderSession {
  name: string;
  email: string;
  accountType: "INDIVIDUAL" | "BUSINESS";
}

interface ProviderAuthValue {
  session: ProviderSession | null;
  loading: boolean;
  online: boolean;
  setOnline: (v: boolean) => void;
  login: (email?: string) => void;
  logout: () => void;
}

const Ctx = createContext<ProviderAuthValue | null>(null);

export function ProviderAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ProviderSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnlineState] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setSession(JSON.parse(raw) as ProviderSession);
      setOnlineState(localStorage.getItem(ONLINE_KEY) !== "false");
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const login = useCallback((email?: string) => {
    const next: ProviderSession = {
      name: providerFullName,
      email: email && email.includes("@") ? email : provider.email,
      accountType: provider.accountType,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  const setOnline = useCallback((v: boolean) => {
    localStorage.setItem(ONLINE_KEY, String(v));
    setOnlineState(v);
  }, []);

  const value = useMemo(
    () => ({ session, loading, online, setOnline, login, logout }),
    [session, loading, online, setOnline, login, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProviderAuth(): ProviderAuthValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProviderAuth must be used inside ProviderAuthProvider");
  return ctx;
}
