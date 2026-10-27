import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords} from '../src/academic-journey-data.mjs';
import {createExperienceRecords} from '../src/experience-data.mjs';
import {evidenceModesForGrade,normalizeEvidenceMode,evidenceValue,
 renderClassEvidencePanel,evidenceRosterColumn} from '../src/class-evidence.mjs';

const DATA=applyFacultyDemo(generateDemoData());
const academic=createAcademicDemoRecords(DATA.students);
const experience=createExperienceRecords(DATA.students);
const group=grade=>{
 const c=DATA.classes.find(x=>x.grade===grade);
 assert.ok(c,'Grade fixture available '+grade);
 return c.studentIds.map(id=>DATA.userIndex.get(id));
};
const ctx={academic,map:DATA.map,experience,subject:'Mathematics',mapSubject:'Mathematics',window:'F26'};
test('grade-specific tabs avoid inapplicable measures',()=>{
 assert.deepEqual(evidenceModesForGrade('PK3'),['report']);
 assert.deepEqual(evidenceModesForGrade('K'),['report','core','fp','commoncore']);
 const g3=evidenceModesForGrade('G3');
 for(const id of ['report','map','ixl','core','fp','commoncore','engagement','belonging','flourishing'])
  assert.ok(g3.includes(id),'Grade 3 tab '+id);
 const g7=evidenceModesForGrade('G7');
 for(const id of ['report','map','ixl','commoncore','engagement','belonging','flourishing'])
  assert.ok(g7.includes(id),'Grade 7 tab '+id);
 assert.ok(!g7.includes('core')&&!g7.includes('fp'));
 assert.deepEqual(evidenceModesForGrade('G12'),
  ['report','commoncore','engagement','belonging','flourishing']);
 assert.equal(normalizeEvidenceMode('K','map'),'report');
});
test('every grade class renders a single selector and correctly scoped tab groups',()=>{
 for(const g of ['PK3','K','G1','G3','G5','G7','G10','G11','G12']){
  const students=group(g);
  const html=renderClassEvidencePanel(students,{...ctx,mode:'report'});
  assert.match(html,/Learning &amp; wellbeing evidence/);
  assert.match(html,/data-class-evidence="report"/);
  assert.match(html,/data-academic-subject/);
  assert.match(html,/class-evidence-selection/);
  assert.match(html,/class-evidence-breakdown/);
  if(g==='PK3')assert.doesNotMatch(html,/data-class-evidence="map"/);
  if(g==='G7')assert.match(html,/data-class-evidence="engagement"/);
  if(g==='G12')assert.doesNotMatch(html,/data-class-evidence="map"/);
 }
});
test('class MAP and wellbeing tabs read distinct fictional sources',()=>{
 const students=group('G7'),student=students[0];
 const html=renderClassEvidencePanel(students,{...ctx,mode:'map'});
 assert.match(html,/MAP subject/);
 assert.match(html,/Fall 2026/);
 assert.doesNotMatch(html,/data-academic-subject/);
 for(const subject of ['Mathematics','Reading','Language Usage']){
  const result=evidenceValue(student,{...ctx,mode:'map',mapSubject:subject});
  assert.match(result.text,/RIT|—/);
 }
 const engagement=renderClassEvidencePanel(students,{...ctx,mode:'engagement'});
 assert.match(engagement,/MaiaLearning Flourishing: not connected/);
 assert.match(engagement,/check-in index out of 100/);
 const belonging=renderClassEvidencePanel(students,{...ctx,mode:'belonging'});
 assert.match(belonging,/Belonging/);
 assert.match(evidenceRosterColumn(student,{...ctx,mode:'engagement'}),/class-evidence-result/);
});
test('Maia and Common Core stay unconnected and never fabricate student results',()=>{
 const students=group('G7');
 for(const mode of ['flourishing','commoncore']){
  const html=renderClassEvidencePanel(students,{...ctx,mode});
  assert.match(html,/Not connected/);
  assert.match(html,/No student results available/);
  for(const student of students){
   const value=evidenceValue(student,{...ctx,mode});
   assert.deepEqual(value,{text:'—',detail:'Source not connected',available:false});
  }
 }
});
