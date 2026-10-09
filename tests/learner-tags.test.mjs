import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {SUPPORT_TAGS,TAG_IDS,TAG_BY_ID,demoTagsForStudent,hasDemoTag,demoTagSummary} from '../src/learner-tags.mjs';
import {supportTagChips,taggedSupportDetail} from '../src/learner-tags-ui.mjs';

const d=generateDemoData();
test('all five fictional indicators have safe, teacher-useful descriptions',()=>{
 assert.deepEqual(TAG_IDS,['eal','ss','iep','medical','behavioural']);
 assert.deepEqual(SUPPORT_TAGS.map(t=>t.label),['EAL','SS','IEP','Medical','Behavioural']);
 assert.ok(SUPPORT_TAGS.every(t=>t.strategies.length>=2&&t.summary&&t.source));
 assert.equal(TAG_BY_ID.medical.restricted,true);
 assert.equal(TAG_BY_ID.behavioural.restricted,true);
 for(const restricted of [TAG_BY_ID.medical,TAG_BY_ID.behavioural]){
  assert.doesNotMatch(restricted.summary,/\b(?:diagnosed with|prescribed|patient record)\b/i);
 }
});
test('every synthetic 20-student class visibly demonstrates all five categories',()=>{
 assert.equal(d.classes.length,60);
 for(const c of d.classes){
  const students=c.studentIds.map(id=>d.userIndex.get(id));
  const totals=demoTagSummary(students);
  for(const id of TAG_IDS)assert.ok(totals[id]>=1,c.id+' needs demo '+id+' indicator');
  assert.ok(students.filter(s=>demoTagsForStudent(s).length>0).length>=5);
  assert.ok(students.some(s=>demoTagsForStudent(s).length>=2),c.id+' needs multi-tag example');
 }
});
test('tag generation is deterministic and only permits DEMO identities',()=>{
 const s=d.students[720];
 assert.deepEqual(demoTagsForStudent(s),demoTagsForStudent(s));
 assert.equal(demoTagsForStudent({...s,id:'ACTUAL-1'}).length,0);
 assert.equal(demoTagsForStudent(null).length,0);
 for(const tag of demoTagsForStudent(s))assert.equal(hasDemoTag(s,tag.id),true);
});
test('roster badges open the chosen learner support tab with accessible labels',()=>{
 const c=d.classes.find(c=>c.id==='G7-A');
 const medical=c.studentIds.map(id=>d.userIndex.get(id)).find(s=>hasDemoTag(s,'medical'));
 assert.ok(medical);
 const chips=supportTagChips(medical,'roster');
 assert.match(chips,/data-target-tab="support"/);
 assert.match(chips,/data-tag-focus="medical"/);
 assert.match(chips,new RegExp('data-open-student="'+medical.id+'"'));
 assert.match(chips,/aria-label="View Medical classroom guidance/);
 const header=supportTagChips(medical,'profile');
 assert.match(header,/data-view-support="medical"/);
 assert.doesNotMatch(header,/data-open-student=/);
});
test('medical and behavioural drill-downs provide strategies without sensitive case histories',()=>{
 const c=d.classes.find(c=>c.id==='G7-A');
 for(const id of ['medical','behavioural']){
  const s=c.studentIds.map(x=>d.userIndex.get(x)).find(x=>hasDemoTag(x,id));
  const html=taggedSupportDetail(s,id);
  assert.match(html,new RegExp('data-support-detail="'+id+'"'));
  assert.match(html,/Useful classroom approaches/);
  assert.match(html,/Detailed health, behavioural, counselling or safeguarding records are not available/);
  assert.match(html,/class="learner-support-detail selected detail-/);
 }
});
test('unsupported students have an explicit non-diagnostic empty state',()=>{
 const s=d.students.find(x=>demoTagsForStudent(x).length===0);
 assert.ok(s);
 assert.match(taggedSupportDetail(s),/No support tags in this demonstration/);
 assert.match(taggedSupportDetail(s),/does not confirm the absence of learning or support needs/);
 assert.equal(supportTagChips(s,'card'),'');
});
