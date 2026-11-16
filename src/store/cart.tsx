import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartItem } from '@/types'
import { useSession } from './session'

interface CartContextType {
  items: CartItem[]
  couponCode?: string
  addItem: (item: CartItem) => void
  updateQuantity: (nftId: string, edition: string, quantity: number) => void
  removeItem: (nftId: string, edition: string) => void
  removePurchased: (purchased: Array<{ nft_id: string; edition: string; quantity: number }>) => void
  clear: () => void
  setCouponCode: (code?: string) => void
}

const CartContext = createContext<CartContextType | null>(null)

const VISITOR_KEY = 'cart:visitor'

function cartKey(userId?: string | null) {
  return userId ? `cart:user:${userId}` : VISITOR_KEY
}

function readCart(key: string): { items: CartItem[]; couponCode?: string } {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return { items: [] }
    const parsed = JSON.parse(raw)
    return { items: Array.isArray(parsed.items) ? parsed.items : [], couponCode: parsed.couponCode }
  } catch {
    return { items: [] }
  }
}

function writeCart(key: string, data: { items: CartItem[]; couponCode?: string }) {
  localStorage.setItem(key, JSON.stringify(data))
}

function mergeItems(base: CartItem[], incoming: CartItem[]) {
  const map = new Map<string, CartItem>()
  for (const it of [...base, ...incoming]) {
    const k = `${it.nft_id}::${it.edition}`
    const prev = map.get(k)
    if (!prev) {
      map.set(k, { ...it })
    } else {
      const max = Math.max(prev.max_availability ?? 999, it.max_availability ?? 999)
      map.set(k, {
        ...prev,
        ...it,
        quantity: Math.min(prev.quantity + it.quantity, max),
        max_availability: max,
      })
    }
  }
  return Array.from(map.values())
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useSession()
  const userId = user?.id
  const [items, setItems] = useState<CartItem[]>([])
  const [couponCode, setCouponCodeState] = useState<string | undefined>()

  // load & merge on auth changes
  useEffect(() => {
    if (isAuthenticated && userId) {
      const visitor = readCart(VISITOR_KEY)
      const userCart = readCart(cartKey(userId))
      const mergedItems = mergeItems(userCart.items, visitor.items)
      const mergedCoupon = userCart.couponCode ?? visitor.couponCode
      setItems(mergedItems)
      setCouponCodeState(mergedCoupon)
      writeCart(cartKey(userId), { items: mergedItems, couponCode: mergedCoupon })
      localStorage.removeItem(VISITOR_KEY)
    } else {
      const stored = readCart(VISITOR_KEY)
      setItems(stored.items)
      setCouponCodeState(stored.couponCode)
    }
  }, [isAuthenticated, userId])

  useEffect(() => {
    const key = cartKey(isAuthenticated ? userId : null)
    writeCart(key, { items, couponCode })
  }, [items, couponCode, isAuthenticated, userId])

  const value = useMemo<CartContextType>(
    () => ({
      items,
      couponCode,
      addItem: (item) => {
        setItems((prev) => {
          const idx = prev.findIndex((p) => p.nft_id === item.nft_id && p.edition === item.edition)
          if (idx === -1) return [...prev, item]
          const next = [...prev]
          const existing = next[idx]
          const max = item.max_availability ?? existing.max_availability ?? 999
          next[idx] = {
            ...existing,
            ...item,
            quantity: Math.min(existing.quantity + item.quantity, max),
            max_availability: max,
          }
          return next
        })
      },
      updateQuantity: (nftId, edition, quantity) => {
        setItems((prev) =>
          prev
            .map((it) => {
              if (it.nft_id !== nftId || it.edition !== edition) return it
              const max = it.max_availability ?? 999
              return { ...it, quantity: Math.max(1, Math.min(quantity, max)) }
            })
            .filter((it) => it.quantity > 0),
        )
      },
      removeItem: (nftId, edition) => {
        setItems((prev) => prev.filter((it) => !(it.nft_id === nftId && it.edition === edition)))
      },
      removePurchased: (purchased) => {
        setItems((prev) => {
          const next = [...prev]
          for (const p of purchased) {
            const idx = next.findIndex((it) => it.nft_id === p.nft_id && it.edition === p.edition)
            if (idx === -1) continue
            const remaining = next[idx].quantity - p.quantity
            if (remaining > 0) next[idx] = { ...next[idx], quantity: remaining }
            else next.splice(idx, 1)
          }
          return next
        })
      },
      clear: () => {
        setItems([])
        setCouponCodeState(undefined)
      },
      setCouponCode: (code) => setCouponCodeState(code?.trim() || undefined),
    }),
    [items, couponCode],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
