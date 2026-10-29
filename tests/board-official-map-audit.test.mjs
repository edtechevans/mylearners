import test from 'node:test';
import assert from 'node:assert/strict';
import {BOARD_DATA,BOARD_US_SCHOOL_NORMS_2025,boardSummary} from '../src/board-map-data.mjs';
// Independent, source-level cross-check:
// "MAP Data Fall 2025.pdf", pp. 4, 8, 12 (AISG school grade means & EARCOS means).
// NWEA 2025 norms quick reference, p. 3: U.S. school mean norms (Fall & Spring).
const SOURCE={
 math:{aisg:[200.7,216.9,222.3,231.3,240.6,245.5,255.1,260.1],
       earcos:[199.7,213.1,221.5,229.1,238.8,246.5,250.9,257.6]},
 reading:{aisg:[189.5,202,208.9,212.2,222.4,223.3,227.9,232],
          earcos:[193.4,203.1,209.6,215.1,220.2,224.8,226.6,228.9]},
 language:{aisg:[194.7,206.1,213.4,215,221,224.2,232.1,235.4],
          earcos:[196.9,205.9,211.4,217,221.4,225.7,227.9,230]}
};
const NWEA={
 fall:{math:[184,196,206,210,217,220,224,225],
  reading:[184,195,203,208,212,215,216,217],
  language:[184,194,202,206,209,213,215,216]},
 spring:{math:[199,209,215,219,223,227,228,229],
  reading:[193,201,207,211,214,217,217,217],
  language:[193,200,207,209,212,215,216,217]}
};
test('All 24 Fall 2025 school grade means and regional EARCOS benchmarks match the school PDF',()=>{
 for(const [subject,source] of Object.entries(SOURCE)){
  const rows=BOARD_DATA.fall2025.subjects[subject];
  assert.deepEqual(rows.map(x=>x.aisg),source.aisg,subject+' school');
  assert.deepEqual(rows.map(x=>x.earcos),source.earcos,subject+' EARCOS');
  assert.equal(rows.length,8);
 }
});
test('All 96 applicable U.S. school mean benchmarks match official NWEA 2025 norms',()=>{
 assert.deepEqual(BOARD_US_SCHOOL_NORMS_2025,NWEA);
 for(const window of ['fall2025','fall2026','spring2026']){
  const term=window.startsWith('spring')?'spring':'fall';
  for(const [subject,norms] of Object.entries(NWEA[term])){
   assert.deepEqual(BOARD_DATA[window].subjects[subject].map(x=>x.us),norms,window+subject);
  }
 }
});
test('Fall 2026 24-of-24 comparison is arithmetically consistent but raw source requires separate audit',()=>{
 let counted=0;
 for(const subject of ['math','reading','language']){
  const rows=BOARD_DATA.fall2026.subjects[subject];
  assert.equal(rows.length,8);
  assert.ok(rows.every(x=>Number.isInteger(x.n)&&x.n>0));
  counted+=rows.filter(x=>x.aisg>x.us).length;
  assert.equal(boardSummary('fall2026',subject).aboveUS,8);
 }
 assert.equal(counted,24);
 assert.deepEqual(BOARD_DATA.fall2026.schoolwide.aboveUSComparisons,24);
 // Returning-student growth cannot be rederived without student-level source export.
 assert.equal(BOARD_DATA.fall2026.schoolwide.returningGrowthInOneOrMoreAreasPct,95);
});
