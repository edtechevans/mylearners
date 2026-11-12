import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../src/compact-headers-microinteractions.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const original=readFileSync(new URL('../src/aisg-board-inspired-sitewide.css',import.meta.url),'utf8');

test('a single compact layer loads after the Board-inspired sitewide theme',()=>{
 const originalAt=html.indexOf('aisg-board-inspired-sitewide.css?v=20261111brand2');
 const compactAt=html.indexOf('compact-headers-microinteractions.css?v=20261111feel1');
 const appAt=html.indexOf('</head>');
 assert.ok(originalAt>0&&compactAt>originalAt&&appAt>compactAt);
});

test('compact operational covers apply to four workspaces but do not redesign Board cover',()=>{
 for(const role of ['faculty','student','sss','leader']){
  assert.match(css,new RegExp('data-workspace="'+role+'"'));
 }
 assert.match(css,/\.heading h1\{/);
 assert.match(css,/min-height:0!important/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) minmax\(145px,206px\)!important/);
 assert.doesNotMatch(css,/#app\[data-workspace="board"\]\s+\.board-heading/);
 assert.match(original,/linear-gradient\(110deg,#0b2b44/);
});

test('Leader introduces school scope once, with compact division and grade controls',()=>{
 for(const token of ['.leader-welcome{','.leader-welcome>h2{',
  '.leader-school-division-select{','.leader-daily-sources{',
  '.leader-division-choice{','.leader-division-hero{',
  '.leader-grade-bar{','.leader-scope-controls{']){
  assert.ok(css.includes(token),'Missing compact Leader treatment: '+token);
 }
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) minmax\(170px,218px\)!important/);
 assert.match(css,/\.leader-welcome \.leader-daily-source\{/);
});

test('all navigation feedback is bounded to controls and never semantic evidence',()=>{
 assert.match(css,/@media\(hover:hover\) and \(pointer:fine\)/);
 assert.match(css,/\.leader-division-choice:hover/);
 assert.match(css,/\.leader-review-open/);
 assert.match(css,/\.student-link/);
 assert.match(css,/\.faculty-concern-filter button/);
 assert.match(css,/\.support-small-button/);
 assert.match(css,/\.board-nav-tabs button/);
 assert.doesNotMatch(css,/\.class-evidence-result:hover\s*\{/);
 assert.doesNotMatch(css,/\.experience-metric-card:hover\s*\{/);
 assert.doesNotMatch(css,/\.board-dp-world-point:hover\s*\{/);
});

test('evidence popovers animate briefly but have no new context or changed numeric scales',()=>{
 assert.match(css,/\.evidence-preview-popup\{\s*animation:ml-preview-enter 140ms/);
 assert.match(css,/@keyframes ml-preview-enter/);
 for(const t of ['.evidence-heat{','.class-evidence-result{','.leader-experience-segments{']){
  assert.ok(!css.includes(t),'A semantic evidence cell was modified: '+t);
 }
});

test('mobile and touch avoid hover dependency and respect motion preferences',()=>{
 assert.match(css,/@media\(hover:none\), \(pointer:coarse\)/);
 assert.match(css,/min-height:42px!important/);
 assert.match(css,/@media\(max-width:850px\)/);
 assert.match(css,/@media\(max-width:480px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/animation:none!important/);
 assert.match(css,/transition:none!important/);
 assert.match(css,/outline:3px solid var\(--ml-interaction-ring\)!important/);
 assert.match(css,/@media print/);
});

test('scripted navigation honours reduced-motion settings, not just stylesheet animation',()=>{
 const app=readFileSync(new URL('../src/student-experience-app.mjs',import.meta.url),'utf8');
 assert.match(app,/const scrollMotion=\(\)=>globalThis\.window\?\.matchMedia/);
 assert.match(app,/behavior:scrollMotion\(\)/);
 assert.doesNotMatch(app,/behavior:'smooth'/);
 assert.match(html,/student-experience-app\.mjs\?v=20261112leaderdir1/);
});
