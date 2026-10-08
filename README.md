# AISG | My Learners — First Release

**[Open the My Learners demonstration](https://edtechevans.github.io/mylearners/)**

A simple, teacher-facing view of **classes, student profiles and the essential information educators look up regularly**. The first release deliberately focuses on finding information rather than launching another workflow or set of daily alerts.

## Four clear sections

| Section | First-release purpose |
| --- | --- |
| **Home** | See assigned teaching groups, learner counts and quick links to the right class |
| **My Classes** | Open a class roster; find students, attendance, recent published academic outcomes, MAP Mathematics growth and classroom guidance |
| **My Learners** | Search across assigned demo groups and open student profiles with illustrated portraits and demographics |
| **MAP Growth** | Compare observed growth to illustrative projected growth by teaching group and student, with RIT history available on individual profiles |

### Student profile
Each fictional learner has an overview, recent academic learning, MAP growth (where assessed), attendance and punctuality, and essential classroom guidance. The design remains growth-first: a change in a valid MAP score is surfaced ahead of the latest RIT value.

### Deliberately not included in the first release
- Daily **Learning Pulse** alerts, automatic evidence signals and prescribed next teaching steps.
- **My Actions** queues, intervention forms, follow-up documentation and browser-saved action records.
- Suggested **flexible grouping**, predictive insights and student-voice summaries.

Advanced exploratory modules remain in the source repository for possible later development, but **the public launch entry point does not load or expose their interaction workflows**. No first-release feature needs teachers to maintain another to-do list.

## Demonstration data and privacy

- **15 grades:** PK3, PK4, Kindergarten and Grades 1–12.
- **4 classes in every grade, 20 fictional students per class**: 60 classes and 1,200 demo student profiles.
- **115 real AISG faculty names** sourced from the already-public **My Observations 2026–27 working PLC roster**; all faculty-to-class, teacher-to-learner and timetable relationships in the demo are fabricated.
- Fictional student names, illustrations, academic assessments, attendance, MAP achievement and growth, demographic fields and classroom guidance.
- Simulated MAP Growth information only where appropriately assessed in the demo (Grades 3–10). Student profile can show RIT as secondary detail, not the headline.
- Data is fixed at a clearly marked **8 October 2026 demonstration date**; it is not current school information.
- The demo has **no live connection** to PowerSchool, ManageBac, NWEA, medical, counselling, student support, safeguarding or HR systems.
- The public GitHub Pages demonstration **must never use identifiable real student data or actual sensitive staff observation records**.

## Develop and test locally

```bash
python3 -m http.server 8765
# In another terminal:
node --test tests/*.test.mjs
MYLEARNERS_URL=http://127.0.0.1:8765 python tests/e2e/teacher_journeys.py
```

The real-browser test suite requires Playwright and Chromium. It models ten **simulated** teacher journeys and checks all public first-release views across desktop, tablet and phone widths. Simulations cannot replace observation of actual AISG educators using the app.

### Architecture
- `index.html` loads **`src/my-learners-launch.mjs`**, the streamlined public entry point.
- `src/first-release-pages.mjs`: Home and class roster.
- `src/my-learners-launch.css`: first-release visual refinements, above the AISG shared UI layer.
- `src/v2-pages.mjs`: reusable learner profiles, class lists and MAP Growth screens. Advanced experimental renderers are retained in this historical module only.
- `src/data.mjs`, `src/staff.mjs`, `src/faculty-demo.mjs`: deterministic synthetic data and real-named, fictionally assigned faculty views.
- `src/map-growth.mjs`, `src/map-growth-ui.mjs`: observed growth, projections, and underlying score history.
- `src/integration-contracts.mjs`: disabled integration specifications for a future secure platform.
- `docs/production-readiness.md`: requirements for any genuine student data integration.
- `docs/ux/real-teacher-study-protocol.md`: protocol to evaluate task speed and ease with ten actual AISG teachers.

## Roadmap — only if it proves useful

The first goal is to establish whether teachers can quickly **find the right learner, view meaningful academic evidence, interpret MAP growth and check essential support guidance**. If this helps faculty without increasing administrative workload, additional features can be reconsidered with teacher input.

Operational deployment would require institution-approved secure hosting, staff SSO, server-enforced class/student access, official source integrations, audit logs and privacy/legal approval. None of those are provided by the public demo.
