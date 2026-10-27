import test from 'node:test';
import assert from 'node:assert/strict';
import {BOARD_DATA,BOARD_WINDOWS,BOARD_METHODS,boardRows,boardSummary} from '../src/board-map-data.mjs';

test('Board view uses eight verified grade aggregates per subject/window',()=>{
 for(const window of ['fall2025','spring2026']){
  for(const subject of ['math','reading']){
   const rows=boardRows(window,subject);
   assert.deepEqual(rows.map(x=>x.grade),[3,4,5,6,7,8,9,10]);
   assert.ok(rows.every(x=>Number.isFinite(x.aisg)&&Number.isFinite(x.us)&&x.aisg>x.us));
  }
 }
 assert.deepEqual(BOARD_WINDOWS.map(x=>x.id),['fall2025','spring2026']);
});
test('Fall 2025 comparison preserves actual EARCOS result rather than an inflated claim',()=>{
 const m=boardSummary('fall2025','math'),r=boardSummary('fall2025','reading');
 assert.equal(m.aboveUS,8);assert.equal(m.aboveEarcos,7);
 assert.equal(r.aboveUS,8);assert.equal(r.aboveEarcos,3);
 const g8=boardRows('fall2025','math','secondary',8)[0];
 assert.equal(g8.aisg,245.5);assert.equal(g8.earcos,246.5);
 assert.equal(g8.aboveEarcosPct,46);
});
test('Spring 2026 has comparable US norm, but never invents an EARCOS Spring benchmark',()=>{
 const m=boardSummary('spring2026','math'),r=boardSummary('spring2026','reading');
 assert.equal(m.hasEarcos,false);assert.equal(r.hasEarcos,false);
 assert.equal(m.aboveEarcos,null);assert.equal(r.gapEarcos,null);
 assert.equal(m.aboveUS,8);assert.equal(r.aboveUS,8);
 assert.equal(m.tested,628);assert.equal(r.tested,621);
 assert.equal(m.growthMet,311);assert.equal(m.growthEligible,438);assert.equal(m.growthPct,71);
 assert.equal(r.growthMet,265);assert.equal(r.growthEligible,428);assert.equal(r.growthPct,62);
 assert.ok(boardRows('spring2026','reading').every(row=>row.earcos===null));
});
test('Division, grade, individual cohorts and missing prior-year growth are filtered correctly',()=>{
 assert.equal(boardRows('fall2025','math','elementary').length,3);
 assert.equal(boardRows('spring2026','reading','secondary').length,5);
 assert.equal(boardRows('fall2025','math','secondary',5).length,0);
 assert.deepEqual(boardRows('fall2025','reading','all','10').map(x=>x.grade),[10]);
 const g3=boardSummary('spring2026','math','elementary','3');
 assert.equal(g3.growthEligible,0);assert.equal(g3.growthPct,null);
 const g8=boardSummary('fall2025','math','secondary','8');
 assert.equal(g8.aboveEarcos,0);assert.equal(g8.gradeCount,1);
});
test('Only aggregated school data is committed and interpretation is documented',()=>{
 const content=JSON.stringify(BOARD_DATA);
 assert.ok(!/StudentID|dateOfBirth|StudentFirstName|StudentLastName|@aisgz|DEMO-\d/.test(content));
 assert.ok(BOARD_METHODS.caution.includes('individual'));
 assert.ok(BOARD_METHODS.growth.includes('Grade 3'));
});
