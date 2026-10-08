# AISG | My Learners

**Know the Learner. Understand the Evidence. Respond with Purpose.**

A polished, client-side demonstration of a teacher-centred student learning dashboard for the American International School of Guangzhou (AISG). The application uses a supplied AISG logo and provides fictional, coherent learning data and locally generated illustrated portraits.

> **DEMO ONLY — NO REAL STUDENT INFORMATION.** The 1,200 student profiles, teacher names, class rosters, attendance records, portraits, assessment outcomes and MAP results are entirely synthetic. No PowerSchool, ManageBac, NWEA or student-support integration is live.

## Try the demo

- Open the published GitHub Pages deployment (when Pages is enabled).
- Select a teacher or specialist persona in the top-right menu.
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
| Teachers | 60 fictional homeroom/advisory personas |
| Specialists | EAL, Learning Inclusion and Divisional Leader personas |
| Student portraits | 1,200 deterministic illustrations produced locally (not photographic images of real people) |
| MAP | Simulated records in Grades 3–10, with appropriate historical windows |
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
- `src/portraits.mjs`: local fictional illustrated portrait generator
- `src/app.js`: accessible navigation and UI rendering
- `assets/aisg-logo.webp`: optimised supplied AISG logo reference
- `assets/favicon.svg`: AISG-style square-letter favicon
- `.github/workflows/pages.yml`: validate and deploy on pushes to main

The data layer is intentionally isolated so that a future implementation may replace demo generators with approved, authorised backend data services. Note that the current client-side persona switcher **does not provide security**.

## Governance before use with real student records

A future live school deployment **must not use public GitHub Pages to serve identifiable records**. Confirm school-approved data residency, applicable PRC obligations and student-data contracts; use AISG staff SSO, backend-enforced student-level permissions, audit logging, encrypted databases and separately governed support guidance. Keep actual medical, counselling and safeguarding records in their source systems.

**MAP disclaimer:** Fictional percentiles and growth projections are illustrative and are **not official NWEA norms or predictions**. Do not treat simulated scores as actual assessments.

**Portraits:** The demo generates locally rendered illustrated synthetic faces from deterministic seeds. They are not actual photos of students. A future visual iteration could substitute properly licensed, age-appropriate synthetic photographic portraits.

## Accessibility and QA

- Responsive layout, accessible controls, focus indicators, keyboard-interactive navigation, explicit empty states.
- Tested for desktop and mobile Chrome rendering, as available.
- Headless unit checks validate grade/class/student counts, unique IDs, attendance derivation, grade-specific academics and MAP eligibility.

## Product scope

MVP includes teacher-specific class rosters, learner demographics, mock MAP achievement/growth, recent assessment snapshot, attendance/punctuality and approved classroom guidance examples. Survey responses, predictive scores, raw medical records, counselling notes and safeguarding incidents are intentionally excluded.

School branding is reproduced with the provided logo for a fictional-data demonstrator, not as an endorsement of a public student-information service.
