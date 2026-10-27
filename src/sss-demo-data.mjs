/** AISG My Learners — fictional Student Support Services cohort.
 * Derives demonstration membership from the SAME synthetic learner/tag source
 * used by Faculty, Student and Leaders. No student diagnoses, confidential case
 * notes, actual IEP records or real WIDA results are included.
 *
 * IMPORTANT: This module is NOT permission enforcement.
 * Never replace synthetic data with identifiable student data on GitHub Pages.
 */
import {hash,rng,gradeNumber,GRADES} from './data.mjs';
import {demoTagsForStudent} from './learner-tags.mjs';

const demoId=id=>/^DEMO-\d{4}$/.test(String(id||''));
const step=(id,key)=>rng(hash(id+'-sss-'+key))();
const roundTenth=n=>Math.max(1,Math.min(6,Math.round(n*10)/10));
export const SSS_AS_OF='2026-10-08';
export const WIDA_DOMAINS=Object.freeze(['Listening','Reading','Speaking','Writing']);

export function isSSSDemoMember(student){
 if(!student||!demoId(student.id))return false;
 const ids=demoTagsForStudent(student).map(t=>t.id);
 // Medical or behavioural tags never establish SSS programme membership.
 if(ids.includes('ss')||ids.includes('iep'))return true;
 // Some, not all, fictional EAL classroom-tag students join the SSS demo cohort.
 return ids.includes('eal') && hash(student.id+'-sss-membership')%4!==0;
}

function widaDemo(student,ids){
 const grade=gradeNumber(student.grade);
 if(!ids.includes('eal')||grade<0||grade>5)return null;
 const kindergarten=grade===0;
 const base=1.9+step(student.id,'wida-base')*2.35;
 const domains=(kindergarten?['Listening','Speaking']:WIDA_DOMAINS).map((name,i)=>({
  name,level:roundTenth(base+(step(student.id,'wida-'+name)-.5)*1.25+
    (name==='Reading' || name==='Writing' ? -.22 : .16))
 }));
 // This is a fictional composite example, NOT an official or self-calculated WIDA score.
 const overall=roundTenth(base+(step(student.id,'wida-composite')-.5)*.52);
 return Object.freeze({
  measure:kindergarten?'WIDA Screener for Kindergarten':'WIDA Screener Paper',
  format:kindergarten?'Listening and Speaking only (two-domain example)':'Four-domain paper example',
  date:'2026-09-'+String(8+hash(student.id+'-wida-date')%17).padStart(2,'0'),
  domains,compositeLabel:kindergarten?'Oral Language':'Overall',
  compositeLevel:overall,
  proficiencyRange:'1.0–6.0',
  simulated:true
 });
}
function programmeFocus(ids,student){
 const hasLang=ids.includes('eal');
 const hasLearning=ids.includes('ss')||ids.includes('iep');
 const elementary=gradeNumber(student.grade)<=5;
 if(hasLang&&hasLearning)return {
  title:'Language and learning access',
  goal:'Use accessible vocabulary, models and flexible ways to show understanding.',
  strategy:'Preview language alongside visual models; review learner work with the team.'
 };
 if(hasLang)return {
  title:'Language development',
  goal:'Build participation through purposeful speaking, listening and language scaffolds.',
  strategy:'Offer visuals, rehearsal and opportunities to use language in meaningful tasks.'
 };
 return elementary?{
  title:'Learning access',
  goal:'Make learning goals explicit and support learners to demonstrate understanding.',
  strategy:'Use worked examples, manageable steps and planned feedback.'
 }:{
  title:'Accessible learning pathways',
  goal:'Support independence, organisation and multiple ways to demonstrate learning.',
  strategy:'Clarify success criteria, chunk complex tasks and check progress together.'
 };
}
function activeServices(ids){
 const out=[];
 if(ids.includes('eal'))out.push('EAL');
 if(ids.includes('ss')||ids.includes('iep'))out.push('Learning Support');
 return out;
}
function createRecord(student){
 if(!isSSSDemoMember(student))return null;
 const tags=demoTagsForStudent(student);
 const ids=tags.map(t=>t.id);
 const focus=programmeFocus(ids,student);
 return Object.freeze({
  studentId:student.id,
  grade:student.grade,
  classId:student.classId,
  services:Object.freeze(activeServices(ids)),
  tagIds:Object.freeze(ids),
  reviewDate:'2026-11-'+String(5+hash(student.id+'-sss-review')%20).padStart(2,'0'),
  lastReviewed:'2026-09-'+String(8+hash(student.id+'-sss-last')%17).padStart(2,'0'),
  focus:Object.freeze(focus),
  wida:widaDemo(student,ids),
  simulated:true
 });
}

export function createSSSDemoRecords(students){
 const out=new Map();
 for(const student of students||[]){
  const record=createRecord(student);
  if(record)out.set(student.id,record);
 }
 return out;
}
export const sssRecordFor=(records,studentId)=>records?.get(studentId)||null;

export function sssCohort(students,records,grade='All',query=''){
 const text=String(query||'').trim().toLocaleLowerCase();
 return (students||[]).filter(s=>records?.has(s.id) &&
  (grade==='All'||s.grade===grade) &&
  (!text||s.name.toLocaleLowerCase().includes(text)||
   (s.last+', '+s.first).toLocaleLowerCase().includes(text)))
  .sort((a,b)=>GRADES.indexOf(a.grade)-GRADES.indexOf(b.grade)||
   a.last.localeCompare(b.last,'en',{sensitivity:'base'})||
   a.first.localeCompare(b.first,'en',{sensitivity:'base'})||a.id.localeCompare(b.id));
}
