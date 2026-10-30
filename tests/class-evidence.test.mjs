import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords} from '../src/academic-journey-data.mjs';
import {createExperienceRecords} from '../src/experience-data.mjs';
import {createMaiaDemoRecords,maiaClassSummary,maiaFor,maiaEligible,MAIA_DIMENSIONS,renderMaiaFacultyProfile} from '../src/maia-demo.mjs';
import {evidenceModesForGrade,normalizeEvidenceMode,evidenceValue,
 renderClassEvidencePanel,evidenceRosterColumn,evidenceLabel,normalizeComparison} from '../src/class-evidence.mjs';

const DATA=applyFacultyDemo(generateDemoData());
const academic=createAcademicDemoRecords(DATA.students);
const experience=createExperienceRecords(DATA.students);
const maia=createMaiaDemoRecords(DATA.students);
const group=grade=>{
 const c=DATA.classes.find(x=>x.grade===grade);
 assert.ok(c,'Grade fixture available '+grade);
 return c.studentIds.map(id=>DATA.userIndex.get(id));
};
const ctx={academic,map:DATA.map,experience,maia,maiaDimension:'relationships',maiaWindow:'F26',subject:'Mathematics',mapSubject:'Mathematics',window:'F26'};
test('grade-specific tabs avoid inapplicable measures',()=>{
 assert.deepEqual(evidenceModesForGrade('PK3'),['report']);
 assert.deepEqual(evidenceModesForGrade('K'),['report','core','fp']);
 const g3=evidenceModesForGrade('G3');
 for(const id of ['report','map','ixl','core','fp','engagement','belonging'])
  assert.ok(g3.includes(id),'Grade 3 tab '+id);
 const g7=evidenceModesForGrade('G7');
 for(const id of ['report','map','ixl','engagement','belonging','flourishing'])
  assert.ok(g7.includes(id),'Grade 7 tab '+id);
 assert.ok(!g7.includes('core')&&!g7.includes('fp'));
 assert.ok(g7.includes('flourishing'));
 assert.ok(!evidenceModesForGrade('G5').includes('flourishing'));
 assert.ok(evidenceModesForGrade('G6').includes('flourishing'));
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
  assert.match(html,/Learning &amp; Wellbeing Evidence/);
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
 assert.match(engagement,/Maia-style PERMA examples are available separately/);
 assert.match(engagement,/check-in index from −2 to +2/);
 const belonging=renderClassEvidencePanel(students,{...ctx,mode:'belonging'});
 assert.match(belonging,/Belonging/);
 assert.match(evidenceRosterColumn(student,{...ctx,mode:'engagement'}),/class-evidence-result/);
});
test('Maia example populates only Secondary learners with five fictional PERMA dimensions',()=>{
 const secondary=group('G7');
 const example=renderClassEvidencePanel(secondary,{...ctx,mode:'flourishing'});
 assert.match(example,/data-maia-dimension/);
 assert.match(example,/data-maia-window/);
 assert.match(example,/illustrative 0–10 display scale/);
 assert.match(example,/Fictional Maia example/);
 assert.match(example,/5 PERMA dimensions|Five PERMA dimensions/);
 assert.doesNotMatch(example,/Not connected|No student results available/);
 const summary=maiaClassSummary(secondary,maia,'relationships','F26');
 assert.ok(summary.available>0&&summary.available<=summary.eligible);
 assert.ok(summary.average>=0&&summary.average<=10);
 const one=secondary.find(s=>maiaFor(maia,s.id));
 assert.ok(one);
 assert.equal(Object.keys(maiaFor(maia,one.id).dimensions).length,5);
 for(const dim of MAIA_DIMENSIONS){
  const score=maiaFor(maia,one.id).dimensions[dim.key];
  assert.ok(score>=0&&score<=10);
 }
 const cell=evidenceRosterColumn(one,{...ctx,mode:'flourishing'});
 assert.match(cell,/Fall 2026/);
 assert.match(cell,/illustrative PERMA value/);
 const profile=renderMaiaFacultyProfile(one,maia);
 assert.match(profile,/data-maia-profile/);
 assert.match(profile,/Positive Emotion/);
 assert.match(profile,/Accomplishment/);
 for(const grade of ['PK3','K','G3','G5']){
  for(const student of group(grade)){
   assert.equal(maiaEligible(student),false);
   assert.equal(maia.has(student.id),false);
   assert.equal(renderMaiaFacultyProfile(student,maia),'');
  }
  assert.doesNotMatch(renderClassEvidencePanel(group(grade),{...ctx,mode:'report'}),/data-class-evidence="flourishing"/);
 }
});
test('Maia PERMA can appear beside MAP or Belonging without inventing blended scores',()=>{
 const students=group('G7');
 const panel=renderClassEvidencePanel(students,{...ctx,mode:'map',compare:'flourishing',maiaDimension:'meaning'});
 assert.match(panel,/Maia dimension/);
 assert.match(panel,/Maia window/);
 assert.match(panel,/value="meaning" selected/);
 assert.match(panel,/Two measures shown separately/);
 assert.match(panel,/No combined score/);
 assert.match(panel,/0–10 display scale/);
 const older=renderClassEvidencePanel(group('G6'),{...ctx,mode:'flourishing',maiaWindow:'F25'});
 assert.match(older,/0 of 20 fictional responses/);
 const recent=renderClassEvidencePanel(group('G6'),{...ctx,mode:'flourishing',maiaWindow:'F26'});
 assert.match(recent,/fictional responses/);
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
 assert.match(spring,/index from −2 to +2/);
 assert.match(spring,/not a percentage/i);
 const first=learners[0];
 const a=evidenceValue(first,{...ctx,mode:'engagement',window:'F25'});
 const b=evidenceValue(first,{...ctx,mode:'engagement',window:'F26'});
 if(a.available)assert.match(a.detail,/Fall 2025/);
 if(b.available)assert.match(b.detail,/Fall 2026/);
});
