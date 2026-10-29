import test from 'node:test';
import assert from 'node:assert/strict';
import {DP_RECORDS,dpMetricSeries,dpPoint} from '../src/board-dp-data.mjs';
import {DIPLOMA_SUBJECTS} from '../src/board-dp-subjects.mjs';

// Independently transcribed from the original 11 AISG May School Statistics reports.
// School number 001832 is the mandatory source identity. Never import other schools.
// Official world awardee-only series are from IB May DP statistical bulletins.
const SCHOOL=String.raw`
2016,65,62,33,42,5.36
2017,60,59,33,41,5.28
2018,65,58,34,44,5.46
2019,58,54,32,40,5.13
2020,59,55,36,45,5.67
2021,42,40,37,44,5.85
2022,43,43,36,43,5.64
2023,55,50,34,42,5.34
2024,38,35,34,44,5.32
2025,42,39,34,43,5.29
2026,56,52,34,43,5.35
`.trim();
const WORLD=String.raw`
2016,30.00,79.30,—
2017,29.88,78.43,32.45
2018,29.76,78.16,32.30
2019,29.65,77.83,32.23
2020,31.33,85.16,33.15
2021,32.98,88.95,34.49
2022,32.00,86.10,33.83
2023,30.24,80.00,32.66
2024,30.32,80.50,32.70
2025,30.58,81.90,32.80
2026,30.88,82.60,33.00
`.trim();
const COURSE=String.raw`
biology-hl:2016,14,4.86,4.33;2017,14,5.29,4.32;2018,22,5.36,4.35;2019,9,4.67,4.34;2020,11,5.82,4.72;2021,5,5.00,5.04;2022,13,5.46,4.73;2023,12,5.00,4.41;2024,13,4.62,4.42;2025,14,4.93,4.45;2026,16,5.06,4.49
chemistry-hl:2016,11,5.09,4.48;2017,7,5.00,4.49;2018,20,5.00,4.46;2019,14,4.71,4.51;2020,15,5.60,4.92;2021,13,4.85,5.38;2022,14,6.21,4.99;2023,17,4.24,4.57;2024,18,4.39,4.70;2025,16,4.19,4.82;2026,18,5.33,4.95
chinese-b-sl:2016,14,6.79,6.01;2017,11,6.91,5.97;2018,18,6.61,5.93;2019,14,6.07,5.99;2020,15,6.40,6.08;2021,11,6.73,6.17;2022,9,6.33,5.80;2023,17,6.59,5.73;2024,10,6.60,5.68;2025,10,5.90,5.69;2026,10,6.10,5.71
english-hl:2016,38,5.47,5.06;2017,26,5.50,4.96;2018,33,5.52,4.98;2019,28,5.68,4.97;2020,31,5.68,5.13;2021,28,5.86,5.11;2022,26,5.62,5.03;2023,20,5.30,4.80;2024,9,5.22,4.73;2025,10,5.50,4.83;2026,17,5.41,4.84
english-sl:2016,21,5.10,5.18;2017,30,5.13,5.19;2018,34,5.06,5.10;2019,27,5.22,5.09;2020,29,5.69,5.45;2021,20,5.20,5.43;2022,15,5.20,5.27;2023,41,5.00,4.89;2024,26,5.27,4.92;2025,36,5.17,4.95;2026,36,5.22,4.98
math-aa-hl:2021,8,6.25,5.44;2022,6,6.67,5.21;2023,19,5.89,4.88;2024,8,6.13,4.87;2025,7,5.14,4.92;2026,17,5.41,5.00
math-aa-sl:2021,21,5.81,5.18;2022,20,6.20,4.99;2023,24,5.92,4.61;2024,15,5.73,4.55;2025,29,5.34,4.50;2026,25,5.52,4.46
math-ai-sl:2021,17,5.88,4.75;2022,19,5.26,4.39;2023,16,4.25,3.87;2024,17,5.12,3.92;2025,9,4.78,3.88;2026,17,4.88,3.89
math-legacy-hl:2016,10,5.30,4.46;2017,17,4.47,4.73;2018,13,6.15,4.75;2019,11,5.64,4.69;2020,10,6.40,5.04
math-legacy-sl:2016,47,5.06,4.39;2017,40,4.95,4.38;2018,53,4.74,4.26;2019,45,4.78,4.18;2020,45,5.38,4.79
physics-hl:2016,7,5.00,4.62;2017,12,5.75,4.65;2018,10,4.80,4.65;2019,12,4.83,4.65;2020,12,5.33,5.29;2021,8,5.38,5.34;2022,3,5.67,5.09;2023,19,5.26,4.81;2024,9,4.88,4.86;2025,10,4.10,4.91;2026,17,4.65,4.97
psychology-hl:2016,39,5.15,4.68;2017,20,5.80,4.73;2018,27,4.89,4.69;2019,27,4.67,4.70;2020,34,5.06,5.18;2021,27,5.41,5.29;2022,13,5.08,5.07;2023,21,5.19,4.79;2024,20,5.60,4.74;2025,12,5.42,4.74;2026,14,5.86,4.82
visual-arts-hl:2016,11,6.18,4.79;2017,9,5.56,4.65;2018,14,5.00,4.48;2019,7,5.57,4.27;2020,9,5.22,4.21;2021,7,6.00,4.56;2022,6,5.50,4.45;2023,11,5.18,4.40;2024,9,5.22,4.25;2025,9,5.11,4.26;2026,7,5.57,4.30
`.trim();
const readRecords=str=>str.split('\n').map(x=>x.trim()).filter(Boolean);

test('Every published school Diploma cohort matches the official AISG 001832 May report',()=>{
 const actual=DP_RECORDS.map(r=>[r.end,r.candidates,r.passes,r.average,r.highScore,r.meanGrade.toFixed(2)].join(','));
 assert.deepEqual(actual,readRecords(SCHOOL));
 for(const row of DP_RECORDS)assert.equal(row.passRate,Math.round(100*row.passes/row.candidates));
});
test('Published global values use exact bulletin figures and awardee-only means for matching',()=>{
 const actual=DP_RECORDS.map(r=>[r.end,r.worldAverage.toFixed(2),r.worldPassRate.toFixed(2),
  r.worldAwardedAverage==null?'—':r.worldAwardedAverage.toFixed(2)].join(','));
 assert.deepEqual(actual,readRecords(WORLD));
 const series=dpMetricSeries('average');
 assert.equal(series[0].worldValue,null,'2016 worldwide recipient mean is not verified');
 assert.equal(series[3].worldValue,32.23,'2019 AISG was below matched worldwide recipient mean');
 assert.equal(series[9].worldValue,32.8);
 assert.equal(series[10].worldValue,33);
 assert.equal(dpPoint(2026,'average').worldValue,33);
 assert.equal(dpMetricSeries('passRate')[0].worldValue,79.3);
});
test('All 116 published subject/year entries exactly match AISG school statistics, including worldwide course means',()=>{
 const actual=DIPLOMA_SUBJECTS.map(s=>s.id+':'+s.rows.map(r=>
  [r.year,r.n,r.school.toFixed(2),r.world.toFixed(2)].join(',')).join(';')).sort();
 assert.deepEqual(actual,readRecords(COURSE).sort());
 assert.equal(DIPLOMA_SUBJECTS.reduce((n,s)=>n+s.rows.length,0),116);
});
