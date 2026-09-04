// Auth context — manages access/refresh tokens, customer profile, and auth
// state. Mirrors applications/frontend/web-user/src/lib/auth-context.tsx, adapted
// for React Native (AsyncStorage instead of localStorage, expo-router
// instead of TanStack Router).
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { apiClient, ApiError } from './api-client'

interface CustomerProfile {
  customer_id: string
  full_name: string
  email: string
  email_verified: boolean
  phone?: string | null
  phone_verified?: boolean
  preferred_language?: string | null
  created_at?: string | null
}

interface AuthState {
  access_token: string | null
  refresh_token: string | null
  customer: CustomerProfile | null
  loading: boolean
}

export interface RegisterData {
  full_name: string
  phone: string
  email: string
  password: string
  preferred_language?: string
  terms_accepted: boolean
  privacy_accepted: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, device_info?: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  requestOtp: (email: string) => Promise<string | null>
  verifyOtp: (email: string, code: string) => Promise<void>
  forgotPassword: (email: string) => Promise<string | null>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>
  updateProfile: (data: { full_name?: string; phone?: string; preferred_language?: string }) => Promise<void>
  logout: () => Promise<void>
  refreshAccessToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const TOKEN_STORAGE = 'fixo_auth'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    access_token: null,
    refresh_token: null,
    customer: null,
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
            customer: parsed.customer,
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
        JSON.stringify({ access_token: state.access_token, refresh_token: state.refresh_token, customer: state.customer }),
      ).catch(() => {})
    } else {
      AsyncStorage.removeItem(TOKEN_STORAGE).catch(() => {})
    }
  }, [state.access_token, state.refresh_token, state.customer])

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
        const resp = await apiClient.post('/auth/token/refresh', { refresh_token: state.refresh_token })
        const { access_token, refresh_token, customer } = resp.data
        apiClient.setAuthToken(access_token)
        setState((prev) => ({ ...prev, access_token, refresh_token, customer: prev.customer ?? customer }))
        return true
      } catch {
        setState({ access_token: null, refresh_token: null, customer: null, loading: false })
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
    const resp = await apiClient.post('/auth/login', { email, password, device_info })
    const { access_token, refresh_token, customer } = resp.data
    setState({ access_token, refresh_token, customer, loading: false })
  }

  const register = async (data: RegisterData) => {
    await apiClient.post('/auth/register', data)
    // Dev-mode OTP is returned but mobile doesn't gate on email verification —
    // log the fresh account straight in, same as a real first-run signup would
    // feel once verification is optional at login.
    await login(data.email, data.password)
  }

  const requestOtp = async (email: string): Promise<string | null> => {
    const resp = await apiClient.post('/auth/otp/request', { email })
    return resp.data.otp_code ?? null
  }

  const verifyOtp = async (email: string, code: string) => {
    await apiClient.post('/auth/otp/verify', { email, code })
  }

  const forgotPassword = async (email: string): Promise<string | null> => {
    const resp = await apiClient.post('/auth/password/forgot', { email })
    return resp.data.otp_code ?? null
  }

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    await apiClient.post('/auth/password/reset', { email, code, new_password: newPassword })
  }

  const updateProfile = async (data: { full_name?: string; phone?: string; preferred_language?: string }) => {
    const resp = await apiClient.patch('/auth/me', data)
    setState((prev) => ({ ...prev, customer: resp.data }))
  }

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // ignore — we're clearing local state regardless
    }
    setState({ access_token: null, refresh_token: null, customer: null, loading: false })
    router.replace('/auth')
  }

  const value = useMemo(
    () => ({ ...state, login, register, requestOtp, verifyOtp, forgotPassword, resetPassword, updateProfile, logout, refreshAccessToken }),
    [state],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { ApiError }
