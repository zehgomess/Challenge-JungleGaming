# Lighthouse summary (deployed production + MSW)

- Tool: Lighthouse 13.x (npx), Playwright Chromium 159.0.8154.6, Node v26.13.1
- URL base: https://challenge-jungle-gaming-lac.vercel.app (Vercel production, MSW enabled)
- 3 runs per scenario; medians below (LCP/TBT in ms, CLS unitless)

| Scenario | Perf (median) | LCP | CLS | TBT |
|---|---:|---:|---:|---:|
| home-desktop | 1.00 | 460 | 0.036 | 0 |
| home-mobile | 0.80 | 3851 | 0.000 | 79 |
| detail-desktop | 1.00 | 226 | 0.010 | 0 |
| detail-mobile | 0.81 | 3798 | 0.036 | 101 |

## Notes
- Explicit image dimensions and a layout-matched detail skeleton keep detail CLS low (about 0.010 desktop / 0.036 mobile). Mobile LCP/TBT remain higher than desktop and need review against the challenge targets.
- Results depend on machine, network path and Vercel edge, and mock/SW behavior; treat these values as environment-specific evidence.
- Raw HTML/JSON reports for all runs are in this folder.
