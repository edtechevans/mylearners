import test from 'node:test';
import assert from 'node:assert/strict';
import {BOARD_DATA,BOARD_WINDOWS,BOARD_SCHOOL_YEARS,BOARD_SUBJECTS,BOARD_GRADE_LIST,
 BOARD_METHODS,boardWindowFor,boardRows,boardSummary} from '../src/board-map-data.mjs';

test('24 valid historical testing windows and 13 academic years',()=>{
 assert.equal(Object.keys(BOARD_DATA).length,24);
 assert.equal(BOARD_WINDOWS.length,24);
 assert.equal(BOARD_SCHOOL_YEARS.length,13);
 assert.deepEqual(BOARD_SUBJECTS.map(s=>s.id),['math','reading','language']);
 for(const [window,item] of Object.entries(BOARD_DATA)){
  for(const subject of ['math','reading','language']){
   assert.deepEqual(item.subjects[subject].map(r=>r.grade),BOARD_GRADE_LIST,window+' '+subject);
  }
 }
 assert.equal(boardWindowFor(2014,'fall'),'fall2014');
 assert.equal(boardWindowFor(2014,'spring'),'spring2015');
 assert.equal(boardWindowFor(2025,'spring'),'spring2026');
 assert.equal(boardWindowFor(2026,'fall'),'fall2026');
 assert.equal(boardWindowFor(2026,'spring'),null);
 assert.equal(boardWindowFor(2019,'spring'),null,'Spring 2020 not in archive');
});

test('Fall 2025 Mathematics, Reading and Language Usage are preserved',()=>{
 const m=boardSummary('fall2025','math'),r=boardSummary('fall2025','reading'),l=boardSummary('fall2025','language');
 assert.equal(m.aboveUS,8);assert.equal(m.aboveEarcos,7);assert.equal(m.earcosAvailable,8);
 assert.equal(r.aboveUS,8);assert.equal(r.aboveEarcos,3);
 assert.equal(l.aboveUS,8);assert.equal(l.aboveEarcos,4);
 const g8=boardRows('fall2025','math','secondary',8)[0];
 assert.equal(g8.aisg,245.5);assert.equal(g8.earcos,246.5);
 assert.equal(g8.aboveEarcosPct,46);
});

test('Spring 2026 EARCOS matches supplied screenshot exactly for all three subjects',()=>{
 const expected={
  math:[213.47,225.55,233.12,237.70,247.00,253.32,256.20,260.55],
  reading:[201.60,209.29,216.21,219.60,223.99,227.78,227.15,229.17],
  language:[205.20,211.80,217.72,221.32,225.53,229.07,228.73,231.98]
 };
 for(const [subject,reference] of Object.entries(expected)){
  const rows=boardRows('spring2026',subject);
  assert.deepEqual(rows.map(r=>r.earcos),reference,subject);
  assert.equal(boardSummary('spring2026',subject).earcosAvailable,8);
 }
 assert.equal(boardSummary('spring2026','math').aboveEarcos,6);
 assert.equal(boardSummary('spring2026','reading').aboveEarcos,3);
 assert.equal(boardSummary('spring2026','language').aboveEarcos,3);
 assert.equal(boardSummary('spring2026','math').aboveUS,8);
 assert.equal(boardSummary('spring2026','reading').aboveUS,8);
 assert.equal(boardSummary('spring2026','language').aboveUS,8);
 const g8m=boardRows('spring2026','math','secondary',8)[0];
 assert.equal(g8m.aisg,252.7);assert.equal(g8m.earcos,253.32);
});

test('Spring 2026 growth figures stay linked to the eligible matched subjects only',()=>{
 const m=boardSummary('spring2026','math'),r=boardSummary('spring2026','reading'),l=boardSummary('spring2026','language');
 assert.equal(m.tested,628);assert.equal(r.tested,621);
 assert.equal(m.growthMet,311);assert.equal(m.growthEligible,438);assert.equal(m.growthPct,71);
 assert.equal(r.growthMet,265);assert.equal(r.growthEligible,428);assert.equal(r.growthPct,62);
 assert.equal(l.growthMet,null);assert.equal(l.growthEligible,null);assert.equal(l.growthPct,null);
 assert.equal(boardSummary('spring2026','math','elementary',3).growthPct,null);
});

test('Fall 2026 AISG grade averages use verified NWEA 2025 Fall US SCHOOL norms',()=>{
 const expected={
  math:[184,196,206,210,217,220,224,225],
  reading:[184,195,203,208,212,215,216,217],
  language:[184,194,202,206,209,213,215,216]
 };
 const totals={math:615,reading:586,language:617};
 const gradeThreeMeans={math:200.7,reading:187.4,language:192.6};
 const gradeTenMeans={math:254.5,reading:226.8,language:229.7};
 for(const subject of ['math','reading','language']){
  const x=boardSummary('fall2026',subject),rows=boardRows('fall2026',subject);
  assert.deepEqual(rows.map(r=>r.us),expected[subject]);
  assert.equal(rows[0].aisg,gradeThreeMeans[subject]);
  assert.equal(rows.at(-1).aisg,gradeTenMeans[subject]);
  assert.equal(rows.reduce((total,r)=>total+r.n,0),totals[subject]);
  assert.ok(rows.every(r=>r.n>=60&&r.aisg>r.us&&r.earcos===null));
  assert.equal(x.gradeCount,8);assert.equal(x.aboveUS,8);assert.equal(x.usAvailable,8);
  assert.equal(x.hasEarcos,false);assert.equal(x.earcosAvailable,0);
  assert.equal(x.aboveEarcos,null);assert.equal(x.gapEarcos,null);
  assert.ok(x.gapUS>0,'Real AISG vs US numerical RIT gap should be calculable');
  assert.equal(x.growthPct,null);assert.equal(x.tested,null);
 }
 assert.equal(BOARD_DATA.fall2026.schoolwide.aboveUSComparisons,24);
 assert.equal(BOARD_DATA.fall2026.schoolwide.returningGrowthInOneOrMoreAreasPct,95);
 assert.ok(BOARD_METHODS.fall2026.includes('NWEA 2025 Fall SCHOOL achievement norms'));
 assert.ok(BOARD_METHODS.fall2026.includes('student-level data remain private')||
   BOARD_METHODS.fall2026.includes('Student-level data remain private'));
});

test('Partial historical EARCOS data are missing, never mistakenly zero',()=>{
 const row=boardRows('spring2016','math','secondary',8)[0];
 assert.equal(row.earcos,null,'Outlier source value 21 discarded');
 assert.equal(row.aisg,258);
 const all=boardSummary('spring2016','math');
 assert.equal(all.earcosAvailable,7);assert.equal(all.gapEarcos,null);
 assert.equal(all.aboveEarcos,6);
 const g8=boardSummary('spring2016','math','secondary',8);
 assert.equal(g8.aboveEarcos,null);assert.equal(g8.gapEarcos,null);
});

test('Grade and division filters always return the correct eight-grade universe',()=>{
 for(const w of ['fall2014','spring2019','spring2016','spring2026','fall2026']){
  for(const s of ['math','reading','language']){
   assert.equal(boardRows(w,s,'elementary').length,3);
   assert.equal(boardRows(w,s,'secondary').length,5);
   assert.equal(boardRows(w,s,'secondary','4').length,0);
   assert.deepEqual(boardRows(w,s,'all','10').map(r=>r.grade),[10]);
  }
 }
});

test('Historical rows contain only school-level aggregates and source notes',()=>{
 const text=JSON.stringify(BOARD_DATA);
 assert.ok(!/StudentID|dateOfBirth|StudentFirstName|StudentLastName|@aisgz|DEMO-\d/.test(text));
 assert.ok(BOARD_METHODS.caution.includes('individual'));
 assert.ok(BOARD_METHODS.history.includes('norm editions'));
});
