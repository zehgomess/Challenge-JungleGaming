# Production Lighthouse — full-category matrix

- Date: 2026-11-17
- Production: `https://challenge-jungle-gaming-lac.vercel.app`
- Commit checked: `2ef4aa3`
- Lighthouse 13.6.0, HeadlessChrome 157.0.0.0, Node v26.13.1
- Three full-category navigation runs per page/profile; medians shown. Matching HTML and JSON reports are included.

| Scenario | Performance | Accessibility | Best Practices | SEO | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|
| Home — mobile | 0.97 | 1.00 | 1.00 | 1.00 | 2,350 ms | 107 ms | 0.000 |
| Home — desktop | 1.00 | 1.00 | 1.00 | 1.00 | 522 ms | 0 ms | 0.000 |
| Detail — mobile | 0.98 | 1.00 | 1.00 | 1.00 | 2,315 ms | 87 ms | 0.044 |
| Detail — desktop | 1.00 | 1.00 | 1.00 | 1.00 | 477 ms | 0 ms | 0.011 |

All Lighthouse category targets in the challenge are met by this matrix. These scores do not establish pixel-level fidelity to the Figma frames or complete the manual keyboard/focus audit.
