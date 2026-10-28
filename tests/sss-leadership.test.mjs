import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../src/data.mjs';
import {createSSSDemoRecords} from '../src/sss-demo-data.mjs';
import {seedSupportDemo,createDraftEntry,loadDraftEntries,storeDraftEntries,supportForStudent} from '../src/support-workspace-data.mjs';
import {CASE_MANAGERS,REFERRAL_STAGES,STRATEGIES,managerFor,interventionFor,
 learnerPerspective,supportLeadership,lastReferralStage} from '../src/sss-leadership-data.mjs';
import {renderSSSLeadershipDashboard,renderSSSProfileNavigation,renderSSSSummary,renderSSSPlans} from '../src/sss-leadership-ui.mjs';

const data=generateDemoData();
const records=createSSSDemoRecords(data.students);
const cohort=data.students.filter(s=>records.has(s.id));
const entries=seedSupportDemo(data.students,records);
const learner=cohort[0];

test('SSS leadership is based on one stable fictional student cohort and action records',()=>{
 assert.ok(cohort.length>0);
 assert.ok(CASE_MANAGERS.includes(managerFor(learner)));
 const overview=supportLeadership(cohort,records,entries);
 assert.equal(overview.selected.length,cohort.length);
 assert.equal(overview.plans.length,cohort.length);
 assert.equal(overview.monitoring.monitored,cohort.length);
 assert.ok(overview.due.length<=cohort.length);
 assert.match(renderSSSLeadershipDashboard(cohort,records,entries),/What Needs Our Attention/);
 assert.match(renderSSSLeadershipDashboard(cohort,records,entries),/Reviews Due/);
 const only=supportLeadership(cohort,records,entries,managerFor(learner));
 assert.ok(only.selected.every(s=>managerFor(s)===managerFor(learner)));
});
test('monitoring examples use six comparable opportunities and an explicit target',()=>{
 const monitor=interventionFor(learner,records,entries);
 assert.equal(monitor.observations.length,6);
 assert.equal(monitor.observations[0].observed,monitor.baseline);
 assert.ok(monitor.observations.every((row,i)=>row.week===i+1&&row.opportunities===5&&row.observed>=0&&row.observed<=5));
 assert.equal(monitor.target,4);
 const html=renderSSSPlans(learner,records.get(learner.id),entries);
 assert.match(html,/Intervention Monitoring/);
 assert.match(html,/data-support-review-form/);
 assert.match(html,/Referral Journey/);
 assert.match(html,/Meeting Preparation Brief/);
 assert.match(html,/Student & Caregiver Voice/);
 assert.match(html,/Classroom Strategy Library/);
});
test('session-only review decisions and learner voice are synthetic and student-scoped',()=>{
 const decision=createDraftEntry({type:'review',summary:'Monitor learner work before the next change.',
  decision:'Adapt',title:'Collaborative Intervention Review',visibility:'restricted'},learner.id,'sss');
 const monitor=interventionFor(learner,records,[...entries,decision]);
 assert.equal(monitor.decision,'Adapt');
 const voice=createDraftEntry({type:'voice',summary:'Learner-generated example.',
   learnerHelps:'A clear example.',learnerHard:'Long instructions.',learnerTry:'A short checklist.',
   visibility:'restricted'},learner.id,'sss');
 const studentVoice=learnerPerspective(learner,[...entries,voice]);
 assert.equal(studentVoice.helps,'A clear example.');
 assert.equal(supportForStudent([...entries,voice],cohort[1].id).some(x=>x.id===voice.id),false);
 const storage={data:'',getItem(){return this.data},setItem(_k,v){this.data=v}};
 assert.equal(storeDraftEntries([decision,voice],storage),true);
 const loaded=loadDraftEntries(storage);
 assert.equal(loaded.length,2);
 assert.ok(loaded.every(x=>x.source==='session'));
});
test('referral stages are bounded and the SSS profile tabs are distinct',()=>{
 assert.equal(REFERRAL_STAGES.length,5);
 assert.equal(lastReferralStage({status:'Under review'}),'Reviewed');
 assert.equal(lastReferralStage({status:'Closed'}),'Closed');
 assert.equal(STRATEGIES.length,5);
 const nav=renderSSSProfileNavigation('plans');
 for(const label of ['Summary','Plans & Progress','Support History','Learning Evidence'])assert.ok(nav.includes(label));
 const summary=renderSSSSummary(learner,records.get(learner.id),entries);
 assert.match(summary,/What Matters Right Now/);
 assert.match(summary,/Learner Perspective/);
});
