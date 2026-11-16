import { http, HttpResponse, delay } from 'msw'
import type { NFT, NFTListResponse, User, Order } from '@/types'
import { emitToAll, getSocketBroadcastDiagnostics, getSocketClientCount } from './socket'

const editions = ['Standard', 'Gold', 'Platinum'] as const

const NFTS: Array<NFT & { version: number }> = Array.from({ length: 24 }).map((_, i) => {
  const edition = editions[i % editions.length]
  const availability = i % 7 === 0 ? 0 : (i % 5) + 1
  const price = (0.25 + i * 0.13).toFixed(2)
  const ts = new Date(Date.now() - i * 3600000).toISOString()
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
    updated_at: ts,
    version: 1,
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
const orders = new Map<string, Order>()
const walletsByUser = new Map<string, any[]>([
  ['user-1', [{ id: 'w1', address: '0xabc123def4567890abc123def4567890abcd', network: 'Ethereum', is_primary: true, label: 'Principal' }]],
])

const testControls = {
  favoriteFail: 0,
  auth401: false,
  orderCreateTimeout: 0,
  orderCreateFail: 0,
}

function getUserId(request: Request) {
  if (testControls.auth401) return null
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
    if (testControls.favoriteFail > 0) {
      testControls.favoriteFail -= 1
      await delay(150)
      return HttpResponse.json({ message: 'Falha simulada' }, { status: 500 })
    }
    const set = favoritesByUser.get(userId) ?? new Set<string>()
    set.add(String(params.id))
    favoritesByUser.set(userId, set)
    await delay(150)
    return HttpResponse.json({ success: true })
  }),

  http.delete('/api/nfts/:id/favorite', async ({ params, request }) => {
    const userId = getUserId(request)
    if (!userId) return new HttpResponse(null, { status: 401 })
    if (testControls.favoriteFail > 0) {
      testControls.favoriteFail -= 1
      await delay(150)
      return HttpResponse.json({ message: 'Falha simulada' }, { status: 500 })
    }
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
  http.patch('/api/auth/profile', async ({ request }) => {
    const userId = getUserId(request)
    if (!userId) return new HttpResponse(null, { status: 401 })
    const body = (await request.json()) as Partial<User>
    Object.assign(MOCK_USER, body, { updated_at: new Date().toISOString() } as any)
    await delay(200)
    return HttpResponse.json(MOCK_USER)
  }),
  http.post('/api/auth/change-password', async ({ request }) => {
    const userId = getUserId(request)
    if (!userId) return new HttpResponse(null, { status: 401 })
    const body = (await request.json()) as { currentPassword?: string; newPassword?: string }
    await delay(200)
    if (body.currentPassword !== 'password123') {
      return HttpResponse.json({ message: 'Senha atual incorreta' }, { status: 400 })
    }
    if (!body.newPassword || body.newPassword.length < 6) {
      return HttpResponse.json({ message: 'Nova senha inválida' }, { status: 400 })
    }
    return HttpResponse.json({ success: true })
  }),

  http.post('/api/orders', async ({ request }) => {
    const body = (await request.json()) as {
      items?: any[]
      coupon_code?: string
      idempotency_key?: string
      wallet_id?: string
      network?: string
    }
    const shouldTimeout = testControls.orderCreateTimeout > 0
    const shouldFail = testControls.orderCreateFail > 0
    if (shouldTimeout) testControls.orderCreateTimeout -= 1
    if (shouldFail) testControls.orderCreateFail -= 1

    if (body.idempotency_key) {
      for (const o of orders.values()) {
        if ((o as any).idempotency_key === body.idempotency_key) {
          return HttpResponse.json(o)
        }
      }
    }
    await delay(400)

    const quoteItems = (body.items ?? [])
      .map((it: any) => {
        const nft = NFTS.find((n) => n.id === it.nft_id)
        if (!nft) return null
        const qty = Math.max(0, Math.min(it.quantity || 0, nft.availability))
        // simulate availability impact on order creation (pending reservation) and emit update
        nft.availability = Math.max(0, nft.availability - qty)
        nft.updated_at = new Date().toISOString()
        nft.version = (nft.version || 1) + 1
        emitToAll('nft.updated', {
          id: nft.id,
          price: nft.price,
          availability: nft.availability,
          updated_at: nft.updated_at,
          version: nft.version,
        })
        return {
          nft_id: nft.id,
          edition: nft.edition,
          quantity: qty,
          price_at_add: nft.price,
        }
      })
      .filter(Boolean) as any[]

    const subtotalNum = quoteItems.reduce((sum, it) => {
      const nft = NFTS.find((n) => n.id === it.nft_id)
      return sum + Number(nft?.price || 0) * it.quantity
    }, 0)
    let discountNum = 0
    const code = (body.coupon_code || '').trim().toUpperCase()
    if (code === 'JUNGLE20') discountNum = subtotalNum * 0.2
    const networkFeeNum = subtotalNum > 0 ? 0.01 : 0
    const totalNum = Math.max(0, subtotalNum - discountNum + networkFeeNum)

    if (shouldFail) {
      return HttpResponse.json({ message: 'Falha simulada ao criar pedido' }, { status: 500 })
    }

    const order: any = {
      id: `order-${Date.now()}`,
      status: 'pending',
      items: quoteItems,
      subtotal: subtotalNum.toFixed(2),
      discount: discountNum.toFixed(2),
      network_fee: networkFeeNum.toFixed(2),
      total: totalNum.toFixed(2),
      coupon_code: code || undefined,
      idempotency_key: body.idempotency_key,
      wallet_id: body.wallet_id,
      network: body.network,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    orders.set(order.id, order)
    emitToAll('order.updated', { orderId: order.id, status: order.status, updated_at: order.updated_at })
    if (shouldTimeout) {
      // simulate timeout after server-side creation to allow idempotent recovery on retry
      await delay(500)
      return HttpResponse.json({ message: 'Timeout simulado', orderId: order.id }, { status: 504 })
    }
    return HttpResponse.json(order)
  }),

  http.get('/api/orders/:id', ({ params }) => {
    const existing = orders.get(String(params.id))
    if (existing) return HttpResponse.json(existing)
    return HttpResponse.json({
      id: params.id,
      status: 'confirmed',
      items: [],
      subtotal: '1.50',
      discount: '0.00',
      network_fee: '0.01',
      total: '1.51',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),

  http.post('/api/orders/:id/confirm', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json().catch(() => ({}))) as { idempotency_key?: string }
    const existing = orders.get(id)
    if (existing) {
      if (existing.status === 'confirmed' || existing.status === 'refused' || (existing as any).status === 'cancelled') {
        return HttpResponse.json(existing)
      }
      existing.status = 'confirmed'
      existing.transaction_hash = existing.transaction_hash || `0x${id.replace(/[^a-z0-9]/gi, '')}abcd`
      existing.updated_at = new Date().toISOString()
      orders.set(id, existing)
      emitToAll('order.updated', { orderId: id, status: existing.status, updated_at: existing.updated_at })
      return HttpResponse.json(existing)
    }
    const fallback: any = {
      id,
      status: 'confirmed',
      items: [],
      subtotal: '0.00',
      discount: '0.00',
      network_fee: '0.00',
      total: '0.00',
      transaction_hash: body.idempotency_key || `0x${id}abcd`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    orders.set(id, fallback)
    emitToAll('order.updated', { orderId: id, status: fallback.status, updated_at: fallback.updated_at })
    return HttpResponse.json(fallback)
  }),

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

  http.get('/api/auth/wallets', ({ request }) => {
    const userId = getUserId(request)
    if (!userId) return new HttpResponse(null, { status: 401 })
    return HttpResponse.json({ wallets: walletsByUser.get(userId) ?? [] })
  }),
  http.post('/api/auth/wallets', async ({ request }) => {
    const userId = getUserId(request)
    if (!userId) return new HttpResponse(null, { status: 401 })
    const body = (await request.json()) as any
    const list = walletsByUser.get(userId) ?? []
    const wallet = { id: `w-${Date.now()}`, is_primary: false, ...body }
    if (wallet.is_primary) {
      for (const w of list) w.is_primary = false
    }
    list.push(wallet)
    walletsByUser.set(userId, list)
    return HttpResponse.json({ success: true, wallet })
  }),
  http.patch('/api/auth/wallets/:id', async ({ request, params }) => {
    const userId = getUserId(request)
    if (!userId) return new HttpResponse(null, { status: 401 })
    const body = (await request.json()) as any
    const list = walletsByUser.get(userId) ?? []
    const idx = list.findIndex((w) => w.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    if (body.is_primary) for (const w of list) w.is_primary = false
    list[idx] = { ...list[idx], ...body }
    walletsByUser.set(userId, list)
    return HttpResponse.json({ success: true, wallet: list[idx] })
  }),

  // Test-control helpers (mock/demo determinism)
  http.post('/api/__test/control', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as any
    if (Object.prototype.hasOwnProperty.call(body, 'auth401')) testControls.auth401 = !!body.auth401
    if (typeof body.favoriteFail === 'number') testControls.favoriteFail = body.favoriteFail
    if (typeof body.orderCreateTimeout === 'number') testControls.orderCreateTimeout = body.orderCreateTimeout
    if (typeof body.orderCreateFail === 'number') testControls.orderCreateFail = body.orderCreateFail
    const { getSocketDiagnostics } = await import('@/lib/socket')
    return HttpResponse.json({
      ok: true,
      testControls: { ...testControls },
      connectedClients: getSocketClientCount(),
      socketClient: getSocketDiagnostics(),
      lastBroadcast: getSocketBroadcastDiagnostics(),
    })
  }),
  http.post('/api/__test/nft-update', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as any
    const nft = NFTS.find((n) => n.id === body.id)
    if (!nft) return HttpResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
    if (typeof body.price === 'string') nft.price = body.price
    if (typeof body.availability === 'number') nft.availability = body.availability
    nft.updated_at = body.updated_at || new Date().toISOString()
    nft.version = typeof body.version === 'number' ? body.version : (nft.version || 1) + 1
    const payload = {
      id: nft.id,
      price: nft.price,
      availability: nft.availability,
      updated_at: nft.updated_at,
      version: nft.version,
      ...(body.extra || {}),
    }
    emitToAll('nft.updated', payload)
    return HttpResponse.json({ ok: true, payload })
  }),
  http.post('/api/__test/order-event', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as any
    const payload = {
      orderId: body.orderId || body.id,
      status: body.status || 'pending',
      updated_at: body.updated_at || new Date().toISOString(),
      ...(typeof body.version === 'number' ? { version: body.version } : {}),
      ...(body.extra || {}),
    }
    if (payload.orderId) {
      const existing = orders.get(String(payload.orderId))
      if (existing && body.mutate !== false) {
        ;(existing as any).status = payload.status
        ;(existing as any).updated_at = payload.updated_at
        orders.set(String(payload.orderId), existing)
      }
    }
    emitToAll('order.updated', payload)
    return HttpResponse.json({ ok: true, payload })
  }),
]
