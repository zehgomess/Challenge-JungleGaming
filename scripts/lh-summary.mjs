import fs from 'fs'

const path = 'reports/lighthouse'
const files = fs.readdirSync(path).filter((f) => f.endsWith('.json'))
const groups = {}
for (const f of files) {
  const m = f.match(/^(home|detail)-(desktop|mobile)-run(\d)\.report\.json$/)
  if (!m) continue
  const key = `${m[1]}-${m[2]}`
  const j = JSON.parse(fs.readFileSync(`${path}/${f}`, 'utf8'))
  const a = j.audits
  groups[key] = groups[key] || []
  groups[key].push({
    run: +m[3],
    perf: j.categories.performance.score,
    lcp: a['largest-contentful-paint']?.numericValue,
    cls: a['cumulative-layout-shift']?.numericValue,
    tbt: a['total-blocking-time']?.numericValue,
  })
}
function median(arr) {
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
let out = '# Lighthouse summary (local preview + MSW)\n\n'
out += '- Tool: Lighthouse 13.x (npx), Playwright Chromium 159.0.8154.6, Node v26.13.1\n'
out += '- URL base: http://127.0.0.1:4173 (vite preview, production build with MSW enabled)\n'
out += '- 3 runs per scenario; medians below (LCP/TBT in ms, CLS unitless)\n\n'
out += '| Scenario | Perf (median) | LCP | CLS | TBT |\n|---|---:|---:|---:|---:|\n'
for (const k of ['home-desktop', 'home-mobile', 'detail-desktop', 'detail-mobile']) {
  const vals = (groups[k] || []).sort((a, b) => a.run - b.run)
  if (!vals.length) continue
  out += `| ${k} | ${median(vals.map((v) => v.perf)).toFixed(2)} | ${median(vals.map((v) => v.lcp)).toFixed(0)} | ${median(vals.map((v) => v.cls)).toFixed(3)} | ${median(vals.map((v) => v.tbt)).toFixed(0)} |\n`
}
out += '\n## Notes\n'
out += '- Detail pages show elevated CLS; mobile runs show higher LCP/TBT in this local environment.\n'
out += '- Results depend on machine, preview server, and mock/SW behavior; production hosting and asset optimization may change scores. Targets/shortfalls should be justified against the deployed environment as required.\n'
out += '- Raw HTML/JSON reports for all runs are in this folder.\n'
fs.writeFileSync(`${path}/SUMMARY.md`, out)
console.log('wrote reports/lighthouse/SUMMARY.md')
