/** Fictional student support indicators for the public AISG My Learners demo.
 * These are DEMONSTRATION FLAGS ONLY, not diagnoses, plans, alerts or actual data.
 * No real student, medical, behavioural or safeguarding information may go to GitHub Pages.
 */
import {hash} from './data.mjs';

export const SUPPORT_TAGS=Object.freeze([
 Object.freeze({
  id:'eal',label:'EAL',fullName:'English as an Additional Language',
  summary:'Additional language-learning scaffolds are illustrated for this learner.',
  strategies:Object.freeze([
   'Preview key vocabulary with visuals, examples and time to rehearse ideas.',
   'Check conceptual understanding separately from English-language fluency.'
  ]),
  source:'Fictional EAL classroom guidance'
 }),
 Object.freeze({
  id:'ss',label:'SS',fullName:'Student Support',
  summary:'Teacher-facing learning adjustments are illustrated for this learner.',
  strategies:Object.freeze([
   'Give clear, manageable instructions and check understanding discreetly.',
   'Confirm approved classroom adjustments with the authorised Student Support team.'
  ]),
  source:'Fictional Student Support classroom guidance'
 }),
 Object.freeze({
  id:'iep',label:'IEP',fullName:'Individualised Education Plan',
  summary:'An individual learning plan is indicated in this demonstration. This is not an actual IEP.',
  strategies:Object.freeze([
   'Apply the agreed learning targets and accommodations in the authorised plan.',
   'Offer clear steps and appropriate options for demonstrating understanding.'
  ]),
  source:'Fictional IEP classroom guidance'
 }),
 Object.freeze({
  id:'medical',label:'Medical',fullName:'Medical classroom guidance',
  summary:'A classroom safety plan may be relevant; no condition or health history is shown here.',
  strategies:Object.freeze([
   'Review the authorised school-health response instructions before activities that require planning.',
   'Use the school-approved health and emergency procedures rather than relying on this demonstration.'
  ]),
  source:'Fictional classroom safety guidance; full records remain with School Health',
  restricted:true
 }),
 Object.freeze({
  id:'behavioural',label:'Behavioural',fullName:'Positive behaviour support',
  summary:'Proactive classroom approaches are illustrated, not a diagnosis or a judgement about this learner.',
  strategies:Object.freeze([
   'Use predictable routines, a calm response and discreet check-ins.',
   'Check any agreed individual approach with authorised student-support colleagues; avoid public labels.'
  ]),
  source:'Fictional positive behaviour support guidance; private records remain restricted',
  restricted:true
 })
]);
export const TAG_BY_ID=Object.freeze(Object.fromEntries(SUPPORT_TAGS.map(tag=>[tag.id,tag])));
export const TAG_IDS=Object.freeze(SUPPORT_TAGS.map(tag=>tag.id));

/** Seeded examples deliberately cover every tag in every synthetic 20-learner group.
 * An enriched demonstration is NOT a prevalence estimate for any grade or school.
 * These example flags are not derived from actual AISG student/staff records.
 */
export function demoTagsForStudent(student){
 if(!student||!/^DEMO-\d{4}$/.test(String(student.id||''))||!student.classId)return [];
 const seat=(Number(student.id.slice(5))-1)%20;
 const offset=hash(student.classId)%3;
 const ids=new Set();
 const primary=TAG_IDS[seat-offset];
 if(primary)ids.add(primary);
 if(seat===offset+5){ids.add('eal');ids.add('ss');}
 if(seat===offset+6){ids.add('iep');ids.add('medical');}
 if(student.eal)ids.add('eal');
 return SUPPORT_TAGS.filter(tag=>ids.has(tag.id));
}
export function hasDemoTag(student,tagId){
 return demoTagsForStudent(student).some(tag=>tag.id===tagId);
}
export function demoTagSummary(classStudents){
 const counts=Object.fromEntries(TAG_IDS.map(id=>[id,0]));
 for(const student of classStudents||[])for(const tag of demoTagsForStudent(student))counts[tag.id]++;
 return counts;
}
