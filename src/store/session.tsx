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
      const returnTo = detail?.returnTo && !detail.returnTo.startsWith('/login') ? detail.returnTo : undefined
      if (returnTo) {
        sessionStorage.setItem('auth_resume_to', returnTo)
      }
      window.dispatchEvent(new Event('auth-logout'))
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        const target = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : '/login'
        window.location.assign(target)
      }
    }

    window.addEventListener('session-expired', handleSessionExpired)
    return () => window.removeEventListener('session-expired', handleSessionExpired)
  }, [])

  // Detect a session that was cleared outside the app (another tab, devtools or
  // a stale token removal) and route through the same expiry flow, preserving
  // the current location so the user can resume after signing in again.
  useEffect(() => {
    if (!token || !user) return
    const interval = window.setInterval(() => {
      const stored = readStoredSession()
      if (!stored.token || !stored.user) {
        window.dispatchEvent(
          new CustomEvent('session-expired', {
            detail: {
              returnTo: `${window.location.pathname}${window.location.search}${window.location.hash}`,
            },
          }),
        )
      }
    }, 750)
    return () => window.clearInterval(interval)
  }, [token, user])

  const login = (t: string, u: User) => {
    const previousUserId = user?.id ?? readStoredSession().user?.id
    // Treat every successful login as an auth boundary, including a fresh
    // login after logout where the previous in-memory identity is already null.
    queryClient.clear()
    if (previousUserId && previousUserId !== u.id) window.dispatchEvent(new Event('auth-user-changed'))
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
