import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { queryClient } from './query'
import type { User } from '@/types'

export interface SessionContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  hydrated: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const SessionContext = createContext<SessionContextType | null>(null)

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

function readStoredSession() {
  const token = localStorage.getItem(TOKEN_KEY)
  const rawUser = localStorage.getItem(USER_KEY)
  if (!token || !rawUser) return { token: null, user: null as User | null }
  try {
    return { token, user: JSON.parse(rawUser) as User }
  } catch {
    return { token: null, user: null as User | null }
  }
}

export function clearSessionStorage() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = readStoredSession()
    setToken(stored.token)
    setUser(stored.user)
    setHydrated(true)

    const handleSessionExpired = (event: Event) => {
      clearSessionStorage()
      setToken(null)
      setUser(null)
      queryClient.clear()
      const detail = (event as CustomEvent<{ returnTo?: string }>).detail
      if (detail?.returnTo && !detail.returnTo.startsWith('/login')) {
        sessionStorage.setItem('auth_resume_to', detail.returnTo)
      }
      window.dispatchEvent(new Event('auth-logout'))
    }

    window.addEventListener('session-expired', handleSessionExpired)
    return () => window.removeEventListener('session-expired', handleSessionExpired)
  }, [])

  const login = (t: string, u: User) => {
    setToken(t)
    setUser(u)
    localStorage.setItem(TOKEN_KEY, t)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    clearSessionStorage()
    queryClient.clear()
    window.dispatchEvent(new Event('auth-logout'))
  }

  return (
    <SessionContext.Provider value={{ user, token, isAuthenticated: !!token, hydrated, login, logout }}>
      {children}
    </SessionContext.Provider>
  )
}

const fallbackSession: SessionContextType = {
  user: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,
  login: () => {},
  logout: () => {},
}

export const useSession = () => {
  const ctx = useContext(SessionContext)
  return ctx ?? fallbackSession
}