import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords} from '../src/academic-journey-data.mjs';
import {createSSSDemoRecords} from '../src/sss-demo-data.mjs';
import {createExperienceRecords,experienceFor} from '../src/experience-data.mjs';
import {resolveEvidencePreview} from '../src/evidence-preview-context.mjs';

const data=applyFacultyDemo(generateDemoData());
const academic=createAcademicDemoRecords(data.students);
const sssRecords=createSSSDemoRecords(data.students);
const experience=createExperienceRecords(data.students);
const student=data.students.find(x=>x.grade==='G7'&&experienceFor(experience,x.id,'engagement','F26'));
assert.ok(student);
const teacher=data.teachers.find(t=>t.classIds.includes(student.classId));
assert.ok(teacher);
const ctx=(role='faculty')=>({role,data,academic,experience,sssRecords,
 state:{studentId:student.id,academicSubject:'Mathematics',classEvidence:'report',classId:student.classId},
 allowedClassIds:teacher.classIds,allowedStudentIds:data.students.filter(s=>teacher.classIds.includes(s.classId)).map(s=>s.id)});
const trigger=(kind,ids={})=>({dataset:{evidencePreview:kind,...ids},textContent:'',
 querySelector(){return null},getAttribute(){return ''}});
test('assigned teachers can preview a learner with recorded context',()=>{
 const result=resolveEvidencePreview(trigger('student',{previewStudent:student.id}),ctx());
 assert.equal(result.title,student.name);
 assert.ok(result.rows.some(([k,v])=>k==='Attendance'&&v.includes('%')));
 assert.ok(result.rows.some(([k])=>k==='Last issued Mathematics'));
 assert.ok(!JSON.stringify(result).toLowerCase().includes('diagnosis'));
});
test('unassigned learners are not previewed by the faculty layer',()=>{
 const other=data.students.find(s=>!teacher.classIds.includes(s.classId));
 assert.ok(other);
 const result=resolveEvidencePreview(trigger('student',{previewStudent:other.id}),ctx());
 assert.equal(result,null);
});
test('SSS student previews show only safe brief evidence and not notes',()=>{
 const person=data.students.find(s=>sssRecords.has(s.id));
 const c=ctx('sss');
 const result=resolveEvidencePreview(trigger('sss-person',{sssStudent:person.id}),c);
 assert.ok(result.title);
 assert.ok(result.note.includes('no confidential case notes'));
 assert.ok(!JSON.stringify(result).includes('confidential diagnosis:'));
});
test('an unfamiliar non-SSS learner cannot be previewed as a support member',()=>{
 const other=data.students.find(s=>!sssRecords.has(s.id));
 assert.ok(other);
 assert.equal(resolveEvidencePreview(trigger('sss-person',{sssStudent:other.id}),ctx('sss')),null);
});
test('missing academic result shows an explanation rather than a synthetic zero',()=>{
 const result=resolveEvidencePreview(trigger('missing'),ctx('faculty'));
 assert.match(result.note,/not a score of zero/i);
});

test('Faculty Engagement hover shows observed index values across check-in windows, not explanatory text',()=>{
 const item=experienceFor(experience,student.id,'engagement','F26');
 assert.ok(item);
 const result=resolveEvidencePreview(trigger('experience-cell',
  {previewStudent:student.id,previewMeasure:'engagement',previewWindow:'F26'}),ctx());
 assert.equal(result.title,'Engagement');
 assert.equal(result.subtitle,student.name);
 assert.equal(result.trend.points.at(-1).label,'Fall 2026');
 assert.ok(result.trend.points.at(-1).value.includes(item.value.toFixed(2)));
 assert.equal(result.rows.length,0);
 assert.equal(result.note,'');
 assert.doesNotMatch(JSON.stringify(result),/synthetic|TEST DATA|assessment context/i);
});
test('MAP hover presents actual RIT results from comparable windows without Q bands',()=>{
 const result=resolveEvidencePreview(trigger('map',
  {previewStudent:student.id,previewSubject:'Mathematics',previewBand:'Q3'}),ctx());
 assert.equal(result.title,'MAP Mathematics');
 assert.equal(result.subtitle,student.name);
 assert.ok(result.trend.points.length>1);
 assert.equal(result.trend.points.at(-1).label,'Fall 2026');
 assert.match(result.trend.change?.value||'',/RIT/);
 assert.equal(result.note,'');
 assert.doesNotMatch(JSON.stringify(result),/Q3|fictional|synthetic/i);
});
test('Report-card hover highlights current subject and earlier same-scale results',()=>{
 const report=academic.get(student.id).workingReport;
 const result=resolveEvidencePreview(trigger('academic',
  {previewStudent:student.id,previewMeasure:'report',evidenceSubject:'Mathematics'}),ctx());
 assert.equal(result.title,'Mathematics');
 assert.equal(result.trend.points.at(-1).label,report.year);
 assert.equal(result.trend.points.at(-1).value,report.subjects.find(x=>x.subject==='Mathematics').value);
 assert.equal(result.note,'');
 assert.ok(result.trend.points.every(x=>x.label!=='2023–24'||x.value!=='TEST DATA'));
});
test('Faculty cannot hover another class learner experience without authorisation',()=>{
 const other=data.students.find(s=>!teacher.classIds.includes(s.classId));
 assert.ok(other);
 assert.equal(resolveEvidencePreview(trigger('experience-cell',
  {previewStudent:other.id,previewMeasure:'belonging',previewWindow:'F26'}),ctx()),null);
});
test('Leader table indices show scoped previous check-ins rather than methodology',()=>{
 const result=resolveEvidencePreview(trigger('leader-index',
  {previewMeasure:'belonging',previewGroup:'Grade 7'}),ctx('leader'));
 assert.equal(result.title,'Belonging');
 assert.equal(result.subtitle,'Grade 7');
 assert.ok(result.trend.points.length>=2);
 assert.equal(result.trend.points.at(-1).label,'Fall 2026');
 assert.equal(result.note,'');
});

test('MAP RIT tile hover uses only the shared white evidence preview with percentile context',()=>{
 const score=data.map[student.id].find(r=>r.key==='F26'&&r.subject==='Mathematics');
 assert.ok(score,'The selected demo learner needs a current MAP Mathematics score');
 const result=resolveEvidencePreview(trigger('map-rit',{
  previewStudent:student.id,previewSubject:'Mathematics'}),ctx());
 assert.equal(result.title,'MAP Math RIT');
 assert.match(result.subtitle,/Fall 2026/);
 assert.ok(result.trend.points.length>1);
 assert.equal(result.trend.points.at(-1).value,String(score.rit));
 assert.ok(result.rows.some(([name,v])=>
  name==='Achievement percentile'&&v.includes('P'+score.percentile)));
 assert.match(result.note,/not a growth percentile/);
 const other=data.students.find(s=>!teacher.classIds.includes(s.classId));
 assert.equal(resolveEvidencePreview(trigger('map-rit',{
  previewStudent:other.id,previewSubject:'Mathematics'}),ctx()),null,
  'MAP hover must not bypass faculty learner access');
});

test('Date-free Faculty headings still preview the selected earlier check-in window',()=>{
 const earlierStudent=data.students.find(s=>teacher.classIds.includes(s.classId)&&
  experienceFor(experience,s.id,'engagement','S26'));
 assert.ok(earlierStudent,'A valid earlier fictional response is available');
 const selected=experienceFor(experience,earlierStudent.id,'engagement','S26');
 const c=ctx('faculty');c.state.classExperienceWindow='S26';
 // The header carries no year and the decorated target has no previewWindow;
 // therefore the role-scoped resolver must use the active Faculty selection.
 const result=resolveEvidencePreview(trigger('experience-cell',{
  previewStudent:earlierStudent.id,previewMeasure:'engagement'}),c);
 assert.equal(result.title,'Engagement');
 assert.equal(result.trend.points.at(-1).label,'Spring 2026');
 assert.ok(result.trend.points.at(-1).value.includes(selected.value.toFixed(2)));
 assert.ok(result.trend.points.every(p=>p.label!=='Fall 2026'));
});
