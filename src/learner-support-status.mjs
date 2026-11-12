/**
 * Deterministic support-reference examples for the public My Learners demo.
 *
 * The stage names mirror simplified reference labels provided for design review.
 * Assignments are completely synthetic, NEVER inferred from language, scores,
 * attendance, diagnoses or individual school records. A non-DEMO ID gets nothing.
 * No public client-side tag is an authorisation or a record of an actual plan.
 */
import {hash} from './data.mjs';
import {demoTagsForStudent} from './learner-tags.mjs';

const EAL_SEQUENCE=Object.freeze(['e1','e2','i3','i4','a5','monitor-y1','monitor-y2']);
export const EAL_STAGES=Object.freeze({
 e1:{label:'EAL · E1',fullName:'Emergent 1',kind:'early'},
 e2:{label:'EAL · E2',fullName:'Emergent 2',kind:'early'},
 i3:{label:'EAL · I3',fullName:'Intermediate 3',kind:'intermediate'},
 i4:{label:'EAL · I4',fullName:'Intermediate 4',kind:'intermediate'},
 a5:{label:'EAL · A5',fullName:'Advanced 5',kind:'advanced'},
 'monitor-y1':{label:'EAL · Monitor Y1',fullName:'EAL Monitor Year 1',kind:'monitor'},
 'monitor-y2':{label:'EAL · Monitor Y2',fullName:'EAL Monitor Year 2',kind:'monitor'},
 exited:{label:'EAL · Exited',fullName:'Exited EAL support',kind:'previous'},
 'not-needed':{label:'No EAL',fullName:'EAL support not needed',kind:'none'}
});
export const SST_STAGES=Object.freeze({
 'sst-monitoring':{label:'Monitoring',fullName:'SST monitoring',kind:'monitor'},
 'sst-intervention':{label:'Intervention',fullName:'Targeted learning intervention',kind:'intervention'},
 'sst-plan':{label:'Support Plan',fullName:'SST / RTI intervention plan',kind:'plan'},
 'sst-soc':{label:'SOC',fullName:'SOC (original reference code; definition to confirm)',kind:'reference'}
});
export const SUPPORT_STATUS_FILTERS=Object.freeze([
 ['all','All support statuses'],['has-support','Any support'],
 ['learning','Learning Support'],['tier-1','Tier 1'],['tier-2','Tier 2'],['tier-3','Tier 3'],
 ['sst','Any SST status'],['sst-monitoring','SST monitoring'],['sst-intervention','Intervention'],
 ['sst-plan','Support Plan'],['sst-soc','SOC (source code)'],
 ['eal-active','Active EAL'],['eal-e1','Emergent 1 (E1)'],['eal-e2','Emergent 2 (E2)'],
 ['eal-i3','Intermediate 3 (I3)'],['eal-i4','Intermediate 4 (I4)'],
 ['eal-a5','Advanced 5 (A5)'],['eal-monitor','EAL monitoring'],
 ['eal-monitor-y1','Monitor Year 1'],['eal-monitor-y2','Monitor Year 2'],
 ['eal-exited','Exited EAL'],['eal-not-needed','No EAL required']
]);
const isDemo=s=>!!s&&/^DEMO-\d{4}$/.test(String(s.id||''))&&!!s.classId;
const stageBadge=(id,label,fullName,group,variant)=>Object.freeze({id,label,fullName,group,variant});

/** Each synthetic learner receives a consistent example status on every screen. */
export function supportStatusForStudent(student){
 if(!isDemo(student))return null;
 const tagIds=new Set(demoTagsForStudent(student).map(t=>t.id));
 const hasEAL=tagIds.has('eal');
 const hasLearning=tagIds.has('ss')||tagIds.has('iep');
 const eal=hasEAL?EAL_SEQUENCE[hash(student.id+'-eal-stage-v1')%EAL_SEQUENCE.length]:
  hash(student.id+'-eal-exit-v1')%19===0?'exited':'not-needed';
 const tier=hasLearning?1+hash(student.id+'-learning-tier-v1')%3:null;
 const candidates=['sst-monitoring','sst-intervention','sst-plan','sst-soc',null];
 const first=hasLearning?candidates[hash(student.id+'-sst-stage-v1')%candidates.length]:null;
 const sst=first?[first]:[];
 if(first==='sst-plan'&&hash(student.id+'-sst-intervention-v1')%2===0)sst.push('sst-intervention');
 const duration=hasLearning&&hash(student.id+'-ls-duration-v1')%3===0?
  (hash(student.id+'-ls-duration-choice-v1')%2===0?'1–2 years':'6–7 years'):null;
 const badges=[];
 if(hasLearning){
  badges.push(stageBadge('learning','Learning Support','Learning Support','learning','learning'));
  badges.push(stageBadge('tier-'+tier,'Tier '+tier,'Learning Support Tier '+tier,'learning','tier'));
 }
 for(const key of sst){
  const item=SST_STAGES[key];
  badges.push(stageBadge(key,item.label,item.fullName,'sst',item.kind));
 }
 if(eal!=='not-needed'){
  const item=EAL_STAGES[eal];
  badges.push(stageBadge('eal-'+eal,item.label,item.fullName,'eal',item.kind));
 }
 return Object.freeze({
  eal,tier,duration,sst:Object.freeze(sst),hasLearning,
  badges:Object.freeze(badges)
 });
}
export function matchesSupportStatus(student,filter='all'){
 if(filter==='all')return true;
 const s=supportStatusForStudent(student);
 if(!s)return false;
 if(filter==='has-support')return s.badges.length>0;
 if(filter==='learning')return s.hasLearning;
 if(filter==='sst')return s.sst.length>0;
 if(filter==='eal-active')return ['e1','e2','i3','i4','a5'].includes(s.eal);
 if(filter==='eal-monitor')return s.eal==='monitor-y1'||s.eal==='monitor-y2';
 if(filter.startsWith('eal-'))return s.eal===filter.slice(4);
 if(filter.startsWith('tier-'))return s.tier===Number(filter.slice(5));
 return s.sst.includes(filter);
}
export function supportStatusCounts(students){
 const totals={learners:0,learning:0,tier1:0,tier2:0,tier3:0,
  ealActive:0,ealMonitoring:0,ealExited:0,ealNotNeeded:0,
  sstMonitoring:0,intervention:0,supportPlan:0,soc:0};
 for(const student of students||[]){
  const s=supportStatusForStudent(student);
  if(!s)continue;
  totals.learners++;
  if(s.hasLearning){totals.learning++;totals['tier'+s.tier]++;}
  if(['e1','e2','i3','i4','a5'].includes(s.eal))totals.ealActive++;
  if(['monitor-y1','monitor-y2'].includes(s.eal))totals.ealMonitoring++;
  if(s.eal==='exited')totals.ealExited++;
  if(s.eal==='not-needed')totals.ealNotNeeded++;
  if(s.sst.includes('sst-monitoring'))totals.sstMonitoring++;
  if(s.sst.includes('sst-intervention'))totals.intervention++;
  if(s.sst.includes('sst-plan'))totals.supportPlan++;
  if(s.sst.includes('sst-soc'))totals.soc++;
 }
 return totals;
}
