import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {supportStatusForStudent,matchesSupportStatus,supportStatusCounts,EAL_STAGES,SST_STAGES,SUPPORT_STATUS_FILTERS} from '../src/learner-support-status.mjs';
import {supportStatusBadges,supportStatusDetails,supportStatusFilterControl,supportStatusSummaryTiles} from '../src/learner-support-status-ui.mjs';

const demo=generateDemoData();
test('support references only attach to synthetic DEMO student IDs',()=>{
 const student=demo.students[120];
 assert.equal(supportStatusForStudent(null),null);
 assert.equal(supportStatusForStudent({...student,id:'AISG-120'}),null);
 assert.equal(supportStatusBadges({...student,id:'REAL-121'}),'');
 assert.deepEqual(supportStatusForStudent(student),supportStatusForStudent(student));
});
test('EAL reference stages remain mutually exclusive, and support tiers are singular',()=>{
 const counts={};const tiers=new Set();const sst=new Set();
 for(const student of demo.students){
  const status=supportStatusForStudent(student);
  counts[status.eal]=(counts[status.eal]||0)+1;
  if(status.tier)tiers.add(status.tier);
  for(const key of status.sst)sst.add(key);
  assert.ok(Object.hasOwn(EAL_STAGES,status.eal));
  assert.equal(status.badges.filter(b=>b.group==='eal').length,status.eal==='not-needed'?0:1);
  assert.equal(status.badges.filter(b=>b.id.startsWith('tier-')).length,status.tier?1:0);
  assert.equal(status.tier!==null,status.hasLearning);
  assert.ok(!status.sst.includes('sst-plan')||status.hasLearning);
 }
 for(const stage of Object.keys(EAL_STAGES))assert.ok(counts[stage]>0,stage+' must appear in demo');
 assert.deepEqual([...tiers].sort(),[1,2,3]);
 assert.ok(sst.has('sst-monitoring')&&sst.has('sst-intervention')&&sst.has('sst-plan')&&sst.has('sst-soc'));
});
test('filter options are unique and all produce meaningful results',()=>{
 const ids=SUPPORT_STATUS_FILTERS.map(([id])=>id);
 assert.equal(ids.length,new Set(ids).size);
 assert.ok(ids.includes('eal-monitor-y1')&&ids.includes('eal-monitor-y2'));
 for(const id of ids)assert.ok(demo.students.some(s=>matchesSupportStatus(s,id)),id+' has no example');
 assert.equal(matchesSupportStatus({...demo.students[0],id:'PRIVATE'},'learning'),false);
 const summary=supportStatusCounts(demo.students);
 assert.equal(summary.learners,demo.students.length);
 assert.equal(summary.ealActive+summary.ealMonitoring+summary.ealExited+summary.ealNotNeeded,demo.students.length);
 assert.equal(summary.tier1+summary.tier2+summary.tier3,summary.learning);
});
test('badges, details, filters and cohort tiles expose designed labels',()=>{
 const ealStudent=demo.students.find(s=>['e1','e2','i3','i4','a5'].includes(supportStatusForStudent(s).eal));
 const tierStudent=demo.students.find(s=>supportStatusForStudent(s).tier===2);
 assert.match(supportStatusBadges(ealStudent),/EAL · (E1|E2|I3|I4|A5)/);
 assert.match(supportStatusBadges(tierStudent),/Tier 2/);
 assert.match(supportStatusDetails(tierStudent),/Learning, EAL & SST/);
 assert.match(supportStatusDetails(tierStudent),/Support duration|Language support stage/);
 assert.match(supportStatusFilterControl('eal-monitor-y1'),/value="eal-monitor-y1" selected/);
 assert.match(supportStatusSummaryTiles(demo.students),/Active EAL/);
});
test('source reference meanings are not invented',()=>{
 assert.match(SST_STAGES['sst-soc'].fullName,/definition to confirm/);
 assert.equal(EAL_STAGES['monitor-y1'].label,'EAL · Monitor Y1');
 assert.equal(EAL_STAGES['monitor-y2'].label,'EAL · Monitor Y2');
});
