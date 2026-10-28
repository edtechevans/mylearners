/** Deterministic, exclusively fictional SSS leadership / intervention / voice examples. */
import {hash} from './data.mjs';
import {SUPPORT_AS_OF,supportForStudent} from './support-workspace-data.mjs';

export const CASE_MANAGERS=Object.freeze(['Learning Support A','Learning Support B','EAL Specialist A','Student Support Coordinator']);
export const REFERRAL_STAGES=Object.freeze(['Submitted','Reviewed','Support Agreed','Progress Reviewed','Closed']);
export const REVIEW_DECISIONS=Object.freeze(['Continue','Adapt','Intensify','Fade Support']);
export const STRATEGIES=Object.freeze([
 {id:'instructions',barrier:'Task initiation',title:'Visual first-step checklist',
  how:'Model the first step, provide a short sequence and reduce prompting as confidence grows.',
  facet:'Personalisation',udl:'Action & Expression',check:'Observe independent starts in five consistent opportunities.'},
 {id:'expression',barrier:'Demonstrating learning',title:'Flexible ways to show understanding',
  how:'Agree equivalent response options while keeping the learning intention constant.',
  facet:'Agency · Creativity',udl:'Action & Expression',check:'Review whether the learner can communicate the intended understanding.'},
 {id:'language',barrier:'Language access',title:'Preview essential language with models',
  how:'Introduce key language through images, rehearsal and purposeful partner talk.',
  facet:'Collaboration',udl:'Representation',check:'Review participation and language use in authentic tasks.'},
 {id:'engagement',barrier:'Engagement and connection',title:'Connect tasks to authentic interests',
  how:'Invite student input on meaningful contexts and offer structured choices.',
  facet:'Authenticity',udl:'Engagement',check:'Ask the learner whether tasks feel relevant and accessible.'},
 {id:'organisation',barrier:'Planning and self-monitoring',title:'Goal check-ins and success criteria',
  how:'Use a brief self-check against clear success criteria and decide the next step together.',
  facet:'Taking Action',udl:'Engagement',check:'Review independence and learner self-reflections.'}
]);
const number=(student,salt,mod)=>hash(student.id+'-lead-'+salt)%mod;
export function managerFor(student){return CASE_MANAGERS[number(student,'manager',CASE_MANAGERS.length)]}
export function tierFor(student){return number(student,'tier',8)<2?'Tier 3':'Tier 2'}
export function interventionFor(student,records,entries){
 const has=records?.has(student.id);
 if(!has)return null;
 const variant=number(student,'intervention',3);
 const names=['Independent Task Initiation','Accessing Academic Language','Self-Monitoring of Learning'];
 const label=names[variant];
 const baseline=1+number(student,'baseline',2);
 const gain=number(student,'gain',4);
 const observations=Array.from({length:6},(_,i)=>{
  const v=Math.min(5,baseline+Math.floor(i*gain/5)+(i===5&&gain>0?1:0));
  return {week:i+1,observed:v,opportunities:5};
 });
 const target=4;
 const review=supportForStudent(entries,student.id).find(x=>x.type==='review');
 return {studentId:student.id,title:label,baseline,latest:observations.at(-1).observed,
  target,observations,measure:'Independent successes in five consistent opportunities per week',
  fidelity:70+number(student,'fidelity',4)*10,
  strategy:STRATEGIES[variant],reviewDate:records.get(student.id).reviewDate,
  decision:review?.decision||'',reviewNote:review?.summary||'',
  measuredThrough:'2026-10-23',owner:managerFor(student)};
}
export function monitoringSummary(students,records,entries){
 const eligible=students.filter(s=>records.has(s.id));
 const interventions=eligible.map(s=>interventionFor(s,records,entries));
 const missing=interventions.filter(x=>x.latest===null).length;
 const target=interventions.filter(x=>x.latest>=x.target).length;
 return {monitored:interventions.length,atTarget:target,withoutEvidence:missing};
}
export function supportLeadership(students,records,entries,manager='All'){
 const cohort=students.filter(s=>records.has(s.id));
 const selected=cohort.filter(s=>manager==='All'||managerFor(s)===manager);
 const open=selected.flatMap(s=>supportForStudent(entries,s.id));
 const due=selected.filter(s=>records.get(s.id).reviewDate>=SUPPORT_AS_OF &&
   records.get(s.id).reviewDate<='2026-11-27');
 const pending=open.filter(x=>x.type==='action'&&x.status==='Open');
 const referrals=open.filter(x=>x.type==='referral'&&!['Closed','Support Agreed','Progress Reviewed'].includes(x.referralStage||x.status));
 const plans=open.filter(x=>x.type==='plan'&&x.status==='Active');
 const meetings=open.filter(x=>x.type==='meeting');
 const underReview=selected.filter(s=>{const x=interventionFor(s,records,entries);return x&&x.latest<x.target});
 return {cohort,selected,due,pending,referrals,plans,meetings,underReview,monitoring:monitoringSummary(selected,records,entries)};
}
export function seededLearnerPerspective(student){
 const variants=[
  {helps:'Seeing an example before I begin.',hard:'Remembering several instructions at once.',try:'A short checklist I can use myself.'},
  {helps:'Talking through ideas before writing.',hard:'Finding words for unfamiliar concepts.',try:'A vocabulary picture and partner rehearsal.'},
  {helps:'Knowing what a successful answer looks like.',hard:'Getting started when a task feels large.',try:'A first-step goal and quick feedback.'}
 ];
 return variants[number(student,'voice',variants.length)];
}
export function learnerPerspective(student,entries){
 const voice=supportForStudent(entries,student.id).find(x=>x.type==='voice');
 return voice?{helps:voice.learnerHelps,hard:voice.learnerHard,try:voice.learnerTry,source:'Session demo entry'}:
  {...seededLearnerPerspective(student),source:'Fictional learner perspective'};
}
export function lastReferralStage(entry){
 const stage=entry?.referralStage||entry?.status;
 if(stage==='Under review')return 'Reviewed';
 return REFERRAL_STAGES.includes(stage)?stage:'Submitted';
}
export function supportInquiry(student,records,entries){
 const out=[];
 const iv=interventionFor(student,records,entries);
 const timeline=supportForStudent(entries,student.id);
 if(iv&&iv.latest<iv.target)out.push('What adaptation might improve access before the next review?');
 if(timeline.some(x=>x.type==='action'&&x.status==='Open'))
  out.push('Which agreed action needs an update before the team meets?');
 if(!timeline.some(x=>x.type==='voice'))out.push('What does this learner identify as helpful or difficult?');
 return out.slice(0,3);
}
