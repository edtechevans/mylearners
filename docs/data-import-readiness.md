# Export compatibility — synthetic My Learners demo

**Privacy boundary:** Public GitHub Pages hosts only generated fictional DEMO-#### learners and simulated assessments. Never upload actual student roster exports, assessment CSVs, photos, identifiers, test records or per-student derivatives to the public repository, deployment or GitHub Actions.

The generic adapters in src/source-export-adapters.mjs define field mappings only. They accept rows passed in memory and never fetch, store, upload or transmit data. They are not a production importer. The original sensitive files were inspected separately and were not included in the application.

## Source-to-dashboard mapping

| Source | Generic field names | Demo feature |
| --- | --- | --- |
| NWEA StudentsBySchool | StudentID, Grade, StudentFirstName, StudentLastName | Roster identity and grade |
| NWEA AssessmentResults | StudentID, TermName, Course, TestRITScore, TestPercentile, AchievementQuintile | MAP Math, Reading and Language Usage score tiles and percentile bands |
| NWEA AssessmentResults | FallToFallObservedGrowth, FallToFallProjectedGrowth, FallToFallConditionalGrowthPercentile, FallToFallGrowthQuintile, FallToFallMetProjectedGrowth | Separately reported *annual* growth, not achievement percentile |
| NWEA AssessmentResults | Goal1Name through Goal8Name and matching Goal#RitScore / Goal#Adjective / Goal#Range | Subject-specific learning goals / strands |
| IXL LevelUp Diagnostic | ID, Grade, Date of completion, Overall math score, Overall math scale score, Overall math tier, Overall math percentile | Diagnostic level, separate scale score, tier and percentile with missing states |
| IXL LevelUp Diagnostic | Named domain score / tier / percentile columns | IXL domain drilldown |

## Identity and data quality

- Join StudentsBySchool.StudentID to AssessmentResults.StudentID; match IXL.ID to the same student ID. Do not join by student name.
- Normalize numeric CSV grade values 1–12 into G1–G12.
- These exports do NOT establish an authoritative class or teacher assignment, attendance source or student email; those will need a separate authenticated SIS.
- Deduplicate repeated MAP tests on student, Course and term, selecting the latest valid administration. Report unmatched IDs and duplicates.
- Use MAP Course to distinguish Reading from Language Usage. Both can have Subject = Language Arts; Math K-12 maps to Mathematics.
- Achievement percentile, AchievementQuintile, conditional *growth* percentile and growth quintile are distinct. Do not interpret growth percentile as achievement or calculate a universal RIT band from score alone.
- The current tile change against the latest preceding test window is different from reported Fall-to-Fall annual growth. Use a visible interval label if only a reported Fall-to-Fall change is available.
- One Fall CSV cannot supply previous Spring/Fall RIT results. Prior test-window files must be separately ingested for genuine history.
- IXL Overall math score is a diagnostic level: not an IXL SmartScore, its scale score, an IXL percentile or a MAP RIT. Do not combine these units.
- "--", "N/A", empty and missing values mean *not completed or unavailable*, not zero. Preserve capped values like "1,200+" without implying exact equality.
- Display assessed/eligible coverage for every optional measure instead of silently assuming every student completed it.

## Production boundary

Real AISG records require a separate private ingestion and SharePoint workflow, backed by Microsoft identity and role permissions. Store uploads outside this public repository, encrypt at rest, audit usage, and filter students by authorized teacher/division before any information is delivered to browsers. Never publish real photos, names, low-score lists or survey concern flags as static demo assets. Complete the school's privacy, retention and safeguarding review before real deployment.

## Tests

- tests/source-export-adapters.test.mjs uses wholly invented input rows.
- tests/export-aligned-demo.test.mjs checks deterministic fictional MAP and IXL coverage/fields.
- No actual uploaded CSV records, actual identifiers, names, school-result distributions or per-student derivatives are committed.

## Leaders: MAP achievement review bands (fictional demonstration)

The Leaders Academic Follow-up card supports three distinct selections, all
derived from each subject's **achievement percentile**, never from a universal
RIT score or MAP conditional growth percentile:

- **Low / Red:** 1st–20th percentile.
- **Low Average / Orange:** 21st–40th percentile.
- **Combined Red + Orange:** 1st–40th percentile. Each learner appears once,
  even if their different MAP subjects belong to different bands.

Counts are for distinct learners with at least one qualifying *current-window*
Reading, Math or Language Usage result within the chosen divisional, grade and
homeroom scope. The count for combined students is not necessarily the sum
of Red and Orange counts. Missing results and students outside MAP's eligible
grades are not classified. Student rows retain every selected-band subject
with its RIT and percentile, while grade, subject and multiple-subject filters
operate on the selected bands. The deeper legacy Red-only follow-up remains
available. This is a review aid, not a combined learner risk score.

Tests use synthetic percentile boundary cases (20/21 and 40/41) to guard
this behavior. All data remain generated fictional learner records.
