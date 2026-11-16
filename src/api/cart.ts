import { api } from './client'
import type { CartItem, CartQuote } from '@/types'

export const cartApi = {
  quote: (items: CartItem[], couponCode?: string) =>
    api.post<CartQuote>('/cart/quote', { items, coupon_code: couponCode }),
}
