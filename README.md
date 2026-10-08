# AISG | My Learners

**Know the Learner. Understand the Evidence. Respond with Purpose.**

A polished, client-side demonstration of a teacher-centred student learning dashboard for the American International School of Guangzhou (AISG). The application uses a supplied AISG logo and provides fictional, coherent learning data and locally generated illustrated portraits.

> **DEMO ONLY — NO REAL STUDENT INFORMATION.** The 1,200 student profiles, all teacher-to-class assignments, attendance records, portraits, assessment outcomes and MAP results are entirely synthetic. Faculty **names and working PLC groupings** are sourced from AISG My Observations, not invented. No PowerSchool, ManageBac, NWEA or student-support integration is live.

## Try the demo

- Open the published GitHub Pages deployment (when Pages is enabled).
- Select one of 115 real faculty names, grouped by Elementary and Secondary, in the top-right demo persona selector. Their assigned student cohorts are entirely fictional.
- Open **My Classes** and select an assigned class.
- Search by fictional name or DEMO ID.
- Open a learner profile and explore MAP Growth, academic learning, attendance and classroom guidance.
- Navigate using the URL hash, which supports GitHub Pages browser refresh/deep linking without server routing.

## Demo coverage

| Dimension | Coverage |
| --- | --- |
| Grades | PK3, PK4, K, Grades 1–12 (15 grade levels) |
| Homerooms | 4 per grade (60 total) |
| Learners | 20 per homeroom (1,200 total) |
| Faculty personas | 115 distinct actual names from My Observations (2026–27 working PLC list) |
| PLC groupings | 20 grade-level/subject/support groups; names deduplicated |
| Teacher-to-class assignments | Fully fictional, PLC-informed demo teaching cohorts |
| Student portraits | 1,200 deterministic illustrations produced locally (not photographic images of real people) |
| MAP | Simulated records in Grades 3–10; observed growth and growth versus projection are primary, RIT achievement is supporting detail |
| Attendance | Simulated daily school-day records; summary rates calculated from events |
| Academic assessments | Division-appropriate mock outcomes, status and feedback metadata |
| Classroom supports | Mock action-focused guidance; no clinical or safeguarding information |

## Development

This project intentionally requires **no package manager or external JavaScript dependencies**. It is a static ES-module application that can deploy directly to GitHub Pages.

```bash
python3 -m http.server 8000
# open http://localhost:8000/
```

Run the built-in data validation suite:

```bash
node --test tests/*.test.mjs
```

## Architecture

- `index.html`: entry point
- `src/styles.css`: AISG-inspired responsive design system
- `src/data.mjs`: deterministic generated synthetic datasets and calculations
- `src/staff.mjs`: names and PLC groupings from My Observations working roster, without observation details
- `src/faculty-demo.mjs`: visibly fictional mapping between names and generated demo classes
- `src/map-growth.mjs`: growth calculations from comparable mock MAP windows
- `src/map-growth-ui.mjs`: growth-focused cards, bars and expandable RIT supporting evidence
- `src/portraits.mjs`: local fictional illustrated portrait generator
- `src/app.js`: accessible navigation and UI rendering
- `assets/aisg-logo.webp`: optimised supplied AISG logo reference
- `assets/favicon.svg`: AISG-style square-letter favicon
- `.github/workflows/pages.yml`: validate and deploy on pushes to main

The data layer is intentionally isolated so that a future implementation may replace demo generators with approved, authorised backend data services. Note that the current client-side persona switcher **does not provide security**.

## Governance before use with real student records

A future live school deployment **must not use public GitHub Pages to serve identifiable records**. Confirm school-approved data residency, applicable PRC obligations and student-data contracts; use AISG staff SSO, backend-enforced student-level permissions, audit logging, encrypted databases and separately governed support guidance. Keep actual medical, counselling and safeguarding records in their source systems.

**MAP disclaimer:** Observed growth means the change in RIT points between two valid comparable assessments. The demo foregrounds observed versus projected growth, with a historical chart of growth intervals and RIT history available in a secondary expandable section. All fictional percentiles and growth projections are illustrative and are **not official NWEA norms or predictions**. Do not treat simulated scores as actual assessments.

**Portraits:** The demo generates locally rendered illustrated synthetic faces from deterministic seeds. They are not actual photos of students. A future visual iteration could substitute properly licensed, age-appropriate synthetic photographic portraits.

## Accessibility and QA

- Responsive layout, accessible controls, focus indicators, keyboard-interactive navigation, explicit empty states.
- Tested for desktop and mobile Chrome rendering, as available.
- Headless unit checks validate grade/class/student counts, unique IDs, attendance derivation, grade-specific academics and MAP eligibility.

## Product scope

MVP includes teacher-specific class rosters, learner demographics, mock MAP achievement/growth, recent assessment snapshot, attendance/punctuality and approved classroom guidance examples. Survey responses, predictive scores, raw medical records, counselling notes and safeguarding incidents are intentionally excluded.

School branding is reproduced with the provided logo for a fictional-data demonstrator, not as an endorsement of a public student-information service.

## Faculty names from My Observations (demo only)

The faculty selector is populated from the **2026–27 working PLC roster** in the [AISG Observations source](https://github.com/edtechevans/observations). The local `src/staff.mjs` snapshot contains **115 distinct names grouped across 20 PLCs**. Names are present in more than one PLC where the working directory lists multiple appointments; the dropdown deduplicates those names. **No observations, comments, feedback, ratings, student relationships, email addresses or other records are imported.**

The working PLC data is not the authoritative AISG HR or timetable directory and may contain aliases or stale spellings. The demonstration assigns fictional classes to real names solely to illustrate the intended user experience. No real teacher–student relationship is represented. A production rollout will require a verified official roster and backend-enforced access rules.

## MAP growth-first decisions

- On the overview, show the percentage of **comparable Fall 2026 subject results** where observed growth meets or exceeds illustrative projected growth. The numerator and denominator are visible; missing tests and students without a valid prior comparison are excluded.
- On class rosters, show **Mathematics observed growth in RIT points versus projected growth**, not the latest score alone.
- On learner profiles, foreground **observed growth**, **illustrative projection** and the **difference**, with a view of changes across historical test intervals.
- Put current RIT achievement, percentile and historical RIT plot in a collapsed supporting-evidence panel.
- Clearly mark all growth data as synthetic and avoid interpreting growth comparisons as student ability labels.
