/**
 * AISG IB Diploma aggregate history.
 * Class of 2018–2025: school-provided IBDP exam statistics table (authoritative).
 * Class of 2026: May 2026 AISG IB School Statistics (school 001832).
 * May 2022–2025 IB reports also support this Board subject comparison.
 * International benchmarks 2023–2025: supplied school statistics table;
 * May 2026 world average: IB official July 2026 results news (30.88 / 45).
 *
 * No identifying records, no inferred 2026 examination cohort counts,
 * and no mixing DP/CP world recipients with Diploma candidates.
 */
export const DP_RECORDS=Object.freeze([
 {year:'2017–18',end:2018,average:34,passRate:89,candidates:65,cohort:75,passes:58,
  highCount:27,highDenominator:65,bilingualCount:9,bilingualDenominator:58,highScore:44,meanGrade:5.45},
 {year:'2018–19',end:2019,average:32,passRate:93,candidates:58,cohort:null,participationPct:89,passes:54,
  highCount:17,highDenominator:58,bilingualCount:18,bilingualDenominator:54,highScore:40,meanGrade:5.15},
 {year:'2019–20',end:2020,average:36,passRate:93,candidates:59,cohort:null,participationPct:91,passes:55,
  highCount:31,highDenominator:59,bilingualCount:17,bilingualDenominator:55,highScore:45,meanGrade:5.67,
  covid:'Examinations cancelled; alternative assessment arrangements'},
 {year:'2020–21',end:2021,average:37,passRate:95,candidates:42,cohort:null,participationPct:86,passes:40,
  highCount:25,highDenominator:40,bilingualCount:15,bilingualDenominator:40,highScore:43,meanGrade:5.85,
  covid:'COVID-related assessment arrangements'},
 {year:'2021–22',end:2022,average:36,passRate:100,candidates:43,cohort:46,passes:43,
  highCount:21,highDenominator:43,bilingualCount:17,bilingualDenominator:43,highScore:43,meanGrade:5.64,corePoints:1.95,
  covid:'COVID-related assessment arrangements'},
 {year:'2022–23',end:2023,average:34,passRate:91,candidates:55,cohort:63,passes:50,
  highCount:22,highDenominator:55,bilingualCount:14,bilingualDenominator:55,highScore:42,meanGrade:5.33,corePoints:1.49,
  worldAverage:30.24,worldPassRate:79.67,worldMeanGrade:4.83,worldCorePoints:1.38,worldHighShare:28.4,worldBilingualShare:27.64},
 {year:'2023–24',end:2024,average:34,passRate:92,candidates:38,cohort:43,passes:35,
  highCount:15,highDenominator:35,bilingualCount:7,bilingualDenominator:35,highScore:44,meanGrade:5.34,corePoints:1.67,
  worldAverage:30.32,worldPassRate:80,worldMeanGrade:4.9,worldCorePoints:1.5,worldHighShare:35.6},
 {year:'2024–25',end:2025,average:33.66,passRate:93,candidates:42,cohort:51,passes:39,
  highCount:15,highDenominator:42,bilingualCount:11,bilingualDenominator:39,highScore:43,meanGrade:5.29,corePoints:1.9,
  worldAverage:30.58,worldPassRate:81,worldMeanGrade:4.89,worldCorePoints:1.5,worldBilingualShare:27.3},
 {year:'2025–26',end:2026,average:34,passRate:93,candidates:56,passes:52,highScore:43,meanGrade:5.35,
  worldAverage:30.88,worldSource:'https://ibo.org/news/news-list/more-than-209000-ib-students-worldwide-receive-their-dp-and-cp-results/'}
]);
export const DP_GRADE12_PATHWAYS=Object.freeze([
 {year:'2023–24',full:38,courses:5,aisg:0},
 {year:'2024–25',full:42,courses:9,aisg:0},
 {year:'2025–26',full:56,courses:6,aisg:1}
]);
export const DP_METRICS=Object.freeze([
 {id:'average',label:'Average Diploma score',unit:'/45',max:45,
  description:'School average Diploma points out of 45. An annual graduating cohort, not matched student growth.'},
 {id:'passRate',label:'Diploma pass rate',unit:'%',max:100,
  description:'Percentage of Diploma/retake candidates awarded the full Diploma. IB May 2026 reports 52 passes from 56 Diploma and retake candidates.'}
]);
export const DP_METHODS=Object.freeze({
 quality:'School Diploma statistics for 2018–2025 come from the supplied historic summary, with May 2022–2026 figures cross-checked against AISG IB School Statistics (school 001832). May 2026 includes 52 passes out of 56 Diploma and retake candidates.',
 limits:'The official May 2026 report lists 61 registered session candidates, including 56 Diploma and retake candidates, of whom 52 passed. These populations are not interchangeable with Grade 12 pathway enrollment.',
 discrepancy:'The previously reported count of 117 full DP learners differs from the Grade 12 full Diploma pathway (56). The official 2026 IB report also lists 56 Diploma and retake candidates, but do not presume they are the same individuals.',
 current:'The May 2026 AISG IB School Statistics reports 34 average points among successful Diploma candidates and 52 awards from 56 Diploma/retake candidates (92.9%, displayed as 93%).',
 pathways:'Grade 12 pathways are enrollment information, not examination candidate or pass counts. Do not divide examinations by pathway entries.',
 boundary:'DP results cover graduating cohorts; MAP covers Grades 3–10. Do not combine them into a single attainment percentage.',
 comparison:'School and world Diploma averages use the same 0–45 scale, but cohort composition and candidature differ. World 2023–2025 values come from the school examination summary, while the 2026 world mean is published by the IB. A world 2026 Diploma pass rate is not included.',
 covid:'The school summary flags examination cancellation in 2020 and altered assessment arrangements in 2021–2022.',
 discrepancy2024:'For 2024, the school summary records 15 high scorers out of 35 for that indicator, but 38 Diploma candidates overall. The high-score denominator is retained exactly as supplied and not silently changed.',
 discrepancy2023:'The bilingual Diploma figure for 2023 is 14/55 in the school summary, a different denominator from the 50 Diploma passes. Historical denominators are displayed as supplied and not reconciled by assumption.'
});
export const dpVerified=(row)=>!!row&&Number.isFinite(row.average);
export const dpPassCount=(row)=>Number.isFinite(row?.passes)&&Number.isFinite(row?.candidates)?row.passes+'/'+row.candidates:null;
export const dpParticipation=(row)=>{
 if(!row||!Number.isFinite(row.candidates))return null;
 return Number.isFinite(row.cohort)?Math.round(100*row.candidates/row.cohort):row.participationPct??null;
};
export function dpMetricSeries(metric='average'){
 const key=metric==='passRate'?'passRate':'average';
 const world=key==='average'?'worldAverage':'worldPassRate';
 return DP_RECORDS.map(row=>({year:row.year,end:row.end,value:row[key],
  worldValue:row[world]??null,provisional:false}));
}
export function dpPoint(year,metric='average'){
 const row=DP_RECORDS.find(r=>r.end===Number(year));if(!row)return null;
 const key=metric==='passRate'?'passRate':'average';
 return {row,metric:key,value:row[key],worldValue:row[key==='average'?'worldAverage':'worldPassRate']??null,
  label:DP_METRICS.find(m=>m.id===key).label};
}
