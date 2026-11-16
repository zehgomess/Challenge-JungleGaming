import { http, HttpResponse, delay } from 'msw'
import type { NFT, NFTListResponse, User, Order } from '@/types'

const editions = ['Standard', 'Gold', 'Platinum'] as const

const NFTS: NFT[] = Array.from({ length: 24 }).map((_, i) => {
  const edition = editions[i % editions.length]
  const availability = i % 7 === 0 ? 0 : (i % 5) + 1
  const price = (0.25 + i * 0.13).toFixed(2)
  return {
    id: `nft-${i + 1}`,
    name: `Crypto Jungle #${i + 1}`,
    description: `Colecionável da série Jungle (${edition}) com raridade e utilidade no ecossistema.`,
    image: `https://picsum.photos/seed/jungle-${i + 1}/600/600`,
    edition,
    price,
    availability,
    total_supply: 100,
    creator: `0x${(1000 + i).toString(16)}...abcd`,
    royalties: (i % 10) + 1,
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    updated_at: new Date(Date.now() - i * 3600000).toISOString(),
  }
})

const MOCK_USER: User = {
  id: 'user-1',
  email: 'collector@jungle.io',
  name: 'Colecionador Jungle',
  avatar: 'https://picsum.photos/seed/avatar/200/200',
  created_at: new Date().toISOString(),
}

const favoritesByUser = new Map<string, Set<string>>([['user-1', new Set(['nft-2'])]])

function getUserId(request: Request) {
  const auth = request.headers.get('authorization') || ''
  if (auth.includes('mock-token')) return 'user-1'
  return null
}

function withFavoriteState(items: NFT[], userId: string | null) {
  const favs = userId ? favoritesByUser.get(userId) ?? new Set<string>() : new Set<string>()
  return items.map((n) => ({ ...n, is_favorited: favs.has(n.id) }))
}

export const handlers = [
  http.get('/api/nfts', async ({ request }) => {
    const url = new URL(request.url)
    const search = (url.searchParams.get('search') || '').toLowerCase().trim()
    const edition = url.searchParams.get('edition')
    const availability = url.searchParams.get('availability')
    const sort = url.searchParams.get('sort') || 'recent'
    const order = url.searchParams.get('order') || 'desc'
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(24, Number(url.searchParams.get('limit') || '8')))

    let items = [...NFTS]
    if (search) {
      items = items.filter(
        (n) => n.name.toLowerCase().includes(search) || n.description.toLowerCase().includes(search),
      )
    }
    if (edition) items = items.filter((n) => n.edition === edition)
    if (availability === 'available') items = items.filter((n) => n.availability > 0)
    if (availability === 'soldout') items = items.filter((n) => n.availability === 0)

    items.sort((a, b) => {
      let cmp = 0
      if (sort === 'price') cmp = Number(a.price) - Number(b.price)
      else if (sort === 'name') cmp = a.name.localeCompare(b.name)
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return order === 'asc' ? cmp : -cmp
    })

    const total = items.length
    const start = (page - 1) * limit
    const paged = items.slice(start, start + limit)
    const userId = getUserId(request)
    await delay(250)

    const response: NFTListResponse = {
      items: withFavoriteState(paged, userId),
      total,
      page,
      limit,
      has_more: start + limit < total,
    }
    return HttpResponse.json(response)
  }),

  http.get('/api/nfts/:id', async ({ params, request }) => {
    await delay(200)
    const nft = NFTS.find((n) => n.id === params.id)
    if (!nft) return new HttpResponse(null, { status: 404 })
    const userId = getUserId(request)
    const [item] = withFavoriteState([nft], userId)
    return HttpResponse.json(item)
  }),

  http.post('/api/nfts/:id/favorite', async ({ params, request }) => {
    const userId = getUserId(request)
    if (!userId) return new HttpResponse(null, { status: 401 })
    const set = favoritesByUser.get(userId) ?? new Set<string>()
    set.add(String(params.id))
    favoritesByUser.set(userId, set)
    await delay(150)
    return HttpResponse.json({ success: true })
  }),

  http.delete('/api/nfts/:id/favorite', async ({ params, request }) => {
    const userId = getUserId(request)
    if (!userId) return new HttpResponse(null, { status: 401 })
    const set = favoritesByUser.get(userId) ?? new Set<string>()
    set.delete(String(params.id))
    favoritesByUser.set(userId, set)
    await delay(150)
    return HttpResponse.json({ success: true })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    await delay(300)
    if (body.email === 'collector@jungle.io' && body.password === 'password123') {
      return HttpResponse.json({ token: 'mock-token-123', user: MOCK_USER })
    }
    return new HttpResponse(null, { status: 401 })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string; name: string }
    await delay(300)
    if (body.email === 'existing@jungle.io') {
      return new HttpResponse(null, { status: 409 })
    }
    return HttpResponse.json({
      token: 'mock-token-new',
      user: { ...MOCK_USER, id: `user-${Date.now()}`, email: body.email, name: body.name },
    })
  }),

  http.post('/api/auth/logout', () => HttpResponse.json({ success: true })),
  http.get('/api/auth/me', ({ request }) => {
    const userId = getUserId(request)
    if (!userId) return new HttpResponse(null, { status: 401 })
    return HttpResponse.json(MOCK_USER)
  }),

  http.post('/api/orders', async ({ request }) => {
    const body = (await request.json()) as { items: any[] }
    await delay(300)
    const order: Order = {
      id: `order-${Date.now()}`,
      status: 'pending',
      items: body.items ?? [],
      subtotal: '1.50',
      discount: '0.00',
      network_fee: '0.01',
      total: '1.51',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return HttpResponse.json(order)
  }),

  http.get('/api/orders/:id', () =>
    HttpResponse.json({
      id: 'order-1',
      status: 'confirmed',
      items: [],
      subtotal: '1.50',
      discount: '0.00',
      network_fee: '0.01',
      total: '1.51',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  ),

  http.post('/api/orders/:id/confirm', () =>
    HttpResponse.json({ status: 'confirmed', transaction_hash: '0xmockhash123' }),
  ),

  http.post('/api/cart/quote', async ({ request }) => {
    const body = (await request.json()) as { items?: Array<{ nft_id: string; edition: string; quantity: number }>; coupon_code?: string }
    await delay(200)
    const items = (body.items ?? [])
      .map((it) => {
        const nft = NFTS.find((n) => n.id === it.nft_id)
        if (!nft) return null
        const available = nft.availability
        const qty = Math.max(0, Math.min(it.quantity || 0, Math.max(available, 0)))
        const unit = Number(nft.price)
        const line = unit * qty
        return {
          nft_id: nft.id,
          edition: nft.edition,
          quantity: qty,
          price_at_add: nft.price,
          name: nft.name,
          image: nft.image,
          max_availability: available,
          unit_price: nft.price,
          line_total: line.toFixed(2),
          available,
        }
      })
      .filter(Boolean) as any[]

    const subtotalNum = items.reduce((sum, it) => sum + Number(it.line_total), 0)
    let discountNum = 0
    let coupon_valid = false
    let coupon_error: string | undefined
    const code = (body.coupon_code || '').trim().toUpperCase()
    if (code) {
      if (code === 'JUNGLE20') {
        discountNum = subtotalNum * 0.2
        coupon_valid = true
      } else if (code === 'EXPIRED') {
        coupon_error = 'Cupom expirado'
      } else {
        coupon_error = 'Cupom inválido'
      }
    }
    const networkFeeNum = subtotalNum > 0 ? 0.01 : 0
    const totalNum = Math.max(0, subtotalNum - discountNum + networkFeeNum)
    return HttpResponse.json({
      items,
      subtotal: subtotalNum.toFixed(2),
      discount: discountNum.toFixed(2),
      network_fee: networkFeeNum.toFixed(2),
      total: totalNum.toFixed(2),
      coupon_code: code || undefined,
      coupon_valid: code ? coupon_valid : undefined,
      coupon_error,
    })
  }),

  http.post('/api/coupons/validate', async ({ request }) => {
    const body = (await request.json()) as { code: string }
    await delay(200)
    if (body.code === 'JUNGLE20') return HttpResponse.json({ valid: true, discount_percentage: 20 })
    if (body.code === 'EXPIRED') return HttpResponse.json({ valid: false, error: 'Cupom expirado' })
    return HttpResponse.json({ valid: false, error: 'Cupom inválido' })
  }),

  http.get('/api/auth/wallets', () => HttpResponse.json({ wallets: [] })),
  http.post('/api/auth/wallets', () => HttpResponse.json({ success: true })),
]