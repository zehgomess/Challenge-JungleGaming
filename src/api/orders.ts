import { api } from './client'
import type { Order, CartItem } from '@/types'

export const orderApi = {
  create: (payload: {
    items: CartItem[]
    coupon_code?: string
    idempotency_key?: string
    wallet_id?: string
    network?: string
  }) => api.post<Order>('/orders', payload),

  get: (id: string) => api.get<Order>(`/orders/${id}`),

  confirm: (id: string, payload: { idempotency_key?: string } = {}) =>
    api.post<Order>(`/orders/${id}/confirm`, payload),

  cancel: (id: string) => api.post<Order>(`/orders/${id}/cancel`),
}