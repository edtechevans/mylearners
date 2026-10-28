/**
 * Aggregate-only leadership interpretation of the same synthetic SSS casework
 * shown in Faculty and SSS. No learner names, IDs or case narratives returned.
 * A small-group presentation rule is used even in the public fictional demo.
 */
import {SUPPORT_AS_OF,supportForStudent} from './support-workspace-data.mjs';
import {interventionFor,lastReferralStage} from './sss-leadership-data.mjs';

export const MIN_LEADERS_GROUP=10;
export const MIN_LEADERS_SUPPORT=5;
const pct=(numerator,denominator)=>denominator?Math.round(numerator*100/denominator):null;
const withinReviewWindow=date=>typeof date==='string'&&date>=SUPPORT_AS_OF&&date<='2026-11-27';

export function aggregateStudentSupport(students,sssRecords,entries){
 const scoped=students||[];
 const members=scoped.filter(s=>sssRecords.has(s.id));
 const all=members.flatMap(s=>supportForStudent(entries,s.id));
 const byType=type=>all.filter(row=>row.type===type);
 const actions=byType('action');
 const referrals=byType('referral');
 const stages=['Submitted','Reviewed','Support Agreed','Progress Reviewed','Closed'];
 const referralStages=stages.map(stage=>({stage,count:referrals.filter(r=>lastReferralStage(r)===stage).length}));
 const monitoring=members.map(s=>interventionFor(s,sssRecords,entries)).filter(Boolean);
 const plans=byType('plan').filter(p=>p.status==='Active');
 const reviews=byType('review');
 const voice=byType('voice');
 const caregiver=byType('communication');
 const decisions=reviews.filter(x=>['Continue','Adapt','Intensify','Fade Support'].includes(x.decision));
 const openActions=actions.filter(a=>a.status==='Open').length;
 const completedActions=actions.filter(a=>a.status==='Completed').length;
 const followed=completedActions+openActions;
 const reviewedStudents=new Set(decisions.map(x=>x.studentId)).size;
 const voiceStudents=new Set(voice.map(x=>x.studentId)).size;
 const caregiverStudents=new Set(caregiver.map(x=>x.studentId)).size;
 const plannedStudents=new Set(plans.map(x=>x.studentId)).size;
 const target=monitoring.filter(x=>x.latest>=x.target).length;
 const weekly=Array.from({length:6},(_,i)=>{
  const available=monitoring.filter(x=>Number.isFinite(x.observations[i]?.observed));
  return {week:i+1,available:available.length,atTarget:available.filter(x=>
   x.observations[i].observed>=x.target).length,
   share:pct(available.filter(x=>x.observations[i].observed>=x.target).length,available.length)};
 });
 const streams=[
  {label:'EAL',count:members.filter(s=>sssRecords.get(s.id).services.includes('EAL')).length},
  {label:'Learning Support',count:members.filter(s=>sssRecords.get(s.id).services.includes('Learning Support')).length}
 ];
 const suppressed=scoped.length<MIN_LEADERS_GROUP||members.length<MIN_LEADERS_SUPPORT;
 return {
  scopeSize:scoped.length,cohort:members.length,suppressed,cohortRate:pct(members.length,scoped.length),
  activePlans:plannedStudents,reviewsDue:members.filter(s=>withinReviewWindow(sssRecords.get(s.id).reviewDate)).length,
  actionOpen:openActions,actionCompleted:completedActions,actionTotal:followed,
  actionCompletionRate:pct(completedActions,followed),
  referralTotal:referrals.length,referralPending:referrals.filter(x=>
   ['Submitted','Reviewed'].includes(lastReferralStage(x))).length,referralStages,
  monitored:monitoring.length,atTarget:target,atTargetRate:pct(target,monitoring.length),
  weekly,streamCounts:streams,
  readiness:[
   {label:'Active support plan',count:plannedStudents,denominator:members.length},
   {label:'Review decision documented',count:reviewedStudents,denominator:members.length},
   {label:'Learner perspective captured',count:voiceStudents,denominator:members.length},
   {label:'Caregiver communication noted',count:caregiverStudents,denominator:members.length}
  ].map(x=>({...x,rate:pct(x.count,x.denominator)})),
  reviewDecisions:decisions.length
 };
}
export function studentSupportLeadershipSummary(students,records,entries){
 const all=aggregateStudentSupport(students,records,entries);
 const distinctDivisions=[...new Set(students.map(s=>s.division))];
 const divisions=distinctDivisions.length>1?['Elementary','Secondary'].map(name=>{
  const result=aggregateStudentSupport(students.filter(s=>s.division===name),records,entries);
  return {name,...result};
 }):[];
 const inquiry=[];
 if(all.referralPending>0)inquiry.push('Are pending referrals receiving a timely review and a documented next decision?');
 if(all.reviewsDue>0)inquiry.push('Are upcoming SST reviews prepared with learner voice and recent evidence?');
 if(all.actionOpen>0)inquiry.push('What would help teams close agreed follow-ups without extra administration?');
 if(all.monitored>0&&all.atTarget<all.monitored)
  inquiry.push('Where might the team review its strategies before the next support cycle?');
 if(!inquiry.length)inquiry.push('Which classroom supports are helping students become more independent?');
 return {...all,divisions,inquiry:inquiry.slice(0,3)};
}
