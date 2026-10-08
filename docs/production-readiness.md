# AISG | My Learners 2.0 — Production Readiness & Implementation Architecture

## Current release: public synthetic demonstration

**Status: GitHub Pages demo, not a live student-information system.** No actual student data, verified teacher-class assignment, assessment result, attendance, medical record or intervention is connected. Staff names and PLC groupings come from AISG My Observations; demo class links remain wholly fictional.

## Four transformation phases

| Phase | Demonstration delivered | Real operational work outstanding |
| --- | --- | --- |
| 1 — Daily experience | Today's Learning Pulse, class timetable mock, Class Pulse matrix, learner timeline, grades-specific views | Authoritative teaching timetable, daily user research, real accessibility and usability pilot |
| 2 — Daily evidence | Synthetic attendance, formative checks, submissions, provenance, change signals | Approved read-only PowerSchool and ManageBac APIs, source permissions, secure hosting, quality reconciliation |
| 3 — Follow-up actions | Local Notice → Respond → Revisit records, reviews, editable temporary grouping, evidence explanations | Audited authorised storage, MTSS workflow approval, retention, leadership policy |
| 4 — Connected intelligence | Aggregated synthetic learner voice, MAP growth context, transparent rules | Permissioned climate aggregation and AI governance; no external AI requests from public demo |

## Proposed secure production architecture

### Identity and access
- School-approved Microsoft Entra ID SSO after AISG IT confirmation.
- Backend-enforced staff -> class -> student permissions; deny cross-class URL/API access.
- Refresh permissions after roster, timetable and staff assignment changes.
- Approved specialist classroom accommodations behind separate, audited entitlements.
- Restricted medical, counselling and CPOMS narratives remain in their authoritative systems.

### Source contracts

PowerSchool is authoritative for student identifiers, enrolment, classes, staff assignments and daily attendance. ManageBac is authoritative for curriculum-aligned classroom assessment, published feedback and assignment status. NWEA provides valid MAP assessment windows, official observed/projected growth and norms where available under licence. Approved Student Support sources may provide classroom-action guidance only. Student Voice offers thresholded aggregates with appropriate consent and source access.

The code in src/integration-contracts.mjs defines required fields and example freshness targets while deliberately prohibiting live connections in GitHub Pages. Real connectors require server-side implementation, monitoring, error handling, retention and signed-off AISG hosting.

### Daily change detection
- Detect new and changed attendance, published formative evidence and submissions.
- Record source, time, class, affected student identifier, data change and permissions.
- Prioritise changes relevant to a teacher's next scheduled class.
- Group repeated updates into one navigable class item.
- Surface stale source data and separate unknown, missing, not assessed and zero.
- Avoid automatically inferring the reason for an absence or a student's wellbeing.

### Meaningful follow-up
- Keep teacher-owned instructional responses lightweight.
- Separate informal Tier 1 adjustments from formally coordinated MTSS plans.
- Save evidence link, chosen action, review date and optional outcome.
- Provide transparent status, permissions and audit history.
- Ensure flexible groups are temporary and teacher-editable, not ability labels.

### Human-centred intelligence
- First use inspectable rules with source date, sample size and explicit evidence.
- Phrase patterns as questions to explore, not diagnostic judgements.
- Any future AI model must undergo data-security, student-privacy, legal, human-review and model-quality checks. It must show the evidence behind its conclusions and have an off switch.
- Do not send health, medical, counselling, safeguarding or other confidential student records to third-party AI without an approved basis and protection.

### Governance / jurisdiction
Complete AISG legal, safeguarding and security reviews for the PRC Personal Information Protection Law, minors' data, cross-border transfer, vendor data contracts, lawful basis, data residency, retention, encryption, logging and incident response before any real deployment.

**Separate high-priority confidentiality check:** The published My Observations README describes a public CSV containing identifiable faculty observation notes and feedback. This issue requires an authorised review of the Observations repository itself. My Learners only copies already-public staff names/PLC groupings, not those observation records.

## Rollout and quality gates

1. **Synthetic UX pilot:** Elementary, Secondary, DP, EAL and learning inclusion teachers test daily workflows, clarity, grouping, growth context, and responsiveness.
2. **Secure technical pilot:** Approved read-only PowerSchool student scope on a private, institution-approved host.
3. **Quality-checked evidence:** ManageBac and NWEA mappings verified against authoritative sources, with clear source-date indicators.
4. **Teacher-response pilot:** School-approved storage and auditing of follow-up actions.
5. **Aggregated student voice:** Minimum sample size, permission and consent rules.
6. **Optional governed AI:** Only after strong data-quality evidence and teacher use patterns.

## Teacher usability success targets

- Open next class with daily context in under 30 seconds.
- Locate a recent evidence pattern in under 60 seconds.
- Find permitted classroom support guidance in under 15 seconds.
- Examine a growth question with the underlying MAP evidence in under 60 seconds.
- Record and revisit a short teaching response in under 30 seconds.

These are proposed design targets—not observed performance figures. Measure and refine with actual AISG teachers before calling the live platform production-ready.
