import { test, expect, type Page } from 'playwright/test'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/E-mail/i).fill('collector@jungle.io')
  await page.getByLabel(/^Senha$/i).fill('password123')
  await page.getByRole('button', { name: /^Entrar$/i }).click()
  await expect(page).not.toHaveURL(/\/login/)
}

test('catalog search, filter, sort and pagination via URL', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Marketplace de NFTs/i })).toBeVisible()
  await page.getByLabel(/Busca/i).fill('Crypto Jungle #2')
  await expect(page).toHaveURL(/search=/)
  await expect(page.getByRole('link', { name: /Crypto Jungle #2/i }).first()).toBeVisible({ timeout: 15000 })
  await page.getByLabel(/Edição/i).selectOption('Gold')
  await expect(page).toHaveURL(/edition=Gold/)
  await expect(page.getByText(/Página 1 de/i)).toBeVisible()
})

test('favorite requires auth and works after login', async ({ page }) => {
  await page.goto('/nfts/nft-2')
  await expect(page.getByRole('button', { name: /Favoritar|Favoritado/i })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /Favoritar|Favoritado/i }).click()
  await expect(page).toHaveURL(/\/login/)
  await page.getByLabel(/E-mail/i).fill('collector@jungle.io')
  await page.getByLabel(/^Senha$/i).fill('password123')
  await page.getByRole('button', { name: /^Entrar$/i }).click()
  await expect(page).toHaveURL(/\/nfts\/nft-2/)
  await expect(page.getByRole('button', { name: /Favoritar|Favoritado/i })).toBeVisible({ timeout: 15000 })
})

test('cart coupon and quantity updates totals', async ({ page }) => {
  await page.goto('/nfts/nft-2')
  await expect(page.getByRole('button', { name: /Adicionar ao carrinho/i })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /Adicionar ao carrinho/i }).click()
  await page.getByRole('link', { name: /Ver carrinho/i }).click()
  await expect(page.getByText(/Resumo/i)).toBeVisible()
  await page.getByPlaceholder(/Código do cupom/i).fill('JUNGLE20')
  await page.getByRole('button', { name: /^Aplicar$/i }).click()
  await expect(page.getByText(/Cupom aplicado com sucesso|Desconto/i).first()).toBeVisible({ timeout: 15000 })
})

test('authenticated checkout and order confirmation', async ({ page }) => {
  await login(page)
  await page.goto('/nfts/nft-2')
  await expect(page.getByRole('button', { name: /Adicionar ao carrinho/i })).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /Adicionar ao carrinho/i }).click()
  await page.goto('/cart')
  await page.getByRole('link', { name: /Ir para pagamento/i }).click()
  await expect(page).toHaveURL(/\/payment/)
  await page.getByRole('button', { name: /Simular conexão/i }).click()
  await expect(page.getByText(/Carteira conectada/i)).toBeVisible({ timeout: 15000 })
  await page.getByLabel(/Confirmo que revisei/i).check()
  await page.getByRole('button', { name: /Confirmar compra/i }).click()
  await expect(page).toHaveURL(/\/order\/confirmation/, { timeout: 30000 })
  await expect(page.getByText(/Confirmação do pedido|Recibo/i).first()).toBeVisible({ timeout: 15000 })
})

test('profile update and wallets management', async ({ page }) => {
  await login(page)
  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: /Perfil do colecionador/i })).toBeVisible()
  await page.getByLabel(/^Nome$/i).fill('Colecionador Jungle Atualizado')
  await page.getByRole('button', { name: /Salvar alterações/i }).click()
  await expect(page.getByText(/Perfil atualizado/i)).toBeVisible({ timeout: 15000 })

  await page.goto('/wallets')
  await expect(page.getByRole('heading', { name: /Carteiras/i })).toBeVisible()
  await page.getByLabel(/Endereço/i).fill('0x1111222233334444555566667777888899990000')
  await page.getByLabel(/Rótulo/i).fill('Carteira Teste')
  await page.getByRole('button', { name: /^Salvar$/i }).click()
  await expect(page.getByText(/Carteira cadastrada|Carteiras registradas/i).first()).toBeVisible({ timeout: 15000 })
})
