# Progressive first-paint shell (local production preview)

- Date: 2026-11-17
- Candidate: Kurio loading shell appears while MSW starts; the router mounts only after MSW is active. NFT detail routes 1–4 also show the matching local artwork in a layout-matched skeleton.
- Method: Lighthouse 13.x, Chromium headless, three performance-preset mobile runs on the local Vite production preview.
- Baseline: previous local preview in `reports/lighthouse-production/`.

## Performance-preset medians

| Scenario | Baseline perf | Baseline LCP | Candidate perf | Candidate LCP | Candidate TBT | Candidate interactive |
|---|---:|---:|---:|---:|---:|---:|
| Home — mobile | 0.72 | 4,807 ms | 0.83 | 2,598 ms | 399 ms | 5,077 ms |
| Detail — mobile (`nft-1`) | 0.76 | 4,284 ms | 0.88 | 2,207 ms | 346 ms | 4,917 ms |

The shell improves first visible content substantially and keeps CLS low (home 0.00066; detail 0.04386). The complete app becomes interactive later than baseline and TBT increases, so this is a progressive first-paint improvement—not a complete startup-performance fix.

## Full-category spot checks

One full-category mobile audit per page scored accessibility, best practices and SEO **1.00** each. Performance was 0.90 for home and 0.93 for detail in those single runs. Their timings use a different collection configuration and are not mixed into the three-run medians.

These are local-preview results only; this candidate has not yet been verified on Vercel. Raw JSON reports for the performance matrix and both full-category audits are included.
