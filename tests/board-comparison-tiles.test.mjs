import test from 'node:test';
import assert from 'node:assert/strict';
import {BOARD_DATA,BOARD_SUBJECTS,boardRows} from '../src/board-map-data.mjs';
import {compareGradeMeans,gapText,gapExplanation,renderMapComparisonTiles} from '../src/board-comparison-tiles.mjs';
import {renderBoard} from '../src/board-map-view.mjs';
import {renderBoardDP} from '../src/board-dp-view.mjs';
import {boardHash,parseBoardHash} from '../src/board-map-links.mjs';

test('Every available MAP window computes genuine unweighted grade-average differences',()=>{
 for(const window of Object.keys(BOARD_DATA)){
  for(const {id} of BOARD_SUBJECTS){
   const rows=boardRows(window,id);
   for(const benchmark of ['us','earcos']){
    const gap=compareGradeMeans(window,id,benchmark);
    const valid=rows.filter(r=>Number.isFinite(r.aisg)&&Number.isFinite(r[benchmark]));
    assert.equal(gap.total,rows.length);
    assert.equal(gap.count,valid.length);
    if(valid.length){
     const exact=valid.reduce((s,r)=>s+(r.aisg-r[benchmark]),0)/valid.length;
     assert.ok(Math.abs(gap.value-exact)<=0.051);
    }else{
     assert.equal(gap.value,null);
     assert.equal(gapText(gap),'—');
    }
   }
  }
 }
});
test('Fall 2026 MAP cards show actual grade-mean differences and honest missing EARCOS',()=>{
 assert.equal(compareGradeMeans('fall2026','math','us').value,22.2);
 assert.equal(compareGradeMeans('fall2026','reading','us').value,6.6);
 assert.equal(compareGradeMeans('fall2026','language','us').value,10.4);
 assert.equal(gapText(compareGradeMeans('fall2026','math','us')),'+22.2 MAP pts');
 for(const {id} of BOARD_SUBJECTS)assert.equal(compareGradeMeans('fall2026',id,'earcos').value,null);
 const html=renderMapComparisonTiles({schoolYear:2026,selectedWindow:'fall2026',selectedSubject:'math'});
 assert.equal((html.match(/class="board-comparison-window"/g)||[]).length,1);
 assert.equal((html.match(/class="board-comparison-subject /g)||[]).length,3);
 assert.equal((html.match(/class="board-comparison-mini unavailable"/g)||[]).length,3);
 assert.match(html,/vs U.S. schools/);
 assert.match(html,/vs regional schools \(EARCOS\)/);
 assert.match(html,/What do these numbers mean/);
 assert.doesNotMatch(html,/Spring 2027|\.xlsx|\.csv|\.pdf|Source:/i);
});
test('Default view shows one window; compare is an explicit, reversible choice',()=>{
 const p={schoolYear:2025,selectedWindow:'spring2026',selectedSubject:'reading'};
 const defaultHtml=renderMapComparisonTiles(p);
 assert.equal((defaultHtml.match(/class="board-comparison-window"/g)||[]).length,1);
 assert.match(defaultHtml,/Spring 2026/);
 assert.doesNotMatch(defaultHtml,/Fall 2025/);
 assert.match(defaultHtml,/Compare Fall &amp; Spring|Compare Fall & Spring/);
 const compare=renderMapComparisonTiles({...p,compareSeasons:true});
 assert.equal((compare.match(/class="board-comparison-window"/g)||[]).length,2);
 assert.equal((compare.match(/class="board-comparison-subject /g)||[]).length,6);
 assert.match(compare,/Fall 2025/);assert.match(compare,/Spring 2026/);
 assert.match(compare,/Show one testing window/);
});
test('Division gaps use the selected grade set and missing regional grades are not zeros',()=>{
 assert.equal(compareGradeMeans('fall2026','math','us','elementary').count,3);
 assert.equal(compareGradeMeans('fall2026','math','us','secondary').count,5);
 const g8=compareGradeMeans('fall2026','math','us','secondary','8');
 assert.equal(g8.count,1);assert.equal(g8.value,28);
 assert.equal(gapExplanation(g8),'Grade 8 average difference');
 const historic=compareGradeMeans('spring2016','math','earcos');
 assert.equal(historic.count,7);assert.equal(historic.total,8);assert.equal(historic.complete,false);
 assert.match(gapExplanation(historic),/7 of 8 comparable/);
});
test('MAP Board starts with one compact filter row, three cards and no grade chart until selected',()=>{
 const state={boardView:'explore',boardWindow:'fall2026',boardSubject:'math',
  boardDivision:'all',boardGrade:'all',boardMapDetailsOpen:false};
 const initial=renderBoard(state);
 assert.match(initial,/board-simple-controls/);
 assert.match(initial,/How does AISG compare\?/);
 assert.equal((initial.match(/class="board-comparison-subject /g)||[]).length,3);
 assert.match(initial,/board-choose-prompt/);
 assert.doesNotMatch(initial,/class="board-stats"/);
 assert.doesNotMatch(initial,/class="board-grade-row"/);
 assert.doesNotMatch(initial,/data-board-subject="math"/);
 const selected=renderBoard({...state,boardMapDetailsOpen:true});
 assert.match(selected,/board-map-drilldown/);
 assert.match(selected,/Grade 10/);
 assert.match(selected,/data-board-select="grade"/);
 assert.match(selected,/View exact grade-level results/);
 assert.match(selected,/Close details/);
});
test('Growth explanation is explicitly different from achievement and projected growth',()=>{
 const html=renderBoard({boardView:'explore',boardWindow:'fall2026',
 boardSubject:'math',boardMapGrowthOpen:true});
 assert.match(html,/95% of returning students grew in at least one MAP area/);
 assert.match(html,/not the percentage reaching projected growth/);
 assert.match(html,/not filtered by division or grade/);
});
test('IB Diploma presents one school-year filter, two cohort outcomes and historical consistency',()=>{
 const html=renderBoardDP({boardDpYear:'2024',boardDpMetric:'average'});
 assert.match(html,/data-board-dp-select="year"/);
 assert.doesNotMatch(html,/data-board-dp-select="range"/);
 assert.equal((html.match(/class="board-dp-graphic-card /g)||[]).length,3);
 assert.match(html,/2023–24/);
 assert.match(html,/92%/);
 assert.match(html,/Consistent results/);
 assert.match(html,/7 \/ 7/);
 assert.match(html,/Explore Grade 12 Diploma pathways/);
 assert.match(html,/data-board-dp-point="average:2024"/);
 assert.match(html,/data-board-dp-metric="passRate"/);
 assert.match(html,/board-dp-point is-selected/);
});
test('Diploma displays unavailable historic pass rates, and always plots full seven-year series',()=>{
 const missing=renderBoardDP({boardDpYear:'2020',boardDpMetric:'passRate'});
 assert.match(missing,/2019–20/);
 assert.match(missing,/No result available for this year/);
 assert.match(missing,/class="board-dp-graphic-value">—/);
 assert.equal((missing.match(/<g class="board-dp-point/g)||[]).length,6);
 const latest=renderBoardDP({boardDpYear:'2026',boardDpMetric:'average',boardDpRange:'recent'});
 assert.equal((latest.match(/<g class="board-dp-point/g)||[]).length,7);
 assert.match(latest,/awaiting final confirmation/);
});
test('Board presentation and optional details are sharable without changing other roles',()=>{
 const opts={boardView:'explore',boardWindow:'fall2026',boardSubject:'math',boardDivision:'all',boardGrade:'all',
  boardMapDetailsOpen:true,boardMapCompareSeasons:true,boardPresentation:true};
 const parsed=parseBoardHash(boardHash(opts));
 assert.equal(parsed.boardMapDetailsOpen,true);
 assert.equal(parsed.boardMapCompareSeasons,true);
 assert.equal(parsed.boardPresentation,true);
 assert.equal(parseBoardHash('#/board?view=explore&grade=8').boardMapDetailsOpen,true);
 assert.equal(parseBoardHash('#/faculty'),null);
 assert.equal(parseBoardHash('#/board').boardPresentation,false);
});
