import test from 'node:test';
import assert from 'node:assert/strict';
import {historicalTrend,renderBoardOverview} from '../src/board-map-overview.mjs';
import {parseBoardHash,boardHash,boardShareUrl} from '../src/board-map-links.mjs';
import {BOARD_DATA,BOARD_GRADE_LIST,boardSummary,boardRows} from '../src/board-map-data.mjs';

test('Fall history includes every year while preserving no EARCOS Fall 2026 gap',()=>{
 const arr=historicalTrend('fall');
 assert.equal(arr.length,13);
 assert.deepEqual(arr.map(x=>x.year),Array.from({length:13},(_,i)=>2014+i));
 assert.equal(arr[0].math,7);assert.equal(arr[0].reading,4);
 assert.equal(arr.at(-2).math,7);assert.equal(arr.at(-2).reading,3);
 assert.equal(arr.at(-1).math,null);assert.equal(arr.at(-1).reading,null);
 assert.equal(arr.filter(x=>Number.isInteger(x.math)).length,12);
});

test('Spring trend omits unreported 2020 and incomplete historical Math, preserves Spring 2026',()=>{
 const arr=historicalTrend('spring');
 assert.equal(arr.length,12);
 const unavailable=arr.find(x=>x.year===2020);
 assert.equal(unavailable.math,null);assert.equal(unavailable.reading,null);
 const corrupt=arr.find(x=>x.year===2016);
 assert.equal(corrupt.math,null,'Spring 2016 G8 EARCOS value is corrupted; no 6/7 as 6/8');
 const current=arr.at(-1);
 assert.deepEqual({year:current.year,math:current.math,reading:current.reading},{year:2026,math:6,reading:3});
});

test('Board Overview HTML contains actionable comparative chart and the underlying numbers',()=>{
 const html=renderBoardOverview({boardTrendTerm:'fall',boardTrendFocus:'both'});
 assert.match(html,/board-overview-cards/);
 assert.equal((html.match(/data-board-go=/g)||[]).length,3);
 assert.match(html,/24 \/ 24/);
 assert.match(html,/71% · 62%/);
 assert.match(html,/6 \/ 8 · 3 \/ 8/);
 assert.match(html,/board-trend-svg/);
 assert.match(html,/Mathematics, 2014: 7 of 8/);
 assert.match(html,/Reading, 2014: 4 of 8/);
 assert.match(html,/Grade averages/mi);
 assert.match(html,/data-board-view="explore"/);
 assert.match(html,/View the annual values/);
 assert.match(html,/not individual student growth/);
});

test('Spring and focused chart do not falsely render absent years or extra series',()=>{
 const spring=renderBoardOverview({boardTrendTerm:'spring',boardTrendFocus:'math'});
 assert.match(spring,/Latest regional comparison/);
 assert.match(spring,/data-board-focus="reading"/);
 assert.match(spring,/data-board-series="math"/);
 assert.doesNotMatch(spring,/data-board-series="reading"/);
 assert.match(spring,/Spring 2020/);
 assert.match(spring,/Mathematics, 2026: 6 of 8/);
 assert.match(spring,/— means that this window lacks a complete set/);
});

test('Shareable overview URL encodes only the relevant Board presentation controls',()=>{
 const state={boardView:'overview',boardTrendTerm:'spring',boardTrendFocus:'reading',
  boardWindow:'fall2025',boardSubject:'math',boardDivision:'all',boardGrade:'all'};
 const hash=boardHash(state);
 assert.equal(hash,'#/board?view=overview&term=spring&focus=reading');
 const parsed=parseBoardHash(hash);
 assert.equal(parsed.boardView,'overview');
 assert.equal(parsed.boardTrendTerm,'spring');
 assert.equal(parsed.boardTrendFocus,'reading');
 assert.equal(parsed.boardWindow,'fall2026');
 const url=boardShareUrl({origin:'https://edtechevans.github.io',pathname:'/mylearners/',search:''},state);
 assert.equal(url,'https://edtechevans.github.io/mylearners/'+hash);
});

test('Shareable grade-specific Board URLs restore subject, window, division and grade',()=>{
 const state={boardView:'explore',boardWindow:'spring2026',boardSubject:'reading',
  boardDivision:'secondary',boardGrade:'8'};
 const hash=boardHash(state);
 assert.equal(hash,'#/board?view=explore&window=spring2026&subject=reading&division=secondary&grade=8');
 const parsed=parseBoardHash(hash);
 assert.equal(parsed.boardWindow,'spring2026');
 assert.equal(parsed.boardSubject,'reading');
 assert.equal(parsed.boardDivision,'secondary');
 assert.equal(parsed.boardGrade,'8');
 assert.equal(parsed.boardView,'explore');
 assert.equal(parseBoardHash('#/faculty'),null);
 assert.equal(parseBoardHash('#/board').boardView,'overview');
});

test('Malformed links are validated; invalid grade cannot cross divisions',()=>{
 const params=parseBoardHash('#/board?view=explore&subject=banana&window=bad&division=elementary&grade=10');
 assert.equal(params.boardSubject,'math');
 assert.equal(params.boardWindow,'fall2026');
 assert.equal(params.boardDivision,'elementary');
 assert.equal(params.boardGrade,'all');
 const huge=parseBoardHash('#/board?view=unavailable&term=other&focus=language');
 assert.equal(huge.boardView,'overview');
 assert.equal(huge.boardTrendTerm,'fall');
 assert.equal(huge.boardTrendFocus,'both');
});

test('Current reported Board facts remain attributable to existing aggregate sources',()=>{
 const latest=BOARD_DATA.fall2026;
 assert.equal(latest.schoolwide.aboveUSComparisons,24);
 assert.equal(latest.schoolwide.returningGrowthInOneOrMoreAreasPct,95);
 assert.equal(boardSummary('spring2026','math').aboveEarcos,6);
 assert.equal(boardSummary('spring2026','reading').aboveEarcos,3);
 assert.equal(boardSummary('spring2026','math').growthPct,71);
 assert.equal(boardSummary('spring2026','reading').growthPct,62);
 assert.deepEqual(BOARD_GRADE_LIST,[3,4,5,6,7,8,9,10]);
});
