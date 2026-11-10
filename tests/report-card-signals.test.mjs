import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords,academicFor,reportSubjectsFor} from '../src/academic-journey-data.mjs';
import {numericReportGrade,reportGradeBand,facultyRosterEvidenceColumns,leaderReportSignalSummary} from '../src/report-card-signals.mjs';
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
test('Faculty landing includes all subjects from latest issued report',()=>{
 for(const grade of ['G3','G7','G12']){
  const people=group(grade);
  const cols=facultyRosterEvidenceColumns(people,academic,everydayEvidenceForGrade(grade));
  const report=academicFor(academic,people.find(s=>academicFor(academic,s.id).reports.length)?.id).reports[0];
  for(const item of report.subjects)assert.ok(cols.some(c=>c.kind==='report'&&c.subject===item.subject));
  assert.equal(cols.filter(c=>c.kind==='report').length,reportSubjectsFor(report.grade).length);
 }
});
test('Leaders count each learner once and only numeric report grades 1 to 3',()=>{
 const secondary=group('G7');
 const results=leaderReportSignalSummary(secondary,academic);
 assert.equal(results.selected,80);
 assert.equal(results.numericReports,secondary.filter(s=>academicFor(academic,s.id).reports[0]?.scale==='1–7').length);
 assert.ok(results.rows.every(x=>x.low.length&&x.low.every(v=>v.value<=3)));
 assert.equal(results.flagged,results.rows.length);
 assert.equal(results.lowSubjectResults,results.rows.reduce((n,x)=>n+x.low.length,0));
 assert.equal(leaderReportSignalSummary(group('G6'),academic).flagged,0);
});
test('Leaders panel has report-source context and actionable filters',()=>{
 const html=renderLeaderReportFollowup({students:group('G7'),academic});
 assert.match(html,/Grades 3 and below/);
 assert.match(html,/data-leader-report-scope/);
 assert.match(html,/data-leader-report-query/);
 assert.match(html,/data-leader-report-multiple/);
 assert.match(html,/2025–26/);
 assert.match(html,/previously issued|previously issued|previously issued/i);
});