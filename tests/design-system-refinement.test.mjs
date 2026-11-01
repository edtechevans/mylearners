import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderBoardOverview} from '../src/board-map-overview.mjs';
import {renderSSSLeadershipDashboard} from '../src/sss-leadership-ui.mjs';
import {generateDemoData} from '../src/data.mjs';
import {createSSSDemoRecords} from '../src/sss-demo-data.mjs';
import {seedSupportDemo} from '../src/support-workspace-data.mjs';
const css=readFileSync(new URL('../src/design-system-refinement.css',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function lum(hex){const c=hex.replace('#','').match(/../g).map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]}
const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
test('design system loads last and corrects low-contrast metadata',()=>{
 assert.ok(index.includes('design-system-refinement.css?v=20261102ds1'));
 assert.ok(index.indexOf('aisg-brand-duotone.css')<index.indexOf('design-system-refinement.css'));
 assert.ok(contrast('#566d75','#f8f7f4')>=4.5);
 assert.match(css,/\.heading-meta \.asof/);
 for(const token of ['--ds-muted','--ds-border','--ds-s4','--ds-r-card','--ds-focus'])assert.ok(css.includes(token));
});
test('Board leads with historical results and preserves four navigation cards',()=>{
 const view=renderBoardOverview({boardOverviewChart:'dp',boardDpMetric:'average',boardDpWorldBasis:'overall'});
 assert.ok(view.indexOf('board-historical-chart')<view.indexOf('board-strength-grid'));
 assert.match(view,/Our Results Over Time/);
 assert.equal((view.match(/class="board-strength-card"/g)||[]).length,4);
 assert.match(view,/data-board-dp-go="passRate"/);
 assert.match(view,/World IB · all Diploma\/retake results/);
});
test('SSS keeps caseload context once, with three actionable queues',()=>{
 const data=generateDemoData();
 const records=createSSSDemoRecords(data.students);
 const students=data.students.filter(s=>records.has(s.id));
 const view=renderSSSLeadershipDashboard(students,records,seedSupportDemo(data.students,records));
 assert.equal((view.match(/class="support-lead-metric"/g)||[]).length,2);
 assert.equal((view.match(/class="support-queue"/g)||[]).length,3);
});
test('all five workspaces and responsive breakpoints have dedicated styling',()=>{
 for(const token of ['faculty','student','leader','sss','board']){
  assert.ok(css.includes('data-workspace="'+token+'"'));
 }
 assert.match(css,/@media\(max-width:720px\)/);
 assert.match(css,/@media\(max-width:480px\)/);
 assert.doesNotMatch(css,/\.index-band-(low|high)/);
});
