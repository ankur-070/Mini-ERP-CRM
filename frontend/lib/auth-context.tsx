"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { authApi } from "@/lib/api/auth"
import {
  clearSession,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
  UNAUTHORIZED_EVENT,
} from "@/lib/api/client"
import type { LoginPayload, User } from "@/types/auth"

interface AuthContextValue {
  user: User | null
  status: "loading" | "authenticated" | "unauthenticated"
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading")
  const bootstrapped = useRef(false)

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    setStatus("unauthenticated")
    router.replace("/login")
  }, [router])

  // Restore session on startup: hydrate from storage, then validate via /auth/me.
  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    const token = getToken()
    if (!token) {
      setStatus("unauthenticated")
      return
    }

    const cached = getStoredUser<User>()
    if (cached) setUser(cached)

    authApi
      .me()
      .then(({ data }) => {
        setUser(data)
        setStoredUser(data)
        setStatus("authenticated")
      })
      .catch(() => {
        clearSession()
        setUser(null)
        setStatus("unauthenticated")
      })
  }, [])

  // Global 401 handler: any request that 401s clears the session.
  useEffect(() => {
    function onUnauthorized() {
      setUser(null)
      setStatus("unauthenticated")
      router.replace("/login")
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [router])

  const login = useCallback(async (payload: LoginPayload) => {
    const { data } = await authApi.login(payload)
    setToken(data.token)
    setStoredUser(data.user)
    setUser(data.user)
    setStatus("authenticated")
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout }),
    [user, status, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
