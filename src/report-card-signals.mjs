/** Presentation-only interpretation of explicitly fictional current-year test grades.
 * Historical issued reports remain separate. Developmental descriptors are
 * never converted to numbers, and non-report measures have their own scales.
 */
import {academicFor,facultyDemoReport} from './academic-journey-data.mjs';

export function numericReportGrade(value,scale){
 if(scale!=='1–7'||value===null||value===undefined||String(value).trim()==='')return null;
 const n=Number(value);
 return Number.isInteger(n)&&n>=1&&n<=7?n:null;
}
export function reportGradeBand(value,scale){
 const n=numericReportGrade(value,scale);
 return n===null?null:n<=3?'band-low':n===4?'band-mid-low':n<=6?'band-mid-high':'band-high';
}
export function facultyRosterEvidenceColumns(students,academic,baseColumns){
 const subjects=new Set();
 for(const s of students||[]){
  const report=facultyDemoReport(academicFor(academic,s.id));
  for(const item of report?.subjects||[])subjects.add(item.subject);
 }
 // No result is invented at render time; the separate synthetic fixture provides data.
 if(!subjects.size)return baseColumns;
 const attendance=baseColumns.find(c=>c.kind==='attendance');
 const other=baseColumns.filter(c=>c.kind!=='attendance'&&c.kind!=='report');
 return [
  ...(attendance?[attendance]:[]),
  ...[...subjects].map(subject=>({id:'report:'+subject,kind:'report',
   subject,label:'Report · '+subject})),
  ...other
 ];
}
export function leaderReportSignalSummary(students,academic){
 const scoped=students||[];
 const numeric=[];
 for(const student of scoped){
  const report=facultyDemoReport(academicFor(academic,student.id));
  if(!report?.testing||report.scale!=='1–7')continue;
  const outcomes=(report.subjects||[]).map(x=>({
   subject:x.subject,value:numericReportGrade(x.value,report.scale)
  })).filter(x=>x.value!==null);
  if(!outcomes.length)continue;
  const low=outcomes.filter(x=>x.value<=3);
  numeric.push({student,report,outcomes,low,lowest:low.length?
   Math.min(...low.map(x=>x.value)):null});
 }
 const flagged=numeric.filter(x=>x.low.length).sort((a,b)=>
  b.low.length-a.low.length||a.lowest-b.lowest||
  a.student.grade.localeCompare(b.student.grade,'en',{numeric:true})||
  a.student.name.localeCompare(b.student.name,'en'));
 return {
  selected:scoped.length,numericReports:numeric.length,
  withoutNumericReport:scoped.length-numeric.length,
  flagged:flagged.length,lowSubjectResults:flagged.reduce((n,x)=>n+x.low.length,0),
  rows:flagged
 };
}
