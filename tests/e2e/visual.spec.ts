import { test, expect } from 'playwright/test'

const pages = [
  { name: 'home', path: '/' },
  { name: 'detail', path: '/nfts/nft-2' },
  { name: 'cart', path: '/cart' },
]

for (const p of pages) {
  test(`visual: ${p.name}`, async ({ page }) => {
    await page.goto(p.path)
    await page.waitForTimeout(1200)
    await expect(page).toHaveScreenshot(`${p.name}.png`, { fullPage: true, maxDiffPixelRatio: 0.05 })
  })
}

test('visual: payment', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('auth_token', 'mock-token-123')
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 'user-1',
        email: 'collector@jungle.io',
        name: 'Colecionador Jungle',
        avatar: 'https://picsum.photos/seed/avatar/200/200',
        created_at: new Date().toISOString(),
      }),
    )
    const seededCart = JSON.stringify({
      items: [
        {
          nft_id: 'nft-2',
          edition: 'Gold',
          quantity: 1,
          price_at_add: '0.38',
          name: 'Crypto Jungle #2',
          image: '/artworks/violet-nomad-314.webp',
          max_availability: 2,
        },
      ],
    })
    localStorage.setItem('cart:visitor', seededCart)
    localStorage.setItem('cart:user:user-1', seededCart)
  })
  await page.goto('/payment')
  await page.waitForTimeout(1500)
  await expect(page).toHaveScreenshot('payment.png', { fullPage: true, maxDiffPixelRatio: 0.05 })
})
