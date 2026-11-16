import { test, expect, type Page } from 'playwright/test'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/E-mail/i).fill('collector@jungle.io')
  await page.getByLabel(/^Senha$/i).fill('password123')
  await page.getByRole('button', { name: /^Entrar$/i }).click()
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 })
}

async function emitNftUpdate(page: Page, payload: any) {
  await page.request.post('/api/__test/nft-update', { data: payload })
}

test('socket: nft price/availability update reflected in cart summary', async ({ page }) => {
  await page.goto('/nfts/nft-2')
  await expect(page.getByRole('button', { name: /Adicionar ao carrinho/i })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /Adicionar ao carrinho/i }).click()
  await page.goto('/cart')
  await expect(page.getByText(/Resumo/i)).toBeVisible({ timeout: 15000 })
  await expect(page.getByText(/0\.38/).first()).toBeVisible({ timeout: 15000 })

  await emitNftUpdate(page, { id: 'nft-2', price: '0.55', availability: 2, version: 50 })
  await expect(page.getByText(/0\.55|Atualiza/i).first()).toBeVisible({ timeout: 15000 })
})

test('socket: duplicate/older nft.updated events do not regress state', async ({ page }) => {
  await page.goto('/nfts/nft-3')
  await expect(page.getByRole('button', { name: /Adicionar ao carrinho/i })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /Adicionar ao carrinho/i }).click()
  await page.goto('/cart')
  await expect(page.getByText(/Resumo/i)).toBeVisible({ timeout: 15000 })

  const before = await page.locator('main').innerText()
  await emitNftUpdate(page, { id: 'nft-3', price: '0.77', availability: 2, version: 100 })
  await page.waitForTimeout(1200)
  // duplicate and older version should not regress to stale price
  await emitNftUpdate(page, { id: 'nft-3', price: '0.77', availability: 2, version: 100 })
  await emitNftUpdate(page, { id: 'nft-3', price: '0.10', availability: 2, version: 5 })
  await page.waitForTimeout(1200)
  await expect(page.getByText(/0\.10 ETH/i)).toHaveCount(0)
  const after = await page.locator('main').innerText()
  expect(after.includes('0.10 ETH')).toBeFalsy()
  expect(after).not.toEqual('')
  // sanity: cart still present
  await expect(page.getByText(/Resumo/i)).toBeVisible()
  expect(before.length).toBeGreaterThan(0)
})

test('checkout: realtime price change prompts review before stale confirmation', async ({ page }) => {
  await login(page)
  await page.goto('/nfts/nft-2')
  await expect(page.getByRole('button', { name: /Adicionar ao carrinho/i })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /Adicionar ao carrinho/i }).click()
  await page.goto('/payment')
  await expect(page).toHaveURL(/\/payment/, { timeout: 15000 })
  await page.getByRole('button', { name: /Simular conexão/i }).click()
  await expect(page.getByText(/Carteira conectada/i)).toBeVisible({ timeout: 15000 })

  await emitNftUpdate(page, { id: 'nft-2', price: '0.99', availability: 2, version: 200 })
  await expect(page.getByText(/atualiz|alter|revis|cotação|diferen/i).first()).toBeVisible({ timeout: 15000 })
})

