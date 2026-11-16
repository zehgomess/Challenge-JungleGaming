import { redirect } from '@tanstack/react-router'

const RESUME_KEY = 'auth_resume_to'

export function saveResumePath(path: string) {
  if (path && !path.startsWith('/login') && !path.startsWith('/register')) {
    sessionStorage.setItem(RESUME_KEY, path)
  }
}

export function consumeResumePath() {
  const value = sessionStorage.getItem(RESUME_KEY)
  if (value) sessionStorage.removeItem(RESUME_KEY)
  return value
}

export function requireAuth(pathname: string) {
  const token = localStorage.getItem('auth_token')
  if (!token) {
    saveResumePath(pathname)
    throw redirect({
      to: '/login',
      search: { returnTo: pathname },
    })
  }
}
