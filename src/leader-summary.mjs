/** Leadership-only summaries of deterministic fictional learner records.
 * Never mix age-specific wellbeing scales or average outcomes across
 * developmental descriptors, MYP/DP grades and assessment systems.
 */
import {gradeNumber} from './data.mjs';
import {latestMapGrowth} from './map-growth.mjs';
import {academicFor,academicModesFor,READING_LEVELS} from './academic-journey-data.mjs';

const percent=(part,total)=>total?Math.round(100*part/total):null;
const median=(numbers)=>{
 if(!numbers.length)return null;
 const sorted=numbers.slice().sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);
 return sorted.length%2?sorted[middle]:Math.round((sorted[middle-1]+sorted[middle])/2);
};

export function leaderMapSummary(students,mapByStudent,subject){
 const eligible=(students||[]).filter(s=>gradeNumber(s.grade)>=3&&gradeNumber(s.grade)<=10);
 const comparable=eligible.map(s=>latestMapGrowth(mapByStudent[s.id]||[],subject))
  .filter(g=>g.status==='comparable'&&g.projected!==null);
 const met=comparable.filter(g=>g.met===true).length;
 return {eligible:eligible.length,compared:comparable.length,met,rate:percent(met,comparable.length)};
}

export function leaderAcademicCoverage(students,records,mode){
 const eligible=(students||[]).filter(s=>academicModesFor(s.grade).includes(mode));
 const available=eligible.filter(s=>{
  const record=academicFor(records,s.id);
  return mode==='report'?!!record.reports?.[0]:!!record[mode]?.at(-1);
 }).length;
 return {eligible:eligible.length,available,rate:percent(available,eligible.length)};
}

export function leaderCheckSnapshot(students,records,mode){
 const coverage=leaderAcademicCoverage(students,records,mode);
 const distinctGrades=new Set((students||[]).map(s=>s.grade));
 if(!['ixl','core','fp'].includes(mode)||distinctGrades.size!==1){
  return {...coverage,recent:null,typical:null};
 }
 const recent=(students||[]).filter(s=>academicModesFor(s.grade).includes(mode))
  .map(s=>academicFor(records,s.id)[mode]?.at(-1))
  .filter(item=>item?.date==='Fall 2026');
 if(!recent.length)return {...coverage,recent:0,typical:null};
 const values=recent.map(item=>mode==='ixl'?item.level:
  mode==='core'?item.correct:READING_LEVELS.indexOf(item.level))
  .filter(Number.isFinite);
 const middle=median(values);
 const typical=middle===null?null:mode==='ixl'?'Median diagnostic level '+middle:
  mode==='core'?'Median '+middle+'/50 decoded items':
  'Median text level '+(READING_LEVELS[middle]||'—');
 return {...coverage,recent:recent.length,typical};
}

export function leaderReportBreakdown(students,records){
 const people=students||[];
 if(!people.length||new Set(people.map(s=>s.grade)).size!==1)return null;
 const reports=people.map(s=>academicFor(records,s.id).reports?.[0]).filter(Boolean);
 if(!reports.length)return {grade:people[0].grade,included:0,excluded:0,rows:[]};
 const cohorts=new Map();
 for(const report of reports){
  const key=[report.year,report.grade,report.framework,report.scale].join('|');
  if(!cohorts.has(key))cohorts.set(key,[]);
  cohorts.get(key).push(report);
 }
 const cohort=[...cohorts.values()].sort((a,b)=>b.length-a.length)[0];
 const first=cohort[0];
 const subjectNames=[
  ['Early Mathematics','Mathematics'],
  ['Early Literacy','English Language Arts','Language & Literature']
 ].map(choices=>choices.find(name=>first.subjects.some(s=>s.subject===name))).filter(Boolean);
 const order=first.scale==='descriptors'?
  ['Emerging','Developing','Applying','Extending']:['1','2','3','4','5','6','7'];
 const rows=subjectNames.map(subject=>({
  subject,
  values:order.map(value=>({
   value,count:cohort.filter(report=>report.subjects.some(entry=>
    entry.subject===subject&&entry.value===value)).length
  }))
 }));
 return {grade:people[0].grade,year:first.year,issuedGrade:first.grade,
  framework:first.framework,scale:first.scale,included:cohort.length,
  excluded:reports.length-cohort.length,rows};
}
