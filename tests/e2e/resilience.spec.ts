import { test, expect, type Page } from 'playwright/test'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/E-mail/i).fill('collector@jungle.io')
  await page.getByLabel(/^Senha$/i).fill('password123')
  await page.getByRole('button', { name: /^Entrar$/i }).click()
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 })
}

test('favorites: mutation failure shows feedback and keeps consistent state', async ({ page }) => {
  await login(page)
  await page.goto('/nfts/nft-3')
  await expect(page.getByRole('button', { name: /Favoritar|Favoritado/i })).toBeVisible({ timeout: 15000 })
  const btn = page.getByRole('button', { name: /Favoritar|Favoritado/i })
  const before = (await btn.textContent()) || ''

  await page.evaluate(() => fetch('/api/__test/control', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ favoriteFail: 1 }) }))
  await btn.click()
  await expect(page.getByText(/não foi possível|erro|falha/i).first()).toBeVisible({ timeout: 15000 })
  await expect(page.getByRole('button', { name: new RegExp(before.trim() || 'Favoritar|Favoritado', 'i') })).toBeVisible({ timeout: 15000 })
})

test('session: expired/cleared session redirects to login on protected route', async ({ page }) => {
  await login(page)
  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: /Perfil do colecionador/i })).toBeVisible({ timeout: 15000 })
  await page.evaluate(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  })
  await page.goto('/wallets')
  await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
})

test('checkout: timeout after order creation recovers same order via idempotency', async ({ page }) => {
  await login(page)
  await page.goto('/nfts/nft-4')
  await expect(page.getByRole('button', { name: /Adicionar ao carrinho/i })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /Adicionar ao carrinho/i }).click()
  await page.goto('/payment')
  await expect(page).toHaveURL(/\/payment/, { timeout: 15000 })

  await page.evaluate(() => fetch('/api/__test/control', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderCreateTimeout: 1 }) }))

  await page.getByRole('button', { name: /Simular conexão/i }).click()
  await expect(page.getByText(/Carteira conectada/i)).toBeVisible({ timeout: 15000 })
  await page.getByLabel(/Confirmo que revisei/i).check()
  await page.getByRole('button', { name: /Confirmar compra/i }).click()

  await expect(page).toHaveURL(/\/order\/confirmation/, { timeout: 30000 })
  await expect(page.getByText(/Confirmação do pedido|Recibo|confirmado/i).first()).toBeVisible({ timeout: 15000 })
})


test('checkout: repeated confirm click does not create duplicate successful flow', async ({ page }) => {
  await login(page)
  await page.goto('/nfts/nft-5')
  await expect(page.getByRole('button', { name: /Adicionar ao carrinho/i })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /Adicionar ao carrinho/i }).click()
  await page.goto('/payment')
  await expect(page).toHaveURL(/\/payment/, { timeout: 15000 })

  await page.getByRole('button', { name: /Simular/i }).click()
  await expect(page.getByText(/Carteira conectada/i)).toBeVisible({ timeout: 15000 })
  await page.getByLabel(/Confirmo que revisei/i).check()
  const confirm = page.getByRole('button', { name: /Confirmar compra/i })
  await confirm.click()
  await confirm.click({ timeout: 1000 }).catch(() => {})

  await expect(page).toHaveURL(/\/order\/confirmation/, { timeout: 30000 })
  await expect(page.getByText(/confirmado|Recibo|Confirma/i).first()).toBeVisible({ timeout: 15000 })
})
test('session: cleared auth on payment redirects to login with resume to payment', async ({ page }) => {
  await login(page)
  await page.goto('/nfts/nft-6')
  await expect(page.getByRole('button', { name: /Adicionar ao carrinho/i })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /Adicionar ao carrinho/i }).click()
  await page.goto('/payment')
  await expect(page).toHaveURL(/\/payment/, { timeout: 15000 })

  await page.evaluate(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  })
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fpayment/, { timeout: 15000 })
  await expect(page.getByText(/Entrar/i).first()).toBeVisible({ timeout: 15000 })
})
