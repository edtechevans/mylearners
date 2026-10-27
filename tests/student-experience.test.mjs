import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {applyFacultyDemo} from '../src/faculty-demo.mjs';
import {createExperienceRecords,calculateIndex,experienceFor,summarizeExperience,experienceEligible,experienceQuestionSummary,EXPERIENCE_WINDOWS,METRIC_IDS} from '../src/experience-data.mjs';
const data=applyFacultyDemo(generateDemoData());
const records=createExperienceRecords(data.students);
test('fictional school data and measures exist for three windows',()=>{
 assert.equal(data.students.length,1200);
 assert.equal(EXPERIENCE_WINDOWS.length,3);
 assert.deepEqual(METRIC_IDS,['engagement','belonging']);
 assert.equal(records.size,800);
});
test('indices are transparent and require exactly three valid responses',()=>{
 assert.equal(calculateIndex([0,1,2]),33);
 assert.equal(calculateIndex([3,3,3]),100);
 assert.equal(calculateIndex([0,0,0]),0);
 assert.equal(calculateIndex([1,2,2]),56);
 assert.equal(calculateIndex([0,4,2]),null);
 assert.equal(calculateIndex([0,1]),null);
});
test('PK–G2 students have no fabricated check-ins or SEL indices',()=>{
 const early=data.students.filter(s=>!experienceEligible(s));
 assert.equal(early.length,400);
 assert.ok(early.every(s=>!records.has(s.id)));
});
test('each fictional learner index equals its three reported answer points',()=>{
 for(const s of data.students.filter(experienceEligible)){
  for(const w of EXPERIENCE_WINDOWS)for(const m of METRIC_IDS){
   const x=experienceFor(records,s.id,m,w.key);
   if(!x)continue;
   assert.equal(x.items.length,3);
   assert.equal(x.value,Math.round(x.items.reduce((n,i)=>n+i.points,0)/3));
  }
 }
});
test('aggregate response count and item breakdown reconcile',()=>{
 const ss=data.students.filter(s=>s.grade==='G7');
 for(const m of METRIC_IDS){
  const total=summarizeExperience(records,ss,m);
  assert.equal(total.eligible,80);
  assert.ok(total.n>0&&total.n<=80);
  const breakdown=experienceQuestionSummary(records,ss,m);
  assert.equal(breakdown.length,3);
  assert.ok(breakdown.every(item=>item.n===total.n));
 }
});
