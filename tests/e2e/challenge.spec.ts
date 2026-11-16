import { test, expect, type Page } from 'playwright/test'

async function login(page: Page, email = 'collector@jungle.io', password = 'password123') {
  await page.goto('/login')
  await page.getByLabel(/E-mail/i).fill(email)
  await page.getByLabel(/^Senha$/i).fill(password)
  await page.getByRole('button', { name: /^Entrar$/i }).click()
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 })
}

test('detail: direct access and not found', async ({ page }) => {
  await page.goto('/nfts/nft-2')
  await expect(page.getByText(/Crypto Jungle #2/i).first()).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('button', { name: /Adicionar ao carrinho|Edição indisponível/i })).toBeVisible()

  await page.goto('/nfts/does-not-exist')
  await expect(
    page.getByText(/não encontrado|inexistente|404|erro/i).first(),
  ).toBeVisible({ timeout: 15000 })
})

test('detail: recover from a transient API failure with retry', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Marketplace de NFTs/i })).toBeVisible()
  await page.evaluate(() =>
    fetch('/api/__test/control', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // Query retries three times automatically; fail all four initial attempts.
      body: JSON.stringify({ nftGetFail: 4 }),
    }),
  )

  await page.getByRole('link', { name: /Crypto Jungle #2/i }).first().evaluate((element) =>
    (element as HTMLAnchorElement).click(),
  )
  await expect(page.getByRole('heading', { name: /Erro ao carregar NFT/i })).toBeVisible({
    timeout: 15000,
  })
  await page.getByRole('button', { name: /Tentar novamente/i }).click()
  await expect(page.getByRole('heading', { name: /Crypto Jungle #2/i })).toBeVisible({
    timeout: 15000,
  })
  await expect(page.getByRole('button', { name: /Adicionar ao carrinho/i })).toBeVisible()
})

test('register: validation and conflict', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel(/Nome completo/i).fill('A')
  await page.getByLabel(/E-mail/i).fill('bad-email')
  await page.getByLabel(/^Senha$/i).fill('123')
  await page.getByLabel(/Confirmar senha/i).fill('456')
  await page.getByRole('button', { name: /Criar conta/i }).click()
  await page.waitForTimeout(500)
  // Client-side validation should prevent success/navigation away
  await expect(page).toHaveURL(/\/register/)

  await page.getByLabel(/Nome completo/i).fill('Novo Usuário')
  await page.getByLabel(/E-mail/i).fill('existing@jungle.io')
  await page.getByLabel(/^Senha$/i).fill('password123')
  await page.getByLabel(/Confirmar senha/i).fill('password123')
  await page.getByRole('button', { name: /Criar conta/i }).click()
  await expect(page.getByText(/já cadastrado|conflito|erro|cadastrado/i).first()).toBeVisible({ timeout: 15000 })
})

test('session: logout and protected route redirect', async ({ page }) => {
  await login(page)
  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: /Perfil do colecionador/i })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /Sair|Logout/i }).click()
  await page.goto('/wallets')
  await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
})

test('session: switching accounts clears cached favorites and keeps user data isolated', async ({ page }) => {
  await login(page)
  await page.goto('/nfts/nft-3')
  const favorite = page.getByRole('button', { name: /Favoritar|Favoritado/i })
  await expect(favorite).toHaveText(/Favoritar/i)
  await favorite.click()
  await expect(page.getByRole('button', { name: /Favoritado/i })).toBeVisible({ timeout: 15000 })

  const firstOrder = await page.evaluate(async () => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: [{ nft_id: 'nft-2', edition: 'Gold', quantity: 1, price_at_add: '0.38' }],
        idempotency_key: `user-one-${Date.now()}`,
      }),
    })
    return response.json()
  })
  expect(firstOrder.user_id).toBe('user-1')

  await page.getByRole('button', { name: /Sair/i }).click()
  await page.getByRole('link', { name: /Cadastro/i }).click()
  const email = `second-${Date.now()}@jungle.io`
  await page.getByLabel(/Nome completo/i).fill('Segundo Colecionador')
  await page.getByLabel(/E-mail/i).fill(email)
  await page.getByLabel(/^Senha$/i).fill('password456')
  await page.getByLabel(/Confirmar senha/i).fill('password456')
  await page.getByRole('button', { name: /Criar conta/i }).click()
  await expect(page).not.toHaveURL(/\/register/, { timeout: 15000 })

  await page.getByRole('link', { name: /Crypto Jungle #3/i }).first().click()
  const switchedFavorite = await page.evaluate(async () => {
    const response = await fetch('/api/nfts/nft-3')
    return response.json()
  })
  expect(switchedFavorite.is_favorited).toBe(false)
  await expect(page.getByRole('button', { name: /^Favoritar$/i })).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('button', { name: /^Favoritado$/i })).toHaveCount(0)

  await page.getByRole('link', { name: /Carteiras/i }).click()
  await expect(page.getByText(/Nenhuma carteira cadastrada/i)).toBeVisible({ timeout: 15000 })

  await page.evaluate((orderId) =>
    fetch('/api/__test/order-event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orderId, status: 'confirmed' }),
    }), firstOrder.id)
  const foreignEvent = await page.evaluate(async () => {
    const response = await fetch('/api/__test/control', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    return response.json()
  })
  expect(foreignEvent.lastBroadcast).toMatchObject({ event: 'order.updated', clients: 0, sent: 0 })
  await expect(page.getByText(/Pedido confirmado em tempo real/i)).toHaveCount(0)

  const secondOrder = await page.evaluate(async () => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: [{ nft_id: 'nft-3', edition: 'Platinum', quantity: 1, price_at_add: '0.51' }],
        idempotency_key: `user-two-${Date.now()}`,
      }),
    })
    return response.json()
  })
  expect(secondOrder.user_id).not.toBe(firstOrder.user_id)
  await page.evaluate((orderId) =>
    fetch('/api/__test/order-event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orderId, status: 'confirmed' }),
    }), secondOrder.id)
  const ownEvent = await page.evaluate(async () => {
    const response = await fetch('/api/__test/control', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    return response.json()
  })
  expect(ownEvent.lastBroadcast).toMatchObject({ event: 'order.updated', clients: 1, sent: 1 })
  await expect(page.getByText(/Pedido confirmado em tempo real/i)).toBeVisible({ timeout: 15000 })
})

test('cart: invalid/expired coupon feedback and persistence after refresh', async ({ page }) => {
  await page.goto('/nfts/nft-2')
  await expect(page.getByRole('button', { name: /Adicionar ao carrinho/i })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /Adicionar ao carrinho/i }).click()
  await page.goto('/cart')
  await expect(page.getByText(/Resumo/i)).toBeVisible({ timeout: 15000 })

  await page.getByPlaceholder(/Código do cupom/i).fill('INVALIDO')
  await page.getByRole('button', { name: /^Aplicar$/i }).click()
  await expect(page.getByText(/inválido|erro|expirado/i).first()).toBeVisible({ timeout: 15000 })

  await page.getByPlaceholder(/Código do cupom/i).fill('EXPIRED')
  await page.getByRole('button', { name: /^Aplicar$/i }).click()
  await expect(page.getByText(/inválido|erro|expirado/i).first()).toBeVisible({ timeout: 15000 })

  await page.reload()
  await expect(page.getByText(/Crypto Jungle #2/i).first()).toBeVisible({ timeout: 15000 })
  await expect(page.getByText(/Resumo/i)).toBeVisible()
})

test('profile: validation error on password change', async ({ page }) => {
  await login(page)
  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: /Perfil do colecionador/i })).toBeVisible({ timeout: 15000 })
  const current = page.getByLabel(/Senha atual|Atual/i)
  if (await current.count()) {
    await current.first().fill('wrong-password')
    const next = page.getByLabel(/Nova senha/i).first()
    if (await next.count()) await next.fill('123456')
    const confirm = page.getByLabel(/Confirmar/i).last()
    if (await confirm.count()) await confirm.fill('123456')
    const submit = page.getByRole('button', { name: /Alterar senha|Salvar/i }).last()
    await submit.click()
    await expect(page.getByText(/incorreta|inválid|erro/i).first()).toBeVisible({ timeout: 15000 })
  } else {
    test.skip(true, 'Password change form not present in current UI')
  }
})

test('profile: validates avatar URL and password confirmation before saving', async ({ page }) => {
  await login(page)
  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: /Perfil do colecionador/i })).toBeVisible()

  await page.getByLabel(/Avatar \(URL\)/i).fill('not-a-url')
  await page.getByRole('button', { name: /Salvar alterações/i }).click()
  await expect(page.getByText(/URL inválida/i)).toBeVisible()

  await page.getByLabel(/Avatar \(URL\)/i).fill('https://example.com/avatar.png')
  await page.getByLabel(/Senha atual/i).fill('password123')
  await page.getByLabel('Nova senha', { exact: true }).fill('newpassword123')
  await page.getByLabel(/Confirmar nova senha/i).fill('different123')
  await page.getByRole('button', { name: /Alterar senha/i }).click()
  await expect(page.getByText(/Senhas não coincidem/i)).toBeVisible()

  await page.getByLabel(/Confirmar nova senha/i).fill('newpassword123')
  await page.getByRole('button', { name: /Alterar senha/i }).click()
  await expect(page.getByText(/Senha alterada com sucesso/i)).toBeVisible({ timeout: 15000 })
})

test('wallets: reject malformed EVM address with accessible validation feedback', async ({ page }) => {
  await login(page)
  await page.goto('/wallets')
  await expect(page.getByRole('heading', { name: /Carteiras/i })).toBeVisible()

  await page.getByLabel(/Endereço/i).fill('0x1234')
  await page.getByRole('button', { name: /^Salvar$/i }).click()
  await expect(page.getByRole('alert')).toContainText(/endereço EVM válido/i)
  await expect(page.getByLabel(/Endereço/i)).toHaveAttribute('aria-invalid', 'true')
})

test('forms: keyboard navigation reaches primary actions on login', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/E-mail/i).focus()
  await expect(page.getByLabel(/E-mail/i)).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel(/^Senha$/i)).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: /^Entrar$/i })).toBeFocused()
})

test('loading states: skeleton/placeholder appears during slow catalog load', async ({ page }) => {
  await page.route('**/api/nfts?**', async (route) => {
    await new Promise((r) => setTimeout(r, 1200))
    await route.continue()
  })
  await page.goto('/')
  // any skeleton/loading indicator in catalog area
  const loading = page.locator('[data-slot="skeleton"], [aria-busy="true"], .animate-pulse, .shimmer').first()
  await expect.soft(loading).toBeVisible({ timeout: 2000 })
  await expect(page.getByRole('heading', { name: /Marketplace de NFTs/i })).toBeVisible({ timeout: 15000 })
})


test('cart: visitor items and coupon are preserved after authentication', async ({ page }) => {
  await page.goto('/nfts/nft-2')
  await expect(page.getByRole('button', { name: /Adicionar ao carrinho/i })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /Adicionar ao carrinho/i }).click()

  await page.goto('/cart')
  await expect(page.getByText(/Crypto Jungle #2/i).first()).toBeVisible({ timeout: 15000 })
  await page.getByPlaceholder(/digo do cupom/i).fill('JUNGLE20')
  await page.getByRole('button', { name: /^Aplicar$/i }).click()
  await expect(page.getByText(/aplicado com sucesso|Cupom aplicado/i).first()).toBeVisible({ timeout: 15000 })

  await login(page)
  await page.goto('/cart')
  await expect(page.getByText(/Crypto Jungle #2/i).first()).toBeVisible({ timeout: 15000 })
  await expect(page.getByText(/Resumo/i)).toBeVisible({ timeout: 15000 })
  // coupon should be preserved/merged (best-effort)
  await expect(page.getByText(/aplicado com sucesso|Cupom aplicado|JUNGLE20/i).first()).toBeVisible({ timeout: 15000 })
})
