import { test, expect } from '@playwright/test'

const pages = [
  { name: 'home', path: '/' },
  { name: 'detail', path: '/nfts/nft-1' },
  { name: 'cart', path: '/cart' },
]

for (const p of pages) {
  test(`visual: ${p.name}`, async ({ page }) => {
    await page.goto(p.path)
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot(`${p.name}.png`, { fullPage: true, maxDiffPixelRatio: 0.05 })
  })
}

// payment requires auth state; baseline intended to be generated in authenticated project/setup
test.skip('visual: payment', async ({ page }) => {
  await page.goto('/payment')
  await expect(page).toHaveScreenshot('payment.png', { fullPage: true })
})
