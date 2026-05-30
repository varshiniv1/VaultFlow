'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { login as apiLogin, logout as apiLogout, restoreSession } from './api'

interface AuthContextType {
  user: string | null
  isAdmin: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null, isAdmin: false, isLoading: true,
  login: async () => {}, logout: async () => {},
})

function decodePayload(token: string): { sub?: string; email?: string; role?: string } {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return {}
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<string | null>(null)
  const [isAdmin, setIsAdmin]   = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  function applyToken(token: string) {
    const payload = decodePayload(token)
    setUser(payload.sub ?? payload.email ?? 'user')
    setIsAdmin(payload.role === 'ADMIN')
  }

  // Restore session from stored refresh token on first load
  useEffect(() => {
    restoreSession()
      .then((token) => {
        if (token) applyToken(token)
        // token === null → user stays null → dashboard layout redirects to /login
      })
      .finally(() => setIsLoading(false))
  }, [])

  // Listen for session-expired event fired by apiFetch (single source of truth)
  useEffect(() => {
    function handleSessionExpired() {
      setUser(null)
      // Hard redirect so all module-level token state is reset
      window.location.href = '/login'
    }
    window.addEventListener('vf:session-expired', handleSessionExpired)
    return () => window.removeEventListener('vf:session-expired', handleSessionExpired)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password)
    applyToken(data.token)
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
    setIsAdmin(false)
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
