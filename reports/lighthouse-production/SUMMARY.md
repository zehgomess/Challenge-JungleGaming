# Lighthouse summary

- Tool: Lighthouse 13.x (npx), Playwright Chromium, Node v26.13.1
- 3 runs per scenario; medians below (LCP/TBT in ms, CLS unitless). Raw HTML/JSON reports are in this folder.

## Deployed production + MSW (earlier visual version)

- URL: https://challenge-jungle-gaming-lac.vercel.app (Vercel production, MSW enabled)

| Scenario | Perf (median) | LCP | CLS | TBT |
|---|---:|---:|---:|---:|
| home-desktop | 1.00 | 460 | 0.036 | 0 |
| home-mobile | 0.80 | 3851 | 0.000 | 79 |
| detail-desktop | 1.00 | 226 | 0.010 | 0 |
| detail-mobile | 0.81 | 3798 | 0.036 | 101 |

## Local production preview (current Figma-aligned visual version)

- URL: `npm run preview` on http://127.0.0.1:4173 (production build, MSW enabled)

| Scenario | Perf (median) | LCP | CLS | TBT |
|---|---:|---:|---:|---:|
| home-desktop | 1.00 | 773 | 0.001 | 0 |
| home-mobile | 0.72 | 4807 | 0.000 | 79 |
| detail-desktop | 1.00 | 686 | 0.011 | 0 |
| detail-mobile | 0.76 | 4284 | 0.044 | 95 |

- Full-category audit of the current home page: accessibility **1.00**, best practices **1.00**, SEO **1.00** on both mobile (`full-home-mobile.report.json`) and desktop (`full-home-desktop.report.json`), with performance 0.93 mobile / 1.00 desktop in those single runs.
- Mobile LCP remains the weakest metric and varies substantially between runs and between local preview and Vercel; it needs further review against the challenge targets. CLS stays low on detail (about 0.010 desktop / 0.044 mobile in local preview).
- Results are environment-specific evidence (machine, network path, edge CDN and mock/SW behavior). These numbers do not establish pixel-perfect fidelity to the Figma frames; visual alignment is tracked separately by the Playwright screenshot baselines at 390/768/1440 px.
