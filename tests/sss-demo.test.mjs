import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData,GRADES,gradeNumber} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {demoTagsForStudent} from '../src/learner-tags.mjs';
import {createAcademicDemoRecords,academicFor} from '../src/academic-journey-data.mjs';
import {createExperienceRecords} from '../src/experience-data.mjs';
import {createSSSDemoRecords,isSSSDemoMember,sssCohort,sssRecordFor} from '../src/sss-demo-data.mjs';
import {renderSSSOverview,renderSSSStudentProfile} from '../src/sss-view.mjs';

const data=applyFacultyDemo(generateDemoData());
const academics=createAcademicDemoRecords(data.students);
const experience=createExperienceRecords(data.students);
const sssRecords=createSSSDemoRecords(data.students);
const cohort=sssCohort(data.students,sssRecords);
const context={data,academicRecords:academics,experienceRecords:experience,sssRecords};

test('SSS uses only fictional shared learner records and a limited programme cohort',()=>{
 assert.equal(data.students.length,1200);
 assert.ok(cohort.length>50&&cohort.length<600);
 assert.equal(cohort.length,sssRecords.size);
 assert.ok(cohort.every(s=>sssRecords.get(s.id).studentId===s.id));
 assert.ok(cohort.every(s=>/^DEMO-\d{4}$/.test(s.id)));
 assert.ok(cohort.every(s=>{
  const tags=demoTagsForStudent(s).map(t=>t.id);
  return tags.includes('eal')||tags.includes('ss')||tags.includes('iep');
 }));
 assert.equal(isSSSDemoMember({...data.students[0],id:'ACTUAL-001'}),false);
 assert.equal(sssRecordFor(sssRecords,'ACTUAL-001'),null);
 const onlyOther=data.students.find(s=>{
  const ids=demoTagsForStudent(s).map(t=>t.id);
  return ids.some(x=>x==='medical'||x==='behavioural')&&
   !ids.some(x=>['eal','ss','iep'].includes(x));
 });
 assert.ok(onlyOther);
 assert.equal(isSSSDemoMember(onlyOther),false);
});
test('grade-first list sorts by family name then given name, independently of class',()=>{
 for(let i=1;i<cohort.length;i++){
  const a=cohort[i-1],b=cohort[i];
  const gradeOrder=GRADES.indexOf(a.grade)-GRADES.indexOf(b.grade);
  const familyOrder=a.last.localeCompare(b.last,'en',{sensitivity:'base'});
  const givenOrder=a.first.localeCompare(b.first,'en',{sensitivity:'base'});
  assert.ok(gradeOrder<0||
   (gradeOrder===0&&(familyOrder<0||
   (familyOrder===0&&givenOrder<=0))),a.name+' before '+b.name);
 }
 for(const grade of GRADES){
  const subset=sssCohort(data.students,sssRecords,grade);
  assert.ok(subset.every(s=>s.grade===grade));
 }
 const first=cohort.find(s=>s.grade==='G3');
 assert.deepEqual(sssCohort(data.students,sssRecords,'G3',first.last+', '+first.first)
  .some(s=>s.id===first.id),true);
});
test('WIDA is K–G5 and only for demo EAL programme members, never mistaken for a progress test',()=>{
 const exams=cohort.map(s=>({student:s,exam:sssRecords.get(s.id).wida}))
  .filter(x=>x.exam);
 assert.ok(exams.length>10);
 assert.ok(exams.every(({student})=>gradeNumber(student.grade)>=0&&gradeNumber(student.grade)<=5));
 assert.ok(exams.every(({student})=>demoTagsForStudent(student).some(x=>x.id==='eal')));
 for(const {student,exam} of exams){
  assert.equal(exam.simulated,true);
  assert.ok(exam.compositeLevel>=1&&exam.compositeLevel<=6);
  assert.match(exam.date,/^2026-09-/);
  assert.deepEqual(exam.domains.map(x=>x.name),
   student.grade==='K'?['Listening','Speaking']:
   ['Listening','Reading','Speaking','Writing']);
  assert.equal(exam.compositeLabel,student.grade==='K'?'Oral Language':'Overall');
  for(const domain of exam.domains)assert.ok(domain.level>=1&&domain.level<=6);
 }
 for(const student of cohort.filter(s=>gradeNumber(s.grade)<0||gradeNumber(s.grade)>5))
  assert.equal(sssRecords.get(student.id).wida,null);
});
test('SSS roster shows cohort only, surname order, one grade filter and accessible native grade lists',()=>{
 const html=renderSSSOverview({...context,grade:'All',query:'',openGrades:['G3']});
 assert.match(html,/Student Support Services roster/);
 assert.match(html,/data-select="sss-grade"/);
 assert.match(html,/data-sss-grade-panel="G3" open/);
 assert.match(html,/Student · A–Z by surname/);
 assert.match(html,/staff-only access will require school SSO/);
 assert.equal((html.match(/data-sss-student="/g)||[]).length,cohort.length);
 const grade='G4';
 const filtered=sssCohort(data.students,sssRecords,grade);
 const gradeHtml=renderSSSOverview({...context,grade,query:'',openGrades:[]});
 assert.equal((gradeHtml.match(/data-sss-student="/g)||[]).length,filtered.length);
 assert.doesNotMatch(gradeHtml,/data-sss-grade-panel="G3"/);
});
test('SSS student profile reuses Faculty academic, attendance, MAP and experience data',()=>{
 const student=cohort.find(s=>s.grade==='G4'&&sssRecords.get(s.id).wida);
 assert.ok(student);
 const html=renderSSSStudentProfile({...context,studentId:student.id});
 assert.match(html,new RegExp(student.name));
 assert.match(html,/WIDA screening snapshot/);
 assert.match(html,/Shared evidence/i);
 assert.match(html,/Latest Mathematics report/);
 assert.match(html,/MAP Mathematics growth/);
 assert.match(html,/MAP Reading growth/);
 assert.match(html,/IXL Mathematics/);
 assert.match(html,/Core Phonics/);
 assert.match(html,/F&P text level/);
 assert.match(html,/Engagement/);
 assert.match(html,/Belonging/);
 assert.match(html,/no real support plan/i);
 assert.match(html,/data-sss-detail="academics"/);
 const report=academicFor(academics,student.id).reports[0];
 assert.ok(html.includes(report.year));
 assert.ok(html.includes(sssRecords.get(student.id).wida.measure));
 const expanded=renderSSSStudentProfile({...context,studentId:student.id,academicOpen:true});
 assert.match(expanded,/data-sss-detail="academics" open/);
});
test('non-members cannot be opened, and no case-note editing or raw student imports exist',()=>{
 const outsider=data.students.find(s=>!sssRecords.has(s.id));
 const html=renderSSSStudentProfile({...context,studentId:outsider.id});
 assert.match(html,/No SSS record available/);
 assert.doesNotMatch(html,new RegExp(outsider.name));
 assert.doesNotMatch(html,/WIDA screening snapshot/);
 const own=renderSSSStudentProfile({...context,studentId:cohort[0].id});
 assert.doesNotMatch(own,/<form|<textarea|data-save-case|data-edit-iep|cpoms incident/i);
 assert.match(own,/does not save referrals, case notes,/);
 assert.match(own,/server-side row permissions/);
});
