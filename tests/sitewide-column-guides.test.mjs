import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyColumnGuide,renderColumnGuide,installSitewideColumnGuides}
 from '../src/sitewide-column-guides.mjs';
import {polishUiText,polishPresentationMarkup} from '../src/sitewide-ui-copy.mjs';
import {SCREENER_BANDS} from '../src/universal-screener.mjs';
import {UFLI_GROUPS} from '../src/ufli-demo.mjs';
import {MAP_RIT_BANDS} from '../src/map-rit-achievement.mjs';
const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Universal Screener guide matches the four actual percent bands and colours',()=>{
 const g=classifyColumnGuide({label:'Universal Screener',family:'screener',role:'faculty'});
 assert.equal(g.rows.length,4);
 assert.deepEqual(g.rows.map(x=>x.label),SCREENER_BANDS.map(x=>x.label));
 assert.deepEqual(g.rows.map(x=>x.colour),SCREENER_BANDS.map(x=>x.colour));
 assert.match(g.description,/not validated screening benchmarks/);
 assert.match(g.note,/not an MYP grade/);
});
test('UFLI legend is categorical, not misleading reading achievement bands',()=>{
 const g=classifyColumnGuide({label:'UFLI Lesson',family:'lesson'});
 assert.equal(g.rows.length,4);
 assert.deepEqual(g.rows.map(x=>x.label),UFLI_GROUPS.map(x=>x.start+'–'+x.end));
 assert.deepEqual(g.rows.map(x=>x.colour),UFLI_GROUPS.map(x=>x.color));
 assert.match(g.note,/not independently establish mastery/);
});
test('MAP tooltip shows quintiles based on percentiles rather than RIT cutoffs',()=>{
 const g=classifyColumnGuide({label:'MAP Reading RIT'});
 assert.equal(g.rows.length,5);
 assert.deepEqual(g.rows.map(x=>x.label),MAP_RIT_BANDS.slice().reverse().map(x=>x.label));
 assert.ok(g.rows.every(x=>x.range.includes('percentile')));
 assert.match(g.description,/observed RIT-point growth/);
 assert.match(g.note,/not a substitute for official NWEA norms/);
});
test('Subject grade legend uses exact AISG palette while Early Years uses descriptors',()=>{
 const upper=classifyColumnGuide({label:'L&L',source:'Language & Literature',family:'report',stage:'upper'});
 assert.deepEqual(upper.rows.map(x=>x.label),['1–3','4','5–6','7']);
 assert.deepEqual(upper.rows.map(x=>x.colour),['#a6373f','#e4a15f','#a6bd88','#246b4f']);
 assert.match(upper.note,/not final issued/);
 const early=classifyColumnGuide({label:'Early Literacy',family:'report',stage:'elementary'});
 assert.equal(early.rows.length,0);
 assert.match(early.description,/not converted into MYP grades/);
 for(const grade of ['G3','G4','G5']){
  const pyp=classifyColumnGuide({label:'Arts',family:'report',stage:'elementary'});
  assert.equal(pyp.rows.length,0,grade+' must not show MYP subject bands');
 }
});
test('Engagement and Belonging get correct −2 to +2 bands, not report-card grades',()=>{
 for(const label of ['Engagement','Belonging']){
  const g=classifyColumnGuide({label,family:'experience'});
  assert.equal(g.rows.length,4);
  assert.deepEqual(g.rows.map(x=>x.colour),['#a6373f','#e4a15f','#a6bd88','#246b4f']);
  assert.match(g.description,/not the percentage agreeing/);
  assert.match(g.note,/not academic attainment/);
 }
});
test('Other sources have useful help without invented colour thresholds',()=>{
 for(const title of ['Attendance','WIDA','Support information','Learner','Class','Data coverage','Reporting window']){
  const g=classifyColumnGuide({label:title});
  assert.ok(g.title&&g.description&&g.subtitle,title);
  assert.equal(g.rows.length,0,title);
 }
 for(const label of ['Core Phonics','F&P Reading','Maia Flourishing']){
  const g=classifyColumnGuide({label});
  assert.deepEqual(g.rows.map(x=>x.label),['Q1','Q2','Q3','Q4']);
  assert.match(g.note,/same-grade/i);
 }
 const ixl=classifyColumnGuide({label:'IXL Math'});
 assert.deepEqual(ixl.rows.map(x=>x.label),[
  'Above grade','On grade','Below grade','Far below grade','Not completed']);
 assert.deepEqual(ixl.rows.slice(0,4).map(x=>x.colour),[
  '#216b58','#b6c9a4','#f0a95b','#9f3945']);
 const fallback=classifyColumnGuide({label:'Custom subject field'});
 assert.match(fallback.note,/no universal colour threshold/i);
});
test('HTML guidance is escaped and uses no additional keyboard tab stop',()=>{
 const html=renderColumnGuide(classifyColumnGuide({label:'<img src=x>'}));
 assert.match(html,/&lt;img src=x&gt;/);
 assert.doesNotMatch(html,/<img/);
 assert.doesNotMatch(html,/<button/);
 const src=get('src/sitewide-column-guides.mjs');
 assert.match(src,/aria-describedby/);
 assert.match(src,/active&&!active\.isConnected/);
 assert.match(src,/CSS-drawn marker adds NO text/);
 assert.match(src,/th\.removeAttribute\('title'\)/);
 assert.match(src,/!th\.hasAttribute\('data-map-rit-subject'\)/);
 assert.equal(installSitewideColumnGuides(null),null);
});
test('Sitewide product copy avoids repeated prototype labels while preserving data safeguards',()=>{
 for(const input of ['FICTIONAL DATA','Demo snapshot: 8 Oct 2026','Fictional student evidence',
  'Synthetic learning values','Demonstration only','demo results']){
  const cleaned=polishUiText(input);
  assert.doesNotMatch(cleaned,/\b(fictional|synthetic|demonstration|demo)\b/i,input);
 }
 assert.match(polishUiText('Not validated screening cutoffs or intervention decisions'),/Not validated/);
 assert.match(polishUiText('Not issued school report'),/Not issued/);
 const html=polishPresentationMarkup('<p title="Fictional values">Fictional results</p>');
 assert.doesNotMatch(html,/\bfictional\b/i);
 assert.match(html,/<p title="/);
 const app=get('src/student-experience-app.mjs'),site=get('index.html');
 assert.match(app,/polishPresentationMarkup\(content\)/);
 assert.match(app,/data-preserve-source-copy/);
 assert.match(app,/No live student records/i);
 assert.match(app,/sample learner profiles, classes and assessments/i);
 assert.match(site,/sitewide-column-guides\.css/);
 assert.match(site,/sitewide-ui-copy\.css/);
});
