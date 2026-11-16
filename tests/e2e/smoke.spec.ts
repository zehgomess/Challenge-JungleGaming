import { test, expect } from 'playwright/test'

test('home renders catalog and navigates to detail', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Marketplace de NFTs/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Crypto Jungle #1/i }).first()).toBeVisible({ timeout: 15000 })
  await page.getByRole('link', { name: /Crypto Jungle #1/i }).first().click()
  await expect(page).toHaveURL(/\/nfts\//)
  await expect(page.getByRole('button', { name: /Adicionar ao carrinho|Edição indisponível/i })).toBeVisible({ timeout: 15000 })
})

test('cart flow and checkout requires auth', async ({ page }) => {
  await page.goto('/nfts/nft-2')
  const addBtn = page.getByRole('button', { name: /Adicionar ao carrinho/i })
  await expect(addBtn).toBeVisible({ timeout: 15000 })
  await addBtn.click()
  await page.getByRole('link', { name: /Ver carrinho/i }).click()
  await expect(page).toHaveURL(/\/cart/)
  await expect(page.getByText(/Resumo/i)).toBeVisible()
  await page.getByRole('link', { name: /Ir para pagamento/i }).click()
  await expect(page).toHaveURL(/\/login/)
})

test('login with fictitious credentials', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/E-mail/i).fill('collector@jungle.io')
  await page.getByLabel(/Senha/i).fill('password123')
  await page.getByRole('button', { name: /^Entrar$/i }).click()
  await expect(page).toHaveURL(/\/(\?.*)?$/)
})
