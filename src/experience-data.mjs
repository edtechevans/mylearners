/** AISG My Learners | fictional student-experience indicators.
 * A transparent, unvalidated demonstration measure based on six
 * survey-inspired check-in questions. NEVER link confidential climate survey
 * rows to named learner profiles or publish genuine learner responses.
 */
import {hash,rng,clamp,gradeNumber} from './data.mjs';

export const EXPERIENCE_WINDOWS=Object.freeze([
 {key:'F25',label:'Fall 2025'},
 {key:'S26',label:'Spring 2026'},
 {key:'F26',label:'Fall 2026'}
]);
export const EXPERIENCE_SCALE=Object.freeze([
 {label:'Strongly disagree',short:'Strongly disagree',points:-2},
 {label:'Disagree',short:'Disagree',points:-1},
 {label:'Agree',short:'Agree',points:1},
 {label:'Strongly agree',short:'Strongly agree',points:2}
]);
export const EXPERIENCE_METRICS=Object.freeze({
 engagement:{
  label:'Engagement',short:'Engagement',description:'How engaged and interested learning feels to the student.',
  color:'teal',
  secondary:[
   'I am engaged during my classes.',
   'I am interested in my classes.',
   'I feel excited to participate in my classes.'
  ],
  elementary:[
   'I am interested in what I am learning.',
   'I have opportunities to take part in learning.',
   'I look forward to joining learning activities.'
  ]
 },
 belonging:{
  label:'Belonging',short:'Belonging',description:'How welcomed, respected and supported the student feels at school.',
  color:'purple',
  secondary:[
   'I feel a sense of belonging at school.',
   'Other students treat me with respect.',
   'I feel supported by my teachers.'
  ],
  elementary:[
   'I feel like I belong at school.',
   'Other students are kind to me.',
   'Adults at school help me feel welcome.'
  ]
 }
});
export const METRIC_IDS=Object.freeze(['engagement','belonging']);
export const experienceEligible=student=>!!student&&gradeNumber(student.grade)>=3;
export const questionsFor=(student,metric)=>EXPERIENCE_METRICS[metric]?.[gradeNumber(student.grade)<=5?'elementary':'secondary']||[];
export function calculateIndex(responses){
 if(!Array.isArray(responses)||responses.length!==3||responses.some(v=>!Number.isInteger(v)||v<0||v>3))return null;
 return Math.round(responses.reduce((sum,r)=>sum+EXPERIENCE_SCALE[r].points,0)/3*100)/100;
}
function simulatedAnswers(student,metric,periodIndex){
 const personal=rng(hash(student.id+'-'+metric+'-profile'));
 const trait=(personal()-.5)*1.55;
 const shift=[-.35,-.16,0][periodIndex];
 const grade=gradeNumber(student.grade);
 const ageEffect=grade>=10?-.10:grade<=5?.09:0;
 const center=metric==='engagement'?1.86:2.10;
 return [0,1,2].map(i=>{
  const n=rng(hash(student.id+'-'+metric+'-'+periodIndex+'-'+i))();
  return clamp(Math.round(center+trait+shift+ageEffect+(n-.5)*1.9+(i===1?-.09:0)),0,3);
 });
}
export function createExperienceRecords(students){
 const byId=new Map();
 for(const s of students){
  if(!experienceEligible(s))continue;
  const history={};
  EXPERIENCE_WINDOWS.forEach((w,periodIndex)=>{
   if(gradeNumber(s.grade)===3&&periodIndex<2)return; // earlier cohort was below G3
   if(periodIndex===2&&hash(s.id+'-latest-checkin')%27===0)return;
   if(periodIndex<2&&hash(s.id+'-'+w.key+'-checkin')%11===0)return;
   history[w.key]={};
   for(const metric of METRIC_IDS){
    const answers=simulatedAnswers(s,metric,periodIndex);
    const labels=questionsFor(s,metric);
    history[w.key][metric]={
     value:calculateIndex(answers),
     items:answers.map((response,i)=>({
      question:labels[i],response,label:EXPERIENCE_SCALE[response].label,
      points:EXPERIENCE_SCALE[response].points
     }))
    };
   }
  });
  byId.set(s.id,history);
 }
 return byId;
}
export function experienceFor(records,studentId,metric,window='F26'){
 return records.get(studentId)?.[window]?.[metric]||null;
}
export function summarizeExperience(records,students,metric,window='F26'){
 const eligible=(students||[]).filter(experienceEligible);
 const values=eligible.map(s=>experienceFor(records,s.id,metric,window)?.value).filter(Number.isFinite);
 return {
  value:values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length*100)/100:null,
  n:values.length,eligible:eligible.length,
  coverage:eligible.length?Math.round(values.length/eligible.length*100):null
 };
}
export function experienceQuestionSummary(records,students,metric,window='F26'){
 const eligible=(students||[]).filter(experienceEligible);
 return questionsFor(eligible[0]||{grade:'G7'},metric).map((question,i)=>{
  const values=eligible.map(s=>experienceFor(records,s.id,metric,window)?.items[i]).filter(Boolean);
  return {question,n:values.length,value:values.length?Math.round(values.reduce((a,v)=>a+v.points,0)/values.length*100)/100:null,
   favorable:values.length?Math.round(values.filter(x=>x.response>=2).length/values.length*100):null};
 });
}
export function experienceChange(records,students,metric,window='F26'){
 const index=EXPERIENCE_WINDOWS.findIndex(item=>item.key===window);
 const current=summarizeExperience(records,students,metric,window);
 const previousWindow=index>0?EXPERIENCE_WINDOWS[index-1]:null;
 const previous=previousWindow?summarizeExperience(records,students,metric,previousWindow.key):null;
 return {current,previous,previousLabel:previousWindow?.label||null,
  delta:current.value===null||previous?.value===null||!previous?null:current.value-previous.value};
}
