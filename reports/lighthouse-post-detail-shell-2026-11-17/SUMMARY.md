# Performance-only diagnostic after detail shell

- Date: 2026-11-17
- Production URL: `https://challenge-jungle-gaming-lac.vercel.app`
- Commit checked: `2ef4aa3`
- Lighthouse 13.6.0, Chromium headless; three `--preset=perf` runs on each mobile route.

| Scenario | Performance median | LCP | FCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|
| Home — mobile | 0.77 | 2,743 ms | 2,743 ms | 562 ms | 0.00066 |
| Detail — mobile | 0.88 | 2,283 ms | 2,283 ms | 306 ms | 0.04386 |

This performance-only preset is not the full-category audit configuration required by the challenge. The official three-run full-category matrix is in `reports/lighthouse-full-categories-2026-11-17/` and meets all four score targets. Keep the profiles separate: the preset matrix is useful for identifying TBT and long-task work, not as a replacement for the full-category medians.
