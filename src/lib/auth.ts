import { redirect } from '@tanstack/react-router'

export function requireAuth(pathname: string) {
  const token = localStorage.getItem('auth_token')
  if (!token) {
    throw redirect({
      to: '/login',
      search: { returnTo: pathname },
    })
  }
}
