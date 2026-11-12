import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateDemoData} from '../src/data.mjs';
import {everydayEvidenceForGrade} from '../src/faculty-everyday-columns.mjs';
import {
 SCREENER_BANDS,SCREENER_PAGE_SIZE,universalScreenerPercent,
 universalScreenerBand,universalScreenerFor,universalScreenerSummary,
 renderUniversalScreenerTile
} from '../src/universal-screener.mjs';
import {renderLeaderUniversalScreener} from '../src/universal-screener-leader.mjs';

const data=generateDemoData();
const fixture=data.students;
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('src/student-experience-app.mjs');
const leader=read('src/leader-daily-workspaces.mjs');
const css=read('src/universal-screener.css');
const html=read('index.html');

function luminance(hex){
 const values=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255)
  .map(x=>x<=0.04045?x/12.92:((x+.055)/1.055)**2.4);
 return values[0]*.2126+values[1]*.7152+values[2]*.0722;
}
const contrast=(a,b)=>{
 const [hi,lo]=[luminance(a),luminance(b)].sort((a,b)=>b-a);
 return (hi+.05)/(lo+.05);
};
test('Every fictional learner from PK through G12 has one stable 0–100% percentage',()=>{
 assert.ok(fixture.length>100);
 for(const student of fixture){
  const first=universalScreenerFor(student);
  const repeat=universalScreenerFor(student);
  assert.ok(first&&Number.isInteger(first.percent));
  assert.ok(first.percent>=0&&first.percent<=100);
  assert.deepEqual(first,repeat);
  assert.equal(universalScreenerPercent(student.id),first.percent);
  assert.equal(first.isDemo,true);
 }
 assert.equal(universalScreenerPercent(null),null);
 assert.equal(universalScreenerFor(null),null);
});
test('Inclusive, disjoint percentage boundaries match the four MYP colour bands',()=>{
 const boundaries=[[0,'low'],[24,'low'],[25,'mid-low'],[49,'mid-low'],
  [50,'mid-high'],[74,'mid-high'],[75,'high'],[100,'high']];
 for(const [value,key] of boundaries)assert.equal(universalScreenerBand(value)?.key,key);
 for(const invalid of [-1,101,NaN,12.5,null,'50'])assert.equal(universalScreenerBand(invalid),null);
 assert.deepEqual(SCREENER_BANDS.map(b=>[b.min,b.max]),[[0,24],[25,49],[50,74],[75,100]]);
 for(const band of SCREENER_BANDS){
  assert.ok(contrast(band.ink,band.colour)>=4.5,band.key+' fails AA contrast');
  assert.match(css,new RegExp('us-band-'+band.key));
  assert.match(renderUniversalScreenerTile(
   fixture.find(s=>universalScreenerFor(s).band===band.key)),
   new RegExp('us-band-'+band.key));
 }
});
test('Faculty class tile exists at every grade and 116px adjustment keeps narrow layout',()=>{
 for(const grade of ['PK3','PK4','K',...Array.from({length:12},(_,i)=>'G'+(i+1))]){
  const cols=everydayEvidenceForGrade(grade);
  assert.equal(cols.filter(c=>c.kind==='screener').length,1,grade);
  assert.equal(cols[1].id,'screener',grade);
 }
 assert.match(app,/evidenceColWidth='116px'/);
 assert.match(app,/class="evidence-cell-open universal-screener-open"/);
 assert.match(app,/renderUniversalScreenerTile\(student\)/);
 assert.match(app,/Universal Screener · demo/);
 assert.match(html,/universal-screener\.css\?v=20261113us1/);
});
test('Leader summary distributes ALL learners once, filter produces only that band',()=>{
 const ss=fixture.filter(s=>s.grade==='G7');
 const summary=universalScreenerSummary(ss);
 assert.equal(summary.available,ss.length);
 assert.equal(Object.values(summary.counts).reduce((a,b)=>a+b,0),ss.length);
 assert.ok(summary.average>=0&&summary.average<=100);
 const full=renderLeaderUniversalScreener({students:ss,scopeLabel:'Grade 7'});
 assert.match(full,/Universal Screener/);
 assert.match(full,/data-leader-screener-grade/);
 assert.match(full,/data-leader-screener-band="mid-low"/);
 assert.match(full,/matching learners/);
 assert.match(full,/Entirely synthetic/);
 for(const band of SCREENER_BANDS){
  const scoped=renderLeaderUniversalScreener({students:ss,bandFilter:band.key,expanded:true});
  const count=(scoped.match(/data-leader-screener-student=/g)||[]).length/2;
  assert.equal(count,summary.counts[band.key],band.key);
 }
});
test('Leader full-school and individual views share the same learner value and allow drilldown',()=>{
 const student=fixture.find(x=>x.grade==='G7');
 const amount=universalScreenerFor(student).percent;
 const html=renderLeaderUniversalScreener({students:[student],expanded:true});
 assert.match(html,new RegExp('>'+amount+'%<'));
 assert.match(html,new RegExp('data-leader-screener-student="'+student.id+'"'));
 assert.match(leader,/renderUniversalScreenerTile\(student,\{compact:true\}\)/);
 assert.match(app,/renderLeaderUniversalScreener\(\{students:DATA.students/);
 assert.match(app,/screenerPanel:renderLeaderUniversalScreener/);
 assert.match(app,/state\.leaderScreenerBand/);
 assert.match(app,/data-leader-screener-student/);
 assert.match(read('src/evidence-preview-context.mjs'),/kind==='universal-screener'/);
});
test('Leader prototype list remains paged until expand and never labels demo bands as risk',()=>{
 const all=renderLeaderUniversalScreener({students:fixture});
 const visible=(all.match(/data-leader-screener-student=/g)||[]).length/2;
 assert.equal(visible,SCREENER_PAGE_SIZE);
 assert.match(all,/Show all/);
 assert.doesNotMatch(all,/high risk|low risk|at risk/i);
 const one=renderLeaderUniversalScreener({students:fixture.slice(0,3),gradeFilter:'G7'});
 assert.match(one,/3 with results/);
});
