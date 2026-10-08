import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData,GRADES,attendanceSummary,getTeacherStudents,gradeNumber} from '../src/data.mjs';
const d=generateDemoData();
test('15 grade levels, 60 classes and 1,200 unique learners',()=>{
 assert.equal(GRADES.length,15);assert.equal(d.classes.length,60);assert.equal(d.students.length,1200);
 assert.equal(new Set(d.students.map(s=>s.id)).size,1200);
 assert.equal(new Set(d.classes.map(s=>s.id)).size,60);
 for(const g of GRADES)assert.equal(d.classes.filter(c=>c.grade===g).length,4);
 for(const c of d.classes)assert.equal(c.studentIds.length,20);
});
test('all learners match an authoritative mock class and are age appropriate',()=>{
 for(const s of d.students){const cls=d.classIndex.get(s.classId);assert.ok(cls);assert.ok(cls.studentIds.includes(s.id));assert.equal(s.grade,cls.grade);assert.equal(s.campus,cls.campus);assert.equal(s.age,gradeNumber(s.grade)+5);assert.ok(s.portraitSeed>=0)}
});
test('stable generation and unique teacher assignments',()=>{
 const d2=generateDemoData();assert.deepEqual(d.students.slice(0,20),d2.students.slice(0,20));assert.equal(d.teachers.length,63);
 for(const t of d.teachers){const visible=getTeacherStudents(d,t);assert.equal(new Set(visible.map(s=>s.id)).size,visible.length);assert.ok(visible.every(s=>t.classIds.includes(s.classId)))}
});
test('MAP assessment validity and grade eligibility',()=>{
 for(const s of d.students){const rows=d.map[s.id];if(gradeNumber(s.grade)<3||gradeNumber(s.grade)>10)assert.equal(rows.length,0);
 for(const rec of rows){assert.ok(['Mathematics','Reading','Language Usage'].includes(rec.subject));assert.ok(rec.rit>=130&&rec.rit<=285);assert.ok(rec.percentile>=1&&rec.percentile<=99);assert.equal(rec.simulated,true);assert.ok(rec.date<='2026-10-08')}}
});
test('attendance summaries derive from underlying events',()=>{
 for(const s of d.students){const events=d.attendance[s.id],a=attendanceSummary(events);assert.ok(a.total>0);assert.equal(a.present+a.absences,a.total);assert.equal(a.absences,events.filter(x=>x.status==='absent').length);assert.equal(a.lates,events.filter(x=>x.status==='late').length);assert.equal(a.rate,Math.round(a.present/a.total*1000)/10)}
});
test('academic assessment outcomes are division-specific',()=>{
 for(const s of d.students){const items=d.assessments[s.id];assert.equal(items.length,7);for(const x of items){const exp=gradeNumber(s.grade)<=5?'developmental':gradeNumber(s.grade)<=10?'MYP':'DP';assert.equal(x.scale,exp)}}
});
test('support guidance is fictional, action-focused and selected',()=>{
 for(const s of d.students){assert.ok(Array.isArray(d.support[s.id]));for(const item of d.support[s.id]){assert.ok(item.title);assert.ok(item.detail);assert.ok(item.kind)}}
});
