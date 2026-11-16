import { http, HttpResponse } from 'msw'
import type { NFT, User, Order } from '@/types'

// Mock data
const MOCK_NFTS: NFT[] = [
  {
    id: 'nft-1',
    name: 'Crypto Jungle #1',
    description: 'A rare NFT from the Jungle collection',
    image: 'https://picsum.photos/seed/nft1/400/400',
    edition: 'Standard',
    price: '0.5',
    availability: 10,
    total_supply: 100,
    creator: '0x1234...',
    royalties: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'nft-2',
    name: 'Crypto Jungle #2',
    description: 'Legendary jungle creature',
    image: 'https://picsum.photos/seed/nft2/400/400',
    edition: 'Gold',
    price: '1.2',
    availability: 3,
    total_supply: 50,
    creator: '0x5678...',
    royalties: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'nft-3',
    name: 'Crypto Jungle #3',
    description: 'Mythic jungle artifact',
    image: 'https://picsum.photos/seed/nft3/400/400',
    edition: 'Platinum',
    price: '2.5',
    availability: 1,
    total_supply: 10,
    creator: '0x9012...',
    royalties: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const MOCK_USER: User = {
  id: 'user-1',
  email: 'collector@jungle.io',
  name: 'Colecionador Jungle',
  avatar: 'https://picsum.photos/seed/avatar/200/200',
  created_at: new Date().toISOString(),
}

export const handlers = [
  // NFT catalog
  http.get('/api/nfts', () => {
    return HttpResponse.json<NFTListResponse>({
      items: MOCK_NFTS,
      total: MOCK_NFTS.length,
      page: 1,
      limit: 20,
      has_more: false,
    })
  }),

  // NFT detail
  http.get('/api/nfts/:id', ({ params }) => {
    const nft = MOCK_NFTS.find((n) => n.id === params.id)
    if (!nft) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(nft)
  }),

  // Favorite toggle
  http.post('/api/nfts/:id/favorite', () => {
    return HttpResponse.json({ success: true })
  }),

  http.delete('/api/nfts/:id/favorite', () => {
    return HttpResponse.json({ success: true })
  }),

  // Auth
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    if (body.email === 'collector@jungle.io' && body.password === 'password123') {
      return HttpResponse.json({ token: 'mock-token-123', user: MOCK_USER })
    }
    return new HttpResponse(null, { status: 401 })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string; name: string }
    if (body.email === 'existing@jungle.io') {
      return new HttpResponse(null, { status: 409 })
    }
    return HttpResponse.json({ token: 'mock-token-new', user: { ...MOCK_USER, email: body.email, name: body.name } })
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true })
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json(MOCK_USER)
  }),

  // Orders
  http.post('/api/orders', async ({ request }) => {
    const body = (await request.json()) as { items: any[] }
    const order: Order = {
      id: `order-${Date.now()}`,
      status: 'pending',
      items: body.items,
      subtotal: '1.5',
      discount: '0',
      network_fee: '0.01',
      total: '1.51',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return HttpResponse.json(order)
  }),

  http.get('/api/orders/:id', () => {
    return HttpResponse.json({
      id: 'order-1',
      status: 'confirmed',
      items: [],
      subtotal: '1.5',
      discount: '0',
      network_fee: '0.01',
      total: '1.51',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  http.post('/api/orders/:id/confirm', () => {
    return HttpResponse.json({
      status: 'confirmed',
      transaction_hash: '0xmockhash123',
    })
  }),

  // Coupon validation
  http.post('/api/coupons/validate', async ({ request }) => {
    const body = (await request.json()) as { code: string }
    if (body.code === 'JUNGLE20') {
      return HttpResponse.json({ valid: true, discount_percentage: 20 })
    }
    if (body.code === 'EXPIRED') {
      return HttpResponse.json({ valid: false, error: 'Cupom expirado' })
    }
    return HttpResponse.json({ valid: false, error: 'Cupom inválido' })
  }),

  // Wallets
  http.get('/api/auth/wallets', () => {
    return HttpResponse.json({ wallets: [] })
  }),

  http.post('/api/auth/wallets', () => {
    return HttpResponse.json({ success: true })
  }),
]

export type { NFT, User, Order }

interface NFTListResponse {
  items: NFT[]
  total: number
  page: number
  limit: number
  has_more: boolean
}