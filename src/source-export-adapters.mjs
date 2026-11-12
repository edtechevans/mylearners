/**
 * Generic NWEA MAP and IXL LevelUp CSV row adapters.
 * 
 * This module holds field names and import rules ONLY. It does not contain,
 * fetch, persist, bundle or transmit school records. Real imports must run
 * in a private authenticated environment, NEVER on public GitHub Pages.
 * Demo content remains independently generated from synthetic DEMO- IDs.
 */
export const SOURCE_TYPES=Object.freeze({
 roster:'NWEA StudentsBySchool',
 map:'NWEA AssessmentResults',
 ixl:'IXL LevelUp Diagnostic Results'
});
export const SOURCE_FIELDS=Object.freeze({
 roster:Object.freeze(['StudentID','Grade','StudentFirstName','StudentLastName']),
 map:Object.freeze(['StudentID','TermName','Course','TestRITScore','TestPercentile','AchievementQuintile','TestStartDate']),
 ixl:Object.freeze(['ID','Grade','Overall math score','Overall math scale score','Overall math tier','Overall math percentile'])
});
const val=x=>String(x??'').trim();
const blank=x=>!val(x)||['--','N/A','NA','NULL'].includes(val(x).toUpperCase());
export function csvNumber(x){
 if(blank(x))return null;
 const n=Number(val(x).replace(/,/g,''));
 return Number.isFinite(n)?n:null;
}
export function csvGrade(x){
 const v=val(x).toUpperCase();
 if(['K','KG','KINDERGARTEN'].includes(v))return 'K';
 const n=Number(v.replace(/^G(RADE)?\s*/,''));
 return Number.isInteger(n)&&n>=1&&n<=12?'G'+n:null;
}
export function csvDate(x){
 let v=val(x).replace(/^\((.*)\)$/,'$1');
 let y,m,d;
 if(/^\d{4}-\d{1,2}-\d{1,2}$/.test(v)){[y,m,d]=v.split('-').map(Number)}
 else if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v)){[m,d,y]=v.split('/').map(Number)}
 else return null;
 const dt=new Date(Date.UTC(y,m-1,d));
 return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d?
  [y,String(m).padStart(2,'0'),String(d).padStart(2,'0')].join('-'):null;
}
export function mapTerm(name){
 const m=val(name).match(/^(Fall|Winter|Spring)\s+(\d{4})/i);
 if(!m)return null;
 const prefix={fall:'F',winter:'W',spring:'S'}[m[1].toLowerCase()];
 const year=Number(m[2]);
 return {key:prefix+String(year).slice(-2),
  label:m[1][0].toUpperCase()+m[1].slice(1).toLowerCase()+' '+year,
  year};
}
/** The MAP Subject column says "Language Arts" for BOTH Reading and
 * Language Usage. Always use Course to identify the three tests.
 */
export function mapCourseSubject(course,subject=''){
 const c=val(course).toLowerCase();
 if(c==='reading')return 'Reading';
 if(c==='language usage'||c==='language')return 'Language Usage';
 if(c==='math k-12'||c==='math'||c==='mathematics')return 'Mathematics';
 if(!c&&val(subject).toLowerCase()==='mathematics')return 'Mathematics';
 return null; // Never infer Reading from "Language Arts" alone.
}
export const MAP_ACHIEVEMENT_QUINTILES=Object.freeze({
 Low:'low',LoAvg:'low-average',Avg:'average',HiAvg:'high-average',High:'high'
});
export function mapPercentileBand(p){
 return Number.isInteger(p)&&p>=1&&p<=99?
  p<=20?'low':p<=40?'low-average':p<=60?'average':p<=80?'high-average':'high':null;
}
function goalRows(row){
 const goals=[];
 for(let i=1;i<=8;i++){
  const name=val(row['Goal'+i+'Name']);
  if(blank(name))continue;
  goals.push({
   name,rit:csvNumber(row['Goal'+i+'RitScore']),
   standardError:csvNumber(row['Goal'+i+'StdErr']),
   range:blank(row['Goal'+i+'Range'])?null:val(row['Goal'+i+'Range']),
   adjective:blank(row['Goal'+i+'Adjective'])?null:val(row['Goal'+i+'Adjective'])
  });
 }
 return goals;
}
function growthFromRow(row){
 const observed=csvNumber(row.FallToFallObservedGrowth);
 const projected=csvNumber(row.FallToFallProjectedGrowth);
 const rank=csvNumber(row.FallToFallConditionalGrowthPercentile);
 const response=val(row.FallToFallMetProjectedGrowth);
 const hasGrowth=observed!==null||projected!==null||rank!==null;
 if(!hasGrowth)return null;
 const met=/^yes\*?$/i.test(response)?true:/^no\*?$/i.test(response)?false:null;
 return {
  period:'Fall to Fall',observed,projected,
  observedSE:csvNumber(row.FallToFallObservedGrowthSE),
  conditionalGrowthIndex:csvNumber(row.FallToFallConditionalGrowthIndex),
  conditionalGrowthPercentile:rank,
  growthQuintile:blank(row.FallToFallGrowthQuintile)?null:val(row.FallToFallGrowthQuintile),
  met,metFlagged:response.endsWith('*'),source:'reported'
 };
}
export function normalizeNweaStudent(row){
 const id=val(row?.StudentID),grade=csvGrade(row?.Grade||row?.NWEAStandard_Grade);
 if(!id||!grade)return null;
 const first=val(row.StudentFirstName),last=val(row.StudentLastName);
 return {id,grade,first,last,name:[first,last].filter(Boolean).join(' '),
  gender:blank(row.StudentGender)?null:val(row.StudentGender)};
}
export function normalizeNweaAssessment(row){
 const studentId=val(row?.StudentID);
 const subject=mapCourseSubject(row?.Course,row?.Subject);
 const term=mapTerm(row?.TermName);
 const rit=csvNumber(row?.TestRITScore);
 const percentile=csvNumber(row?.TestPercentile);
 const date=csvDate(row?.TestStartDate);
 if(!studentId||!subject||!term||!date||!Number.isFinite(rit)||rit<=0)return null;
 const quintile=val(row.AchievementQuintile);
 return {
  studentId,subject,key:term.key,window:term.label,date,
  // Grade at this specific test, only if the export provides it.
  gradeAtTest:csvGrade(row.GradeAtTest||row.TestGrade||row.NWEAStandard_Grade||row.Grade),
  testTime:val(row.TestStartTime),testId:val(row.TestID),
  course:val(row.Course),testName:val(row.TestName),
  rit,percentile:Number.isInteger(percentile)&&percentile>=1&&percentile<=99?percentile:null,
  achievementQuintile:MAP_ACHIEVEMENT_QUINTILES[quintile]||null,
  percentileMismatch:!!MAP_ACHIEVEMENT_QUINTILES[quintile]&&Number.isInteger(percentile)&&
    mapPercentileBand(percentile)!==MAP_ACHIEVEMENT_QUINTILES[quintile],
  growthMeasure:val(row.GrowthMeasureYN).toUpperCase()==='TRUE',
  growth:{fallToFall:growthFromRow(row)},
  goals:goalRows(row),
  lexile:blank(row.LexileScore)?null:val(row.LexileScore),
  quantile:blank(row.QuantileScore)?null:val(row.QuantileScore),
  rapidGuessingPct:csvNumber(row.RapidGuessingPercentage),
  testDurationMinutes:csvNumber(row.TestDurationMinutes),
  status:'valid'
 };
}
const parseIxlScore=value=>{
 const raw=val(value);
 if(blank(raw))return {score:null,scoreLabel:null,atLeast:false};
 if(/^\d{1,3}(?:,\d{3})+\+$|^\d+\+$/.test(raw)){
  return {score:Number(raw.replace(/[,+]/g,'')),scoreLabel:raw,atLeast:true};
 }
 const score=csvNumber(raw);
 return Number.isFinite(score)?
  {score,scoreLabel:String(score),atLeast:false}:
  {score:null,scoreLabel:null,atLeast:false};
};
function ixlDomains(row){
 return Object.keys(row||{}).filter(k=>k.endsWith(' score')&&!k.startsWith('Overall math '))
  .map(k=>{
   const name=k.slice(0,-' score'.length);
   const p=csvNumber(row[name+' percentile']);
   return {name,
    ...parseIxlScore(row[k]),tier:blank(row[name+' tier'])?null:val(row[name+' tier']),
    percentile:Number.isInteger(p)&&p>=1&&p<=99?p:null};
  }).filter(x=>x.score!==null||x.tier!==null||x.percentile!==null);
}
export function normalizeIxlDiagnostic(row){
 const studentId=val(row?.ID),grade=csvGrade(row?.Grade);
 if(!studentId||!grade)return null;
 const overall=parseIxlScore(row['Overall math score']);
 const scaleScore=csvNumber(row['Overall math scale score']);
 const p=csvNumber(row['Overall math percentile']);
 const date=csvDate(row['Date of completion']);
 const complete=overall.score!==null&&scaleScore!==null&&date!==null;
 return {
  studentId,grade,date,completed:complete,
  status:complete?'completed':'not-completed',
  level:complete?overall.score:null,
  scoreLabel:complete?overall.scoreLabel:null,
  atLeast:complete?overall.atLeast:false,
  scaleScore:complete?scaleScore:null,
  percentile:complete&&Number.isInteger(p)&&p>=1&&p<=99?p:null,
  tier:complete&&!blank(row['Overall math tier'])?val(row['Overall math tier']):null,
  domains:complete?ixlDomains(row):[]
 };
}
/** This builds only a transient in-memory index from passed CSV-row objects.
 * No names, IDs or data are logged, persisted or sent to GitHub.
 * A single term export cannot supply historical test windows.
 */
export function indexAssessmentExports({students=[],map=[],ixl=[],termRosters={}}={}){
 const indexedStudents=(students||[]).map(normalizeNweaStudent).filter(Boolean);
 const ids=new Set(indexedStudents.map(s=>s.id));
 const mapByStudent=Object.fromEntries(indexedStudents.map(s=>[s.id,[]]));
 const ixlByStudent=Object.fromEntries(indexedStudents.map(s=>[s.id,null]));
 let unmatchedMap=0,unmatchedIxl=0,duplicateTests=0;
 const seen=new Map();
 for(const row of map||[]){
  const n=normalizeNweaAssessment(row);
  if(!n)continue;
  // Optional term-specific roster grade map, supplied privately by the caller.
  // Never use the current roster to infer a previous testing-year grade.
  if(!n.gradeAtTest) n.gradeAtTest=csvGrade(termRosters?.[n.key]?.[n.studentId]);
  if(!ids.has(n.studentId)){unmatchedMap++;continue}
  const key=n.studentId+'|'+n.key+'|'+n.subject;
  const previous=seen.get(key);
  if(previous)duplicateTests++;
  const sortable=x=>x.date+'T'+(x.testTime||'00:00')+'|'+x.testId;
  if(!previous||sortable(n)>sortable(previous))seen.set(key,n);
 }
 for(const rec of seen.values())mapByStudent[rec.studentId].push(rec);
 for(const records of Object.values(mapByStudent))records.sort((a,b)=>a.date.localeCompare(b.date));
 for(const row of ixl||[]){
  const n=normalizeIxlDiagnostic(row);
  if(!n)continue;
  if(!ids.has(n.studentId)){unmatchedIxl++;continue}
  const prev=ixlByStudent[n.studentId];
  if(!prev||n.completed&&!prev.completed||
    n.completed===prev.completed&&(n.date||'')>(prev.date||''))ixlByStudent[n.studentId]=n;
 }
 return {students:indexedStudents,mapByStudent,ixlByStudent,
  coverage:{
   roster:indexedStudents.length,
   mapLearners:Object.values(mapByStudent).filter(x=>x.length).length,
   ixlCompleted:Object.values(ixlByStudent).filter(x=>x?.completed).length,
   unmatchedMap,unmatchedIxl,duplicateTests
  }};
}
