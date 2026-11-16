# Lighthouse summary (local preview + MSW)

- Tool: Lighthouse 13.x (npx), Playwright Chromium 159.0.8154.6, Node v26.13.1
- URL base: http://127.0.0.1:4180 (vite preview, production build with MSW enabled)
- 3 runs per scenario; medians below (LCP/TBT in ms, CLS unitless)

| Scenario | Perf (median) | LCP | CLS | TBT |
|---|---:|---:|---:|---:|
| home-desktop | 1.00 | 634 | 0.036 | 0 |
| home-mobile | 0.79 | 3967 | 0.000 | 62 |
| detail-desktop | 1.00 | 207 | 0.010 | 0 |
| detail-mobile | 0.80 | 3903 | 0.036 | 75 |

## Notes
- Explicit image dimensions and a layout-matched detail skeleton reduced detail CLS to 0.010 desktop / 0.036 mobile. Mobile LCP remains about 4 seconds, with most delay before the client-rendered LCP image is inserted while MSW/router bundles initialize.
- Results depend on machine, preview server, and mock/SW behavior; production hosting and asset optimization may change scores. Mobile LCP remains the main performance shortfall to investigate against challenge targets.
- Raw HTML/JSON reports for all runs are in this folder.
