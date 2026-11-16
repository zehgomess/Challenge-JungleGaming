# Lighthouse summary (local preview + MSW)

- Tool: Lighthouse 13.x (npx), Playwright Chromium 159.0.8154.6, Node v26.13.1
- URL base: http://127.0.0.1:4173 (vite preview, production build with MSW enabled)
- 3 runs per scenario; medians below (LCP/TBT in ms, CLS unitless)

| Scenario | Perf (median) | LCP | CLS | TBT |
|---|---:|---:|---:|---:|
| home-desktop | 0.97 | 1200 | 0.036 | 0 |
| home-mobile | 0.70 | 5020 | 0.000 | 49 |
| detail-desktop | 0.80 | 1172 | 0.364 | 0 |
| detail-mobile | 0.53 | 4934 | 0.377 | 65 |

## Notes
- Detail pages show elevated CLS; mobile runs show higher LCP/TBT in this local environment.
- Results depend on machine, preview server, and mock/SW behavior; production hosting and asset optimization may change scores. Targets/shortfalls should be justified against the deployed environment as required.
- Raw HTML/JSON reports for all runs are in this folder.
