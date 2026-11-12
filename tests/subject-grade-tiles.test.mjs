import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData,gradeNumber} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords,academicFor,facultyDemoReport} from '../src/academic-journey-data.mjs';
import {renderSubjectGradeTiles} from '../src/subject-grade-tiles.mjs';
const data=applyFacultyDemo(generateDemoData());
const records=createAcademicDemoRecords(data.students);
const first=grade=>data.students.find(s=>s.grade===grade);
test('Shared current subject cards cover every subject for each programme',()=>{
 for(const g of ['PK3','G3','G6','G10','G11','G12']){
  const learner=first(g),report=facultyDemoReport(academicFor(records,learner.id));
  const html=renderSubjectGradeTiles(learner,records);
  assert.equal((html.match(/class="sg-card /g)||[]).length,report.subjects.length,g);
  assert.match(html,/Subject grades & progress/);
  assert.doesNotMatch(html,/>INC</);
  if(gradeNumber(g)>=6&&gradeNumber(g)<=10)assert.match(html,/1–3/);
 }
});
test('G6-G10 projected MYP grades always mirror current best fit and use an asterisk for partial criteria only',()=>{
 for(const learner of data.students.filter(s=>gradeNumber(s.grade)>=6&&gradeNumber(s.grade)<=10)){
  const report=facultyDemoReport(academicFor(records,learner.id));
  const html=renderSubjectGradeTiles(learner,records,true);
  const projected=report.subjects.filter(x=>x.provisional).length;
  assert.equal((html.match(/class="sg-card /g)||[]).length,report.subjects.length);
  assert.equal((html.match(/class="myp-best-fit-marker sg-asterisk"/g)||[]).length,projected*2-
   report.subjects.filter(x=>x.provisional&&!academicFor(records,learner.id).reports.some(r=>r.issued&&r.framework===report.framework&&r.scale===report.scale&&r.subjects.some(y=>y.subject===x.subject))).length);
  for(const subject of report.subjects){
   assert.ok(html.includes(subject.subject.replaceAll('&','&amp;')));
   assert.ok(html.includes('Criterion A:'));
   assert.ok(html.includes('Criterion D:'));
  }
  assert.doesNotMatch(html,/>INC</);
 }
});
test('MYP progress never mixes Elementary descriptors, while DP and Elementary omit MYP criteria',()=>{
 const six=renderSubjectGradeTiles(first('G6'),records,true);
 assert.match(six,/No comparable earlier subject report/);
 assert.doesNotMatch(six,/Last issued · 2025–26/);
 for(const grade of ['G3','G11']){
  const html=renderSubjectGradeTiles(first(grade),records,true);
  assert.doesNotMatch(html,/class="sg-criteria"/);
  assert.doesNotMatch(html,/class="myp-best-fit-marker sg-asterisk"/);
 }
});
