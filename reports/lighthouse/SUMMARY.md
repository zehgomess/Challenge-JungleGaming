# Lighthouse summary (local preview + MSW)

- Tool: Lighthouse 13.x (npx), Playwright Chromium 159.0.8154.6, Node v26.13.1
- URL base: http://127.0.0.1:4180 (vite preview, production build with MSW enabled)
- 3 runs per scenario; medians below (LCP/TBT in ms, CLS unitless)

| Scenario | Perf (median) | LCP | CLS | TBT |
|---|---:|---:|---:|---:|
| home-desktop | 1.00 | 640 | 0.036 | 0 |
| home-mobile | 0.78 | 4096 | 0.000 | 73 |
| detail-desktop | 1.00 | 208 | 0.010 | 0 |
| detail-mobile | 0.78 | 4042 | 0.036 | 86 |

## Notes
- Explicit image dimensions and a layout-matched detail skeleton keep detail CLS low (0.010 desktop / 0.036 mobile). Mobile LCP remains about 4 seconds, primarily due client-side startup and hydration after MSW/router initialization.
- Results depend on machine, preview server, and mock/SW behavior; production hosting and asset optimization may change scores. Mobile LCP/TBT remain the main performance shortfalls to justify or optimize against challenge targets.
- Raw HTML/JSON reports for all runs are in this folder.
