import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createAcademicDemoRecords} from '../src/academic-journey-data.mjs';
import {createSSSDemoRecords} from '../src/sss-demo-data.mjs';
import {resolveEvidencePreview} from '../src/evidence-preview-context.mjs';

const data=applyFacultyDemo(generateDemoData());
const academic=createAcademicDemoRecords(data.students);
const sssRecords=createSSSDemoRecords(data.students);
const student=data.students.find(x=>x.grade==='G7');
assert.ok(student);
const teacher=data.teachers.find(t=>t.classIds.includes(student.classId));
assert.ok(teacher);
const ctx=(role='faculty')=>({role,data,academic,sssRecords,
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
