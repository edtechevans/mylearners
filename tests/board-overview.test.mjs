import test from 'node:test';
import assert from 'node:assert/strict';
import {historicalTrend,gradeBreakdown,renderBoardOverview,renderTrendPointDetails} from '../src/board-map-overview.mjs';
import {parseBoardHash,boardHash,boardShareUrl} from '../src/board-map-links.mjs';
import {BOARD_DATA,BOARD_GRADE_LIST,boardSummary,boardRows} from '../src/board-map-data.mjs';

test('Fall historical trend includes 3 subjects and leaves missing 2026 EARCOS blank',()=>{
 const trend=historicalTrend('fall');
 assert.equal(trend.length,13);
 assert.deepEqual(trend.map(r=>r.year),Array.from({length:13},(_,i)=>2014+i));
 assert.equal(trend[0].math,7);assert.equal(trend[0].reading,4);
 assert.ok(Number.isInteger(trend[0].language));
 assert.equal(trend.at(-2).math,7);assert.equal(trend.at(-2).reading,3);
 assert.deepEqual([trend.at(-1).math,trend.at(-1).reading,trend.at(-1).language],[null,null,null]);
 assert.equal(trend.filter(r=>Number.isInteger(r.language)).length,12);
});

test('Spring historical trend preserves missing 2020 and incomplete 2016 Math, adds 2026 Language',()=>{
 const trend=historicalTrend('spring');
 assert.equal(trend.length,12);
 const missing=trend.find(r=>r.year===2020);
 assert.equal(missing.math,null);assert.equal(missing.reading,null);assert.equal(missing.language,null);
 assert.equal(trend.find(r=>r.year===2016).math,null,'2016 Grade 8 EARCOS is invalid');
 const last=trend.at(-1);
 assert.deepEqual([last.year,last.math,last.reading,last.language],[2026,6,3,3]);
});

test('Hover breakdown identifies exact included grade averages rather than student percentages',()=>{
 const x=gradeBreakdown('fall',2025,'math');
 assert.equal(x.compared,8);assert.equal(x.complete,true);
 assert.deepEqual(x.above,[3,4,5,6,7,9,10]);
 assert.deepEqual(x.notAbove,[8]);
 assert.deepEqual(x.missing,[]);
 assert.equal(x.grades.find(r=>r.grade===8).difference,-1);
 const panel=renderTrendPointDetails('fall:2025:math');
 assert.match(panel,/GRADES INCLUDED IN THIS POINT/);
 assert.match(panel,/7 \/ 8/);
 assert.match(panel,/G8/);
 assert.match(panel,/Not above/);
 assert.equal((panel.match(/class="board-trend-grade /g)||[]).length,8);
 assert.equal(gradeBreakdown('fall',2026,'math').compared,0);
 assert.match(renderTrendPointDetails('fall:2026:math'),/No complete EARCOS/);
});

test('Overview includes Language Usage on every headline card, the historic chart and annual table',()=>{
 const html=renderBoardOverview({boardTrendTerm:'fall',boardTrendFocus:'all'});
 assert.match(html,/board-overview-cards/);
 assert.equal((html.match(/data-board-go=/g)||[]).length,3);
 assert.equal((html.match(/class="board-overview-three-metrics"/g)||[]).length,3);
 assert.match(html,/24 \/ 24/);
 assert.match(html,/71%/);assert.match(html,/62%/);
 assert.match(html,/Language Usage/);
 assert.match(html,/data-board-series="math"/);
 assert.match(html,/data-board-series="reading"/);
 assert.match(html,/data-board-series="language"/);
 assert.match(html,/data-board-point="fall:2025:math"/);
 assert.match(html,/data-board-point="fall:2025:language"/);
 assert.match(html,/hover, tap or keyboard-focus/i);
 assert.match(html,/board-trend-inspector/);
 assert.match(html,/View the annual values/);
 assert.match(html,/not individual student growth/);
 assert.match(html,/data-board-view="explore"/);
});

test('Focused Language Usage renders exactly one interactive trend and visible point values',()=>{
 const html=renderBoardOverview({boardTrendTerm:'spring',boardTrendFocus:'language'});
 assert.match(html,/data-board-focus="language"/);
 assert.match(html,/data-board-series="language"/);
 assert.doesNotMatch(html,/data-board-series="reading"/);
 assert.doesNotMatch(html,/data-board-series="math"/);
 assert.match(html,/Language Usage, Spring 2026: 3 of 8/);
 assert.match(html,/Spring 2020/);
 assert.match(html,/class="board-trend-value"/);
 assert.match(html,/role="button"/);
 assert.match(html,/tabindex="0"/);
});

test('Shareable Overview links can focus all three subjects, with legacy compatibility',()=>{
 const state={boardView:'overview',boardTrendTerm:'spring',boardTrendFocus:'language',
  boardWindow:'fall2025',boardSubject:'math',boardDivision:'all',boardGrade:'all'};
 const hash=boardHash(state);
 assert.equal(hash,'#/board?view=overview&term=spring&focus=language');
 const parsed=parseBoardHash(hash);
 assert.equal(parsed.boardView,'overview');assert.equal(parsed.boardTrendTerm,'spring');
 assert.equal(parsed.boardTrendFocus,'language');assert.equal(parsed.boardWindow,'fall2026');
 const url=boardShareUrl({origin:'https://edtechevans.github.io',pathname:'/mylearners/',search:''},state);
 assert.equal(url,'https://edtechevans.github.io/mylearners/'+hash);
 assert.equal(parseBoardHash('#/board?focus=both').boardTrendFocus,'all');
});

test('Shareable grade-specific Explorer URL restores the latest Fall 2026 US comparison',()=>{
 const state={boardView:'explore',boardWindow:'fall2026',boardSubject:'language',
  boardDivision:'secondary',boardGrade:'8'};
 const hash=boardHash(state);
 const parsed=parseBoardHash(hash);
 assert.equal(parsed.boardWindow,'fall2026');assert.equal(parsed.boardSubject,'language');
 assert.equal(parsed.boardDivision,'secondary');assert.equal(parsed.boardGrade,'8');
 assert.equal(parsed.boardView,'explore');
 assert.equal(parseBoardHash('#/faculty'),null);
 assert.equal(parseBoardHash('#/board').boardView,'overview');
 const g8=boardRows('fall2026','language','secondary','8')[0];
 assert.equal(g8.aisg,225.8);assert.equal(g8.us,213);
});

test('Malformed Board share parameters are validated',()=>{
 const bad=parseBoardHash('#/board?view=explore&subject=banana&window=bad&division=elementary&grade=10');
 assert.equal(bad.boardSubject,'math');assert.equal(bad.boardWindow,'fall2026');
 assert.equal(bad.boardDivision,'elementary');assert.equal(bad.boardGrade,'all');
 const unavailable=parseBoardHash('#/board?view=missing&term=unknown&focus=science');
 assert.equal(unavailable.boardView,'overview');assert.equal(unavailable.boardTrendTerm,'fall');
 assert.equal(unavailable.boardTrendFocus,'all');
});

test('Current Board facts remain aggregate, correctly windowed and privacy-safe',()=>{
 assert.equal(BOARD_DATA.fall2026.schoolwide.aboveUSComparisons,24);
 assert.equal(BOARD_DATA.fall2026.schoolwide.returningGrowthInOneOrMoreAreasPct,95);
 assert.equal(boardSummary('fall2026','math').aboveUS,8);
 assert.ok(boardSummary('fall2026','math').gapUS>0);
 assert.equal(boardSummary('fall2026','reading').earcosAvailable,0);
 assert.equal(boardSummary('spring2026','math').aboveEarcos,6);
 assert.equal(boardSummary('spring2026','reading').aboveEarcos,3);
 assert.equal(boardSummary('spring2026','language').aboveEarcos,3);
 assert.equal(boardSummary('spring2026','math').growthPct,71);
 assert.equal(boardSummary('spring2026','reading').growthPct,62);
 assert.equal(boardSummary('spring2026','language').growthPct,null);
 assert.deepEqual(BOARD_GRADE_LIST,[3,4,5,6,7,8,9,10]);
});
