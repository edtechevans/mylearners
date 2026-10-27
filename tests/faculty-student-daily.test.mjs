import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords,academicFor} from '../src/academic-journey-data.mjs';
import {renderClassAcademicPanel} from '../src/academic-journey-view.mjs';
import {renderStudentOverview} from '../src/student-daily-overview.mjs';
const DATA=applyFacultyDemo(generateDemoData());
const ACADEMIC=createAcademicDemoRecords(DATA.students);
const first=g=>DATA.students.find(s=>s.grade===g);
const overview=(grade,draft='')=>{
 const student=first(grade);
 return renderStudentOverview(student,ACADEMIC,{
  attendance:DATA.attendance[student.id],
  mathGrowth:null,reflectionDraft:draft
 });
};
test('Student landing has three meaningful ideas, one reflection, no class comparisons',()=>{
 for(const grade of ['PK3','K','G1','G3','G5','G7','G10','G11','G12']){
  const html=overview(grade);
  assert.match(html,/MY LEARNING TODAY/);
  assert.match(html,/student-today-celebrate/);
  assert.match(html,/student-today-progress/);
  assert.match(html,/student-today-goal/);
  assert.match(html,/data-action="save-reflection"/);
  assert.equal((html.match(/id="reflection"/g)||[]).length,1);
  assert.doesNotMatch(html,/comparison with classmates|rank within class|student percentile/i);
  assert.match(html,/Fictional learning example/);
  assert.doesNotMatch(html,/2026–27 · G\d|Current report card 2026/i);
 }
});
test('Age-responsive copy and valid assessment evidence are displayed',()=>{
 for(const grade of ['PK3','PK4','K','G1','G2']){
  const html=overview(grade);
  assert.match(html,/student-stage-early/);
  assert.match(html,/What I learned/);
  assert.doesNotMatch(html,/MAP Mathematics growth/);
 }
 for(const grade of ['G3','G4','G5'])assert.match(overview(grade),/student-stage-primary/);
 for(const grade of ['G6','G7','G11','G12'])assert.match(overview(grade),/student-stage-secondary/);
 assert.match(overview('K'),/fictional 50-item decoding check/i);
 assert.match(overview('G7'),/IXL diagnostic level/i);
 assert.doesNotMatch(overview('G12'),/IXL Mathematics diagnostic/);
 assert.doesNotMatch(overview('G12'),/MAP Mathematics growth/);
});
test('School report highlights state the issued year and prior grade explicitly',()=>{
 for(const g of ['G2','G5','G6','G7','G10','G12']){
  const s=first(g),rec=academicFor(ACADEMIC,s.id);
  const html=overview(g);
  if(rec.reports.length){
   assert.ok(html.includes(rec.reports[0].year));
   assert.ok(html.includes(rec.reports[0].grade));
  }
 }
 assert.match(overview('PK3'),/No issued report yet/);
});
test('Personal reflection is safely escaped and saved only through an existing explicit action',()=>{
 const html=overview('G5','<script>alert("oops")</script>');
 assert.doesNotMatch(html,/<script>/);
 assert.match(html,/&lt;script&gt;/);
 assert.equal((html.match(/data-action="save-reflection"/g)||[]).length,1);
});
test('Compact Faculty academic selector retains all grade-specific measures and hides large distribution by default',()=>{
 for(const grade of ['PK3','K','G3','G7','G12']){
  const cls=DATA.classes.find(c=>c.grade===grade);
  const ss=cls.studentIds.map(id=>DATA.userIndex.get(id));
  const html=renderClassAcademicPanel(ss,ACADEMIC,'report','Mathematics',{compact:true});
  assert.match(html,/academic-class-compact/);
  assert.match(html,/Show in My Roster/);
  assert.match(html,/<details class="academic-class-breakdown">/);
  assert.match(html,/Class results breakdown/);
  assert.match(html,/data-academic-mode="report"/);
  if(grade==='K')assert.doesNotMatch(html,/data-academic-mode="ixl"/);
  if(grade==='G3')assert.match(html,/data-academic-mode="core"/);
  if(grade==='G12')assert.doesNotMatch(html,/data-academic-mode="core"/);
  if(grade==='PK3')assert.match(html,/No completed reports yet/);
 }
});
