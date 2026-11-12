/** Read-only question-level previews for demonstration Engagement / Belonging data.
 * Group previews never identify respondents. Never publish confidential survey rows.
 */
import {EXPERIENCE_METRICS,EXPERIENCE_WINDOWS,EXPERIENCE_SCALE,
 experienceEligible,experienceFor,experienceQuestionSummary,questionsFor,summarizeExperience} from './experience-data.mjs';

const score=value=>Number.isFinite(value)?value:null;

export function buildExperienceQuestionPreview(records,students,metric,window='F26',
 {scopeLabel='',individual=false}={}){
 if(!records||!Object.hasOwn(EXPERIENCE_METRICS,metric))return null;
 const period=EXPERIENCE_WINDOWS.find(x=>x.key===window)||EXPERIENCE_WINDOWS.at(-1);
 const eligible=(students||[]).filter(experienceEligible);
 const title=EXPERIENCE_METRICS[metric].label;
 if(individual){
  if(eligible.length!==1)return null;
  const student=eligible[0],entry=experienceFor(records,student.id,metric,period.key);
  const questions=questionsFor(student,metric).map((question,i)=>{
   const item=entry?.items?.[i];
   return {question:item?.question||question,label:item?.label||'Not recorded',points:score(item?.points)};
  });
  return {metric,title,scopeLabel:scopeLabel||student.name||student.grade,
   windowLabel:period.label,individual:true,value:score(entry?.value),
   n:entry?1:0,eligible:1,
   groups:[{label:student.division||'',value:score(entry?.value),
    n:entry?1:0,eligible:1,questions}]};
 }
 const summary=summarizeExperience(records,eligible,metric,period.key);
 // Elementary and Secondary question sets differ, so split even a whole-school view.
 const groups=['Elementary','Secondary'].map(division=>{
  const members=eligible.filter(s=>s.division===division);
  if(!members.length)return null;
  const group=summarizeExperience(records,members,metric,period.key);
  const questions=experienceQuestionSummary(records,members,metric,period.key).map((q,i)=>{
   const answers=members.map(s=>experienceFor(records,s.id,metric,period.key)?.items?.[i])
    .filter(x=>x&&Number.isInteger(x.response)&&x.response>=0&&x.response<EXPERIENCE_SCALE.length);
   return {...q,choices:EXPERIENCE_SCALE.map((option,response)=>({
    label:option.label,points:option.points,count:answers.filter(x=>x.response===response).length
   }))};
  });
  return {label:division,value:score(group.value),n:group.n,eligible:group.eligible,questions};
 }).filter(Boolean);
 return {metric,title,scopeLabel,windowLabel:period.label,individual:false,
  value:score(summary.value),n:summary.n,eligible:summary.eligible,groups};
}
