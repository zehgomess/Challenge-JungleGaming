# Mobile LCP follow-up (local production preview)

- Date: 2026-11-17
- Candidate build: Figma home with mobile preload and an eager first-card preview while the catalog API is pending.
- Baseline: previous local production-preview matrix in `reports/lighthouse-production/home-mobile-run*.report.json`.
- Method: Lighthouse 13.x, Chromium headless, three runs per build, `--preset=perf`, same machine and local Vite preview.

| Metric | Baseline median | Candidate median |
|---|---:|---:|
| Performance | 0.72 | 0.77 |
| LCP | 4,807 ms | 4,176 ms |
| FCP | 4,390 ms | 4,176 ms |
| CLS | 0.00027 | 0.00027 |
| TBT | 79 ms | 55 ms |

The candidate improved local median LCP by about **631 ms (13%)**. Lighthouse now marks the first NFT image as discoverable, high priority and eager. This is a local experiment, not a deployed measurement; mobile LCP remains above the 2.5 s “good” threshold and is sensitive to the audit environment. Three candidate JSON reports are included here.
