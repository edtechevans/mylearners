/** AISG My Learners: deterministic, strictly fictional academic evidence.
 *
 * 1) Report card outcomes by subject: most recent *issued* years only.
 *    PK–G5 are illustrative developmental descriptors; G6–10 are illustrative
 *    MYP grades 1–7; G11–12 are illustrative DP course grades 1–7.
 *    Programme scales are NOT comparable longitudinally.
 * 2) IXL Mathematics: simulated overall diagnostic levels for G1–10 (0–1300).
 *    Not IXL practice SmartScores and not a percentage.
 * 3) Core Phonics: a *mock classroom 50-item decoding check*, not an official
 *    CORE Phonics Survey total/benchmark. Included for K–G5 only.
 * 4) Fountas & Pinnell: mock text levels A–Z+, K–G5 only, not grades/percentiles.
 *
 * No real AISG students, accounts, survey records or assessment exports are used.
 */
import {hash,rng,clamp,gradeNumber,GRADES} from './data.mjs';

export const REPORT_PERIODS=Object.freeze([
 {end:2026,label:'2025–26'},
 {end:2025,label:'2024–25'},
 {end:2024,label:'2023–24'}
]);
export const ACADEMIC_CHECKINS=Object.freeze([
 {year:2024,label:'Fall 2024'},
 {year:2025,label:'Fall 2025'},
 {year:2026,label:'Fall 2026'}
]);
export const PRIMARY_DESCRIPTORS=Object.freeze([
 'Emerging','Developing','Applying','Extending'
]);
export const READING_LEVELS=Object.freeze([...'ABCDEFGHIJKLMNOPQRSTUVWXYZ','Z+']);
export const ACADEMIC_MODES=Object.freeze([
 {id:'report',label:'Report card',short:'Report card'},
 {id:'ixl',label:'IXL Mathematics',short:'IXL Math'},
 {id:'core',label:'Core Phonics',short:'Core Phonics'},
 {id:'fp',label:'F&P Reading',short:'F&P'}
]);
const SUBJECTS_EARLY=Object.freeze([
 'Early Literacy','Early Mathematics','Inquiry & Play','Creative Arts','Physical Development'
]);
const SUBJECTS_ES=Object.freeze([
 'English Language Arts','Mathematics','Science','Social Studies','Arts','Physical Education'
]);
const SUBJECTS_MYP=Object.freeze([
 'Language & Literature','Mathematics','Sciences','Individuals & Societies',
 'Language Acquisition','Design','Arts','Physical & Health Education'
]);
const SUBJECTS_DP=Object.freeze([
 'Language & Literature','Mathematics','Sciences','Individuals & Societies',
 'Language Acquisition','Arts / Elective'
]);
export const academicModesFor=grade=>{
 const n=gradeNumber(grade);
 return ['report',...(n>=1&&n<=10?['ixl']:[]),...(n>=0&&n<=5?['core','fp']:[])];
};
export const reportSubjectsFor=grade=>{
 const n=gradeNumber(grade);
 return n<0?SUBJECTS_EARLY:n<=5?SUBJECTS_ES:n<=10?SUBJECTS_MYP:SUBJECTS_DP;
};
export const reportFrameworkFor=grade=>{
 const n=gradeNumber(grade);
 return n<0?'Early years development':n<=5?'Elementary learning continuum':n<=10?'IB MYP':'IB Diploma';
};
const pseudo=(key)=>rng(hash(key))();
const currentGradeInYear=(student,startYear)=>{
 const gradeIndex=GRADES.indexOf(student.grade)-(2026-startYear);
 return gradeIndex>=0?GRADES[gradeIndex]:null;
};
const hasBeenEnrolled=(student,year)=>Number(String(student.enrolledDate||'9999').slice(0,4))<=year;
const issuer=(student,period)=>{
 const grade=currentGradeInYear(student,period.end-1);
 return grade&&hasBeenEnrolled(student,period.end-1)?grade:null;
};
const reportValue=(student,subject,year,grade)=>{
 const n=gradeNumber(grade);
 const studentStrength=(pseudo(student.id+'-report-personal')-.5)*1.8;
 const subjectStrength=(pseudo(student.id+'-'+subject+'-talent')-.5)*1.6;
 const variation=(pseudo(student.id+'-'+subject+'-'+year+'-reported')-.5)*1.5;
 const tendency=4.8+studentStrength+subjectStrength+variation+(year-2024)*.10;
 return n<=5?
  PRIMARY_DESCRIPTORS[clamp(Math.round(tendency-3),0,3)]:
  String(clamp(Math.round(tendency),1,7));
};
function createReports(student){
 return REPORT_PERIODS.flatMap(period=>{
  const grade=issuer(student,period);
  if(!grade)return [];
  const framework=reportFrameworkFor(grade);
  const scale=gradeNumber(grade)<=5?'descriptors':'1–7';
  return [{
   year:period.label,end:period.end,grade,framework,scale,
   issued:true,simulated:true,
   subjects:reportSubjectsFor(grade).map(subject=>({
    subject,value:reportValue(student,subject,period.end,grade),
    scale,framework
   }))
  }];
 });
}
const range=(min,max,n)=>clamp(n,min,max);
function createIXL(student){
 const current=gradeNumber(student.grade);
 if(current<1||current>10)return [];
 return ACADEMIC_CHECKINS.flatMap(window=>{
  const grade=currentGradeInYear(student,window.year);
  const n=grade?gradeNumber(grade):-1;
  if(n<1||n>10||!hasBeenEnrolled(student,window.year))return [];
  const aptitude=(pseudo(student.id+'-ixl-aptitude')-.5)*86;
  const individual=(pseudo(student.id+'-ixl-'+window.year)-.5)*24;
  const level=range(80,1150,Math.round((n*100+49+aptitude+individual)/5)*5);
  return [{
   date:window.label,year:window.year,grade,
   level,measure:'Illustrative IXL Mathematics diagnostic level',
   simulated:true
  }];
 }).sort((a,b)=>a.year-b.year);
}
function createCore(student){
 const current=gradeNumber(student.grade);
 if(current<0||current>5)return [];
 return ACADEMIC_CHECKINS.flatMap(window=>{
  const grade=currentGradeInYear(student,window.year);
  const n=grade?gradeNumber(grade):-1;
  if(n<0||n>5||!hasBeenEnrolled(student,window.year))return [];
  const readiness=(pseudo(student.id+'-core-readiness')-.5)*14;
  const variation=(pseudo(student.id+'-core-'+window.year)-.5)*6;
  const correct=range(0,50,Math.round(17+6*n+readiness+variation));
  return [{
   date:window.label,year:window.year,grade,correct,assessed:50,
   measure:'Fictional decoding-item check, not a published CORE Phonics total',
   simulated:true
  }];
 }).sort((a,b)=>a.year-b.year);
}
function createFP(student){
 const current=gradeNumber(student.grade);
 if(current<0||current>5)return [];
 const targets=[3,8,11,14,17,19];
 return ACADEMIC_CHECKINS.flatMap(window=>{
  const grade=currentGradeInYear(student,window.year);
  const n=grade?gradeNumber(grade):-1;
  if(n<0||n>5||!hasBeenEnrolled(student,window.year))return [];
  const personal=(pseudo(student.id+'-fp-reader')-.5)*5;
  const variation=(pseudo(student.id+'-fp-'+window.year)-.5)*2;
  const index=range(0,26,Math.round(targets[n]+personal+variation));
  return [{
   date:window.label,year:window.year,grade,level:READING_LEVELS[index],
   measure:'Illustrative F&P text level, not a grade or percentile',
   simulated:true
  }];
 }).sort((a,b)=>a.year-b.year);
}
export function createAcademicDemoRecords(students){
 const records=new Map();
 for(const student of students||[]){
  if(!/^DEMO-\d{4}$/.test(student.id))throw Error('Only fictional student identifiers are accepted');
  records.set(student.id,{
   reports:createReports(student),ixl:createIXL(student),
   core:createCore(student),fp:createFP(student)
  });
 }
 return records;
}
export const academicFor=(records,studentId)=>records.get(studentId)||{reports:[],ixl:[],core:[],fp:[]};
export function latestAcademic(record,mode='report',subject='Mathematics'){
 if(!record)return null;
 if(mode==='report'){
  const report=record.reports?.[0]||null;
  const entry=report?.subjects.find(x=>x.subject===subject)||null;
  return report&&entry?{...entry,label:report.year,grade:report.grade,framework:report.framework}:null;
 }
 const item=record[mode]?.at(-1)||null;
 if(!item)return null;
 return {...item,label:item.date,
  value:mode==='ixl'?String(item.level):mode==='core'?item.correct+'/'+item.assessed:item.level};
}
export function academicCoverage(students,records,mode='report',subject='Mathematics'){
 const eligible=(students||[]).filter(student=>academicModesFor(student.grade).includes(mode));
 const available=eligible.filter(student=>latestAcademic(academicFor(records,student.id),mode,subject));
 return {eligible:eligible.length,available:available.length};
}
