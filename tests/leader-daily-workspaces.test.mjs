import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData,attendanceSummary} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords} from '../src/academic-journey-data.mjs';
import {createExperienceRecords} from '../src/experience-data.mjs';
import {createSSSDemoRecords} from '../src/sss-demo-data.mjs';
import {seedSupportDemo} from '../src/support-workspace-data.mjs';
import {leaderAttendanceReview,leaderAcademicReview,leaderAdvisoryClasses,
 leaderReviewQueue,renderLeaderWholeSchool,renderLeaderDivisionDaily,
 renderLeaderLearnerEvidence} from '../src/leader-daily-workspaces.mjs';

const data=applyFacultyDemo(generateDemoData());
const students=data.students;
const academic=createAcademicDemoRecords(students);
const records=createExperienceRecords(students);
const sss=createSSSDemoRecords(students);
const entries=seedSupportDemo(students,sss);
const elementary=students.filter(s=>s.division==='Elementary');
const secondary=students.filter(s=>s.division==='Secondary');
const opts={data,academic,records,sssRecords:sss,entries};
test('whole-school landing separates divisions, offers a division filter and exposes no person names',()=>{
 const html=renderLeaderWholeSchool({students,...opts,savedView:null});
 assert.match(html,/WHOLE SCHOOL · START HERE/);
 assert.match(html,/data-select="division"/);
 assert.match(html,/data-leader-division="Elementary"/);
 assert.match(html,/data-leader-division="Secondary"/);
 assert.match(html,/leader-school-voice-grid/);
 assert.doesNotMatch(html,/data-leader-student=/);
 assert.doesNotMatch(html,/leader-review-table/);
 assert.doesNotMatch(html,/learner risk score.*\d+\/100/i);
 const named=students[0].name;
 assert.ok(!html.includes(named),'Schoolwide overview should not display learner names');
 assert.doesNotMatch(html,/Attendance checks.*?through|Demo attendance · through/i);
});
test('attendance review is explicit, bounded and based only on observed attendance events',()=>{
 const result=leaderAttendanceReview(secondary,data,90);
 assert.equal(result.eligible,secondary.length);
 assert.ok(result.flagged.length>0);
 assert.ok(result.flagged.every(x=>x.rate<90));
 for(const x of result.flagged){
  const expected=attendanceSummary(data.attendance[x.student.id]);
  assert.equal(x.rate,expected.rate);
 }
});
test('Secondary academic cohorts have nested subject-result thresholds and exclude Elementary descriptors',()=>{
 const group=leaderAcademicReview(students,academic);
 assert.ok(group.at2.length>0&&group.at3.length>=group.at2.length);
 assert.ok(group.all.every(x=>x.student.division==='Secondary'));
 assert.ok(group.at2.every(x=>group.at3.includes(x)));
 assert.ok(group.at2.every(x=>x.at2.every(v=>v.score<=2)));
});
test('division view is personalised: Secondary has subject review, Elementary literacy not numeric risk',()=>{
 const secondaryHtml=renderLeaderDivisionDaily({division:'Secondary',grade:'All',students:secondary,
  allStudents:students,reviewFilter:'academic2',...opts});
 assert.match(secondaryHtml,/data-leader-grade="G12"/);
 assert.match(secondaryHtml,/data-leader-review-filter="academic2" aria-pressed="true"/);
 assert.match(secondaryHtml,/Subject results ≤2/);
 assert.match(secondaryHtml,/data-leader-student=/);
 assert.match(secondaryHtml,/data-leader-jump="leader-experience-review"/);
 assert.match(secondaryHtml,/data-leader-jump="leader-map-review"/);
 assert.match(secondaryHtml,/2026–27 simulated, in progress and not issued/);
 assert.doesNotMatch(secondaryHtml,/ATTENDANCE.*through|attendance · through/i);
 const elementaryHtml=renderLeaderDivisionDaily({division:'Elementary',grade:'All',students:elementary,
  allStudents:students,reviewFilter:'all',...opts});
 assert.match(elementaryHtml,/Literacy checks/);
 assert.match(elementaryHtml,/Attendance and early learning review/);
 assert.doesNotMatch(elementaryHtml,/data-leader-review-filter="academic2"/);
 assert.match(elementaryHtml,/Elementary report descriptors are not 1–7 grades/);
});
test('Grade 12 view does not imply MAP or IXL are current DP assessments',()=>{
 const group=secondary.filter(s=>s.grade==='G12');
 const html=renderLeaderDivisionDaily({division:'Secondary',grade:'G12',students:group,
  allStudents:students,...opts});
 assert.match(html,/MAP and IXL end at Grade 10/);
 assert.match(html,/DP subject/);
 assert.match(html,/data-leader-grade="G12" aria-pressed="true"/);
});
test('a queue never merges attendance and grades into a single calculated learner risk score',()=>{
 const q=leaderReviewQueue(secondary,data,academic,'all',false,true);
 const strict=leaderReviewQueue(secondary,data,academic,'academic2',true,true);
 const broader=leaderReviewQueue(secondary,data,academic,'academic3',true,true);
 assert.ok(strict.total>0&&strict.total<=broader.total);
 assert.ok(q.shown.length<=10);
 assert.equal(q.total,leaderReviewQueue(secondary,data,academic,'all',true,true).total);
 assert.ok(strict.shown.every(x=>x.academic.at2.length>0));
 const a=leaderReviewQueue(elementary,data,academic,'all',true,false);
 assert.ok(a.shown.every(x=>x.attendance&&x.student.division==='Elementary'));
});
test('only advisory and homeroom cohorts are eligible for Student Experience class comparison',()=>{
 const mixed=[...data.classes,{id:'0301.1',name:'IB2 Mathematics Analysis HL',
  grade:'G12',division:'Secondary'}];
 const chosen=leaderAdvisoryClasses(mixed,'Secondary','G12');
 assert.ok(chosen.length>0);
 assert.ok(chosen.every(x=>x.name!=='IB2 Mathematics Analysis HL'));
 assert.equal(leaderAdvisoryClasses(mixed,'Elementary','G12').length,0);
});
test('read-only profile shows comparable academic windows but not support case narratives',()=>{
 const student=secondary.find(s=>s.grade==='G7');
 const html=renderLeaderLearnerEvidence({student,...opts});
 assert.match(html,/data-leader-back/);
 assert.match(html,/Current subject results/);
 assert.match(html,/leader-mini-series/);
 assert.match(html,/leader-profile-grade/);
 assert.match(html,/leader-profile-voices/);
 assert.doesNotMatch(html,/Demo through|Attendance.*through/i);
 const earlier=renderLeaderLearnerEvidence({student,...opts,window:'S26'});
 assert.match(earlier,/Spring 2026/);
 assert.doesNotMatch(html,/case manager|Safeguarding incident|data-support-new|data-sss-student/i);
});
