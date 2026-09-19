// Auth context — manages access/refresh tokens, provider profile, and auth
// state. Ported from user-app's auth-context.tsx (AsyncStorage, expo-router)
// but retargeted at /providers/auth/* and following web-provider's own
// real, already-verified flow: register() only creates the account and
// sends an OTP — it does NOT auto-login (unlike user-app's register(),
// which skips verification). A provider must verify the OTP, then sign in
// separately, exactly as built and tested on web-provider this session.
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { apiClient, ApiError } from './api-client'

export interface ProviderProfile {
  provider_id: string
  display_name: string
  first_name: string
  middle_name?: string | null
  last_name: string
  email: string
  phone?: string | null
  account_type: string
  status: string
  preferred_language?: string | null
  email_verified: boolean
  phone_verified: boolean
  verification_status?: string | null
  country?: string | null
  region?: string | null
  city?: string | null
  district?: string | null
  created_at?: string | null
}

interface AuthState {
  access_token: string | null
  refresh_token: string | null
  provider: ProviderProfile | null
  loading: boolean
}

export interface ProviderRegisterData {
  first_name: string
  last_name: string
  middle_name?: string
  email: string
  phone: string
  password: string
  account_type: 'INDIVIDUAL' | 'BUSINESS'
  preferred_language?: string
  terms_accepted: boolean
  privacy_accepted: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, device_info?: string) => Promise<void>
  register: (data: ProviderRegisterData) => Promise<{ otp?: string | null; email: string }>
  requestOtp: (email: string) => Promise<string | null>
  verifyOtp: (email: string, code: string) => Promise<void>
  forgotPassword: (email: string) => Promise<string | null>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>
  updateProfile: (data: Record<string, unknown>) => Promise<void>
  logout: () => Promise<void>
  refreshAccessToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const TOKEN_STORAGE = 'fixo_provider_auth'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    access_token: null,
    refresh_token: null,
    provider: null,
    loading: true,
  })

  // Restore tokens from AsyncStorage on mount.
  useEffect(() => {
    ;(async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_STORAGE)
        if (stored) {
          const parsed = JSON.parse(stored)
          apiClient.setAuthToken(parsed.access_token)
          setState((prev) => ({
            ...prev,
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token,
            provider: parsed.provider,
          }))
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_STORAGE)
      } finally {
        setState((prev) => ({ ...prev, loading: false }))
      }
    })()
  }, [])

  // Persist tokens whenever they change.
  useEffect(() => {
    if (state.access_token && state.refresh_token) {
      AsyncStorage.setItem(
        TOKEN_STORAGE,
        JSON.stringify({ access_token: state.access_token, refresh_token: state.refresh_token, provider: state.provider }),
      ).catch(() => {})
    } else {
      AsyncStorage.removeItem(TOKEN_STORAGE).catch(() => {})
    }
  }, [state.access_token, state.refresh_token, state.provider])

  useEffect(() => {
    apiClient.setAuthToken(state.access_token)
  }, [state.access_token])

  useEffect(() => {
    apiClient.onUnauthorized(async () => refreshAccessToken())
  }, [state.refresh_token])

  // Refresh tokens are single-use/rotating server-side. Dedupe concurrent
  // 401s onto one in-flight refresh so parallel screen fetches don't each
  // rotate (and invalidate) the refresh token out from under each other.
  const refreshInFlight = useRef<Promise<boolean> | null>(null)

  const refreshAccessToken = (): Promise<boolean> => {
    if (refreshInFlight.current) return refreshInFlight.current

    const run = async (): Promise<boolean> => {
      if (!state.refresh_token) return false
      try {
        const resp = await apiClient.post('/providers/auth/token/refresh', { refresh_token: state.refresh_token })
        const { access_token, refresh_token, provider } = resp.data
        apiClient.setAuthToken(access_token)
        setState((prev) => ({ ...prev, access_token, refresh_token, provider: prev.provider ?? provider }))
        return true
      } catch {
        setState({ access_token: null, refresh_token: null, provider: null, loading: false })
        return false
      }
    }

    const promise = run().finally(() => {
      refreshInFlight.current = null
    })
    refreshInFlight.current = promise
    return promise
  }

  const login = async (email: string, password: string, device_info = 'mobile') => {
    const resp = await apiClient.post('/providers/auth/login', { email, password, device_info })
    const { access_token, refresh_token, provider } = resp.data
    setState({ access_token, refresh_token, provider, loading: false })
  }

  // Only creates the account and sends an OTP — no session yet, matching
  // web-provider's real, already-verified /providers/auth/register behavior.
  // The caller (sign-up screen) navigates to verify-otp with the returned
  // dev-mode code, same as web-provider's register.tsx does.
  const register = async (data: ProviderRegisterData): Promise<{ otp?: string | null; email: string }> => {
    const resp = await apiClient.post('/providers/auth/register', data)
    return { otp: resp.data?.otp_code ?? null, email: data.email }
  }

  const requestOtp = async (email: string): Promise<string | null> => {
    const resp = await apiClient.post('/providers/auth/otp/request', { email })
    return resp.data?.otp_code ?? null
  }

  // Verification alone doesn't establish a session — the provider signs in
  // separately afterward, exactly as on web-provider.
  const verifyOtp = async (email: string, code: string) => {
    await apiClient.post('/providers/auth/otp/verify', { email, code })
  }

  const forgotPassword = async (email: string): Promise<string | null> => {
    const resp = await apiClient.post('/providers/auth/password/forgot', { email })
    return resp.data?.otp_code ?? null
  }

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    await apiClient.post('/providers/auth/password/reset', { email, code, new_password: newPassword })
  }

  const updateProfile = async (data: Record<string, unknown>) => {
    const resp = await apiClient.patch('/providers/profile', data)
    setState((prev) => ({ ...prev, provider: prev.provider ? { ...prev.provider, ...resp.data } : prev.provider }))
  }

  const logout = async () => {
    try {
      await apiClient.post('/providers/auth/logout')
    } catch {
      // ignore — we're clearing local state regardless
    }
    setState({ access_token: null, refresh_token: null, provider: null, loading: false })
    router.replace('/auth')
  }

  const value = useMemo(
    () => ({ ...state, login, register, requestOtp, verifyOtp, forgotPassword, resetPassword, updateProfile, logout, refreshAccessToken }),
    [state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { ApiError }
