import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../src/aisg-board-inspired-sitewide.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const board=readFileSync(new URL('../src/aisg-brand-duotone.css',import.meta.url),'utf8');

test('sitewide scheme matches the established Board palette and dot motif',()=>{
 assert.match(board,/--aisg-brand-navy:#10324e/);
 assert.match(board,/--aisg-brand-red:#a71f35/);
 assert.match(css,/--aisg-editorial-crimson:#a71f35/);
 assert.match(css,/--aisg-editorial-navy:#0b2b44/);
 assert.match(css,/background-image:radial-gradient\(circle,#ffe3e6/);
});
test('new brand CSS loads after existing design layers',()=>{
 const brandAt=html.indexOf('aisg-board-inspired-sitewide.css?v=20261111brand1');
 const oldAt=html.indexOf('leader-daily-workspaces.css');
 const headEnd=html.indexOf('</head>');
 assert.ok(oldAt>=0&&brandAt>oldAt&&headEnd>brandAt);
});
test('four non-Board workspaces share a navy-red cover and contrasting white headings',()=>{
 for(const role of ['faculty','student','sss','leader']){
  assert.match(css,new RegExp('#app\\[data-workspace="'+role+'"\\] \\.heading'));
  assert.match(css,new RegExp('#app\\[data-workspace="'+role+'"\\] \\.heading h1'));
 }
 assert.match(css,/linear-gradient\(110deg,#0b2b44/);
 assert.match(css,/color:#fff!important/);
 assert.match(css,/color:#e0e9f1!important/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) minmax\(145px,234px\)/);
});
test('Faculty preserves compact above-fold learner data and narrow widths reflow',()=>{
 assert.match(css,/#app\[data-workspace="faculty"\] \.heading\{\s*min-height:112px!important/);
 assert.match(css,/@media\(max-width:850px\)/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)!important/);
 assert.match(css,/@media\(max-width:480px\)/);
});
test('semantic grades, indices, support and Board cover are not recoloured',()=>{
 assert.doesNotMatch(css,/#app\[data-workspace="board"\]\s+\.board-heading\{/);
 for(const sel of ['.class-evidence-result{','.leader-report-fourband{',
    '.leader-experience-card{','.student-checkin-preview-tile{',
    '.leader-grade-flag{','.experience-metric-card{']){
   assert.ok(!css.includes(sel),'Semantic evidence must not get blanket styles: '+sel);
 }
 assert.match(css,/support case/);
 assert.match(css,/Evidence/);
});
test('focus, responsive, reduced-motion and print treatments are present',()=>{
 assert.match(css,/:focus-visible\{/);
 assert.match(css,/@media print\{/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
