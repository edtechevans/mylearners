import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords} from '../src/academic-journey-data.mjs';
import {leaderAcademicActionModel,renderLeaderAcademicActions} from '../src/leader-academic-actions.mjs';
import {leaderMapRedReview} from '../src/leader-review-signals.mjs';
import {leaderReportSignalSummary} from '../src/report-card-signals.mjs';

const data=applyFacultyDemo(generateDemoData());
const academic=createAcademicDemoRecords(data.students);
const secondary=data.students.filter(s=>s.division==='Secondary');
const elementary=data.students.filter(s=>s.division==='Elementary');
const params={students:secondary,map:data.map,academic};

test('Academic Follow-up cards count unique scoped learners from the existing trusted selectors',()=>{
 const model=leaderAcademicActionModel(secondary,data.map,academic);
 assert.equal(model.map.rows.length,leaderMapRedReview(secondary,data.map).rows.length);
 assert.equal(model.subjects.flagged,leaderReportSignalSummary(secondary,academic,2).flagged);
 const html=renderLeaderAcademicActions(params);
 assert.match(html,/data-leader-academic-focus="map" aria-expanded="false"/);
 assert.match(html,/data-leader-academic-focus="subjects" aria-expanded="false"/);
 assert.match(html,/leader-academic-action-title">Students in MAP Low band/);
 assert.match(html,/leader-academic-action-title">Students with subject results ≤2/);
 assert.match(html,/id="leader-academic-results" class="leader-academic-results" hidden/);
 assert.doesNotMatch(html,/data-leader-student=/,'Closed cards must not reveal any named learners');
});
test('One click reveals available MAP low-band student rows with photo and exact RIT percentiles',()=>{
 const model=leaderAcademicActionModel(secondary,data.map,academic);
 const html=renderLeaderAcademicActions({...params,focus:'map'});
 assert.match(html,/data-leader-academic-focus="map" aria-expanded="true"/);
 assert.match(html,/id="leader-academic-results" class="leader-academic-results" tabindex="-1"/);
 assert.match(html,/MAP Low achievement — student list/);
 assert.match(html,/data-leader-academic-subject/);
 assert.match(html,/data-leader-academic-grade/);
 assert.match(html,/data-leader-academic-multiple aria-pressed="false"/);
 assert.match(html,/student-photo-trigger/);
 assert.match(html,/data-leader-student=/);
 assert.ok(model.map.rows.length>0);
 const first=model.map.rows[0];
 assert.ok(html.includes('data-leader-student="'+first.student.id+'"'));
 const each=first.red[0];
 assert.ok(html.includes(each.rit+' RIT · P'+each.percentile));
 assert.ok(model.map.rows.every(x=>x.red.every(r=>r.percentile>=1&&r.percentile<=20)));
});
test('Subject ≤2 action immediately reveals flagged 1–7 result chips and maintains current-year only',()=>{
 const model=leaderAcademicActionModel(secondary,data.map,academic);
 const html=renderLeaderAcademicActions({...params,focus:'subjects'});
 assert.ok(model.subjects.flagged>12,'Need a meaningful fictional demo shortlist');
 assert.match(html,/Subject results ≤2 — student list/);
 assert.match(html,/12 displayed/);
 assert.match(html,/Show all/);
 const first=model.subjects.rows[0];
 assert.ok(html.includes('data-leader-student="'+first.student.id+'"'));
 for(const mark of first.low)assert.ok(mark.value>=1&&mark.value<=2);
 assert.ok(html.includes(' / 7'));
 assert.doesNotMatch(html,/Not issued reports/, 'Explicitly mark the test results as in progress instead');
 assert.match(html,/In-progress 2026–27 numeric subject results/);
});
test('Selecting grade, subject or multiple areas filters in-scope learner list without inventing cases',()=>{
 const model=leaderAcademicActionModel(secondary,data.map,academic);
 const first=model.subjects.rows.find(x=>x.low.length>=2);
 assert.ok(first);
 const subject=first.low[0].subject;
 const html=renderLeaderAcademicActions({...params,focus:'subjects',
  grade:first.student.grade,subject,multiple:true,expanded:true});
 const filtered=model.subjects.rows.filter(x=>x.student.grade===first.student.grade&&
   x.low.length>=2&&x.low.some(y=>y.subject===subject));
 const actionIds=[...html.matchAll(/data-leader-student="(DEMO-\d+)"/g)].map(m=>m[1]);
 assert.equal(actionIds.length,filtered.length);
 assert.deepEqual(new Set(actionIds),new Set(filtered.map(x=>x.student.id)));
 assert.match(html,/data-leader-academic-multiple aria-pressed="true"/);
 assert.ok(!html.includes('Overall student risk score'));
});
test('Grade 12 has subject review but no misleading MAP link; Elementary uses MAP where eligible',()=>{
 const g12=secondary.filter(s=>s.grade==='G12');
 const dp=renderLeaderAcademicActions({students:g12,map:data.map,academic});
 assert.match(dp,/data-leader-academic-focus="subjects"/);
 assert.doesNotMatch(dp,/data-leader-academic-focus="map"/);
 const el=renderLeaderAcademicActions({students:elementary,map:data.map,academic});
 assert.match(el,/data-leader-academic-focus="map"/);
 assert.doesNotMatch(el,/data-leader-academic-focus="subjects"/);
 const g1=elementary.filter(s=>s.grade==='G1');
 assert.equal(renderLeaderAcademicActions({students:g1,map:data.map,academic}),'');
});
test('Schoolwide privacy and scoped selection: card count only before a division is chosen',()=>{
 const one=secondary.filter(s=>s.grade==='G7');
 const html=renderLeaderAcademicActions({students:one,map:data.map,academic,focus:'map',expanded:true});
 const ids=[...html.matchAll(/data-leader-student="(DEMO-\d+)"/g)].map(m=>m[1]);
 assert.ok(ids.every(id=>one.some(s=>s.id===id)));
 assert.ok(!ids.some(id=>elementary.some(s=>s.id===id)));
});
