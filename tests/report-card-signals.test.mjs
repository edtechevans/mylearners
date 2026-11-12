import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords,academicFor,reportSubjectsFor,facultyDemoReport,DEMO_REPORT_YEAR,PRIMARY_DESCRIPTORS} from '../src/academic-journey-data.mjs';
import {numericReportGrade,reportGradeBand,facultyRosterEvidenceColumns,leaderReportSignalSummary,hasLowReportGrade,mypBestFitMarker} from '../src/report-card-signals.mjs';
import {everydayEvidenceForGrade} from '../src/faculty-everyday-columns.mjs';
import {renderLeaderReportFollowup} from '../src/leader-report-followup.mjs';
const data=applyFacultyDemo(generateDemoData());
const academic=createAcademicDemoRecords(data.students);
const group=g=>data.students.filter(s=>s.grade===g);
test('numeric report grades use fixed thresholds and reject descriptors',()=>{
 for(const [grade,expected] of [[1,'band-low'],[3,'band-low'],[4,'band-mid-low'],[5,'band-mid-high'],[6,'band-mid-high'],[7,'band-high']])
  assert.equal(reportGradeBand(String(grade),'1–7'),expected);
 for(const input of ['Emerging','Developing','Applying','Extending','',null,'8','0'])
  assert.equal(numericReportGrade(input,'1–7'),null);
 assert.equal(reportGradeBand('3','descriptors'),null);
});
test('provisional MYP best fits use an asterisk while completed criteria and other grades do not',()=>{
 assert.match(mypBestFitMarker({mypBestFit:true,provisional:true}),/myp-best-fit-marker/);
 assert.match(mypBestFitMarker({mypBestFit:true,provisional:true}),/>\*<\/sup>/);
 assert.equal(mypBestFitMarker({mypBestFit:true,provisional:false}),'');
 assert.equal(mypBestFitMarker({provisional:true}),'');
});
test('Faculty landing includes all current-year test subjects without Report prefixes',()=>{
 for(const grade of ['G3','G7','G12']){
  const people=group(grade);
  const cols=facultyRosterEvidenceColumns(people,academic,everydayEvidenceForGrade(grade));
  const report=facultyDemoReport(academicFor(academic,people[0].id));
  for(const item of report.subjects)assert.ok(cols.some(c=>c.kind==='report'&&c.subject===item.subject&&c.label===item.subject));
  assert.equal(cols.filter(c=>c.kind==='report').length,reportSubjectsFor(report.grade).length);
 }
});
test('Leaders count each learner once and only numeric report grades 1 to 3',()=>{
 const secondary=group('G7');
 const results=leaderReportSignalSummary(secondary,academic);
 assert.equal(results.selected,80);
 assert.equal(results.numericReports,secondary.length);
 assert.ok(results.rows.every(x=>x.low.length&&x.low.every(v=>v.value<=3)));
 assert.equal(results.flagged,results.rows.length);
 assert.equal(results.lowSubjectResults,results.rows.reduce((n,x)=>n+x.low.length,0));
 const six=leaderReportSignalSummary(group('G6'),academic);
 assert.equal(six.numericReports,80,'Grade 6 tests must use current-year MYP grades rather than prior Elementary descriptors');
 assert.ok(six.flagged>0,'Grade 6 low-grade queue must be testable');
});
test('Leaders panel has report-source context and actionable filters',()=>{
 const html=renderLeaderReportFollowup({students:group('G7'),academic});
 assert.match(html,/Students with 3 or below/);
 assert.doesNotMatch(html,/data-leader-report-scope/);
 assert.match(html,/leader-report-legend-chip/);
 assert.match(html,/leader-report-fourband/);
 assert.match(html,/data-leader-report-query/);
 assert.match(html,/data-leader-report-multiple/);
 assert.match(html,/data-leader-report-threshold="3" aria-pressed="true"/);
 assert.match(html,/data-leader-report-threshold="2" aria-pressed="false"/);
 const narrower=renderLeaderReportFollowup({students:group('G7'),academic,threshold:2});
 assert.match(narrower,/Students with 2 or below/);
 assert.match(narrower,/Subjects at 2 or below/);
 assert.match(narrower,/data-leader-report-threshold="2" aria-pressed="true"/);
 assert.match(narrower,/Two or more subjects at 2 or below/);
 assert.doesNotMatch(narrower,/<h2[^>]*>Students with 3 or below<\/h2>/);
 assert.match(html,/2026–27/);
 assert.match(html,/TEST DATA/);
 assert.match(html,/Not issued/);
});
test('Every learner has a complete current-grade demo test result for every subject',()=>{
 const seen=new Set();
 for(const student of data.students){
  const rec=academicFor(academic,student.id);
  const testReport=facultyDemoReport(rec);
  assert.equal(testReport.year,DEMO_REPORT_YEAR,student.id);
  assert.equal(testReport.grade,student.grade,student.id);
  assert.equal(testReport.issued,false,student.id);
  assert.equal(testReport.testing,true,student.id);
  const subjects=reportSubjectsFor(student.grade);
  assert.deepEqual(testReport.subjects.map(x=>x.subject),subjects,student.id);
  assert.equal(new Set(testReport.subjects.map(x=>x.subject)).size,subjects.length);
  for(const item of testReport.subjects){
   assert.ok(item.value!==null&&item.value!==undefined&&String(item.value).length>0);
   assert.equal(item.scale,testReport.scale);
   if(student.division==='Secondary'){
    assert.match(item.value,/^[1-7]$/,student.id+' '+item.subject);
    seen.add(item.value);
   }else assert.ok(PRIMARY_DESCRIPTORS.includes(item.value),student.id+' '+item.subject);
  }
 }
 assert.equal(academic.size,1200);
 assert.deepEqual([...seen].sort(),['1','2','3','4','5','6','7']);
});
test('Historic issued reports remain unmodified and separate from test data',()=>{
 for(const student of data.students){
  const rec=academicFor(academic,student.id);
  assert.equal(rec.workingReport.issued,false);
  assert.ok(rec.reports.every(r=>r.issued&&r.end<=2026));
  assert.ok(rec.reports.every(r=>r.year!=='2026–27'));
 }
});
test('All four colours are exercised by numeric Secondary test grades',()=>{
 const bandSet=new Set();
 for(const student of data.students.filter(s=>s.division==='Secondary')){
  const r=facultyDemoReport(academicFor(academic,student.id));
  for(const item of r.subjects)bandSet.add(reportGradeBand(item.value,r.scale));
 }
 assert.deepEqual([...bandSet].sort(),['band-high','band-low','band-mid-high','band-mid-low']);
});

test('Faculty filters only Secondary learners with at least one numeric subject result of 3 or below',()=>{
 for(const g of ['G6','G7','G10','G11','G12']){
  const students=group(g);
  const three=leaderReportSignalSummary(students,academic,3);
  const two=leaderReportSignalSummary(students,academic,2);
  assert.equal(students.filter(s=>hasLowReportGrade(s,academic)).length,three.flagged);
  assert.equal(students.filter(s=>hasLowReportGrade(s,academic,2)).length,two.flagged);
  assert.ok(three.flagged>0,'Each demo grade exercises the 3 or below filter');
  assert.ok(two.flagged>0,'Each demo grade exercises the 2 or below filter');
  assert.ok(two.flagged<=three.flagged,'2 or below is a subset of 3 or below');
  assert.ok(two.lowSubjectResults<=three.lowSubjectResults);
  assert.ok(two.rows.every(x=>x.low.every(item=>item.value<=2)));
 }
 for(const g of ['PK3','K','G1','G3','G5']){
  assert.equal(group(g).filter(s=>hasLowReportGrade(s,academic)).length,0,g);
 }
 assert.equal(hasLowReportGrade(null,academic),false);
 assert.equal(hasLowReportGrade(null,academic,2),false);
 const secondary=group('G7');
 assert.ok(secondary.some(student=>
  hasLowReportGrade(student,academic,3)&&!hasLowReportGrade(student,academic,2)),
  'The two filters should differ in at least one demo learner');
});
test('Leaders display all four colour bands for every synthetic subject profile',()=>{
 const html=renderLeaderReportFollowup({students:group('G7'),academic});
 for(const band of ['band-low','band-mid-low','band-mid-high','band-high'])
  assert.ok(html.includes('leader-report-legend-chip '+band),band);
 assert.match(html,/All subject results/);
 assert.match(html,/3 or below/);
 assert.match(html,/Test period/);
});
