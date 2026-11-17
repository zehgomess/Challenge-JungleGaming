# Production check after first-paint shell

- Date: 2026-11-17
- Production URL: `https://challenge-jungle-gaming-lac.vercel.app`
- Deployed commit checked: `e97173b`
- Method: Lighthouse 13.x, Chromium headless, three performance-preset mobile runs per route.

| Scenario | Performance median | LCP | CLS | TBT |
|---|---:|---:|---:|---:|
| Home — mobile | 0.75 | 2,796 ms | 0.00066 | 622 ms |
| Detail — mobile (`nft-1`) | 0.70 | 4,789 ms | 0.04386 | 347 ms |

The deployed shell brought home LCP close to 2.8 s but leaves long tasks and late interactivity (about 5.2 s). Detail still used the generic startup placeholder at this deployed commit. The working tree now contains a route-specific NFT detail shell; its local-preview result is documented separately in `reports/lighthouse-bootstrap-followup-2026-11-17/` and has not yet been deployed.

These are environment-specific measurements. The raw JSON runs are included alongside this summary.
