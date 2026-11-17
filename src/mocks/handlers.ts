import { http, HttpResponse, delay } from 'msw'
import type { NFT, NFTListResponse, User, Order } from '@/types'
import {
  disconnectSocketClients,
  emitToAll,
  emitToUser,
  getSocketBroadcastDiagnostics,
  getSocketClientCount,
} from './socket'

const editions = ['Standard', 'Gold', 'Platinum'] as const

function createNftArtwork(index: number) {
  const hue = (index * 47 + 132) % 360
  const accentHue = (hue + 58) % 360
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="hsl(${hue} 64% 16%)"/>
          <stop offset="1" stop-color="hsl(${accentHue} 67% 38%)"/>
        </linearGradient>
        <radialGradient id="glow">
          <stop stop-color="hsl(${accentHue} 95% 78%)" stop-opacity=".72"/>
          <stop offset="1" stop-color="hsl(${accentHue} 95% 78%)" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="600" height="600" fill="url(#bg)"/>
      <circle cx="${170 + (index * 29) % 260}" cy="${175 + (index * 37) % 230}" r="190" fill="url(#glow)"/>
      <path d="M0 430 Q150 320 300 430 T600 420 V600 H0Z" fill="#071512" fill-opacity=".48"/>
      <path d="M85 390 Q105 230 205 170 Q190 285 135 400Z" fill="#86efac" fill-opacity=".42"/>
      <path d="M515 390 Q495 230 395 170 Q410 285 465 400Z" fill="#86efac" fill-opacity=".34"/>
      <path d="M300 145 410 300 300 455 190 300Z" fill="none" stroke="#f0fdf4" stroke-opacity=".85" stroke-width="5"/>
      <path d="M300 182 382 300 300 418 218 300Z" fill="#d9f99d" fill-opacity=".22" stroke="#d9f99d" stroke-opacity=".75" stroke-width="3"/>
      <circle cx="300" cy="300" r="28" fill="#fef9c3" fill-opacity=".88"/>
      <text x="300" y="514" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="700" letter-spacing="6">JUNGLE</text>
      <text x="300" y="550" fill="#fff" fill-opacity=".8" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" letter-spacing="3">COLLECTIBLE #${index}</text>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const NFTS: Array<NFT & { version: number }> = Array.from({ length: 24 }).map((_, i) => {
  const edition = editions[i % editions.length]
  const availability = i % 7 === 0 ? 0 : (i % 5) + 1
  const price = (0.25 + i * 0.13).toFixed(2)
  const ts = new Date(Date.now() - i * 3600000).toISOString()
  return {
    id: `nft-${i + 1}`,
    name: `Crypto Jungle #${i + 1}`,
    description: `Colecionável da série Jungle (${edition}) com raridade e utilidade no ecossistema.`,
    image:
      i < 4
        ? `/artworks/${['emerald-ape-042', 'violet-nomad-314', 'ivory-baron-008', 'golden-beat-207'][i]}.webp`
        : createNftArtwork(i + 1),
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

type MockCredential = { passwordSalt: string; passwordHash: string; token: string; userId: string }

async function hashPassword(password: string, salt: string) {
  const encoded = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function createPasswordSalt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const usersById = new Map<string, User>([[MOCK_USER.id, MOCK_USER]])
const userIdByToken = new Map<string, string>([['mock-token-123', MOCK_USER.id]])
const credentialsByEmail = new Map<string, MockCredential>([
  [
    'collector@jungle.io',
    {
      passwordSalt: 'demo-user-1',
      passwordHash: '220a1cda079f13126c25358fb9cd8e9bc15330d4a261d89e32281b419be5c397',
      token: 'mock-token-123',
      userId: MOCK_USER.id,
    },
  ],
])
let nextUserId = 2

const favoritesByUser = new Map<string, Set<string>>([['user-1', new Set(['nft-2'])]])
const orders = new Map<string, Order>()
const completedListSearches: Record<string, number> = {}
const listQueryDiagnostics = {
  started: {} as Record<string, number>,
  completed: {} as Record<string, number>,
  aborted: {} as Record<string, number>,
}
const walletsByUser = new Map<string, any[]>([
  ['user-1', [{ id: 'w1', address: '0xabc123def4567890abc123def4567890abcd', network: 'Ethereum', is_primary: true, label: 'Principal' }]],
])

const testControls = {
  favoriteFail: 0,
  auth401: false,
  nftGetFail: 0,
  nftListDelayBySearch: {} as Record<string, number>,
  orderCreateTimeout: 0,
  orderCreateFail: 0,
  orderConfirmPending: 0,
}

function getUserId(request: Request) {
  if (testControls.auth401) return null
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '')
  return userIdByToken.get(token) ?? null
}

function withFavoriteState(items: NFT[], userId: string | null) {
  const favs = userId ? favoritesByUser.get(userId) ?? new Set<string>() : new Set<string>()
  return items.map((n) => ({ ...n, is_favorited: favs.has(n.id) }))
}

export const handlers = [
  http.get('/api/nfts', async ({ request }) => {
    const url = new URL(request.url)
    const search = (url.searchParams.get('search') || '').toLowerCase().trim()
    const increment = (bucket: Record<string, number>) => {
      bucket[search] = (bucket[search] ?? 0) + 1
    }
    increment(listQueryDiagnostics.started)
    request.signal.addEventListener('abort', () => increment(listQueryDiagnostics.aborted), { once: true })
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
    await delay(testControls.nftListDelayBySearch[search] ?? 250)
    completedListSearches[search] = (completedListSearches[search] ?? 0) + 1
    increment(listQueryDiagnostics.completed)

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
    if (testControls.nftGetFail > 0) {
      testControls.nftGetFail -= 1
      return HttpResponse.json({ message: 'Falha simulada ao carregar NFT' }, { status: 503 })
    }
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
    const credentials = credentialsByEmail.get(body.email.toLowerCase())
    const passwordHash = credentials ? await hashPassword(body.password, credentials.passwordSalt) : ''
    if (credentials && passwordHash === credentials.passwordHash) {
      const user = usersById.get(credentials.userId)
      if (user) return HttpResponse.json({ token: credentials.token, user })
    }
    return new HttpResponse(null, { status: 401 })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string; name: string }
    await delay(300)
    const email = body.email.trim().toLowerCase()
    if (email === 'existing@jungle.io' || credentialsByEmail.has(email)) {
      return new HttpResponse(null, { status: 409 })
    }
    const id = `user-${nextUserId++}`
    const token = `mock-token-${id}`
    const user: User = {
      id,
      email,
      name: body.name,
      avatar: '',
      created_at: new Date().toISOString(),
    }
    usersById.set(id, user)
    userIdByToken.set(token, id)
    const passwordSalt = createPasswordSalt()
    const passwordHash = await hashPassword(body.password, passwordSalt)
    credentialsByEmail.set(email, { passwordSalt, passwordHash, token, userId: id })
    favoritesByUser.set(id, new Set())
    walletsByUser.set(id, [])
    return HttpResponse.json({ token, user })
  }),

  http.post('/api/auth/logout', () => HttpResponse.json({ success: true })),
  http.get('/api/auth/me', ({ request }) => {
    const userId = getUserId(request)
    if (!userId) return new HttpResponse(null, { status: 401 })
    const user = usersById.get(userId)
    if (!user) return new HttpResponse(null, { status: 401 })
    return HttpResponse.json(user)
  }),
  http.patch('/api/auth/profile', async ({ request }) => {
    const userId = getUserId(request)
    if (!userId) return new HttpResponse(null, { status: 401 })
    const body = (await request.json()) as Partial<User>
    const user = usersById.get(userId)
    if (!user) return new HttpResponse(null, { status: 401 })
    Object.assign(user, body, { updated_at: new Date().toISOString() } as any)
    await delay(200)
    return HttpResponse.json(user)
  }),
  http.post('/api/auth/change-password', async ({ request }) => {
    const userId = getUserId(request)
    if (!userId) return new HttpResponse(null, { status: 401 })
    const body = (await request.json()) as { currentPassword?: string; newPassword?: string }
    await delay(200)
    const user = usersById.get(userId)
    const credentials = user ? credentialsByEmail.get(user.email.toLowerCase()) : undefined
    if (!credentials) return new HttpResponse(null, { status: 401 })
    const currentPasswordHash = body.currentPassword
      ? await hashPassword(body.currentPassword, credentials.passwordSalt)
      : ''
    if (currentPasswordHash !== credentials.passwordHash) {
      return HttpResponse.json({ message: 'Senha atual incorreta' }, { status: 400 })
    }
    if (!body.newPassword || body.newPassword.length < 6) {
      return HttpResponse.json({ message: 'Nova senha inválida' }, { status: 400 })
    }
    credentials.passwordSalt = createPasswordSalt()
    credentials.passwordHash = await hashPassword(body.newPassword, credentials.passwordSalt)
    return HttpResponse.json({ success: true })
  }),

  http.post('/api/orders', async ({ request }) => {
    const userId = getUserId(request)
    if (!userId) return new HttpResponse(null, { status: 401 })
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
        if ((o as any).user_id === userId && (o as any).idempotency_key === body.idempotency_key) {
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
      user_id: userId,
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
    emitToUser(userId, 'order.updated', { orderId: order.id, userId, status: order.status, updated_at: order.updated_at })
    if (shouldTimeout) {
      // simulate timeout after server-side creation to allow idempotent recovery on retry
      await delay(500)
      return HttpResponse.json({ message: 'Timeout simulado', orderId: order.id }, { status: 504 })
    }
    return HttpResponse.json(order)
  }),

  http.get('/api/orders/:id', ({ params, request }) => {
    const userId = getUserId(request)
    if (!userId) return new HttpResponse(null, { status: 401 })
    const existing = orders.get(String(params.id))
    if (existing) {
      if ((existing as any).user_id !== userId) return new HttpResponse(null, { status: 404 })
      return HttpResponse.json(existing)
    }
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
    const userId = getUserId(request)
    if (!userId) return new HttpResponse(null, { status: 401 })
    const id = String(params.id)
    const body = (await request.json().catch(() => ({}))) as { idempotency_key?: string }
    const existing = orders.get(id)
    if (existing) {
      if ((existing as any).user_id !== userId) return new HttpResponse(null, { status: 404 })
      if (existing.status === 'confirmed' || existing.status === 'refused' || (existing as any).status === 'cancelled') {
        return HttpResponse.json(existing)
      }
      if (testControls.orderConfirmPending > 0) {
        testControls.orderConfirmPending -= 1
        return HttpResponse.json(existing)
      }
      existing.status = 'confirmed'
      existing.transaction_hash = existing.transaction_hash || `0x${id.replace(/[^a-z0-9]/gi, '')}abcd`
      existing.updated_at = new Date().toISOString()
      orders.set(id, existing)
      emitToUser(userId, 'order.updated', { orderId: id, userId, status: existing.status, updated_at: existing.updated_at })
      return HttpResponse.json(existing)
    }
    const fallback: any = {
      id,
      user_id: userId,
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
    emitToUser(userId, 'order.updated', { orderId: id, userId, status: fallback.status, updated_at: fallback.updated_at })
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
    if (typeof body.address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(body.address.trim())) {
      return HttpResponse.json({ message: 'Endereço de carteira inválido' }, { status: 400 })
    }
    const list = walletsByUser.get(userId) ?? []
    const wallet = { id: `w-${Date.now()}`, is_primary: false, ...body, address: body.address.trim() }
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
    if (body.address !== undefined && (typeof body.address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(body.address.trim()))) {
      return HttpResponse.json({ message: 'Endereço de carteira inválido' }, { status: 400 })
    }
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
    if (typeof body.nftGetFail === 'number') testControls.nftGetFail = body.nftGetFail
    if (body.nftListDelayBySearch && typeof body.nftListDelayBySearch === 'object') {
      testControls.nftListDelayBySearch = Object.fromEntries(
        Object.entries(body.nftListDelayBySearch)
          .filter(([, value]) => typeof value === 'number')
          .map(([key, value]) => [
            key.toLowerCase().trim(),
            Math.max(0, Math.min(5000, value as number)),
          ]),
      )
    }
    if (body.resetListQueryDiagnostics) {
      for (const bucket of Object.values(listQueryDiagnostics)) {
        for (const key of Object.keys(bucket)) delete bucket[key]
      }
      for (const key of Object.keys(completedListSearches)) delete completedListSearches[key]
    }
    if (typeof body.favoriteFail === 'number') testControls.favoriteFail = body.favoriteFail
    if (typeof body.orderCreateTimeout === 'number') testControls.orderCreateTimeout = body.orderCreateTimeout
    if (typeof body.orderCreateFail === 'number') testControls.orderCreateFail = body.orderCreateFail
    if (typeof body.orderConfirmPending === 'number') testControls.orderConfirmPending = body.orderConfirmPending
    const { getSocketDiagnostics } = await import('@/lib/socket')
    return HttpResponse.json({
      ok: true,
      testControls: { ...testControls },
      connectedClients: getSocketClientCount(),
      socketClient: getSocketDiagnostics(),
      lastBroadcast: getSocketBroadcastDiagnostics(),
      completedListSearches: { ...completedListSearches },
      listQueryDiagnostics: {
        started: { ...listQueryDiagnostics.started },
        completed: { ...listQueryDiagnostics.completed },
        aborted: { ...listQueryDiagnostics.aborted },
      },
    })
  }),
  http.post('/api/__test/socket-disconnect', () => {
    return HttpResponse.json({ ok: true, disconnected: disconnectSocketClients() })
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
    const orderId = body.orderId || body.id
    const existing = orderId ? orders.get(String(orderId)) : undefined
    const userId = (existing as any)?.user_id
    const payload = {
      orderId,
      ...(userId ? { userId } : {}),
      status: body.status || 'pending',
      updated_at: body.updated_at || new Date().toISOString(),
      ...(typeof body.version === 'number' ? { version: body.version } : {}),
      ...(body.extra || {}),
    }
    if (existing && body.mutate !== false) {
      ;(existing as any).status = payload.status
      ;(existing as any).updated_at = payload.updated_at
      orders.set(String(payload.orderId), existing)
    }
    if (userId) emitToUser(userId, 'order.updated', payload)
    return HttpResponse.json({ ok: true, payload })
  }),
]
