# My Learners — Student Explorer leadership usability audit
**Date:** 13 November 2026  
**Area:** Leaders → Student Explorer, reviewed independently of the other My Learners dashboards  
**Scope:** Public, simulated preview; no real student data and no real staff participants  
**Method:** Code inspection + Chrome DevTools interactive scenarios (head of school, secondary principal, elementary principal, student support, learning leader, DP coordinator, mobile leader); automated Node tests; screenshots; CSV verification  
**Evidence:** [GitHub Actions run 43371782850](https://github.com/edtechevans/mylearners/actions/runs/43371782850) → **student-explorer-leader-audit** artifact, 6 screenshots and JSON report  
**Interpretation:** Simulated roles are task profiles, **not actual leaders' opinions**. Do not attribute the observations to AISG leaders.

## Executive assessment
The technical foundations work: the default A–Z roster includes all 1,200 synthetic learners; names and the table sort correctly; grade-level curricula render; combined EAL + Learning Support filtering and navigation into/back from learner profiles work; 80 filtered G12 records export correctly. But the experience is not yet operationally efficient for a busy principal. Most space is consumed by controls before a single learner is visible. Heavy horizontal scrolling and incompatible curriculum columns weaken the schoolwide overview. Two MAP filters can produce misleading results.

**Overall:** Good functional prototype; **not ready as a leader-facing operational tool without targeted UX corrections and real-user validation.**

## Tested measurements (Chrome)
| Metric | Observed |
|---|---:|
| Simulated leader tasks completed without error | 11/11 |
| Initial default roster | 1,200 distinct synthetic learners |
| Initial A–Z order | Pass |
| Whole-school columns | 31 (18 subject-grade columns) |
| Empty subject-grade cells in whole-school view | 63.7% (13,760 blank / 21,600 subject cells) |
| Whole-school table width | 3,896 CSS px (3.06× available horizontal space) |
| Grade 7 table width | 3,005 CSS px (2.36× available horizontal space) |
| Visible subject-grade columns at 1440px | 5 of 18 schoolwide; 6 of 8 in G7 |
| Whole-school keyboard stops in table | 4,270 |
| First student row at 1440×900 | ~1,031px from viewport top (below fold) |
| First student row on 390×844 mobile | ~1,461px from top (well below fold) |
| Whole-school route + initial Explorer render | ~4.8 s in CI Chrome (one measurement, not a benchmark) |
| Query-triggered whole-school rerender | ~109 ms for one search input (one measurement) |
| Filtered G7 EAL + Learning Support matching students | 6 |
| Filtered G12 CSV learner count and subject columns | 80, matching the UI |
| Mobile horizontal navigation button | Moves the scroller 520px as intended |
| Uncaught browser exceptions | 0 |

## Critical findings and recommendations
### High — H1. First student is not visible when entering Explorer
At 1440×900, the first row begins at y≈1,031px. On a phone it begins at y≈1,461px. The screen opens to a large branded page header, a second Student Explorer heading, 12 always-expanded filters, two export controls, the sort controls, and a MAP legend. A leader intending to **scan learners** must scroll before seeing one.

**Fix:** Prioritise the table. Keep one compact title and a sticky row with Search, Division, Grade and Show Filters. Hide the remaining criteria behind a clearly labelled expandable filter drawer with an active-filter count/chips. Retain horizontal navigation above the visible table and keep the student count prominent. Aim to show the first learner on the initial desktop viewport.

### High — H2. Keyboard access is impractical
The whole-school table exposes 4,270 interactive elements to keyboard navigation. This undermines the otherwise useful full-school view.

**Fix:** Use a roving tabindex or accessible grid pattern so only one row/cell action is in the tab order; arrow keys navigate within the grid. Consider DOM virtualization for 1,200 learners (while preserving complete results, export, sort, and screen-reader semantics).

### High — H3. MAP Low strand filter silently returns zero
Reproduction: reset; MAP test = Reading; MAP strand left at All strands; Strand descriptor = Low. The UI shows zero learners despite low goal descriptors existing in the synthetic data. Source logic checks \`row.goal\`, which is populated only when a named goal is selected.

**Fix:** When no named strand is selected, match \`any\` goal of the selected MAP assessment with the chosen descriptor, and display which goal(s) matched. When a goal is selected, scope the descriptor to that goal. Explain the scope above results. Test for Math/Reading/Language Usage and missing assessments.

### High — H4. Column design undermines whole-school comparability
Whole school requires 18 different subject headings to span PK–12. 63.7% of the grade cells are empty. A 3,896px-wide table displays just five subject columns in the initial viewport, leaving core MAP/experience/support evidence far to the right.

**Fix:** Preserve all 1,200 learners A–Z. In the *All grades* view, show each student's actual subjects as compact per-learner chips or a controlled academic drilldown, not 18 cross-programme columns filled mostly with dashes. A selected grade/division switches to the Faculty-style full-width subject columns (as it already does). Do not collapse different curriculum grading scales into one numeric mean.

### Medium — M1. All-tests MAP band is visually inconsistent
Reproduction: MAP test = All MAP tests; MAP percentile band = Low. The filter yields 57 learners while the MAP band column renders \`—\` because it expects a single focused assessment.

**Fix:** Show subject-labelled matching bands (e.g., Reading Low; Math Low Average) or require a specific subject when a single-band column is shown; avoid an all-tests filter with a blank explanation.

### Medium — M2. Subject filter doesn't answer the leader's likely question
Selecting Mathematics checks that a student has the subject; it does not help find scores of 2 or below, a declining grade, or students with no result. The same subject grades remain visible, which is good, but no academic criterion is applied.

**Fix:** Pair Subject with *Grade / evidence status* filters appropriate to programme: e.g., MYP numeric ≤2 or ≤3, and descriptive statuses for Elementary. Offer Any subject for a cross-disciplinary scan. Include source and grading period.

### Medium — M3. Grade tiles lose Faculty's subject-level evidence interactions
The matching grade chips are static \`span\` elements with only a title. In the Faculty view, the same evidence treatment offers richer comparison and historic context.

**Fix:** Make grade tiles a focused action that opens the existing subject grade detail/history popover/drawer (without leaking student data). Retain the provisional \`*\` information and latest-versus-previous dates.

### Medium — M4. Row context is lost when horizontally scrolling
Only the learner name is sticky. Grade, class and teacher quickly scroll away, weakening context when the table is 2–3 viewport widths wide.

**Fix:** Freeze learner + grade (and optionally class). Use a sticky header, keep sort indicator visible, and add an accessible jump-to-subject selector; arrow nudges alone are slow for a table this wide.

### Medium — M5. Colour-only experience bands are ambiguous
Engagement/Belonging use coloured marks with aria-label and title, but no succinct visible status text. This depends on colour interpretation and may confuse staff.

**Fix:** Add a small text label or pattern alongside colour, keep a consistent accessible legend, and ensure hover/focus guidance names the band, dates, and source. Avoid putting the raw index back in the default tile if that conflicts with design direction.

### Medium — M6. The schoolwide teacher column is potentially ambiguous
Without a Teacher filter, the shown name is the demo lead for a class; selecting an assigned specialist switches the displayed teacher. A principal could treat the default name as a subject teacher or only associated teacher.

**Fix:** Label it Homeroom / Advisor on the global roster; use explicit subject-teacher assignments only where source timetable data support them. Avoid conflating multiple staff relationships.

### Deployment / privacy — Production gating
This repository is an intentionally public demonstration. EAL, Learning Support and exported learner combinations must **not** be deployed against real named AISG students behind a client-only role switch. Production requires authenticated leader identity, server-side authorization, field-level permissions, secure exports/auditing, and meaningful source/as-of labels.

## What worked in actual browser checks
- A–Z whole-school roster of 1,200 synthetic students (no list truncation).
- Grade 7 filters to 80 students and retains all eight MYP subject columns.
- Numeric Mathematics sort gives a correctly ascending Grade 7 roster.
- Combined Grade 7 + Mathematics + active EAL + Learning Support yields six students without dropping subject columns.
- Clicking an Explorer student's name opens the learner profile; Back to Student Explorer preserves the six-person filtered result.
- Grade 2 shows 480 descriptive subject grade tiles for its 80 students.
- Grade 12 shows six subject columns and correctly omits MAP RIT subject tiles (but still shows empty MAP band/strand footer columns).
- CSV export matches 80 filtered Grade 12 students and retains every selected curriculum subject column.
- At 390px, table-left/right controls work, and no document-wide horizontal overflow was detected.

## Real leader pilot — not yet performed
No AISG colleagues were contacted and no genuine leader opinions were obtained. Run a 10-minute think-aloud check with 1 Elementary Principal, 1 Secondary Principal and 1 Learning Support / EAL leader, each individually:
1. Without help, open Student Explorer and find the current number of students.
2. Find Grade 7 students with Mathematics 2 or below. Note whether the available controls allow this.
3. Find students with Learning Support and active EAL in a grade.
4. Find students with a Low MAP Reading strand. Ask which strand they found and whether they trust the results.
5. Open a learner, inspect the available context, and return without losing the filters.
6. Export the current selection and explain what the columns mean.

Ask each person to narrate where they expect to click, not to praise or critique the visual styling. Record independently: time to first result, task completion, wrong turns, unexpected blank results, confidence in the data, favourite feature and top desired change. Do not supply task instructions pointing to specific controls. Stop immediately if any real data access is in question.

### Invitation text
> Could I borrow 10 minutes to test the new My Learners Student Explorer? It uses demonstration student information. I'd like you to try a handful of tasks without guidance and tell me where the experience helps or gets in the way. I'm particularly interested in how quickly you can find a group of learners, understand the results and get back to their profiles. No preparation needed, and critical feedback is more useful than polite feedback.

## Suggested sequence
1. **Immediate fixes:** H3 strand logic, M1 all-tests band mismatch, clearer filter dependencies.
2. **Leader-first UX:** H1 bring learners above fold; H2 keyboard/grid performance; H4 schoolwide column representation.
3. **Deeper functionality:** subject low-grade threshold, evidence popovers, adviser/subject teacher semantics, clearer experience indicators.
4. **Human test:** 3–5 actual leaders, then revise before any production data integration.
