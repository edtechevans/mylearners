import test from 'node:test';
import assert from 'node:assert/strict';
import {BOARD_DATA,BOARD_SCHOOL_YEARS,BOARD_SUBJECTS,BOARD_GRADE_LIST,boardRows,boardSummary} from '../src/board-map-data.mjs';
import {compareGradeMeans,gapText,gapExplanation,renderMapComparisonTiles} from '../src/board-comparison-tiles.mjs';
import {DP_RECORDS,DP_GRADE12_PATHWAYS} from '../src/board-dp-data.mjs';
import {renderBoardDP} from '../src/board-dp-view.mjs';
import {boardHash,parseBoardHash} from '../src/board-map-links.mjs';

test('Every real MAP test window supports exact data-driven gap tiles for three subjects',()=>{
 for(const [window,source] of Object.entries(BOARD_DATA)){
  for(const {id} of BOARD_SUBJECTS){
   const rows=boardRows(window,id);
   for(const benchmark of ['us','earcos']){
    const gap=compareGradeMeans(window,id,benchmark);
    assert.equal(gap.total,rows.length,window+'/'+id+'/'+benchmark);
    const valid=rows.filter(r=>Number.isFinite(r.aisg)&&Number.isFinite(r[benchmark]));
    assert.equal(gap.count,valid.length);
    if(valid.length){
     const mean=valid.reduce((n,r)=>n+(r.aisg-r[benchmark]),0)/valid.length;
     assert.ok(Math.abs(gap.value-mean)<=.051,'correct unweighted mean for '+window+'/'+id+'/'+benchmark);
    }else{
     assert.equal(gap.value,null,'Missing benchmarks must not become zero');
     assert.equal(gapText(gap),'—');
    }
   }
  }
 }
 assert.ok(Object.keys(BOARD_DATA).length>=24);
});
test('Fall 2026 actual U.S. tile differences are calculated from AISG and norms, not concept art',()=>{
 assert.equal(compareGradeMeans('fall2026','math','us').value,22.2);
 assert.equal(compareGradeMeans('fall2026','reading','us').value,6.6);
 assert.equal(compareGradeMeans('fall2026','language','us').value,10.4);
 for(const {id} of BOARD_SUBJECTS)assert.equal(compareGradeMeans('fall2026',id,'earcos').value,null);
 assert.equal(gapText(compareGradeMeans('fall2026','math','us')),'+22.2 RIT');
});
test('MAP tiles show both Fall and Spring of selected academic year, without invented windows',()=>{
 const html=renderMapComparisonTiles({schoolYear:2025,selectedWindow:'spring2026',selectedSubject:'reading'});
 assert.equal((html.match(/class="board-comparison-window"/g)||[]).length,2);
 assert.equal((html.match(/class="board-comparison-subject /g)||[]).length,6);
 assert.match(html,/Fall 2025/);assert.match(html,/Spring 2026/);
 assert.match(html,/data-board-tile-window="fall2025"/);
 assert.match(html,/data-board-tile-window="spring2026"/);
 assert.match(html,/board-comparison-reading is-selected/);
 assert.match(html,/data-board-tile-subject="language"/);
 assert.match(html,/Avg grade gap vs EARCOS/);
 assert.doesNotMatch(html,/\.csv|\.xlsx|\.pdf|Dashboard SY\d|KPIs!|Source:/i);
 const latest=renderMapComparisonTiles({schoolYear:2026,selectedWindow:'fall2026',selectedSubject:'math'});
 assert.equal((latest.match(/class="board-comparison-window"/g)||[]).length,1);
 assert.match(latest,/Fall 2026/);
 assert.doesNotMatch(latest,/Spring 2027/);
 assert.equal((latest.match(/class="board-comparison-mini unavailable"/g)||[]).length,3);
 assert.match(latest,/Comparison not available for this window/);
});
test('Division and single-grade filters recalculate every tile with correct coverage',()=>{
 const es=compareGradeMeans('fall2026','math','us','elementary','all');
 const sec=compareGradeMeans('fall2026','math','us','secondary','all');
 assert.equal(es.count,3);assert.equal(sec.count,5);
 const g8=compareGradeMeans('fall2026','math','us','secondary','8');
 assert.equal(g8.value,28);
 assert.equal(g8.count,1);assert.equal(g8.total,1);
 assert.equal(gapExplanation(g8,'8'),'Grade 8 mean difference');
 const h=renderMapComparisonTiles({schoolYear:2026,selectedWindow:'fall2026',selectedSubject:'reading',division:'secondary',grade:'8'});
 assert.match(h,/Grade 8 mean difference/);assert.match(h,/Grade 8/);
 assert.match(h,/data-board-tile-subject="math"/);
});
test('Missing or corrupted regional grade averages are omitted and partial coverage is explicit',()=>{
 const gap=compareGradeMeans('spring2016','math','earcos');
 assert.equal(gap.total,8);
 assert.equal(gap.count,7);
 assert.equal(gap.complete,false);
 assert.match(gapExplanation(gap),/partial \(7 of 8\)/);
 assert.equal(compareGradeMeans('fall2026','math','earcos').count,0);
 assert.equal(compareGradeMeans('badwindow','math','us'),null);
});
test('Diploma comparison cards and filters reflect selected year, not always latest',()=>{
 const html=renderBoardDP({boardDpYear:'2024',boardDpMetric:'average',boardDpRange:'all'});
 assert.match(html,/board-dp-graphic-grid/);
 assert.equal((html.match(/class="board-dp-graphic-card /g)||[]).length,3);
 assert.match(html,/data-board-dp-select="year"/);
 assert.match(html,/data-board-dp-select="range"/);
 assert.match(html,/data-board-dp-metric="passRate"/);
 assert.match(html,/2023–24/);assert.match(html,/92%/);
 assert.match(html,/Grade 12 full DP pathway/);
 assert.match(html,/38/);
 assert.match(html,/data-board-dp-point="average:2024"/);
 assert.match(html,/board-dp-point is-selected/);
 assert.doesNotMatch(html,/\.xlsx|\.csv|\.pdf|Dashboard SY\d|KPIs!|Source:/i);
});
test('Diploma missing pathway and pass rate are unavailable, never fabricated',()=>{
 const early=renderBoardDP({boardDpYear:'2020',boardDpMetric:'passRate'});
 assert.match(early,/2019–20/);
 assert.match(early,/Rate not available for this graduating year/);
 assert.match(early,/Grade 12 pathway counts not available/);
 assert.match(early,/class="board-dp-graphic-value">—/);
 assert.doesNotMatch(early,/data-board-dp-point="passRate:2020"/);
});
test('Diploma range filter limits chart years, and year-filtered sharing restores state',()=>{
 const short=renderBoardDP({boardDpYear:'2026',boardDpMetric:'average',boardDpRange:'recent'});
 assert.equal((short.match(/<g class="board-dp-point/g)||[]).length,3);
 assert.match(short,/Latest 3 years/);
 assert.doesNotMatch(short,/data-board-dp-point="average:2021"/);
 const full=renderBoardDP({boardDpYear:'2026',boardDpMetric:'average',boardDpRange:'all'});
 assert.equal((full.match(/<g class="board-dp-point/g)||[]).length,7);
 const link=boardHash({boardView:'dp',boardDpMetric:'passRate',boardDpYear:'2024',boardDpRange:'recent'});
 assert.equal(link,'#/board?view=dp&metric=passRate&year=2024&range=recent');
 const parsed=parseBoardHash(link);
 assert.equal(parsed.boardDpYear,'2024');
 assert.equal(parsed.boardDpRange,'recent');
 assert.equal(parsed.boardDpMetric,'passRate');
 assert.equal(parseBoardHash('#/board?view=dp&year=5000').boardDpYear,'2026');
});
