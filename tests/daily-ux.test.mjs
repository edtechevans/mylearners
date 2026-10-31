import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normaliseNumber,compareEvidence,compareEvidenceSource,exportCsv,filteredRecords,parsePreferences,sortEvidenceRows} from '../src/daily-ux-core.mjs';
test('numbers retain their evidence units without merging scales',()=>{
 assert.equal(normaliseNumber('95%'),95);
 assert.equal(normaliseNumber('+8 RIT'),8);
 assert.equal(normaliseNumber('4 / 7'),4);
 assert.equal(normaliseNumber('—'),null);
 assert.equal(normaliseNumber('Not collected'),null);
 assert.equal(compareEvidence('4','12'),-8);
});
test('academic evidence sorts by numeric source rather than visual quartile and missing is last',()=>{
 assert.equal(compareEvidenceSource('Q3','Q2','6','5'),1);
 assert.equal(compareEvidenceSource('Q3','Q2','6','5',true),-1);
 assert.equal(compareEvidenceSource('Q1','Q1','2','8'),-6);
 assert.equal(compareEvidenceSource('Q1','Q1','2','8',true),6);
 assert.equal(compareEvidenceSource('—','Q4','','12'),1);
 assert.equal(compareEvidenceSource('—','Q4','','12',true),1);
 assert.equal(compareEvidenceSource('87%','93%'),-6);
});
test('search and scoped column filters preserve the underlying records',()=>{
 const input=[['Ana','85%','MAP'],['Bea','96%','Report'],['Sam','90%','MAP']];
 assert.deepEqual(filteredRecords(input,'a',{2:'MAP'}),[input[0],input[2]]);
 assert.equal(input.length,3);
 assert.deepEqual(sortEvidenceRows(input,1).map(r=>r[0]),['Ana','Sam','Bea']);
 assert.deepEqual(sortEvidenceRows(input,1,true).map(r=>r[0]),['Bea','Sam','Ana']);
});
test('CSV quotes are correctly escaped and remain separate fields',()=>{
 const csv=exportCsv(['Learner','Value'],[['Example, "Student"','5 / 7'],['Second','—']]);
 assert.match(csv,/\"Example, \"\"Student\"\"\"/);
 assert.match(csv,/Learner,Value/);
 assert.ok(csv.startsWith('\uFEFF'));
});
test('view preference parser rejects damaged configurations',()=>{
 assert.deepEqual(parsePreferences('{'),{});
 assert.deepEqual(parsePreferences('[]'),{});
 assert.deepEqual(parsePreferences('{"selected":"MAP"}'),{selected:'MAP'});
});
test('daily interaction layer is additive and connected to site shell',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../src/daily-ux.mjs',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/daily-ux.css',import.meta.url),'utf8');
 assert.match(html,/daily-ux\.css/);
 assert.match(html,/daily-ux\.mjs/);
 for(const key of ['MutationObserver','data-ux-view','data-ux-sort','data-ux-columns','data-ux-export','data-ux-find','ux-source-strip'])
  assert.match(js,new RegExp(key));
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/:focus-visible/);
 assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|sendBeacon|localStorage\.setItem\('student-/);
});
