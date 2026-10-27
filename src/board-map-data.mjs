/**
 * AISG MAP — Board-facing, anonymised, school-grade aggregates only.
 * Source 1: AISG MAP Data Fall 2025 PDF (pp.4 & 8).
 * Source 2: NWEA Spring 2025–26 AssessmentResults + StudentsBySchool CSV,
 * and AISG Spring 2026 US comparison workbook for reference means.
 *
 * Fall 2025 and Spring 2026 are separate testing windows; EARCOS comparisons
 * are available for Fall 2025 only. No individual records or identifiers here.
 * 2026 Spring results use one earliest chronologically dated valid test
 * per learner and subject; growth is eligible spring-to-spring matched progress.
 */
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
// grade, AISG mean, US spring norm, student tests, students above US,
// matched students meeting projected growth, matched eligible students.
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
const fallRow=([grade,aisg,us,earcos,aboveUsPct,aboveEarcosPct])=>
 ({grade,aisg,us,earcos,aboveUsPct,aboveEarcosPct});
const springRow=([grade,aisg,us,n,aboveUsN,growthMet,growthEligible])=>
 ({grade,aisg,us,earcos:null,n,aboveUsN,growthMet,growthEligible});
export const BOARD_WINDOWS=Object.freeze([
 Object.freeze({id:'fall2025',label:'Fall 2025',benchmarks:'US + EARCOS'}),
 Object.freeze({id:'spring2026',label:'Spring 2026',benchmarks:'US + growth'})
]);
export const BOARD_SUBJECTS=Object.freeze([
 Object.freeze({id:'math',label:'Mathematics'}),
 Object.freeze({id:'reading',label:'Reading'})
]);
export const BOARD_DATA=Object.freeze({
 fall2025:{
  label:'Fall 2025',hasEarcos:true,hasMatchedGrowth:false,
  source:'AISG MAP Data Fall 2025 (Mathematics p.4; Reading p.8)',
  subjects:{math:fallMath.map(fallRow),reading:fallReading.map(fallRow)}
 },
 spring2026:{
  label:'Spring 2026',hasEarcos:false,hasMatchedGrowth:true,
  source:'AISG NWEA Spring 2026 AssessmentResults and StudentsBySchool exports; Spring 2026 US comparison workbook',
  subjects:{math:springMath.map(springRow),reading:springReading.map(springRow)}
 }
});
export const BOARD_METHODS=Object.freeze({
 achievement:'Each bar shows AISG mean RIT minus the comparison-group grade-level mean. A positive gap means the AISG grade mean is higher; it does not mean every student is above the norm.',
 fall:'Fall 2025 EARCOS and US benchmarks are from the same Fall 2025 AISG summary. The percentages above each reference are student-level figures published for each grade. Fall sample sizes are not present in that summary.',
 spring:'Spring 2026 US mean is a season-matched reference. AISG grade results and growth are reaggregated from the Spring 2026 NWEA export with the earliest dated test per learner/subject to avoid double counting repeated assessments. Counts are distinct tested students, not the whole enrolled school.',
 growth:'Spring-to-spring growth counts only students with a valid matched projected-growth comparison. Grade 3 has no matched Spring 2025 starting result in this export, so its growth is unavailable.',
 caution:'Do not interpret a cross-sectional comparison between different grades or testing windows as student growth. The Board view contains real AISG aggregate data; all other My Learners personas use fictional records. No student-level MAP records are published.'
});
export const BOARD_GRADE_LIST=Object.freeze([3,4,5,6,7,8,9,10]);
export function boardRows(window='fall2025',subject='math',division='all',grade='all'){
 const item=BOARD_DATA[window];
 if(!item || !['math','reading'].includes(subject))return [];
 return item.subjects[subject].filter(x=>
  (division==='all'||division==='elementary'&&x.grade<=5||division==='secondary'&&x.grade>=6)&&
  (grade==='all'||x.grade===Number(grade))
 );
}
const sum=(rows,key)=>rows.reduce((v,row)=>v+(Number.isFinite(row[key])?row[key]:0),0);
const round1=x=>Math.round((x+Number.EPSILON)*10)/10;
export function boardSummary(window='fall2025',subject='math',division='all',grade='all'){
 const rows=boardRows(window,subject,division,grade),hasEarcos=BOARD_DATA[window]?.hasEarcos??false;
 const total=rows.length,aboveUS=rows.filter(r=>r.aisg>r.us).length;
 const aboveEarcos=hasEarcos?rows.filter(r=>r.aisg>r.earcos).length:null;
 const gapUS=total?round1(rows.reduce((v,r)=>v+r.aisg-r.us,0)/total):null;
 const gapEarcos=hasEarcos&&total?round1(rows.reduce((v,r)=>v+r.aisg-r.earcos,0)/total):null;
 const tested=window==='spring2026'?sum(rows,'n'):null;
 const aboveUsN=window==='spring2026'?sum(rows,'aboveUsN'):null;
 const growthMet=window==='spring2026'?sum(rows,'growthMet'):null;
 const growthEligible=window==='spring2026'?sum(rows,'growthEligible'):null;
 return {rows,gradeCount:total,aboveUS,aboveEarcos,hasEarcos,gapUS,gapEarcos,tested,aboveUsN,
  aboveUsPct:tested?Math.round(100*aboveUsN/tested):null,
  growthMet,growthEligible,growthPct:growthEligible?Math.round(100*growthMet/growthEligible):null};
}
