# Daily UX release - 29 October 2026

## Scope
This release is strictly presentation and interaction focused. It does not change the fictional learner source records, existing assessment calculations, student eligibility, SSS access policies, Board dataset values, or any real school data system.

## Implemented
- Shared daily-use controls in `src/daily-ux.mjs`, reusable pure functions in `src/daily-ux-core.mjs`, and visual rules in `src/daily-ux.css`.
- A keyboard-operated dashboard finder (Command/Ctrl + K); when Faculty or SSS is active it also searches learners already visible in that role's roster.
- Table-local free-text search, per-column filtering, sortable headers, and visibility controls for relevant Faculty, Leaders and Board HTML tables.
- Saved table layouts and filters, stored only as browser-local configuration (no student records or scores); reset and delete controls.
- Visible-row CSV output in the *fictional Faculty* and existing *aggregated Board* displays. Exports are not added to specialist SSS or individual Student views. Production must enforce server-side authorisation and approved export policies.
- An evidence-context banner, a non-prescriptive note separating SSS viewing from source case-management records, and Board print-view action.
- Automated syntax checks and unit regression-test workflow in GitHub Actions, with new test coverage in `tests/daily-ux.test.mjs`.

## Intentionally unchanged
- Existing learner profiles, student experience metrics and all Board source calculations.
- Existing scope filters, teacher-class assignments in the demo, and specialist support content.
- Public demo access rules. Client-side role selection remains **not** a production access boundary.
- SharePoint and all live data services.

## SharePoint migration notes
Copy the three daily UX source modules, their script and stylesheet references in `index.html`, and preserve the existing `#app` entry point. Retain the full existing application and stylesheet dependencies.

For production:
1. Replace the demo role switcher with Microsoft Entra ID authentication and server-side permissions.
2. Remove or restrict exports according to each role's privileges and school privacy decisions.
3. Server-validate any student record requests. A filtered interface is not an access-control system.
4. Prefer authoritative linked support plans over second copies of confidential case notes.
5. Replace hard-coded demo dates with source-verified assessment dates, response coverage, and source refresh timestamps.

## QA acceptance criteria
- Switching all five dashboards preserves existing data and does not leak restricted learner names in the finder.
- Faculty and Board rows sort numerically and alphabetically without replacing the source data.
- Filtered and hidden columns are accurately reflected in the visible CSV output.
- Column configuration can be saved, selected, reset and deleted; no records are saved.
- Escape closes the finder; keyboard focus is visible; reduced-motion preferences remain supported.
- At 1440 x 900 and 1280 x 800 the class roster is reachable without excessive scrolling.
- Screen-reader headings and role navigation are correct; verify focus return after dialogs.
- Run `node --test tests/*.test.mjs` and the existing real-browser journey suite.

## Outstanding before calling the product production-ready
This release does not complete the independent five-role live-browser audit, full WCAG 2.2 AA assessment, secure deployment, verified source provenance pipeline, or user study. Those must be completed on the approved platform. The current prototype remains fictional apart from historical aggregate Board content and publicly sourced staff names.
