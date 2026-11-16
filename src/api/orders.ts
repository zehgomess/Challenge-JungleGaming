import { api } from './client'
import type { Order, CartItem } from '@/types'

export const orderApi = {
  create: (items: CartItem[]) => api.post<Order>('/orders', { items }),

  get: (id: string) => api.get<Order>(`/orders/${id}`),

  confirm: (id: string) => api.post<Order>(`/orders/${id}/confirm`),

  cancel: (id: string) => api.post<Order>(`/orders/${id}/cancel`),
}