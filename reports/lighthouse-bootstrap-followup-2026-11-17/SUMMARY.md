# Progressive first-paint shell (local production preview)

- Date: 2026-11-17
- Candidate: lightweight Kurio/catalog shell paints while MSW and route modules initialize; the application router mounts only after the service worker is ready.
- Method: Lighthouse 13.x, Chromium headless, three performance-preset mobile runs on the local Vite production preview.
- Comparison: `reports/lighthouse-lcp-followup-2026-11-17/` is the prior local candidate without the shell.

| Metric | Prior local candidate median | Shell candidate median |
|---|---:|---:|
| Performance | 0.77 | 0.82 |
| LCP | 4,176 ms | 2,724 ms |
| FCP | 4,176 ms | 2,724 ms |
| CLS | 0.00027 | 0.00066 |
| TBT | 55 ms | 388 ms |

The shell improved local median LCP by about **1,452 ms (35%)** while keeping CLS low. It is a meaningful first-paint improvement, but it does **not** make the complete application interactive sooner: the performance-only run reported about 5.2 s to interactive, and TBT increased. The shell is therefore progressive loading, not a complete startup fix.

A separate full-category mobile audit scored accessibility, best practices and SEO **1.00** each (full report: `home-mobile-full.report.json`). Its performance timings use a different audit configuration and are not mixed into the three-run medians.

These are local-preview results only; the shell has not yet been deployed or measured on Vercel. Raw JSON is included for reproducibility.
