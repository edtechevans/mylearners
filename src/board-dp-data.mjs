/**
 * AISG IB Diploma Programme outcomes: aggregate, school-reported annual values.
 * Figures cover seven completed school years. Data validation for 2025–26
 * is pending confirmation against the final examination session results.
 * Participation and examination-candidate populations must not be conflated.
 * No student identifiers or individual assessment records are included.
 */
export const DP_RECORDS=Object.freeze([
 {year:'2019–20',end:2020,average:35.7,passRate:null},
 {year:'2020–21',end:2021,average:36.4,passRate:95},
 {year:'2021–22',end:2022,average:36,passRate:100},
 {year:'2022–23',end:2023,average:34,passRate:91},
 {year:'2023–24',end:2024,average:34,passRate:92},
 {year:'2024–25',end:2025,average:34,passRate:93},
 {year:'2025–26',end:2026,average:34,passRate:93,verify:true}
]);
export const DP_GRADE12_PATHWAYS=Object.freeze([
 {year:'2023–24',full:38,courses:5,aisg:0},
 {year:'2024–25',full:42,courses:9,aisg:0},
 {year:'2025–26',full:56,courses:6,aisg:1}
]);
export const DP_METRICS=Object.freeze([
 {id:'average',label:'Average Diploma score',unit:'/45',max:45,
  description:'Reported average Diploma points, out of 45. Not a MAP score or growth measure.'},
 {id:'passRate',label:'Diploma pass rate',unit:'%',max:100,
  description:'Reported percentage of Diploma candidates awarded the Diploma. No consistent yearly candidate count is available.'}
]);
export const DP_METHODS=Object.freeze({
 quality:'Figures represent annual school-reported Diploma outcomes. The most recent year has not yet been confirmed against final examination-session results.',
 limits:'Consistent annual Diploma examination-candidate counts are not available, so pass counts must not be inferred or calculated from pathway participation.',
 discrepancy:'For 2025–26, the recorded count of 117 full DP learners differs from 56 learners in the Grade 12 full Diploma pathway. These refer to different or unconfirmed populations and are not used as an examination-candidate denominator.',
 current:'2025–26 results are reported school outcomes. Confirm them against the final IB Diploma examination results before formal Board reporting.',
 pathways:'Grade 12 pathway counts reflect the learning pathways selected or enrolled in. They are not examination counts, pass counts or comparisons of the value of different programmes.',
 boundary:'DP results represent graduating cohorts, whereas MAP achievement covers Grades 3–10. These different populations are not combined in one statistic.'
});
export function dpMetricSeries(metric='average'){
 const key=metric==='passRate'?'passRate':'average';
 return DP_RECORDS.map(row=>({year:row.year,end:row.end,value:row[key],provisional:!!row.verify}));
}
export function dpPoint(year,metric='average'){
 const row=DP_RECORDS.find(r=>r.end===Number(year));
 if(!row)return null;
 const key=metric==='passRate'?'passRate':'average';
 return {row,metric:key,value:row[key],label:DP_METRICS.find(m=>m.id===key).label};
}
