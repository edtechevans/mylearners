import test from 'node:test';
import assert from 'node:assert/strict';
import {DP_RECORDS,DP_GRADE12_PATHWAYS,DP_METHODS,dpPoint,dpMetricSeries} from '../src/board-dp-data.mjs';
import {renderBoardDP,renderDPPointDetails} from '../src/board-dp-view.mjs';
import {BOARD_DATA,BOARD_US_SCHOOL_NORMS_2025,boardRows,boardSummary} from '../src/board-map-data.mjs';
import {boardHash,parseBoardHash} from '../src/board-map-links.mjs';

test('2018–2025 exam statistics replace legacy summary while 2026 remains explicitly separate',()=>{
 assert.deepEqual(DP_RECORDS.map(x=>x.year),[
  '2017–18','2018–19','2019–20','2020–21','2021–22',
  '2022–23','2023–24','2024–25','2025–26']);
 assert.deepEqual(DP_RECORDS.map(x=>x.average),[34,32,36,37,36,34,34,33.66,34]);
 assert.deepEqual(DP_RECORDS.map(x=>x.passRate),[89,93,93,95,100,91,95,93,93]);
 assert.deepEqual(DP_RECORDS.map(x=>x.candidates??null),[65,58,59,42,43,55,38,42,null]);
 assert.deepEqual(DP_RECORDS.map(x=>x.passes??null),[58,54,55,40,43,50,36,39,null]);
 assert.equal(DP_RECORDS.find(x=>x.end===2025).worldAverage,30.58);
 assert.equal(DP_RECORDS.find(x=>x.end===2025).worldPassRate,81);
 assert.equal(DP_RECORDS.find(x=>x.end===2024).highDenominator,35);
 assert.equal(DP_RECORDS.find(x=>x.end===2024).candidates,38);
 assert.equal(DP_RECORDS.find(x=>x.end===2026).verify,true);
 assert.equal(DP_RECORDS.find(x=>x.end===2026).worldAverage,30.88);
 assert.equal(DP_RECORDS.find(x=>x.end===2026).candidates,undefined);
 assert.deepEqual(DP_GRADE12_PATHWAYS.map(x=>[x.full,x.courses,x.aisg]),
 [[38,5,0],[42,9,0],[56,6,1]]);
 assert.match(DP_METHODS.discrepancy,/117/);
 assert.match(DP_METHODS.discrepancy,/56/);
 assert.match(DP_METHODS.current,/Confirm/);
});
test('Nine-year Diploma chart keeps full scale and supports actual global reference windows',()=>{
 const average=dpMetricSeries('average'),passes=dpMetricSeries('passRate');
 assert.equal(average.length,9);assert.equal(passes.length,9);
 assert.equal(average[0].value,34);
 assert.equal(passes.find(x=>x.end===2020).value,93);
 assert.equal(average.at(-1).worldValue,30.88);
 assert.equal(passes.at(-1).worldValue,null);
 assert.equal(dpPoint(2018,'average').value,34);
 assert.equal(dpPoint(2026,'passRate').value,93);
 const html=renderBoardDP({boardDpMetric:'average',boardDpGlobal:true});
 assert.match(html,/board-dp-graphic-grid/);
 assert.match(html,/IB Diploma Results/);
 assert.match(html,/Consistent outcomes/);
 assert.match(html,/6 \/ 8/);
 assert.match(html,/data-board-dp-point="average:2018"/);
 assert.match(html,/data-board-dp-point="average:2026"/);
 assert.match(html,/board-dp-world-point/);
 assert.match(html,/data-board-dp-global/);
 assert.match(html,/30\.88/);
 assert.match(html,/global IB reference/);
 assert.match(html,/32\.0–37\.0/);
 assert.match(html,/2026 AISG average and pass rate are taken from the previously reported school dashboard/);
 assert.doesNotMatch(html,/confirmation pending|verification pending|unconfirmed|board-dp-status/i);
 assert.match(html,/Detailed results by graduating year/);
 assert.match(html,/Source context/);
 assert.match(html,/Previously reported dashboard/);
 const solo=renderBoardDP({boardDpGlobal:false});
 assert.doesNotMatch(solo,/class="board-dp-world-point"/);
 assert.match(solo,/Compare with world/);
 const passHtml=renderBoardDP({boardDpMetric:'passRate'});
 assert.match(passHtml,/data-board-dp-point="passRate:2020"/);
 assert.match(passHtml,/data-board-dp-point="passRate:2026"/);
 assert.match(renderDPPointDetails('passRate:2026'),/93%/);
 assert.match(renderDPPointDetails('average:2025'),/33\.66/);
 assert.match(renderDPPointDetails('average:2025'),/30\.58/);
});
test('IB Diploma remains separate from MAP; Board URLs preserve DP metric',()=>{
 const link=boardHash({boardView:'dp',boardDpMetric:'passRate'});
 assert.equal(link,'#/board?view=dp&metric=passRate');
 const parsed=parseBoardHash(link);
 assert.equal(parsed.boardView,'dp');assert.equal(parsed.boardDpMetric,'passRate');
 assert.equal(parsed.boardWindow,'fall2026');
 assert.equal(parseBoardHash('#/board?view=dp&metric=invalid').boardDpMetric,'average');
 assert.equal(parseBoardHash('#/faculty'),null);
});
test('Fall 2025 and Spring 2026 use NWEA school achievement reference, not student means',()=>{
 const fall={
  math:[184,196,206,210,217,220,224,225],
  reading:[184,195,203,208,212,215,216,217],
  language:[184,194,202,206,209,213,215,216]
 };
 const spring={
  math:[199,209,215,219,223,227,228,229],
  reading:[193,201,207,211,214,217,217,217],
  language:[193,200,207,209,212,215,216,217]
 };
 assert.deepEqual(BOARD_US_SCHOOL_NORMS_2025.fall,fall);
 assert.deepEqual(BOARD_US_SCHOOL_NORMS_2025.spring,spring);
 for(const [window,norms] of [['fall2025',fall],['spring2026',spring]]){
  for(const [subject,reference] of Object.entries(norms)){
   const rows=boardRows(window,subject);
   assert.deepEqual(rows.map(x=>x.us),reference,window+':'+subject);
   assert.ok(rows.every(x=>Number.isFinite(x.usOriginal)&&Number.isFinite(x.aisg)));
  }
  assert.equal(BOARD_DATA[window].usNormType,'2025-school');
 }
 assert.equal(BOARD_DATA.fall2026.usNormType,'2025-school');
 assert.equal(BOARD_DATA.fall2024.usNormType,'historical-unverified');
 assert.equal(boardSummary('spring2026','math').growthPct,71);
 assert.equal(boardSummary('spring2026','reading').growthPct,62);
});
test('Public DP module contains only annual aggregates, pathway counts and no learner identifiers',()=>{
 const raw=JSON.stringify({DP_RECORDS,DP_GRADE12_PATHWAYS});
 assert.ok(!/(?:@aisgz|studentid|dateofbirth|learner name|student email)/i.test(raw));
 assert.ok(DP_METHODS.limits.includes('Examination'));
 assert.ok(DP_METHODS.current.includes('Confirm'));
 assert.ok(DP_METHODS.quality.includes('school-supplied'));
});

test('No filenames or underlying cell references are shown in any Diploma result',()=>{
 for(const metric of ['average','passRate']){
  const html=renderBoardDP({boardDpMetric:metric});
  const tooltip=renderDPPointDetails(metric+':2026');
  assert.doesNotMatch(html+tooltip,/\.xlsx|\.csv|\.pdf|Dashboard SY\d|KPIs!|Source:|workbook/i);
  assert.match(html,/Understanding Diploma results/);
  assert.doesNotMatch(html,/confirmation pending|verification pending|unconfirmed|board-dp-status/i);
  assert.match(html,/supplied examination statistics summary/);
 }
});

test('Diploma year selection remains grounded; legacy range links remain accepted',()=>{
 const row=DP_RECORDS.find(r=>r.end===2025);
 assert.equal(row.average,33.66);
 assert.equal(row.passRate,93);
 const selected=renderBoardDP({boardDpYear:'2025',boardDpMetric:'passRate',boardDpRange:'recent'});
 assert.match(selected,/2024–25/);
 assert.match(selected,/data-board-dp-select="year"/);
 assert.doesNotMatch(selected,/data-board-dp-select="range"/);
 assert.match(selected,/board-dp-graphic-pass/);
 assert.match(selected,/board-dp-graphic-consistency/);
 assert.equal(parseBoardHash('#/board?view=dp&year=2025&range=recent').boardDpYear,'2025');
 assert.equal(parseBoardHash('#/board?view=dp&year=2025&range=recent').boardDpRange,'recent');
});
