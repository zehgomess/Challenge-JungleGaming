# Production check after image-priority change

- Date: 2026-11-17
- URL: `https://challenge-jungle-gaming-lac.vercel.app`
- Method: Lighthouse 13.x, Chromium headless, 3 performance-preset runs per mobile scenario.
- Baseline: `reports/lighthouse-deployed-2026-11-17/` before commit `15bda05`.

| Scenario | Baseline performance | Baseline LCP | After performance | After LCP |
|---|---:|---:|---:|---:|
| Home — mobile | 0.80 | 3,893 ms | 0.78 | 4,022 ms |
| Detail — mobile | 0.82 | 3,683 ms | 0.81 | 3,787 ms |

These runs showed **no measurable production improvement** from the preload alone (small differences may be run-to-run variation). The image became discoverable and high priority, but app startup/render delay remained dominant. Raw post-change runs are included here; this finding motivated the progressive first-paint shell in the next local experiment.
