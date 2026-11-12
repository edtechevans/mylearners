/** Historical MAP goal-area evidence. No student exports, IDs or actual records
 * belong in this public repository. A longitudinal pattern is descriptive,
 * not a causal or predictive learning judgement.
 */
import {gradeNumber,MAP_LONG_WINDOWS} from './data.mjs';
import {subjectMapRecords} from './map-growth.mjs';
import {STRAND_SUBJECTS,strandBand,comparableGoalTest} from './map-strand-explorer.mjs';

const VALID_BANDS=['low','low-average','average','high-average','high'];
const bandIndex=x=>VALID_BANDS.indexOf(x);
const isLow=x=>x==='low'||x==='low-average';
const isHigh=x=>x==='average'||x==='high-average'||x==='high';
const fallKey=x=>/^F\d{2}$/.test(String(x||''));
export function strandStage(grade){
 const n=gradeNumber(String(grade||''));
 return Number.isInteger(n)&&n>=3&&n<=5?'Elementary':
  Number.isInteger(n)&&n>=6&&n<=12?'Secondary':null;
}
export function recordedGrade(record){
 // A single later-year roster must never be projected backwards. Use only
 // grade-at-test metadata explicitly supplied with that test.
 const g=String(record?.gradeAtTest||'');
 return /^G(?:[1-9]|1[0-2])$/.test(g)?g:null;
}
export function comparableStrandForms(from,to,subject){
 if(!comparableGoalTest(from,to))return false;
 const left=strandStage(recordedGrade(from)),right=strandStage(recordedGrade(to));
 // Mathematics goal headings can persist across course stages while the
 // underlying test blueprint changes. Never bridge that boundary on a label.
 if(subject==='Mathematics'&&left&&right&&left!==right)return false;
 return true;
}
function chooseTermRecords(records,subject,season='fall'){
 if(!STRAND_SUBJECTS.includes(subject))return [];
 const indexed=new Map();
 for(const r of subjectMapRecords(records,subject)){
  if(!r?.key||!(r.goals?.length)||season==='fall'&&!fallKey(r.key))continue;
  const old=indexed.get(r.key);
  if(!old||(String(r.date)+'T'+String(r.testTime||''))>(String(old.date)+'T'+String(old.testTime||'')))indexed.set(r.key,r);
 }
 return [...indexed.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.key.localeCompare(b.key));
}
export function strandWindowRecords(records,subject,season='fall'){
 return chooseTermRecords(records,subject,season);
}
export function strandGoalAt(record,name){
 const g=record?.goals?.find(g=>g.name===name&&Number.isFinite(g.rit));
 return g?{name:g.name,rit:g.rit,band:strandBand(g),adjective:g.adjective||null,
  range:g.range||null,standardError:g.standardError??null}:null;
}
export function strandTransitionStatus(from,to){
 if(!from||!to||bandIndex(from.band)<0||bandIndex(to.band)<0)return 'not-classified';
 if(isLow(from.band)&&isHigh(to.band))return 'moved-beyond-low';
 if(isLow(from.band)&&isLow(to.band))return 'continued-low';
 if(isHigh(from.band)&&isLow(to.band))return 'entered-low';
 return 'continued-average-plus';
}
export const STRAND_STATUS_LABEL=Object.freeze({
 'moved-beyond-low':'Moved from Low / Low Average to Average+',
 'continued-low':'Low / Low Average in both windows',
 'entered-low':'Now Low / Low Average',
 'continued-average-plus':'Average+ in both windows',
 'version-break':'Assessment version / stage changed',
 'not-classified':'Descriptor not available',
 'not-compared':'Comparison not available'
});
export function studentStrandJourney({
 student=null,records=[],subject='Reading',goalName='',season='fall'
}={}){
 const target=STRAND_SUBJECTS.includes(subject)?subject:'Reading';
 const mode=season==='all'?'all':'fall';
 const history=chooseTermRecords(records,target,mode);
 const goals=[...new Set(history.flatMap(r=>r.goals.map(g=>g.name).filter(Boolean)))].sort();
 const latest=history.at(-1)||null;
 const prefer=(latest?.goals||[]).find(g=>isLow(strandBand(g)))?.name||
  latest?.goals?.[0]?.name||goals[0]||'';
 const selected=goals.includes(goalName)?goalName:prefer;
 const steps=[];let priorGoal=null;
 for(const record of history){
  const goal=strandGoalAt(record,selected);
  const prev=priorGoal;
  const compatible=!!goal&&!!prev&&comparableStrandForms(prev.record,record,target);
  const grade=recordedGrade(record),stage=strandStage(grade);
  steps.push({
   key:record.key,window:record.window,date:record.date,grade,stage,
   version:record.testName||record.course||'Not specified',
   goal,rit:goal?.rit??null,band:goal?.band||null,
   prior:prev?.record?.key||null,
   comparable:compatible,
   delta:compatible?goal.rit-prev.goal.rit:null,
   versionBreak:!!goal&&!!prev&&!compatible
  });
  if(goal)priorGoal={record,goal};
 }
 const withStages=steps.filter(s=>s.stage);
 let handoff=null;
 for(let i=1;i<withStages.length;i++){
  if(withStages[i-1].stage==='Elementary'&&withStages[i].stage==='Secondary'){
   handoff={from:withStages[i-1],to:withStages[i]};break;
  }
 }
 const goalSteps=steps.filter(s=>s.goal);
 const first=goalSteps[0]||null,last=goalSteps.at(-1)||null;
 const pairCompatible=!!first&&!!last&&first.key!==last.key&&
  comparableStrandForms(history.find(r=>r.key===first.key),
   history.find(r=>r.key===last.key),target);
 const status=goalSteps.length<2?'not-compared':
  !pairCompatible?'version-break':strandTransitionStatus(first,last);
 return {student,subject:target,season:mode,goals,goalName:selected,steps,
  handoff,first,last,status,matchedWindows:goalSteps.length,
  comparableWindows:goalSteps.filter(x=>x.comparable).length+Number(!!goalSteps.length)};
}
const knownWindows=MAP_LONG_WINDOWS.filter(w=>fallKey(w.key));
const sortRows=(a,b)=>gradeNumber(a.student.grade)-gradeNumber(b.student.grade)||
 a.student.name.localeCompare(b.student.name)||a.student.id.localeCompare(b.student.id);
export function strandCohortJourney({
 students=[],map={},subject='Reading',goalName='',start='auto',end='auto',grade='All'
}={}){
 const target=STRAND_SUBJECTS.includes(subject)?subject:'Reading';
 const scope=(students||[]).filter(s=>{
  const n=gradeNumber(s.grade);return n>=3&&n<=10&&(grade==='All'||grade===s.grade);
 });
 const tests=scope.map(student=>({student,tests:chooseTermRecords(map[student.id]||[],target,'fall')}));
 const keys=new Set(tests.flatMap(x=>x.tests.map(r=>r.key)));
 const windows=knownWindows.filter(w=>keys.has(w.key));
 const last=windows.at(-1)?.key||'';
 const finalEnd=keys.has(end)?end:last;
 const endIndex=windows.findIndex(w=>w.key===finalEnd);
 const priorWindows=windows.slice(0,Math.max(0,endIndex));
 const finalStart=priorWindows.some(w=>w.key===start)?start:
  priorWindows.some(w=>w.key==='F22')?'F22':priorWindows.at(-1)?.key||'';
 const endRecordByStudent=tests.map(x=>x.tests.find(r=>r.key===finalEnd)).filter(Boolean);
 const nameScores=new Map();
 for(const r of endRecordByStudent)for(const g of r.goals||[]){
  if(!g.name)continue;
  const weight=isLow(strandBand(g))?2:1;
  nameScores.set(g.name,(nameScores.get(g.name)||0)+weight);
 }
 const allNames=[...new Set(tests.flatMap(x=>x.tests.flatMap(r=>r.goals.map(g=>g.name).filter(Boolean))))].sort();
 const defaultName=[...nameScores].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]||allNames[0]||'';
 const selected=allNames.includes(goalName)?goalName:defaultName;
 const timeline=windows.map(w=>{
  let tested=0,assessed=0,low=0,lowAverage=0,averagePlus=0,unclassified=0;
  for(const {tests} of tests){
   const r=tests.find(x=>x.key===w.key);
   if(!r)continue;
   tested++;
   const goal=strandGoalAt(r,selected);
   if(!goal)continue;
   assessed++;
   if(goal.band==='low')low++;
   else if(goal.band==='low-average')lowAverage++;
   else if(isHigh(goal.band))averagePlus++;
   else unclassified++;
  }
  return {key:w.key,label:w.label,tested,assessed,low,lowAverage,averagePlus,unclassified,
   lowShare:assessed?Math.round((low+lowAverage)*100/assessed):null};
 });
 const statuses=Object.fromEntries(Object.keys(STRAND_STATUS_LABEL).map(key=>[key,0]));
 let paired=0,compared=0,crossStage=0,missingPair=0;
 const rows=[];
 for(const {student,tests:history} of tests){
  const fromRecord=finalStart?history.find(r=>r.key===finalStart):null;
  const toRecord=history.find(r=>r.key===finalEnd);
  const from=fromRecord?strandGoalAt(fromRecord,selected):null;
  const to=toRecord?strandGoalAt(toRecord,selected):null;
  if(!fromRecord||!toRecord||!from||!to){missingPair++;continue}
  paired++;
  const fromGrade=recordedGrade(fromRecord),toGrade=recordedGrade(toRecord);
  const isCross=strandStage(fromGrade)==='Elementary'&&strandStage(toGrade)==='Secondary';
  if(isCross)crossStage++;
  const comparable=comparableStrandForms(fromRecord,toRecord,target);
  const status=comparable?strandTransitionStatus(from,to):'version-break';
  if(comparable&&status!=='not-classified')compared++;
  statuses[status]++;
  rows.push({student,from,to,fromGrade,toGrade,fromWindow:fromRecord.window,
   toWindow:toRecord.window,isCross,comparable,status,
   delta:comparable?to.rit-from.rit:null});
 }
 rows.sort(sortRows);
 return {subject:target,goalName:selected,goalNames:allNames,start:finalStart,end:finalEnd,
  windows,scope:scope.length,timeline,paired,compared,crossStage,missingPair,rows,statuses};
}
