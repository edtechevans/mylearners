/**
 * AISG IB Diploma aggregate history.
 * May 2016–2026: official AISG IB School Statistics (school 001832).
 * Historical supplementary indicators remain from school-provided IBDP summary;
 * IB official report is authoritative for Diploma awards, candidate counts and averages.
 * World Diploma results: official IB May final bulletins 2016–2025;
 * May 2026 uses the IB provisional bulletin and July 2026 announcement.
 * worldAverage = worldwide mean among ALL Diploma/retake results.
 * worldAwardedAverage = mean of Diploma recipients only (MATCHED to AISG school mean).
 * Global awardee mean is unavailable from the verified historical source for May 2016;
 * comparison graph begins at May 2017, while AISG school history begins in 2016.
 *
 * No identifying records or inferred examination cohort counts,
 * and no mixing DP/CP world recipients with Diploma candidates.
 */
export const DP_RECORDS=Object.freeze([
 {year:'2015–16',end:2016,average:33,passRate:95,candidates:65,sessionCandidates:67,passes:62,worldAverage:30,worldPassRate:79.3,highScore:42,meanGrade:5.36},
 {year:'2016–17',end:2017,average:33,passRate:98,candidates:60,sessionCandidates:65,passes:59,worldAverage:29.88,worldPassRate:78.43,worldAwardedAverage:32.45,highScore:41,meanGrade:5.28},
 {year:'2017–18',end:2018,average:34,passRate:89,candidates:65,cohort:75,passes:58,worldAverage:29.76,worldPassRate:78.16,worldAwardedAverage:32.3,
  highCount:27,highDenominator:65,bilingualCount:9,bilingualDenominator:58,highScore:44,meanGrade:5.46},
 {year:'2018–19',end:2019,average:32,passRate:93,candidates:58,cohort:null,participationPct:89,passes:54,worldAverage:29.65,worldPassRate:77.83,worldAwardedAverage:32.23,
  highCount:17,highDenominator:58,bilingualCount:18,bilingualDenominator:54,highScore:40,meanGrade:5.13},
 {year:'2019–20',end:2020,average:36,passRate:93,candidates:59,cohort:null,participationPct:91,passes:55,worldAverage:31.33,worldPassRate:85.16,worldAwardedAverage:33.15,
  highCount:31,highDenominator:59,bilingualCount:17,bilingualDenominator:55,highScore:45,meanGrade:5.67,
  covid:'Examinations cancelled; alternative assessment arrangements'},
 {year:'2020–21',end:2021,average:37,passRate:95,candidates:42,cohort:null,participationPct:86,passes:40,worldAverage:32.98,worldPassRate:88.95,worldAwardedAverage:34.49,
  highCount:25,highDenominator:40,bilingualCount:15,bilingualDenominator:40,highScore:44,meanGrade:5.85,
  covid:'COVID-related assessment arrangements'},
 {year:'2021–22',end:2022,average:36,passRate:100,candidates:43,cohort:46,passes:43,worldAverage:32,worldPassRate:86.1,worldAwardedAverage:33.83,
  highCount:21,highDenominator:43,bilingualCount:17,bilingualDenominator:43,highScore:43,meanGrade:5.64,corePoints:1.95,
  covid:'COVID-related assessment arrangements'},
 {year:'2022–23',end:2023,average:34,passRate:91,candidates:55,cohort:63,passes:50,worldAverage:30.24,worldPassRate:80,worldAwardedAverage:32.66,
  highCount:22,highDenominator:55,bilingualCount:14,bilingualDenominator:55,highScore:42,meanGrade:5.34,corePoints:1.49,worldMeanGrade:4.83,worldCorePoints:1.38,worldHighShare:28.4,worldBilingualShare:27.64},
 {year:'2023–24',end:2024,average:34,passRate:92,candidates:38,cohort:43,passes:35,worldAverage:30.32,worldPassRate:80.5,worldAwardedAverage:32.7,
  highCount:15,highDenominator:35,bilingualCount:7,bilingualDenominator:35,highScore:44,meanGrade:5.32,corePoints:1.67,worldMeanGrade:4.9,worldCorePoints:1.5,worldHighShare:35.6},
 {year:'2024–25',end:2025,average:34,passRate:93,candidates:42,cohort:51,passes:39,worldAverage:30.58,worldPassRate:81.9,worldAwardedAverage:32.8,
  highCount:15,highDenominator:42,bilingualCount:11,bilingualDenominator:39,highScore:43,meanGrade:5.29,corePoints:1.9,worldMeanGrade:4.89,worldCorePoints:1.5,worldBilingualShare:27.3},
 {year:'2025–26',end:2026,average:34,passRate:93,candidates:56,passes:52,worldAverage:30.88,worldPassRate:82.6,worldAwardedAverage:33,highScore:43,meanGrade:5.35,worldMeanGrade:4.9,
  worldSource:'https://ibo.org/news/news-list/more-than-209000-ib-students-worldwide-receive-their-dp-and-cp-results/',
  worldPassSource:'https://ibo.org/globalassets/publications/dpcp-provisional-statistical-bulletin-may-2026_en.pdf'}
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
 quality:'Official May 2016–2026 AISG IB School Statistics (school 001832) establish Diploma averages, awards, examination candidature and subject means. The 2016 and 2017 total session-registration figures are not labelled as graduating-class counts. Other supplementary indicators use the previously supplied school summary. May 2026 includes 52 passes out of 56 Diploma and retake candidates.',
 limits:'The official May 2026 report lists 61 registered session candidates, including 56 Diploma and retake candidates, of whom 52 passed. These populations are not interchangeable with Grade 12 pathway enrollment.',
 discrepancy:'The previously reported count of 117 full DP learners differs from the Grade 12 full Diploma pathway (56). The official 2026 IB report also lists 56 Diploma and retake candidates, but do not presume they are the same individuals.',
 current:'The May 2026 AISG IB School Statistics reports 34 average points among successful Diploma candidates and 52 awards from 56 Diploma/retake candidates (92.9%, displayed as 93%).',
 pathways:'Grade 12 pathways are enrollment information, not examination candidate or pass counts. Do not divide examinations by pathway entries.',
 boundary:'DP results cover graduating cohorts; MAP covers Grades 3–10. Do not combine them into a single attainment percentage.',
 comparison:'IB overall worldwide Diploma mean and worldwide Diploma-recipient mean are DIFFERENT populations. Compare AISG recipient-only Diploma mean with worldAwardedAverage for May 2017–2026. IB 2016 awardee-only global mean not independently established, so omit that world chart point. May 2026 statistics are provisional; historical May sessions use final IB bulletins. Worldwide pass rates reflect Diploma/retake results. Values retain original source precision.',
 covid:'The school summary flags examination cancellation in 2020 and altered assessment arrangements in 2021–2022. Compare those years with care.',
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
 const world=key==='average'?'worldAwardedAverage':'worldPassRate';
 return DP_RECORDS.map(row=>({year:row.year,end:row.end,value:row[key],
  worldValue:row[world]??null,provisional:false}));
}
export function dpPoint(year,metric='average'){
 const row=DP_RECORDS.find(r=>r.end===Number(year));if(!row)return null;
 const key=metric==='passRate'?'passRate':'average';
 return {row,metric:key,value:row[key],worldValue:row[key==='average'?'worldAwardedAverage':'worldPassRate']??null,
  label:DP_METRICS.find(m=>m.id===key).label};
}
