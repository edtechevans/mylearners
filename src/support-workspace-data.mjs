/**
 * Synthetic SSS casework for the PUBLIC My Learners demo.
 * All learner records, authors, supports, dates and communications are invented.
 * Never import actual AISG casework or use this as an operational system.
 */
import {hash} from './data.mjs';

export const SUPPORT_TYPES=Object.freeze({
 note:'Case Note',referral:'SST Referral',meeting:'SST Meeting',
 plan:'Support Plan',communication:'Caregiver Communication',action:'Follow-up Action'
});
export const SUPPORT_AS_OF='2026-10-28';
const demoDate=(day)=>'2026-10-'+String(day).padStart(2,'0');
const reviewDay=(id)=>'2026-11-'+String(3+hash(id+'-review-due')%24).padStart(2,'0');
const ID_PREFIX='support-demo-';
const allowed=new Set(Object.keys(SUPPORT_TYPES));
const clean=(value,n=2000)=>String(value??'').trim().slice(0,n);
const allowedVisibility=v=>v==='restricted'?'restricted':'shared';
const base=(student,id,type,date,title,summary,visibility,extra={})=>({
 id:ID_PREFIX+student.id+'-'+id,studentId:student.id,type,date,title,summary,
 visibility,author:'SSS Demonstration Team',source:'seed',status:'Recorded',...extra
});

export function seedSupportDemo(students,sssRecords){
 const all=[];
 for(const student of students||[]){
  const r=sssRecords.get(student.id);
  if(!r){
   if(hash(student.id+'-class-note')%5===0)all.push(base(student,'class-note','note',demoDate(15),
    'Classroom strategy reflection','A short visual routine supported independent task initiation. Continue checking how the learner experiences the approach.','shared',
    {category:'Learning Access',nextStep:'Continue with visuals and gather learner feedback.'}));
   continue;
  }
  const focus=r.focus;
  const reviewDate=r.reviewDate||reviewDay(student.id);
  all.push(base(student,'plan','plan','2026-09-22','Learning Access Support Plan',
   focus.goal,'shared',{status:'Active',category:'Learning Access',
    accommodations:'Provide clear success criteria, short steps and a visual model.',
    goals:'Increase independent access to multi-step learning tasks.',
    services:r.services.join(', '),progress:'Review student work and learner feedback at the next check-in.',
    reviewDate}));
  all.push(base(student,'note','note',demoDate(12+hash(student.id+'-note-day')%9),
   'Classroom support update',focus.strategy,'shared',
   {category:'Learning Access',nextStep:'Discuss implementation and review evidence.',reviewDate}));
  all.push(base(student,'meeting','meeting',demoDate(8+hash(student.id+'-meeting-day')%9),
   'SST progress review','The team reviewed strengths, access needs and existing classroom approaches. A follow-up check was agreed.',
   'restricted',{category:'Learning Access',participants:'Classroom teacher; SSS team',
    barriers:'Multi-step learning tasks can benefit from additional scaffolding.',
    studentNeeds:'Predictable instructions, clarity and ways to demonstrate learning.',
    supports:focus.strategy,classroom:focus.strategy,
    actionItems:'Check classroom implementation and collect learner feedback.',
    owner:'SSS Case Manager (demo)',reviewDate}));
  all.push(base(student,'action','action',demoDate(20),
   'Review classroom strategies','Gather a short example of learner work and review the agreed strategies.',
   'restricted',{status:hash(student.id+'-action-status')%4===0?'Completed':'Open',
    owner:'SSS Case Manager (demo)',reviewDate}));
  if(hash(student.id+'-communication')%3!==0)
   all.push(base(student,'communication','communication',demoDate(18),
    'Caregiver check-in','A constructive discussion about learning strengths and practical support approaches.',
    'restricted',{category:'Phone conversation',owner:'SSS Case Manager (demo)',
     nextStep:'Share an update at the next review.',reviewDate}));
  if(hash(student.id+'-referral')%4===0)
   all.push(base(student,'referral','referral','2026-09-16','SST referral',
    'Teacher requested collaborative review of learning access and prior classroom strategies.',
    'restricted',{status:'Under review',category:'Learning Access',
     strengths:'Engages positively with familiar learning routines.',
     evidence:'Recent classroom work samples and formative checks.',
     previous:'Visual task checklist, modelling and targeted feedback.',
     nextStep:'Review evidence with the SST.',reviewDate}));
 }
 return all;
}
const SESSION_KEY='aisg-mylearners-support-demo-v1';
export function loadDraftEntries(storage=globalThis.sessionStorage){
 try{
  const parsed=JSON.parse(storage?.getItem(SESSION_KEY)||'[]');
  if(!Array.isArray(parsed))return [];
  return parsed.slice(-100).filter(x=>x&&allowed.has(x.type)&&/^DEMO-\d{4}$/.test(x.studentId))
   .map(x=>sanitizeEntry(x)).filter(Boolean);
 }catch{return []}
}
function sanitizeEntry(entry){
 if(!entry||!allowed.has(entry.type)||!/^DEMO-\d{4}$/.test(String(entry.studentId)))return null;
 const extra={};
 for(const key of ['category','nextStep','strengths','evidence','previous','participants',
  'barriers','studentNeeds','supports','classroom','actionItems','owner','services','goals',
  'accommodations','progress'])extra[key]=clean(entry[key],2000);
 return {...extra,id:clean(entry.id,100),studentId:entry.studentId,type:entry.type,
  date:/^\d{4}-\d{2}-\d{2}$/.test(entry.date)?entry.date:SUPPORT_AS_OF,
  title:clean(entry.title,160),summary:clean(entry.summary),author:'Demo Contributor',
  status:['Active','Open','Completed','Under review','Recorded'].includes(entry.status)?entry.status:'Recorded',
  reviewDate:/^\d{4}-\d{2}-\d{2}$/.test(entry.reviewDate)?entry.reviewDate:'',
  visibility:allowedVisibility(entry.visibility),source:'session'};
}
export function storeDraftEntries(entries,storage=globalThis.sessionStorage){
 try{storage?.setItem(SESSION_KEY,JSON.stringify(entries.slice(-100).map(sanitizeEntry).filter(Boolean)));return true}catch{return false}
}
export function createDraftEntry(form,studentId,role,existingId=''){
 const type=allowed.has(form.type)?form.type:'note';
 const input={...form,studentId,type,date:form.date||SUPPORT_AS_OF,
  id:existingId||'draft-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),
  title:clean(form.title,160)||SUPPORT_TYPES[type],
  summary:clean(form.summary),author:'Demo Contributor',source:'session',
  status:type==='plan'?'Active':type==='action'?'Open':type==='referral'?'Under review':'Recorded',
  visibility:role==='faculty'?'shared':allowedVisibility(form.visibility)};
 return sanitizeEntry(input);
}
export function supportForStudent(entries,id,role='sss'){
 return (entries||[]).filter(x=>x.studentId===id&&(role==='sss'||x.visibility==='shared'))
  .sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
}
export function supportActions(entries,students,sssRecords){
 const ids=new Set(students.map(s=>s.id));
 const relevant=(entries||[]).filter(x=>ids.has(x.studentId));
 const reviews=students.filter(s=>{
  const date=sssRecords.get(s.id)?.reviewDate;
  return date&&date>=SUPPORT_AS_OF&&date<='2026-11-27';
 }).length;
 return {learners:students.length,reviews,actions:relevant.filter(x=>x.type==='action'&&x.status==='Open').length,
  plans:relevant.filter(x=>x.type==='plan'&&x.status==='Active').length};
}
