/** MAP Journeys: pure longitudinal evidence based on matched student IDs.
 * Cohorts are only those already authorised by the caller's selected division /
 * grade / advisory. No cross-student inferred match, risk scoring or persistence.
 * MAP achievement percentile is not RIT-point growth or causal school impact.
 */
import {gradeNumber,MAP_LONG_WINDOWS} from './data.mjs?v=20261111journeys1';
import {MAP_RIT_BANDS,MAP_RIT_SUBJECTS,mapRitBand} from './map-rit-achievement.mjs';
import {subjectMapRecords} from './map-growth.mjs';

export const JOURNEY_FALL_WINDOWS=Object.freeze(MAP_LONG_WINDOWS
 .filter(w=>w.key.startsWith('F')).map(w=>Object.freeze({
  key:w.key,label:w.label,year:Number(w.key.slice(1))+2000
 })));
export const JOURNEY_START_BANDS=Object.freeze([
 'both','low','low-average','average','high-average','high','all'
]);
export const JOURNEY_END_BANDS=Object.freeze([
 'average-plus','average','high-average','high','all','low','low-average'
]);
export const JOURNEY_PALETTE=Object.freeze({
 low:'#a63743','low-average':'#e7972f',average:'#e0b81b',
 'high-average':'#218352',high:'#435eaa'
});
export const journeyGradeAtTest=(student,record)=>{
 if(/^G(?:[3-9]|10)$/.test(record?.gradeAtTest||''))return record.gradeAtTest;
 // Missing grade in an import is not evidence of an actual grade.
 return null;
};
export function journeyBandIncludes(choice,key,at='start'){
 if(!key)return false;
 if(choice==='all')return true;
 if(at==='start'&&choice==='both')return ['low','low-average'].includes(key);
 if(at==='end'&&choice==='average-plus')return ['average','high-average','high'].includes(key);
 return choice===key;
}
export function journeyStudentHistory(student,records,subject='Reading'){
 if(!student||!MAP_RIT_SUBJECTS.includes(subject))return [];
 const indexed=new Map();
 for(const record of subjectMapRecords(records||[],subject)){
  if(!JOURNEY_FALL_WINDOWS.some(w=>w.key===record.key)||!mapRitBand(record.percentile))continue;
  const existing=indexed.get(record.key);
  if(!existing||record.date>=existing.date)indexed.set(record.key,record);
 }
 return JOURNEY_FALL_WINDOWS.filter(w=>indexed.has(w.key)).map(w=>{
  const record=indexed.get(w.key),band=mapRitBand(record.percentile);
  return {key:w.key,window:w.label,year:w.year,
   grade:journeyGradeAtTest(student,record),rit:record.rit,
   percentile:record.percentile,band:band.key,bandLabel:band.label,
   date:record.date,record};
 });
}
const sortStudents=(a,b)=>gradeNumber(a.student.grade)-gradeNumber(b.student.grade)||
 a.student.name.localeCompare(b.student.name)||a.student.id.localeCompare(b.student.id);
const emptyBands=()=>Object.fromEntries(MAP_RIT_BANDS.map(b=>[b.key,0]));
const validKey=key=>JOURNEY_FALL_WINDOWS.some(w=>w.key===key);
const oneDecimal=x=>Math.round(x*10)/10;

/** Same subject, same fall season, two actual assessments on one student ID.
 * Do not assume a missing earlier test means Low, and never include a pupil
 * outside the selected scoped students (including learners not yet enrolled).
 */
export function mapJourneyCohort({
 students=[],map={},subject='Reading',start='F22',end='F26',
 startingBand='both',endingBand='average-plus',pathway='all'
}={}){
 const studySubject=MAP_RIT_SUBJECTS.includes(subject)?subject:'Reading';
 const startKey=validKey(start)?start:'F22';
 const endKey=validKey(end)&&end>startKey?end:'F26';
 const startChoice=JOURNEY_START_BANDS.includes(startingBand)?startingBand:'both';
 const endChoice=JOURNEY_END_BANDS.includes(endingBand)?endingBand:'average-plus';
 const eligible=(students||[]).filter(s=>gradeNumber(s.grade)>=3&&gradeNumber(s.grade)<=10);
 const allMatched=[],withStart=[],withEnd=[],withoutBoth=[];
 for(const student of eligible){
  const history=journeyStudentHistory(student,map?.[student.id]||[],studySubject);
  const byKey=new Map(history.map(x=>[x.key,x]));
  const from=byKey.get(startKey)||null,to=byKey.get(endKey)||null;
  if(from)withStart.push(student.id);
  if(to)withEnd.push(student.id);
  if(from&&to)allMatched.push({student,from,to,history,
   movement:to.percentile-from.percentile});
  else withoutBoth.push(student.id);
 }
 allMatched.sort(sortStudents);
 const isCross=row=>Number(row.from.grade?.slice(1))<=5&&
  Number(row.to.grade?.slice(1))>=6;
 const crossCount=allMatched.filter(isCross).length;
 const selectedPathway=pathway==='cross'?'cross':'all';
 const matched=selectedPathway==='cross'?allMatched.filter(isCross):allMatched;
 const cohort=matched.filter(row=>journeyBandIncludes(startChoice,row.from.band,'start'));
 const selected=cohort.filter(row=>journeyBandIncludes(endChoice,row.to.band,'end'));
 const destinations=emptyBands();
 for(const row of cohort)destinations[row.to.band]++;
 const matrix=Object.fromEntries(MAP_RIT_BANDS.map(from=>[
  from.key,Object.fromEntries(MAP_RIT_BANDS.map(to=>[to.key,0]))
 ]));
 for(const row of matched)matrix[row.from.band][row.to.band]++;
 const improving=cohort.filter(row=>row.to.percentile>row.from.percentile).length;
 const endedAveragePlus=cohort.filter(row=>journeyBandIncludes('average-plus',row.to.band,'end')).length;
 return {
  subject:studySubject,start:startKey,end:endKey,pathway:selectedPathway,
  crossAvailable:crossCount,allMatched:allMatched.length,
  startingBand:startChoice,endingBand:endChoice,eligible:eligible.length,
  withStart:withStart.length,withEnd:withEnd.length,
  matched:matched.length,missingPair:withoutBoth.length,
  matchedRows:matched,cohort,selected,destinations,matrix,
  improving,endedAveragePlus,
  averagePlusPct:cohort.length?oneDecimal(endedAveragePlus*100/cohort.length):null,
  selectedPct:cohort.length?oneDecimal(selected.length*100/cohort.length):null
 };
}
/** Explicit transition: matrix counts must always equal matched learner count. */
export function mapJourneyTransition(model,from,to){
 if(!MAP_RIT_BANDS.some(b=>b.key===from)||!MAP_RIT_BANDS.some(b=>b.key===to))return [];
 return model.matchedRows.filter(row=>row.from.band===from&&row.to.band===to);
}
