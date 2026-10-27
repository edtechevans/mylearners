/**
 * AISG historic IB Diploma Programme aggregate outcomes only.
 * User-provided "Measuring the Mission KPI Dashboard.xlsx":
 *   KPIs!F5:I5, G4:I4 (SY19–20 through SY22–23)
 *   Dashboard SY2324!S27:S28, SY2425!S28:S29,
 *   Dashboard SY2526!S28:S29 (SY23–24 to SY25–26).
 * Pathway counts: each dashboard's L12:L14 (Grade 12, SY23–24 to SY25–26).
 *
 * These are values *reported in the workbook*, not verified against
 * official IBO candidate-session reports. 2025–26 should be reconfirmed.
 * Critical source discrepancy: "full DP students" SY25–26=117, while
 * Grade 12 Full DP pathway=56. Neither is published as a DP exam cohort.
 * Never infer numbers of examination candidates or certificates awarded.
 * No student-level/identifiable records present.
 */
export const DP_RECORDS=Object.freeze([
 {year:'2019–20',end:2020,average:35.7,passRate:null,source:'KPIs!F5'},
 {year:'2020–21',end:2021,average:36.4,passRate:95,source:'KPIs!G4:G5'},
 {year:'2021–22',end:2022,average:36,passRate:100,source:'KPIs!H4:H5'},
 {year:'2022–23',end:2023,average:34,passRate:91,source:'KPIs!I4:I5'},
 {year:'2023–24',end:2024,average:34,passRate:92,source:'Dashboard SY2324!S27:S28'},
 {year:'2024–25',end:2025,average:34,passRate:93,source:'Dashboard SY2425!S28:S29'},
 {year:'2025–26',end:2026,average:34,passRate:93,source:'Dashboard SY2526!S28:S29',
  verify:true}
]);
export const DP_GRADE12_PATHWAYS=Object.freeze([
 {year:'2023–24',full:38,courses:5,aisg:0,source:'Dashboard SY2324!L12:L14'},
 {year:'2024–25',full:42,courses:9,aisg:0,source:'Dashboard SY2425!L12:L14'},
 {year:'2025–26',full:56,courses:6,aisg:1,source:'Dashboard SY2526!L12:L14'}
]);
export const DP_METRICS=Object.freeze([
 {id:'average',label:'Average Diploma score',unit:'/45',max:45,
  description:'School-reported average IB Diploma points; not a MAP score or a student-growth measure'},
 {id:'passRate',label:'Diploma pass rate',unit:'%',max:100,
  description:'School-reported percentage of diploma candidates awarded the diploma; candidate denominators are not supplied'}
]);
export const DP_METHODS=Object.freeze({
 source:'Measuring the Mission KPI Dashboard.xlsx (AISG internal historical KPI workbook). Reported annual values, not independently verified against official IBO exam-session reports.',
 limits:'The workbook does not provide a consistent number of Diploma examination candidates each year, so do not calculate pass counts or use pathway participation as an exam denominator.',
 discrepancy:'For SY2025–26 the workbook lists 117 “full DP students” and 56 Grade 12 Full DP pathway learners. These figures describe different or inconsistent populations and are intentionally not treated as comparable examination counts.',
 current:'SY2025–26 values are the latest reported figures in the supplied workbook. Please verify them against the official final IB Diploma examination results; they should be reconfirmed before formal Board reporting.',
 pathways:'Grade 12 pathway counts show pathways selected or enrolled (full Diploma, DP courses and AISG pathway). They are not candidate counts, pass counts or a statement that one pathway is more valuable than another.',
 boundary:'This page uses aggregate school-reported data only. The Diploma Programme applies to a different age cohort from MAP Grades 3–10, and neither set should be directly combined.'
});
export function dpMetricSeries(metric='average'){
 const m=metric==='passRate'?'passRate':'average';
 return DP_RECORDS.map(r=>({year:r.year,end:r.end,value:r[m],provisional:!!r.verify,source:r.source}));
}
export function dpPoint(year,metric='average'){
 const row=DP_RECORDS.find(r=>r.end===Number(year));
 if(!row)return null;
 const type=metric==='passRate'?'passRate':'average';
 return {row,metric:type,value:row[type],label:DP_METRICS.find(m=>m.id===type).label};
}
