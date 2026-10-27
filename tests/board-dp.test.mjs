import test from 'node:test';
import assert from 'node:assert/strict';
import {DP_RECORDS,DP_GRADE12_PATHWAYS,DP_METHODS,dpPoint,dpMetricSeries} from '../src/board-dp-data.mjs';
import {renderBoardDP,renderDPPointDetails} from '../src/board-dp-view.mjs';
import {BOARD_DATA,BOARD_US_SCHOOL_NORMS_2025,boardRows,boardSummary} from '../src/board-map-data.mjs';
import {boardHash,parseBoardHash} from '../src/board-map-links.mjs';

test('IB Diploma annual school-reported values stay accurate without invented candidates',()=>{
 assert.deepEqual(DP_RECORDS.map(x=>x.year),[
  '2019–20','2020–21','2021–22','2022–23','2023–24','2024–25','2025–26']);
 assert.deepEqual(DP_RECORDS.map(x=>x.average),[35.7,36.4,36,34,34,34,34]);
 assert.deepEqual(DP_RECORDS.map(x=>x.passRate),[null,95,100,91,92,93,93]);
 assert.ok(DP_RECORDS.every(x=>!('source' in x)));
 assert.ok(DP_GRADE12_PATHWAYS.every(x=>!('source' in x)));
 assert.equal(DP_RECORDS.at(-1).verify,true);
 assert.deepEqual(DP_GRADE12_PATHWAYS.map(x=>[x.full,x.courses,x.aisg]),
 [[38,5,0],[42,9,0],[56,6,1]]);
 assert.ok(DP_METHODS.discrepancy.includes('117'));
 assert.ok(DP_METHODS.discrepancy.includes('56'));
 assert.ok(!DP_RECORDS.some(x=>x.examCandidates||x.passedCandidates));
});
test('Diploma interactive measures preserve missing 2020 pass rate and full chart scale',()=>{
 const avg=dpMetricSeries('average'),pass=dpMetricSeries('passRate');
 assert.equal(avg.length,7);assert.equal(pass.length,7);
 assert.equal(avg[0].value,35.7);assert.equal(pass[0].value,null);
 assert.deepEqual(dpPoint(2026,'average').value,34);
 assert.deepEqual(dpPoint(2026,'passRate').value,93);
 assert.equal(dpPoint(2018,'average'),null);
 const html=renderBoardDP({boardDpMetric:'average'});
 assert.match(html,/board-dp-tiles/);
 assert.match(html,/IB Diploma outcomes over time/);
 assert.match(html,/Grade 12 full DP pathway/);
 assert.match(html,/data-board-dp-point="average:2026"/);
 assert.match(html,/board-floating-tooltip/);
 assert.match(html,/Full Diploma pathway/);
 assert.match(html,/candidate denominator/i);
 const passHtml=renderBoardDP({boardDpMetric:'passRate'});
 assert.match(passHtml,/data-board-dp-point="passRate:2026"/);
 assert.doesNotMatch(passHtml,/data-board-dp-point="passRate:2020"/);
 assert.match(renderDPPointDetails('passRate:2026'),/93%/);
 assert.match(renderDPPointDetails('average:2020'),/35.7/);
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
 assert.ok(DP_METHODS.limits.includes('examination'));
 assert.ok(DP_METHODS.current.includes('Confirm'));
 assert.ok(DP_METHODS.quality.includes('annual school-reported'));
});

test('No filenames or underlying cell references are shown in any Diploma result',()=>{
 for(const metric of ['average','passRate']){
  const html=renderBoardDP({boardDpMetric:metric});
  const tooltip=renderDPPointDetails(metric+':2026');
  assert.doesNotMatch(html+tooltip,/\.xlsx|\.csv|\.pdf|Dashboard SY\d|KPIs!|Source:|workbook/i);
  assert.match(html,/Data definitions and limitations/);
  assert.match(html,/verification|confirm/i);
 }
});
