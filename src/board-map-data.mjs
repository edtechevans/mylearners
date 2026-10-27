/** AISG MAP Board data. All records are aggregated grade means, never learner records.
 * Historical: uploaded AISG.csv, Fall 2014 - Spring 2026 (archive, original norms);
 * verified Fall 2025: AISG Fall 2025 report; verified Spring 2026
 * Mathematics/Reading: separately reaggregated NWEA student outcomes;
 * Spring 2026 EARCOS: user-supplied screenshot, "Spring - 2025/26
 * International Comparison" (EARCOS-Spring grade means).
 * Spring 2026 Language Usage AISG/US: AISG.csv archive.
 * Fall 2026: grade-mean RIT reaggregated from NWEA 2026 Student Progress reports;
 * matched to official 2025 NWEA Fall SCHOOL achievement norms (4 weeks),
 * plus AISG family summary. Only grade summaries are committed (no learner rows).
 */
import {BOARD_HISTORICAL} from './board-map-history.mjs';

export const BOARD_GRADE_LIST=Object.freeze([3,4,5,6,7,8,9,10]);
export const BOARD_SCHOOL_YEARS=Object.freeze(Array.from({length:13},(_,i)=>2026-i));
export const BOARD_SUBJECTS=Object.freeze([
 {id:'math',label:'Mathematics'},
 {id:'reading',label:'Reading'},
 {id:'language',label:'Language Usage'}
]);
const fallMath=[
 [3,200.7,184,199.7,95,54],[4,216.9,197,213.1,98,65],
 [5,222.3,206.2,221.5,95,53],[6,231.3,210.2,229.1,98,59],
 [7,240.6,217.2,238.8,99,57],[8,245.5,222,246.5,99,46],
 [9,255.1,224.9,250.9,99.9,66],[10,260.1,226.8,257.6,100,60]
];
const fallReading=[
 [3,189.5,184.7,193.4,82,42],[4,202,195.9,203.1,76,46],
 [5,208.9,203.7,209.6,69,47],[6,212.2,209,215.1,61,44],
 [7,222.4,212.3,220.2,80,58],[8,223.3,215.7,224.8,78,44],
 [9,227.9,216.2,226.6,84,55],[10,232,217.8,228.9,87,58]
];
// Grade, AISG, U.S., EARCOS. Source AISG.csv, Fall 2025.
const fallLanguage=[
 [3,194.7,184.4,196.9],[4,206.1,194.7,205.9],
 [5,213.4,201.9,211.4],[6,215,206.5,217],
 [7,221,210.1,221.4],[8,224.2,213.7,225.7],
 [9,232.1,213.9,227.9],[10,235.4,215.9,230]
];
// Spring 2026: grade, AISG, US, eligible tests, count above US,
// matched students meeting projected growth, matched eligible students.
// Verified from NWEA deduplicated results; Spring archive contains small
// differences in G4 Math/G9/G10 Reading. Prefer verified NWEA reaggregation.
const springMath=[
 [3,215,199.1,73,69,0,0],[4,228.5,210.1,75,68,46,57],
 [5,231.3,216,90,72,50,73],[6,238.8,220.3,85,74,48,70],
 [7,250.6,223.8,87,82,59,68],[8,252.7,228.9,87,81,44,68],
 [9,258.6,228.8,66,63,39,54],[10,263.4,231.4,65,63,25,48]
];
const springReading=[
 [3,200.4,193.8,73,56,0,0],[4,207.9,202.1,75,52,36,58],
 [5,214.6,208.4,90,62,55,74],[6,217.2,212,84,50,47,69],
 [7,225,214.8,86,69,48,67],[8,225.6,217.8,87,61,38,69],
 [9,233.5,217.2,65,57,25,49],[10,234.7,218.5,61,54,16,42]
];
// Grade, AISG student RIT mean (to 0.1), U.S. 2025 Fall SCHOOL
// achievement norm mean, unique tested students.
// AISG: September 2026 NWEA Student Progress PDF, valid FA26 RIT center
// per distinct student/grade/subject; aggregated privately, only these
// school-level results are placed in the public website.
// U.S.: official NWEA 2025 Norms quick reference, p.3, week 4.
// https://www.nwea.org/resource-center/fact-sheet/87992/MAP-Growth-2025-norms-quick-reference_NWEA_onesheet.pdf
const fall2026Math=[
 [3,200.7,184,75],[4,215.7,196,68],[5,224.8,206,72],
 [6,225.6,210,81],[7,238.3,217,86],[8,248.0,220,91],
 [9,251.8,224,77],[10,254.5,225,65]
];
const fall2026Reading=[
 [3,187.4,184,73],[4,198.8,195,64],[5,205.8,203,60],
 [6,215.7,208,77],[7,216.9,212,83],[8,225.9,215,86],
 [9,225.1,216,78],[10,226.8,217,65]
];
const fall2026Language=[
 [3,192.6,184,76],[4,204.6,194,68],[5,210.2,202,73],
 [6,215.2,206,80],[7,218.7,209,86],[8,225.8,213,90],
 [9,225.7,215,80],[10,229.7,216,64]
];
const fall2026Grades=[3,4,5,6,7,8,9,10];
// NWEA 2025 SCHOOL achievement norms (unweighted school grade-mean reference).
// Verified against NWEA 2025 Norms Quick Reference, physical page 3.
// Historical archive uses mixed/unverified norms: do not rebase older years.
export const BOARD_US_SCHOOL_NORMS_2025=Object.freeze({
 fall:{
  math:[184,196,206,210,217,220,224,225],
  reading:[184,195,203,208,212,215,216,217],
  language:[184,194,202,206,209,213,215,216]
 },
 spring:{
  math:[199,209,215,219,223,227,228,229],
  reading:[193,201,207,211,214,217,217,217],
  language:[193,200,207,209,212,215,216,217]
 }
});
const fallRow=([grade,aisg,us,earcos,aboveUsPct,aboveEarcosPct],i,subject)=>
 ({grade,aisg,us:BOARD_US_SCHOOL_NORMS_2025.fall[subject][i],
  usOriginal:us,earcos,aboveUsPct,aboveEarcosPct});
const springRow=([grade,aisg,us,n,aboveUsN,growthMet,growthEligible],i,earcos,subject)=>
 ({grade,aisg,us:BOARD_US_SCHOOL_NORMS_2025.spring[subject][i],
  usOriginal:us,earcos:earcos[i],n,aboveUsN,growthMet,growthEligible});
const meansRow=([grade,aisg,us,earcos],i,subject,season='fall')=>
 ({grade,aisg,us:BOARD_US_SCHOOL_NORMS_2025[season][subject][i],
  usOriginal:us,earcos});
const fall2026Row=([grade,aisg,us,n])=>({grade,aisg,us,earcos:null,n,aboveUsMean:aisg>us});
// EARCOS Spring 2025/26 international comparison screenshot (Grades 3-10).
const springEarcos={
 math:[213.47,225.55,233.12,237.70,247.00,253.32,256.20,260.55],
 reading:[201.60,209.29,216.21,219.60,223.99,227.78,227.15,229.17],
 language:[205.20,211.80,217.72,221.32,225.53,229.07,228.73,231.98]
};
// Spring 2026 Language Usage archive: grade, AISG mean, US mean.
const springLanguage=[
 [3,202.7,193.4],[4,211.2,201.3],[5,217.6,207],
 [6,219.1,210.1],[7,225.9,213],[8,227.2,216.5],
 [9,235.9,215.5],[10,239.9,217.4]
].map(([grade,aisg,us],i)=>({grade,aisg,us:BOARD_US_SCHOOL_NORMS_2025.spring.language[i],
 usOriginal:us,earcos:springEarcos.language[i]}));

const historical={};
for(const [key,subjects] of Object.entries(BOARD_HISTORICAL)){
 const historicalSubjects={};
 for(const id of ['math','reading','language']){
  historicalSubjects[id]=subjects[id].map(([us,aisg,earcos],i)=>
   ({grade:i+3,us,aisg,earcos}));
 }
 const season=key.startsWith('fall')?'Fall':'Spring',year=Number(key.slice(season.length===4?4:6));
 historical[key]={
  label:season+' '+year,hasEarcos:true,hasMatchedGrowth:false,evidence:'grade-means',
  source:'AISG.csv · historical grade-level MAP mean RIT archive · '+season+' '+year,
  usNormType:'historical-unverified',
  subjects:historicalSubjects
 };
}
export const BOARD_DATA=Object.freeze({
 ...historical,
 fall2025:{
  label:'Fall 2025',hasEarcos:true,hasMatchedGrowth:false,evidence:'grade-means',usNormType:'2025-school',
  source:'AISG MAP Data Fall 2025 (Mathematics p.4; Reading p.8); Language Usage from AISG.csv archive',
  subjects:{math:fallMath.map((r,i)=>fallRow(r,i,'math')),
   reading:fallReading.map((r,i)=>fallRow(r,i,'reading')),
   language:fallLanguage.map((r,i)=>meansRow(r,i,'language'))}
 },
 spring2026:{
  label:'Spring 2026',hasEarcos:true,hasMatchedGrowth:true,evidence:'grade-means',usNormType:'2025-school',
  source:'AISG Spring 2026 NWEA exports (Math/Reading), AISG.csv (Language Usage); Spring 2025/26 EARCOS International Comparison screenshot',
  subjects:{
   math:springMath.map((r,i)=>springRow(r,i,springEarcos.math,'math')),
   reading:springReading.map((r,i)=>springRow(r,i,springEarcos.reading,'reading')),
   language:springLanguage
  }
 },
 fall2026:{
  label:'Fall 2026',hasEarcos:false,hasMatchedGrowth:false,evidence:'grade-means',usNormType:'2025-school',
  source:'AISG Fall 2026–27 NWEA Student Progress Report (aggregated valid FA26 student scores by grade and subject); 2025 NWEA Fall school achievement norms (week 4); AISG Fall 2026–27 Family Highlights',
  schoolwide:{
   aboveUSComparisons:24,totalComparisons:24,
   returningGrowthInOneOrMoreAreasPct:95,
   projectedGroupGrowthExceeded:['Mathematics','Reading','Language Usage'],
   gradesReported:fall2026Grades
  },
  subjects:{math:fall2026Math.map(fall2026Row),reading:fall2026Reading.map(fall2026Row),
   language:fall2026Language.map(fall2026Row)}
 }
});
export const BOARD_WINDOWS=Object.freeze(Object.keys(BOARD_DATA).sort((a,b)=>{
 const yearA=Number(a.slice(a.startsWith('fall')?4:6)),yearB=Number(b.slice(b.startsWith('fall')?4:6));
 return yearB-yearA||(a.startsWith('fall')?-1:1);
}).map(id=>({id,label:BOARD_DATA[id].label})));
export function boardWindowFor(schoolYear,season){
 const year=Number(schoolYear);
 const key=season==='spring'?'spring'+(year+1):'fall'+year;
 return BOARD_DATA[key]?key:null;
}
export const BOARD_METHODS=Object.freeze({
 achievement:'Grade-level achievement comparisons use mean RIT: AISG grade mean minus the corresponding U.S. or EARCOS grade mean. A positive difference means the AISG average is higher. It does not mean every learner scored above the benchmark.',
 history:'Historical windows from Fall 2014 to Spring 2025 come from AISG.csv. Their U.S. reference norm type or edition is not confirmed and is preserved as originally supplied. It must not be read as a consistent national time series. The corrupted Spring 2016 Grade 8 Mathematics EARCOS figure was omitted.',
 fall:'Fall 2025 grade-average comparisons have been rebased to NWEA 2025 FALL SCHOOL achievement norm means (4 instructional weeks), retaining original archived U.S. values separately. The reported Fall 2025 above-reference STUDENT percentages use their original student-level benchmark and are not directly comparable to school-mean gaps. EARCOS grade means are from the same Fall 2025 testing season.',
 spring:'Spring 2026 U.S. grade-mean references have been rebased to NWEA 2025 SPRING SCHOOL achievement norm means (32 instructional weeks). EARCOS values are from the Spring 2025/26 screenshot. Mathematics and Reading AISG means were reaggregated from NWEA assessments, while Language Usage AISG means are from AISG.csv. Existing count-above-student-norm figures are retained from their original student-level benchmark and are not school-mean counts.',
 growth:'Spring-to-spring growth is calculated from matched students with valid NWEA projected-growth records in Mathematics or Reading. There is no matched previous Spring grade-3 cohort in that export. Language Usage matched growth counts were not supplied.',
 fall2026:'AISG Fall 2026 grade averages are calculated from the September 2026 NWEA Student Progress report, using the central RIT of each valid FA26 record, one result per distinct student/grade/subject; reported sample sizes vary by grade and subject. U.S. benchmarks are NWEA 2025 Fall SCHOOL achievement norms at 4 weeks of instruction (NWEA 2025 Norms Quick Reference, page 3). The same 2025 norm edition is identified in the school NWEA report for 2026. Fall 2026 EARCOS grade means are not available. Student-level data remain private and are not published. The 95% statistic refers to returning students growing in one or more MAP areas, not a subject-specific projected-growth rate.',
 missing:'A dash (—) means the comparison or measure is not available from the supplied source. It never means a zero score or zero progress.',
 caution:'Only anonymised aggregated real school data appears in Board view. Other My Learners demo roles use fictional students. Distinct grade snapshots are not individual student growth.'
});
export function boardRows(window='fall2026',subject='math',division='all',grade='all'){
 const source=BOARD_DATA[window];
 if(!source||!source.subjects[subject])return [];
 return source.subjects[subject].filter(r=>
  (division==='all'||division==='elementary'&&r.grade<=5||division==='secondary'&&r.grade>=6)&&
  (grade==='all'||r.grade===Number(grade))
 );
}
const round1=n=>Math.round((n+Number.EPSILON)*10)/10;
const sum=(rows,k)=>rows.reduce((v,row)=>v+(Number.isFinite(row[k])?row[k]:0),0);
export function boardSummary(window='fall2026',subject='math',division='all',grade='all'){
 const rows=boardRows(window,subject,division,grade), source=BOARD_DATA[window],gradeCount=rows.length;
 const usMeasured=rows.filter(r=>Number.isFinite(r.aisg)&&Number.isFinite(r.us));
 const earcosMeasured=rows.filter(r=>Number.isFinite(r.aisg)&&Number.isFinite(r.earcos));
 const aboveUS=rows.filter(r=>r.aboveUsMean===true||(Number.isFinite(r.aisg)&&Number.isFinite(r.us)&&r.aisg>r.us)).length;
 const aboveEarcos=earcosMeasured.filter(r=>r.aisg>r.earcos).length;
 const usAvailable=rows.filter(r=>r.aboveUsMean===true||(Number.isFinite(r.aisg)&&Number.isFinite(r.us))).length;
 const earcosAvailable=earcosMeasured.length;
 const gapUS=gradeCount&&usMeasured.length===gradeCount?
  round1(sum(usMeasured.map(r=>({delta:r.aisg-r.us})),'delta')/gradeCount):null;
 const gapEarcos=gradeCount&&earcosMeasured.length===gradeCount?
  round1(sum(earcosMeasured.map(r=>({delta:r.aisg-r.earcos})),'delta')/gradeCount):null;
 const hasGrowth=window==='spring2026'&&['math','reading'].includes(subject);
 const tested=hasGrowth?sum(rows,'n'):null;
 const aboveUsN=hasGrowth?sum(rows,'aboveUsN'):null;
 const growthMet=hasGrowth?sum(rows,'growthMet'):null;
 const growthEligible=hasGrowth?sum(rows,'growthEligible'):null;
 return {
  rows,gradeCount,aboveUS,aboveEarcos:earcosAvailable?aboveEarcos:null,
  hasEarcos:earcosAvailable>0,usAvailable,earcosAvailable,
  gapUS,gapEarcos,tested,aboveUsN,
  aboveUsPct:tested?Math.round(100*aboveUsN/tested):null,
  growthMet,growthEligible,growthPct:growthEligible?Math.round(100*growthMet/growthEligible):null,
  source,coverage:{us:usAvailable,earcos:earcosAvailable}
 };
}
