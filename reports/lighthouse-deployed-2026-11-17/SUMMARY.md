# Lighthouse — deployed version

- Date: 2026-11-17
- URL: `https://challenge-jungle-gaming-lac.vercel.app` (Vercel production; MSW active)
- Tool: Lighthouse 13.x with Chromium headless.
- Performance-only matrix: 3 runs per scenario; report medians below. Raw JSON reports are alongside this summary.

| Scenario | Performance median | LCP (ms) | CLS | TBT (ms) |
|---|---:|---:|---:|---:|
| Home — mobile | 0.80 | 3,893 | 0.000 | 31 |
| Home — desktop | 1.00 | 462 | 0.001 | 0 |
| Detail — mobile | 0.82 | 3,683 | 0.044 | 49 |
| Detail — desktop | 1.00 | 458 | 0.011 | 0 |

Four additional full-category audits were run once each. Accessibility, best practices and SEO scored **1.00** in all four. Full-audit performance scores were 0.99 on mobile and 1.00 on desktop; the full-audit mobile LCP was about 1,970 ms. This differs from the performance-only matrix, so it is recorded separately rather than combined into the medians.

Mobile LCP remains variable by audit configuration and run; use the three-run matrix as the comparable performance result. These scores are environment-specific and do not establish pixel-perfect Figma fidelity. Playwright visual baselines cover 390 px, 768 px and 1440 px.
