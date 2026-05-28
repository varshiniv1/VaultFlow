'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { login as apiLogin, logout as apiLogout, restoreSession } from './api'

interface AuthContextType {
  user: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session from stored refresh token on first load
  useEffect(() => {
    restoreSession()
      .then((token) => {
        if (token) {
          // Decode email from JWT payload (no library needed)
          try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            setUser(payload.sub ?? payload.email ?? 'user')
          } catch {
            setUser('user')
          }
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await apiLogin(email, password)
    setUser(email)
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
