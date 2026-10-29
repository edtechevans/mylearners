import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderBoard} from '../src/board-map-view.mjs';
import {boardHash,parseBoardHash} from '../src/board-map-links.mjs';
const base={boardWindow:'fall2026',boardSubject:'math',boardDivision:'all',boardGrade:'all',boardDpMetric:'average'};
test('Board overview, MAP, and IB Diploma have no presentation or copy controls',()=>{
 for(const view of ['overview','explore','dp']){
  const html=renderBoard({...base,boardView:view});
  assert.match(html,/data-board-view="overview"/);
  assert.match(html,/data-board-view="explore"/);
  assert.match(html,/data-board-view="dp"/);
  assert.doesNotMatch(html,/data-board-presentation|data-board-share|board-copy-link|board-share-feedback|Presentation view|Copy link|Exit presentation/i,view);
 }
});
test('Legacy presentation deep links no longer activate a presentation mode',()=>{
 assert.equal(Object.hasOwn(parseBoardHash('#/board?present=1'),'boardPresentation'),false);
 assert.doesNotMatch(boardHash({...base,boardPresentation:true}),/present=1/);
});
test('Unused presentation and clipboard handlers are removed; printing remains',()=>{
 const app=readFileSync(new URL('../src/student-experience-app.mjs',import.meta.url),'utf8');
 const daily=readFileSync(new URL('../src/daily-ux.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(app,/data-board-presentation|data-board-share|boardShareUrl|board-presentation-mode/);
 assert.match(daily,/Print this view/);
 assert.match(daily,/data-ux-print/);
});
