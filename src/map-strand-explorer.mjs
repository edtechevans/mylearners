/** MAP goal-area/strand analysis over already-authorized records.
 * Public demo uses generated DEMO IDs only; never import or persist school exports here.
 * A goal descriptor is NOT a numeric percentile. Goal RIT is not overall test RIT.
 */
import {gradeNumber,MAP_LONG_WINDOWS} from './data.mjs';
import {subjectMapRecords} from './map-growth.mjs';
import {MAP_RIT_SUBJECTS} from './map-rit-achievement.mjs';

export const STRAND_SUBJECTS=MAP_RIT_SUBJECTS;
export const STRAND_BAND_OPTIONS=Object.freeze([
 {value:'both',label:'Low + Low Average'},
 {value:'low',label:'Low only'},
 {value:'low-average',label:'Low Average only'},
 {value:'all',label:'All recorded goal areas'}
]);
const ADJECTIVES=Object.freeze({
 Low:'low',LoAvg:'low-average',Avg:'average',HiAvg:'high-average',High:'high',
 'Low Average':'low-average','High Average':'high-average',Average:'average'
});
export const strandBand=goal=>ADJECTIVES[String(goal?.adjective||'').trim()]||null;
export const strandBandLabel=band=>({
 low:'Low','low-average':'Low Average',average:'Average',
 'high-average':'High Average',high:'High'
})[band]||'Not classified';
const eligibleStudent=s=>{const n=gradeNumber(s.grade);return n>=3&&n<=10};
const recordVersion=r=>String(r?.testName||r?.course||'').trim();
export function comparableGoalTest(a,b){
 if(!a||!b)return false;
 // The actual MAP TestName identifies a form/version; course alone is
 // usable only when BOTH records omit TestName (as in synthetic demo data).
 if(a.testName||b.testName)return !!a.testName&&a.testName===b.testName;
 return !!a.course&&a.course===b.course;
}
export function strandAssessment(records,subject,window){
 if(!STRAND_SUBJECTS.includes(subject))return null;
 return subjectMapRecords(records,subject).filter(r=>r.key===window&&r.goals?.length).at(-1)||null;
}
export function latestStrandAssessment(records,subject){
 if(!STRAND_SUBJECTS.includes(subject))return null;
 return subjectMapRecords(records,subject).filter(r=>r.goals?.length).at(-1)||null;
}
export function strandGoalHistory(records,subject,goalName,current){
 if(!current||!goalName)return {points:[],previous:null,delta:null};
 const points=subjectMapRecords(records,subject)
  .filter(r=>r.date<=current.date&&r.goals?.some(g=>g.name===goalName&&Number.isFinite(g.rit)))
  .map(r=>({
   key:r.key,window:r.window,date:r.date,testName:r.testName||r.course||'',
   rit:r.goals.find(g=>g.name===goalName).rit,
   comparable:comparableGoalTest(r,current)
  }));
 const prior=points.filter(p=>p.date<current.date&&p.comparable).at(-1)||null;
 const now=points.find(p=>p.key===current.key&&p.date===current.date);
 return {points,previous:prior,delta:prior&&now?now.rit-prior.rit:null};
}
const sortStudents=(a,b)=>gradeNumber(a.student.grade)-gradeNumber(b.student.grade)||
 a.student.name.localeCompare(b.student.name)||a.student.id.localeCompare(b.student.id);
const sortGroups=(a,b)=>b.low-a.low||b.members.length-a.members.length||
 gradeNumber(a.grade)-gradeNumber(b.grade)||a.name.localeCompare(b.name);
/** Do not mistake a goal-area label for a numeric percentile. Never assign
 * low/average bands from raw RIT points, which are not common grade cutoffs.
 * Groups stay within a grade and assessment version.
 */
export function mapStrandExplorerModel({
 students=[],map={},subject='Reading',window='F26',
 band='both',goalName='',grade='All'
}={}){
 const subj=STRAND_SUBJECTS.includes(subject)?subject:'Reading';
 const scoped=(students||[]).filter(eligibleStudent).filter(s=>grade==='All'||s.grade===grade);
 const allEligible=(students||[]).filter(eligibleStudent);
 const availableKeys=new Set(allEligible.flatMap(s=>
  subjectMapRecords(map[s.id]||[],subj).filter(r=>r.goals?.length).map(r=>r.key)));
 const windows=MAP_LONG_WINDOWS.filter(w=>availableKeys.has(w.key));
 const chosenWindow=availableKeys.has(window)?window:windows.at(-1)?.key||window;
 const selectedBand=STRAND_BAND_OPTIONS.some(b=>b.value===band)?band:'both';
 const tests=scoped.map(student=>({
  student,record:strandAssessment(map[student.id]||[],subj,chosenWindow)
 }));
 const names=[...new Set(tests.flatMap(({record})=>
  (record?.goals||[]).map(g=>g.name).filter(Boolean)))].sort();
 const selectedGoal=names.includes(goalName)?goalName:'';
 let tested=0,withoutGoals=0;
 const rows=[],groupMap=new Map();
 for(const {student,record} of tests){
  if(!record){withoutGoals++;continue}
  tested++;
  const hits=(record.goals||[]).filter(g=>{
   if(!g.name||!Number.isFinite(g.rit))return false;
   if(selectedGoal&&g.name!==selectedGoal)return false;
   const value=strandBand(g);
   return selectedBand==='all'||selectedBand==='both'&&
     (value==='low'||value==='low-average')||value===selectedBand;
  }).map(g=>({...g,band:strandBand(g),window:record.window}));
  if(!hits.length)continue;
  rows.push({student,record,hits});
  for(const goal of hits){
   const key=student.grade+'\u0000'+recordVersion(record)+'\u0000'+goal.name;
   if(!groupMap.has(key))groupMap.set(key,{
    name:goal.name,grade:student.grade,version:recordVersion(record),
    low:0,lowAverage:0,members:[]
   });
   const group=groupMap.get(key);
   if(goal.band==='low')group.low++;
   if(goal.band==='low-average')group.lowAverage++;
   group.members.push({student,goal});
  }
 }
 rows.sort(sortStudents);
 const groups=[...groupMap.values()].sort(sortGroups);
 return {subject:subj,window:chosenWindow,windows,band:selectedBand,grade,
  goalName:selectedGoal,goalNames:names,
  eligible:scoped.length,tested,withoutGoals,matched:rows.length,
  flaggedGoalResults:rows.reduce((n,row)=>n+row.hits.length,0),
  rows,groups};
}
