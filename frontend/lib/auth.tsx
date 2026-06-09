'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

export type Role = 'agent' | 'admin'
export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  plan_id?: string
  company?: string
  avatar?: string | null
}

interface AuthState {
  user: SessionUser | null
  ready: boolean
  login: (user: SessionUser) => void
  logout: () => void
}

const AuthContext = React.createContext<AuthState | null>(null)
const STORAGE_KEY = 'invitepro.session'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<SessionUser | null>(null)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch {
      /* ignore */
    }
    setReady(true)
  }, [])

  const login = React.useCallback((u: SessionUser) => {
    setUser(u)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    } catch {
      /* ignore */
    }
  }, [])

  const logout = React.useCallback(() => {
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/** Redirects to /login if no session, or to the wrong-role home. */
export function useRequireRole(role: Role) {
  const { user, ready } = useAuth()
  const router = useRouter()
  React.useEffect(() => {
    if (!ready) return
    if (!user) {
      router.replace('/login')
    } else if (user.role !== role) {
      router.replace(user.role === 'admin' ? '/admin' : '/app')
    }
  }, [ready, user, role, router])
  return { user, ready }
}
