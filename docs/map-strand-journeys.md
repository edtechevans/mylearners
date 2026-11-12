# MAP Strand Journeys: data contract and safeguards

## Public preview

The My Learners GitHub Pages dashboard uses synthetic DEMO students only. No AISG student roster, assessment export, name, email or student identifier is committed.

**Faculty quick strand check** appears above the assigned-class roster (MAP Grades 3–10). Subject cards for Reading, Mathematics and Language Usage show distinct students with Low or Low Average goal-area descriptors in Fall 2026. Buttons switch subject, descriptor and goal; the detailed Explorer includes filters and grade-specific teaching groups.

**Student history** appears on Faculty, Student and Leaders profiles. Choose subject, exact goal area, and Fall or all recorded testing windows. A milestone identifies Elementary–Secondary transitions only when actual grade-at-test metadata demonstrates a move from G3–5 to G6–12.

**Cohort pathways** follow the same students and exact goal across two selected Fall windows, showing coverage snapshots, matched rows, descriptor shifts, and a filter for recorded Elementary-to-Secondary transitions. Results remain within the viewer's authorized roster, division, grade or class scope.

## Source fields and secure joining

NWEA AssessmentResults provides up to eight Goal fields per test: Goal1Name through Goal8Name, Goal#RitScore, Goal#Adjective, Goal#Range and Goal#StdErr. It also provides StudentID, TermName, TestName, Course, overall TestRITScore and TestPercentile.

A goal adjective such as Low or LoAvg is a **descriptor, not a numeric strand percentile**. Never substitute the overall test percentile for a goal-area percentile.

For real AISG history, join multiple years of exports by StudentID and specific test term. StudentsBySchool from 2022 gives grade for its own roster period only. Never treat that as a grade for a later-year test.

The generic adapter indexAssessmentExports accepts an optional termRosters in-memory object (for example F22 with a student-ID-to-grade map derived only from the corresponding Fall 2022 roster). It can also accept grade-at-test fields when explicitly present on an assessment. This is an input contract only: public GitHub Pages does not import, fetch, upload or publish real students.

Grade-at-test is not present in the supplied AssessmentResults CSV, so additional term-matched roster data is required for true Elementary-to-Secondary tracking. If absent, show Grade unavailable and do not infer it from today's grade.

## Safe interpretation

- Compare the same exact goal name only within compatible test names/forms; a version change blocks calculation of goal RIT change.
- Mathematics goal areas must not be treated as directly comparable across the Elementary–Secondary stage boundary merely because a goal heading repeats.
- A movement from Low to Average reflects a shift in grade/term-relative achievement descriptors, not the official conditional growth percentile or proof of causation.
- Each Fall snapshot uses its own tested and goal-assessed denominator, so proportions are not fixed-cohort growth measurements.
- Missing records, missing descriptors, test-form changes and unverifiable grade transitions are never classified as low or as improvement.

## Validation and production

Run node --test tests/*.test.mjs and confirm successful GitHub Actions checks before deploying from main. The tests include grade handoff, variable coverage, version breaks, missing window protection, per-term roster grades and Faculty authorization scoping.

For production, import real multiple-year assessment and roster records only through an authenticated private AISG SharePoint/Microsoft data pipeline with role-based permissions. Do not use the public demo repository for confidential files.
