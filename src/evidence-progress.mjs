/** Compact, read-only sequences from the same fictional evidence records as the UI.
 * No synthetic history is generated here. Never compare different programmes/scales.
 */
import {facultyDemoReport} from './academic-journey-data.mjs';
import {subjectMapRecords} from './map-growth.mjs';
import {EXPERIENCE_WINDOWS,experienceFor,summarizeExperience} from './experience-data.mjs';
import {MAIA_PERIODS,maiaValue,maiaPeriod,maiaDimension} from './maia-demo.mjs';

const finite=Number.isFinite;
const formatSigned=(n,digits=0)=>{
 const rounded=Number(n.toFixed(digits));
 return (rounded>0?'+':'')+rounded.toFixed(digits);
};
const result=(points,unit='',precision=0,compare=true)=>{
 const selected=points.filter(p=>p&&p.label&&p.value!==null&&p.value!==undefined);
 const recent=selected.slice(-3);
 const latest=recent.at(-1),prior=recent.at(-2);
 const delta=compare&&latest&&prior&&finite(latest.numeric)&&finite(prior.numeric)?
  formatSigned(latest.numeric-prior.numeric,precision)+' '+unit:null;
 return {points:recent.map(({label,value})=>({label:String(label),value:String(value)})),
  change:delta&&prior?{value:delta,from:String(prior.label)}:null};
};
export function reportProgress(record,subject){
 const current=facultyDemoReport(record);
 const chosen=current?.subjects?.find(x=>x.subject===subject);
 if(!chosen)return result([]);
 const compatible=(record?.reports||[]).filter(report=>
  report.year!==current.year&&report.scale===current.scale&&
  report.framework===current.framework&&report.subjects?.some(x=>x.subject===subject));
 const points=compatible.slice().reverse().map(report=>{
  const entry=report.subjects.find(x=>x.subject===subject);
  return {label:report.year,value:entry.value,
   numeric:report.scale==='1–7'&&/^[1-7]$/.test(String(entry.value))?Number(entry.value):null};
 });
 points.push({label:current.year,value:chosen.value,
  numeric:current.scale==='1–7'&&/^[1-7]$/.test(String(chosen.value))?Number(chosen.value):null});
 return result(points,'grade points',0,current.scale==='1–7');
}
/** Historical issued records only, stopping at the report selected in the profile. */
export function issuedReportProgress(record,subject,year){
 const reports=(record?.reports||[]).filter(r=>r.issued!==false);
 const selected=reports.find(r=>r.year===year)||reports[0];
 const chosen=selected?.subjects.find(x=>x.subject===subject);
 if(!chosen)return result([]);
 const points=reports.filter(r=>r.end<=selected.end&&r.framework===selected.framework&&
  r.scale===selected.scale&&r.subjects.some(x=>x.subject===subject))
  .sort((a,b)=>a.end-b.end).map(r=>{
   const entry=r.subjects.find(x=>x.subject===subject);
   return {label:r.year,value:entry.value,
    numeric:r.scale==='1–7'&&/^[1-7]$/.test(String(entry.value))?Number(entry.value):null};
  });
 return result(points,'grade points',0,selected.scale==='1–7');
}
export function academicCheckinProgress(record,mode){
 const items=(record?.[mode]||[]).filter(x=>mode!=='ixl'||Number.isFinite(x.level));
 if(!['ixl','core','fp'].includes(mode))return result([]);
 const points=items.map(x=>({
  label:x.date,
  value:mode==='ixl'?String(x.level):mode==='core'?x.correct+'/'+x.assessed:'Level '+x.level,
  numeric:mode==='ixl'?x.level:mode==='core'?x.correct:null
 }));
 return result(points,mode==='ixl'?'diagnostic points':'items',0,mode!=='fp');
}
export function mapProgress(records,subject='Mathematics',window='F26'){
 const series=subjectMapRecords(records,subject);
 const current=series.find(x=>x.key===window);
 if(!current)return result([]);
 const points=series.filter(x=>x.date<=current.date).map(x=>({
  label:x.window||x.date,value:String(x.rit),numeric:x.rit
 }));
 return result(points,'RIT',0);
}
export function experienceProgress(records,studentId,metric,window='F26'){
 const end=EXPERIENCE_WINDOWS.findIndex(x=>x.key===window);
 if(end<0||!experienceFor(records,studentId,metric,window))return result([]);
 const points=EXPERIENCE_WINDOWS.slice(0,end+1).map(w=>{
  const x=experienceFor(records,studentId,metric,w.key);
  return x?{label:w.label,value:formatSigned(x.value,2),numeric:x.value}:null;
 });
 return result(points,'index points',2);
}
export function groupExperienceProgress(records,students,metric,window='F26'){
 const end=EXPERIENCE_WINDOWS.findIndex(x=>x.key===window);
 if(end<0)return result([]);
 const current=summarizeExperience(records,students,metric,window);
 if(!finite(current.value))return result([]);
 const points=EXPERIENCE_WINDOWS.slice(0,end+1).map(w=>{
  const x=summarizeExperience(records,students,metric,w.key);
  return finite(x.value)?{label:w.label,value:formatSigned(x.value,2),numeric:x.value}:null;
 });
 return result(points,'index points',2);
}
export function maiaProgress(records,studentId,dimension,window='F26'){
 const key=maiaPeriod(window),end=MAIA_PERIODS.findIndex(x=>x.key===key);
 if(end<0||!finite(maiaValue(records,studentId,dimension,key)))return result([]);
 const points=MAIA_PERIODS.slice(0,end+1).map(w=>{
  const v=maiaValue(records,studentId,maiaDimension(dimension),w.key);
  return finite(v)?{label:w.label,value:v.toFixed(1)+' / 10',numeric:v}:null;
 });
 return result(points,'points',1);
}
