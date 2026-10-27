import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords} from '../src/academic-journey-data.mjs';
import {createExperienceRecords} from '../src/experience-data.mjs';
import {evidenceModesForGrade,normalizeEvidenceMode,evidenceValue,
 renderClassEvidencePanel,evidenceRosterColumn,evidenceLabel,normalizeComparison} from '../src/class-evidence.mjs';

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
 assert.deepEqual(evidenceModesForGrade('K'),['report','core','fp']);
 const g3=evidenceModesForGrade('G3');
 for(const id of ['report','map','ixl','core','fp','engagement','belonging','flourishing'])
  assert.ok(g3.includes(id),'Grade 3 tab '+id);
 const g7=evidenceModesForGrade('G7');
 for(const id of ['report','map','ixl','engagement','belonging','flourishing'])
  assert.ok(g7.includes(id),'Grade 7 tab '+id);
 assert.ok(!g7.includes('core')&&!g7.includes('fp'));
 assert.deepEqual(evidenceModesForGrade('G12'),
  ['report','engagement','belonging','flourishing']);
 // Core Phonics and F&P are Elementary (K–G5) only; never show in Secondary.
 for(const g of ['K','G1','G2','G3','G4','G5']){
  const modes=evidenceModesForGrade(g);
  assert.ok(modes.includes('core') && modes.includes('fp'),g+' Elementary assessment tabs');
 }
 for(const g of ['PK3','PK4','G6','G7','G8','G9','G10','G11','G12']){
  const modes=evidenceModesForGrade(g);
  assert.ok(!modes.includes('core') && !modes.includes('fp'),g+' must not show Elementary assessments');
 }
 for(const g of ['PK3','K','G1','G3','G5','G7','G12']){
  assert.ok(!evidenceModesForGrade(g).includes('commoncore'),g+' must not have Common Core tab');
 }
 assert.equal(normalizeEvidenceMode('K','map'),'report');
});
test('every grade class renders a single selector and correctly scoped tab groups',()=>{
 for(const g of ['PK3','K','G1','G3','G5','G7','G10','G11','G12']){
  const students=group(g);
  const html=renderClassEvidencePanel(students,{...ctx,mode:'report'});
  assert.match(html,/Learning &amp; wellbeing evidence/);
  assert.match(html,/data-class-evidence="report"/);
  if(g!=='PK3')assert.match(html,/data-academic-subject/);
  else assert.doesNotMatch(html,/data-academic-subject/);
  assert.match(html,/class-evidence-selection/);
  assert.doesNotMatch(html,/Common Core|data-class-evidence="commoncore"/);
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
test('Maia stays unconnected and never fabricates student results',()=>{
 const students=group('G7');
 for(const mode of ['flourishing']){
  const html=renderClassEvidencePanel(students,{...ctx,mode});
  assert.match(html,/Not connected/);
  assert.match(html,/No student results available/);
  for(const student of students){
   const value=evidenceValue(student,{...ctx,mode});
   assert.deepEqual(value,{text:'—',detail:'Source not connected',available:false});
  }
 }
});

test('optional comparison shows two independent measures and no invented relationship',()=>{
 const learners=group('G7');
 const html=renderClassEvidencePanel(learners,{...ctx,mode:'map',compare:'belonging'});
 assert.match(html,/data-class-compare/);
 assert.match(html,/value="belonging" selected/);
 assert.match(html,/class-evidence-selection has-comparison/);
 assert.match(html,/Two measures shown separately/);
 assert.match(html,/No combined score/);
 assert.match(html,/data-map-subject/);
 assert.match(html,/data-class-window/);
 assert.match(html,/MAP Mathematics growth/);
 assert.match(html,/Belonging/);
 assert.equal((html.match(/class="class-evidence-selected"/g)||[]).length,2);
 assert.doesNotMatch(html,/correlat|intervention recommended|at.risk/i);
 const one=learners[0];
 const growth=evidenceRosterColumn(one,{...ctx,mode:'map'});
 const belonging=evidenceRosterColumn(one,{...ctx,mode:'belonging'});
 assert.match(growth,/RIT|No comparable|No current/);
 assert.match(belonging,/check-in index|No check-in/);
 assert.notEqual(growth,belonging);
});
test('comparison options respect grade availability and exclude the selected measure',()=>{
 const primary='report';
 const kindergarten=renderClassEvidencePanel(group('K'),{...ctx,mode:primary,compare:'belonging'});
 assert.match(kindergarten,/data-class-compare/);
 assert.match(kindergarten,/value="core"/);
 assert.match(kindergarten,/value="fp"/);
 assert.doesNotMatch(kindergarten,/value="belonging"/);
 assert.doesNotMatch(kindergarten,/data-class-evidence="map"/);
 const secondary=renderClassEvidencePanel(group('G7'),{...ctx,mode:'map',compare:'map'});
 assert.doesNotMatch(secondary,/class-evidence-selection has-comparison/);
 assert.match(secondary,/value="none" selected/);
 const elementary=renderClassEvidencePanel(group('G3'),{...ctx,mode:'report',compare:'core'});
 assert.match(elementary,/class-evidence-selection has-comparison/);
 assert.equal(normalizeComparison('G7','map','core'),'none');
 assert.equal(normalizeComparison('G7','map','map'),'none');
 assert.equal(normalizeComparison('G7','map','belonging'),'belonging');
 assert.equal(evidenceLabel('engagement',{window:'S26'}),'Engagement · Spring 2026');
});
test('a second report or MAP measure keeps its own subject selector',()=>{
 const learners=group('G7');
 const mapAndReport=renderClassEvidencePanel(learners,{...ctx,mode:'map',compare:'report'});
 assert.match(mapAndReport,/data-map-subject/);
 assert.match(mapAndReport,/data-academic-subject/);
 const reportAndMap=renderClassEvidencePanel(learners,{...ctx,mode:'report',compare:'map'});
 assert.match(reportAndMap,/data-map-subject/);
 assert.match(reportAndMap,/data-academic-subject/);
 const none=renderClassEvidencePanel(learners,{...ctx,mode:'report',compare:'none'});
 assert.doesNotMatch(none,/class-evidence-selection has-comparison/);
 assert.doesNotMatch(none,/No combined score/);
});
test('teachers can choose real check-in windows without treating an index as a percentage',()=>{
 const learners=group('G7');
 const spring=renderClassEvidencePanel(learners,{
  ...ctx,mode:'engagement',compare:'map',window:'S26'
 });
 assert.match(spring,/data-class-window/);
 assert.match(spring,/value="S26" selected/);
 assert.match(spring,/Spring 2026/);
 assert.match(spring,/index out of 100/);
 assert.match(spring,/not a percentage or validated score/i);
 const first=learners[0];
 const a=evidenceValue(first,{...ctx,mode:'engagement',window:'F25'});
 const b=evidenceValue(first,{...ctx,mode:'engagement',window:'F26'});
 if(a.available)assert.match(a.detail,/Fall 2025/);
 if(b.available)assert.match(b.detail,/Fall 2026/);
});
