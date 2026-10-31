# My Learners — multidisciplinary product redevelopment (31 October 2026)

## Review basis

Four specialist lenses guided the work: UX and information architecture, assessment/data interpretation, WCAG-oriented interaction accessibility, and school data governance. This is a standards-informed product/engineering review, **not a claim that external experts or real AISG teachers were recruited**.

External guidance: [WCAG 2.2 — Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html). Internal reference: [real-teacher research protocol](./real-teacher-study-protocol.md) and [production-readiness requirements](../production-readiness.md).

## Implemented

1. **Faculty information architecture:** default view prioritises learner evidence. Advanced assessment tabs, subject/period controls, comparison tools, demo-faculty selector and table search/exports/saved views remain available in named disclosures.
2. **Source-correct sorting:** the visual Q1–Q4 band and raw academic values are separate. Sorts use the original MAP RIT change, IXL diagnostic measure, attendance rate or engagement/belonging index, retaining missing values last in either direction.
3. **Consistent interpretation:** a compact four-colour legend distinguishes fictional same-grade academic quartiles from the fixed -2 to +2 experience bands. This does not replace external assessment norms or identify student needs.
4. **Improved scanning:** equal-size evidence cells and a sticky learner-name column within the horizontally scrolling table.
5. **Professional inquiry:** an optional “From evidence to action” disclosure points teachers to existing learner profiles and follow-up workflows. It does not claim to infer interventions from student scores.
6. **Accessible interactions:** retained hover, keyboard focus and Escape dismissal. On touch/coarse-pointer devices, one tap previews an evidence cell and a second tap follows the existing profile navigation.
7. **Sitewide design tokens:** shared text, focus, border and evidence colours help maintain consistency across Faculty, Students, SSS, Leaders and Board without replacing each role's distinct information architecture.

## Test expectations

- Node regressions for source-aware sorting, fixed index bands and original data values.
- Browser smoke tests for the default Faculty view, preserved focused view, role switches and source provenance.
- Chrome screenshot/interaction walkthroughs at varied screen widths.
- Additional browser checks for initially collapsed secondary controls, legible band legend, sticky learner names and true numeric MAP sorting.
- Successful GitHub Pages workflow required before calling the release deployed.

## Unchanged safeguards

The GitHub Pages prototype retains fictional learner and student-support data. Faculty names may be real but assignments are explicitly fabricated. Actual learner, medical, safeguarding or staff observation records must not enter this public build. An AISG production build requires school-approved hosting, Microsoft Entra SSO, server-side role-based permissions, auditable access and legitimate source/consent arrangements.

## Deferred

- A genuine study with teachers from both divisions, using the existing voluntary, facilitator-ready protocol; no fabricated participant feedback or success scores.
- Testing with actual keyboard-only, screen-reader and touch users beyond automated checks.
- Secure authoritative integrations with PowerSchool, ManageBac, MAP and approved specialist data sources.

The standard for success is **faster, more confident interpretation and action**, not a larger number of visual widgets.
