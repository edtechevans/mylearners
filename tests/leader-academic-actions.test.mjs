import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords} from '../src/academic-journey-data.mjs';
import {leaderAcademicActionModel,renderLeaderAcademicActions} from '../src/leader-academic-actions.mjs';
import {leaderMapRedReview,leaderMapBandReview} from '../src/leader-review-signals.mjs';
import {leaderReportSignalSummary} from '../src/report-card-signals.mjs';

const data=applyFacultyDemo(generateDemoData());
const academic=createAcademicDemoRecords(data.students);
const secondary=data.students.filter(s=>s.division==='Secondary');
const elementary=data.students.filter(s=>s.division==='Elementary');
const params={students:secondary,map:data.map,academic};

test('Academic Follow-up cards count unique scoped learners from the existing trusted selectors',()=>{
 const model=leaderAcademicActionModel(secondary,data.map,academic);
 const red=leaderMapRedReview(secondary,data.map);
 const orange=leaderMapBandReview(secondary,data.map,'F26','low-average');
 assert.equal(model.map.bandCounts.red,red.rows.length);
 assert.equal(model.map.bandCounts.orange,orange.rows.length);
 assert.equal(model.map.bandCounts.both,model.map.rows.length);
 assert.ok(model.map.bandCounts.both<=model.map.bandCounts.red+model.map.bandCounts.orange);
 assert.equal(model.subjects.flagged,leaderReportSignalSummary(secondary,academic,2).flagged);
 const html=renderLeaderAcademicActions(params);
 assert.match(html,/data-leader-academic-focus="map" aria-expanded="false"/);
 assert.match(html,/data-leader-academic-focus="subjects" aria-expanded="false"/);
 assert.match(html,/leader-academic-action-title">Students in MAP Low \/ Low Average/);
 assert.match(html,/leader-academic-action-title">Students with subject results ≤2/);
 assert.match(html,/id="leader-academic-results" class="leader-academic-results" hidden/);
 assert.doesNotMatch(html,/data-leader-student=/,'Closed cards must not reveal any named learners');
});
test('One click reveals available MAP low-band student rows with photo and exact RIT percentiles',()=>{
 const model=leaderAcademicActionModel(secondary,data.map,academic);
 const html=renderLeaderAcademicActions({...params,focus:'map'});
 assert.match(html,/data-leader-academic-focus="map" aria-expanded="true"/);
 assert.match(html,/id="leader-academic-results" class="leader-academic-results" tabindex="-1"/);
 assert.match(html,/MAP achievement — Red \+ Orange \(P1–40\)/);
 assert.match(html,/data-leader-map-band="both" aria-pressed="true"/);
 assert.match(html,/data-leader-map-band="low" aria-pressed="false"/);
 assert.match(html,/data-leader-map-band="low-average" aria-pressed="false"/);
 assert.match(html,/data-leader-academic-subject/);
 assert.match(html,/data-leader-academic-grade/);
 assert.match(html,/data-leader-academic-multiple aria-pressed="false"/);
 assert.match(html,/student-photo-trigger/);
 assert.match(html,/data-leader-student=/);
 assert.ok(model.map.rows.length>0);
 const first=model.map.rows[0];
 assert.ok(html.includes('data-leader-student="'+first.student.id+'"'));
 const each=first.hits[0];
 assert.ok(html.includes(each.rit+' RIT · P'+each.percentile));
 assert.ok(model.map.rows.every(x=>x.hits.every(r=>r.percentile>=1&&r.percentile<=40)));
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

test('MAP Red/Orange views cover exact percentile boundaries and deduplicate combined cohort',()=>{
 const fixture=[
  {id:'DEMO-9001',name:'Fictional Student One',grade:'G7',division:'Secondary',classId:'G7-A'},
  {id:'DEMO-9002',name:'Fictional Student Two',grade:'G7',division:'Secondary',classId:'G7-A'},
  {id:'DEMO-9003',name:'Fictional Student Three',grade:'G7',division:'Secondary',classId:'G7-B'},
  {id:'DEMO-9004',name:'Fictional Student Four',grade:'G7',division:'Secondary',classId:'G7-B'},
  {id:'DEMO-9005',name:'Fictional Student Five',grade:'G7',division:'Secondary',classId:'G7-C'}
 ];
 const map=(id,subject,p)=>({key:'F26',window:'Fall 2026',subject,date:'2026-09-15',
   rit:210,percentile:p,status:'valid',simulated:true});
 const fixtureMap={
  'DEMO-9001':[map('DEMO-9001','Reading',20),map('DEMO-9001','Mathematics',21),
   map('DEMO-9001','Language Usage',41)],
  'DEMO-9002':[map('DEMO-9002','Reading',40)],
  'DEMO-9003':[map('DEMO-9003','Reading',1)],
  'DEMO-9004':[map('DEMO-9004','Reading',41)],
  'DEMO-9005':[map('DEMO-9005','Reading',null)]
 };
 const combined=leaderMapBandReview(fixture,fixtureMap,'F26','both');
 const red=leaderMapBandReview(fixture,fixtureMap,'F26','low');
 const orange=leaderMapBandReview(fixture,fixtureMap,'F26','low-average');
 assert.deepEqual(combined.bandCounts,{red:2,orange:2,both:3});
 assert.equal(red.rows.length,2);
 assert.equal(orange.rows.length,2);
 assert.equal(combined.rows.length,3);
 assert.deepEqual(combined.rows.find(x=>x.student.id==='DEMO-9001').hits.map(x=>x.percentile),[20,21]);
 assert.deepEqual(red.rows.find(x=>x.student.id==='DEMO-9001').hits.map(x=>x.percentile),[20]);
 assert.deepEqual(orange.rows.find(x=>x.student.id==='DEMO-9001').hits.map(x=>x.percentile),[21]);
 assert.equal(combined.rows.filter(x=>x.student.id==='DEMO-9001').length,1);
 assert.equal(combined.rows.some(x=>x.student.id==='DEMO-9004'||x.student.id==='DEMO-9005'),false);
 for(const [selection,low,high] of [['both',1,40],['low',1,20],['low-average',21,40]]){
  const model=leaderMapBandReview(fixture,fixtureMap,'F26',selection);
  assert.ok(model.rows.every(x=>x.hits.every(y=>y.percentile>=low&&y.percentile<=high)));
 }
 const bothHtml=renderLeaderAcademicActions({students:fixture,map:fixtureMap,academic,focus:'map',mapBand:'both',expanded:true});
 const redHtml=renderLeaderAcademicActions({students:fixture,map:fixtureMap,academic,focus:'map',mapBand:'low',expanded:true});
 const orangeHtml=renderLeaderAcademicActions({students:fixture,map:fixtureMap,academic,focus:'map',mapBand:'low-average',expanded:true});
 assert.match(bothHtml,/leader-academic-evidence-chip map map-low/);
 assert.match(bothHtml,/leader-academic-evidence-chip map map-low-average/);
 assert.doesNotMatch(redHtml,/leader-academic-evidence-chip map map-low-average/);
 assert.doesNotMatch(orangeHtml,/leader-academic-evidence-chip map map-low"/);
 assert.match(redHtml,/data-leader-map-band="low" aria-pressed="true"/);
 assert.match(orangeHtml,/data-leader-map-band="low-average" aria-pressed="true"/);
 assert.match(bothHtml,/data-leader-map-band="both" aria-pressed="true"/);
 const onlyMulti=renderLeaderAcademicActions({students:fixture,map:fixtureMap,academic,
  focus:'map',mapBand:'both',multiple:true,expanded:true});
 assert.ok(onlyMulti.includes('data-leader-student="DEMO-9001"'));
 assert.ok(!onlyMulti.includes('data-leader-student="DEMO-9002"'));
 const redMulti=renderLeaderAcademicActions({students:fixture,map:fixtureMap,academic,
  focus:'map',mapBand:'low',multiple:true});
 assert.ok(!redMulti.includes('data-leader-student="DEMO-9001"'));
});
test('Orange and combined selection still respect grade, subject, and scope without low-growth conflation',()=>{
 const selected=secondary.filter(x=>x.grade==='G7');
 const view=leaderMapBandReview(selected,data.map,'F26','low-average');
 const actual=view.rows.filter(x=>x.hits.some(h=>h.subject==='Mathematics'));
 const html=renderLeaderAcademicActions({students:selected,map:data.map,academic,
  focus:'map',mapBand:'low-average',subject:'Mathematics',expanded:true});
 const studentIds=[...html.matchAll(/data-leader-student="(DEMO-\d+)"/g)].map(m=>m[1]);
 assert.deepEqual(new Set(studentIds),new Set(actual.map(x=>x.student.id)));
 assert.ok(studentIds.every(id=>selected.some(s=>s.id===id)));
 assert.match(html,/MAP achievement — Low Average · Orange \(P21–40\)/);
 assert.match(html,/not growth percentiles or universal RIT cutoffs/);
});
