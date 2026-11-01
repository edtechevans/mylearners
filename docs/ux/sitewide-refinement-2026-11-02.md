# My Learners — Sitewide Design-System Refinement
2 November 2026 | Design and engineering implementation

## Context
This release implements the findings of the 2 November sitewide design audit. It is an internal, standards-informed design/engineering pass, **not** work commissioned from an external designer. Existing public-demo data, permission boundaries, assessment colour bands and scoring methods were not altered.

## Canonical design tokens
New stylesheet: `src/design-system-refinement.css`, loaded last after `src/aisg-brand-duotone.css`. It specifies readable text, spacing, border, radii, input height, focus treatment and role-level layout adaptations. It initiates CSS consolidation without deleting older selectors before browser comparison.

| Element | Value |
|---|---|
| Primary type | #102B3C |
| Muted readable type | #566D75 |
| Control text | #526973 |
| Border | #DFE5E2 |
| Canvas | #F8F7F4 |
| Spacing | 4, 8, 12, 16, 24, 32, 48px |
| Body / labels | 14 / 12px |
| Control/card radius | 9 / 16px |
| Focus outline | 3px #1776B6 |
| AISG institutional palette | Preserved red #A71F35 and navy #10324E |

## Page-level decisions
**Board** — The historical IB Diploma/MAP evidence chart comes directly after the editorial introduction and before celebratory KPI cards. The same four cards and deep links remain functional; source and candidate-population explanations remain attached to their graphs.

**Faculty** — My Class, assigned-student search and Demo controls share a compact responsive toolbar at desktop/tablet widths. Summary KPIs and table controls take less height, retaining fixed four-colour index/assessment semantics, names and source-aware sorting.

**Student** — Hierarchy is simplified to “My learning”, learner identity, and “Learning today”; reflection, academic history, check-ins and student choice stay intact.

**SSS** — The main summary shows students supported and monitoring context once. Upcoming reviews, follow-ups and referrals display counts in their actionable queues, not in duplicate KPI tiles. Case manager, referral and support navigation remain present. This public demonstration continues to use fictional records only.

**Leaders** — KPI labels and reporting dates align consistently, with readable 12px supporting text and stable card sizes.

## Accessibility and testing
- Muted metadata text `#566D75` on `#F8F7F4`: approximately 5.1:1 WCAG normal text contrast.
- Standardised keyboard focus styling and responsive control layout.
- Added `tests/design-system-refinement.test.mjs` to required Pages checks.
- Extended Chrome walkthrough with Board chart-first, Faculty first-viewport readability, and 390px/768px tests for all five roles.
- No claim of a full WCAG audit, screen-reader certification or actual teacher usability testing.

## Remaining engineering debt
The legacy site still uses multiple layered stylesheets and CSS `!important` declarations. This release adds a canonical source for new tokenised styles and corrects visible inconsistencies. A separate component-by-component cleanup, with screenshot diffs and keyboard testing, is required to safely eliminate superseded legacy rules.
