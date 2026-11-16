import { execSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

mkdirSync('reports/lighthouse', { recursive: true })

const base = process.env.LH_BASE_URL || 'http://127.0.0.1:4173'
const pages = [
  { name: 'home-mobile', url: `${base}/`, preset: 'perf', formFactor: 'mobile' },
  { name: 'home-desktop', url: `${base}/`, preset: 'desktop', formFactor: 'desktop' },
  { name: 'detail-mobile', url: `${base}/nfts/nft-1`, preset: 'perf', formFactor: 'mobile' },
  { name: 'detail-desktop', url: `${base}/nfts/nft-1`, preset: 'desktop', formFactor: 'desktop' },
]

for (const p of pages) {
  for (let run = 1; run <= 3; run++) {
    const out = `reports/lighthouse/${p.name}-run${run}`
    const cmd = `npx lighthouse "${p.url}" --preset=${p.preset} --output=html --output=json --output-path="${out}" --quiet --chrome-flags="--headless"`
    console.log('Running:', cmd)
    try {
      execSync(cmd, { stdio: 'inherit' })
    } catch (e) {
      console.error('Lighthouse run failed', p.name, run, e?.message || e)
    }
  }
}

console.log('Lighthouse runs completed (see reports/lighthouse). Compute median across runs per page/form factor as required.')
