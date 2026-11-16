import { api } from './client'
import type { User } from '@/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<{ token: string; user: User }>('/auth/login', credentials),

  register: (credentials: RegisterCredentials) =>
    api.post<{ token: string; user: User }>('/auth/register', credentials),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<User>('/auth/me'),

  updateProfile: (data: Partial<User>) => api.patch<User>('/auth/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),

  wallets: () => api.get<{ wallets: any[] }>('/auth/wallets'),

  addWallet: (wallet: { address: string; network: string; is_primary?: boolean; label?: string }) =>
    api.post('/auth/wallets', wallet),

  updateWallet: (id: string, wallet: { address?: string; network?: string; is_primary?: boolean; label?: string }) =>
    api.patch(`/auth/wallets/${id}`, wallet),
}