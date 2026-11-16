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

