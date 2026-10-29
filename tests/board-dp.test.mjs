import test from 'node:test';
import assert from 'node:assert/strict';
import {DP_RECORDS,DP_GRADE12_PATHWAYS,DP_METHODS,dpPoint,dpMetricSeries} from '../src/board-dp-data.mjs';
import {renderBoardDP,renderDPPointDetails} from '../src/board-dp-view.mjs';
import {BOARD_DATA,BOARD_US_SCHOOL_NORMS_2025,boardRows,boardSummary} from '../src/board-map-data.mjs';
import {boardHash,parseBoardHash} from '../src/board-map-links.mjs';

test('Historic Diploma figures include official 2024 and 2026 IB school-report counts',()=>{
 assert.deepEqual(DP_RECORDS.map(x=>x.year),[
  '2015–16','2016–17','2017–18','2018–19','2019–20','2020–21','2021–22',
  '2022–23','2023–24','2024–25','2025–26']);
 assert.deepEqual(DP_RECORDS.map(x=>x.average),[33,33,34,32,36,37,36,34,34,34,34]);
 assert.deepEqual(DP_RECORDS.map(x=>x.passRate),[95,98,89,93,93,95,100,91,92,93,93]);
 assert.deepEqual(DP_RECORDS.map(x=>x.candidates??null),[65,60,65,58,59,42,43,55,38,42,56]);
 assert.deepEqual(DP_RECORDS.map(x=>x.passes??null),[62,59,58,54,55,40,43,50,35,39,52]);
 assert.equal(DP_RECORDS.find(x=>x.end===2025).worldAverage,30.58);
 assert.equal(DP_RECORDS.find(x=>x.end===2025).worldPassRate,81.9);
 assert.equal(DP_RECORDS.find(x=>x.end===2024).highDenominator,35);
 assert.equal(DP_RECORDS.find(x=>x.end===2024).candidates,38);
 assert.equal(DP_RECORDS.find(x=>x.end===2026).passes,52);
 assert.equal(DP_RECORDS.find(x=>x.end===2026).worldAverage,30.88);
 assert.equal(DP_RECORDS.find(x=>x.end===2026).candidates,56);
 assert.deepEqual(DP_GRADE12_PATHWAYS.map(x=>[x.full,x.courses,x.aisg]),
 [[38,5,0],[42,9,0],[56,6,1]]);
 assert.match(DP_METHODS.discrepancy,/117/);
 assert.match(DP_METHODS.discrepancy,/56/);
 assert.match(DP_METHODS.current,/52 awards from 56/);
});
test('Eleven-year Diploma chart keeps full scale and supports actual global reference windows',()=>{
 const average=dpMetricSeries('average'),passes=dpMetricSeries('passRate');
 assert.equal(average.length,11);assert.equal(passes.length,11);
 assert.equal(average[0].value,33);
 assert.equal(passes.find(x=>x.end===2020).value,93);
 assert.equal(average.at(-1).worldValue,33);
 assert.equal(passes.at(-1).worldValue,82.6);
 assert.equal(dpPoint(2018,'average').value,34);
 assert.equal(dpPoint(2026,'passRate').value,93);
 const html=renderBoardDP({boardDpMetric:'average',boardDpGlobal:true});
 assert.match(html,/board-dp-graphic-grid/);
 assert.match(html,/IB Diploma Results/);
 assert.match(html,/Long-term Diploma success/);
 assert.match(html,/10 \/ 11/);
 assert.match(html,/data-board-dp-point="average:2016"/);
 assert.match(html,/data-board-dp-point="average:2018"/);
 assert.match(html,/data-board-dp-point="average:2026"/);
 assert.match(html,/board-dp-world-point/);
 assert.match(html,/board-dp-world-hover/);
 assert.match(html,/data-board-dp-global/);
 assert.match(html,/30\.88/);
 assert.match(html,/World recipients \/45/);
 assert.match(html,/data-board-dp-world-point="average:2017"/);
 assert.doesNotMatch(html,/data-board-dp-world-point="average:2016"/);
 assert.match(renderDPPointDetails('average:2019'),/-0\.23 points/);
 assert.match(html,/same award category/);
 assert.doesNotMatch(html,/AISG \+3\.12 points vs world/);
 assert.match(html,/82\.6%/);
 assert.match(html,/data-board-dp-world-point="passRate:2026"|data-board-dp-world-point="average:2026"/);
 assert.match(html,/global IB reference/);
 assert.match(html,/32\.0–37\.0/);
 assert.match(html,/IB School Statistics \(school 001832\)/);
 assert.doesNotMatch(html,/confirmation pending|verification pending|unconfirmed|board-dp-status/i);
 assert.match(html,/Detailed results by graduating year/);
 assert.match(html,/Source context/);
 assert.match(html,/IB school report/);
 const solo=renderBoardDP({boardDpGlobal:false});
 assert.doesNotMatch(solo,/class="board-dp-world-point"/);
 assert.match(solo,/Compare with world/);
 const passHtml=renderBoardDP({boardDpMetric:'passRate'});
 assert.match(passHtml,/data-board-dp-point="passRate:2020"/);
 assert.match(passHtml,/data-board-dp-point="passRate:2026"/);
 assert.match(renderDPPointDetails('passRate:2026'),/93%/);
 assert.match(renderDPPointDetails('average:2025'),/World Diploma recipients · 32\.8/);
 assert.match(renderBoardDP({boardDpYear:'2025'}),/board-dp-graphic-value\">34/);
 assert.match(renderDPPointDetails('passRate:2026'),/82\.6%/);
 assert.match(renderDPPointDetails('average:2025'),/AISG \+1\.20 points/);
 assert.equal(dpPoint(2017,'passRate').row.passes,59);
 assert.equal(DP_RECORDS.find(r=>r.end===2021).highScore,44);
});
test('Board Diploma presents historical AISG vs global outcomes immediately after At a Glance',()=>{
 const html=renderBoardDP({boardDpMetric:'average',boardDpGlobal:true});
 const ids=['board-dp-outcomes','board-dp-history','board-dp-subjects'];
 const offsets=ids.map(id=>html.indexOf('id="'+id+'"'));
 assert.ok(offsets.every(i=>i>=0), 'All Diploma sections remain accessible');
 assert.ok(offsets[0]<offsets[1]&&offsets[1]<offsets[2], 'Overview, then history, then subject results');
 assert.equal((html.match(/id="board-dp-history"/g)||[]).length,1,'History only appears once');
 const nav=['board-dp-outcomes','board-dp-history','board-dp-subjects'].map(id=>html.indexOf('data-board-dp-jump="'+id+'"'));
 assert.ok(nav[0]<nav[1]&&nav[1]<nav[2], 'Navigation matches on-screen order');
 assert.match(html,/World IB · Diploma recipients/);
 assert.match(html,/data-board-dp-world-point="average:2026"/);
 assert.match(html,/board-dp-matched-gaps/);
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
 assert.ok(DP_METHODS.limits.includes('Diploma and retake candidates'));
 assert.ok(DP_METHODS.current.includes('May 2026'));
 assert.ok(DP_METHODS.quality.includes('IB School Statistics'));
});

test('No filenames or underlying cell references are shown in any Diploma result',()=>{
 for(const metric of ['average','passRate']){
  const html=renderBoardDP({boardDpMetric:metric});
  const tooltip=renderDPPointDetails(metric+':2026');
  assert.doesNotMatch(html+tooltip,/\.xlsx|\.csv|\.pdf|Dashboard SY\d|KPIs!|workbook/i);
  assert.match(html,/Understanding Diploma results/);
  assert.doesNotMatch(html,/confirmation pending|verification pending|unconfirmed|board-dp-status/i);
  assert.match(html,/IB School Statistics \(school 001832\)/);
 }
});

test('Diploma year selection remains grounded; legacy range links remain accepted',()=>{
 const row=DP_RECORDS.find(r=>r.end===2025);
 assert.equal(row.average,34);
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
