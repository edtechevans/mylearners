import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const events={};
let navFoci=0,mainFoci=0,mainScrolls=0,pageScrolls=0;
const node={
 classList:{toggle(){}},
 innerHTML:'',
 addEventListener(name,fn){events[name]=fn},
 querySelector(selector){
  if(selector==='#main')return {
   focus(){mainFoci++},scrollIntoView(){mainScrolls++}
  };
  if(selector.startsWith('[data-role="'))return {focus(){navFoci++}};
  return null;
 }
};
const prefs=new Map();
const store={
 getItem(key){return prefs.get(key)||null},
 setItem(key,value){prefs.set(key,String(value))}
};
globalThis.document={
 getElementById(id){return id==='app'?node:null},
 body:{classList:{toggle(){}}},
 querySelector(){return null}
};
globalThis.localStorage=store;
globalThis.sessionStorage=store;
globalThis.location={hash:'#/faculty'};
globalThis.window={
 addEventListener(name,fn){events['window-'+name]=fn},
 scrollTo(){pageScrolls++},innerWidth:1440
};
await import('../src/student-experience-app.mjs');

function click(selector,dataset={}){
 events.click({target:{closest(query){
  return query===selector?{dataset}:null;
 }}});
}
test('all five views use a labelled semantic navigation with a single active dashboard',()=>{
 assert.match(node.innerHTML,/<nav class="roles" aria-label="Dashboard views">/);
 assert.match(node.innerHTML,/data-skip-main/);
 assert.match(node.innerHTML,/<main class="container" id="main" tabindex="-1">/);
 for(const role of ['faculty','student','sss','leader','board'])
  assert.match(node.innerHTML,new RegExp('data-role="'+role+'"'));
 assert.match(node.innerHTML,/data-role="sss" aria-pressed="false" aria-label="Open Student Support Services \(SSS\) demonstration dashboard"/);
 assert.match(node.innerHTML,/data-role="leader" aria-pressed="false" aria-label="Open Leaders dashboard"/);
 assert.equal((node.innerHTML.match(/data-role="[^"]+" aria-pressed="true"/g)||[]).length,1);
});
test('dashboard switching preserves location, restores focus and starts from top',()=>{
 const previous=pageScrolls;
 click('[data-role]',{role:'sss'});
 assert.match(node.innerHTML,/Student Support Services/);
 assert.match(node.innerHTML,/data-role="sss" aria-pressed="true"/);
 assert.equal(globalThis.location.hash,'#/sss');
 assert.ok(navFoci>0);
 assert.ok(pageScrolls>previous);
 for(const [role,headline] of [
  ['leader','Leadership overview'],['board','AISG AGGREGATED DATA'],
  ['student','My learning, my story.'],['faculty','My students']
 ]){
  click('[data-role]',{role});
  assert.match(node.innerHTML,new RegExp(headline));
  assert.equal((node.innerHTML.match(/data-role="[^"]+" aria-pressed="true"/g)||[]).length,1);
 }
});
test('skip to content works without changing the hash-based route',()=>{
 const before=globalThis.location.hash;
 click('[data-skip-main]');
 assert.ok(mainFoci>0);
 assert.ok(mainScrolls>0);
 assert.equal(globalThis.location.hash,before);
});
test('sitewide polish keeps accessible system fallback and scope of data-safe visuals',()=>{
 const css=readFileSync(new URL('../src/sitewide-polish.css',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../src/student-experience-app.mjs',import.meta.url),'utf8');
 assert.match(css,/font-family:'Noto Sans','Segoe UI'/);
 assert.match(css,/\.skip-link:focus-visible/);
 assert.match(css,/\.roster-daily th\{font-size:12px/);
 assert.match(css,/\.student-today-tile small\{color:var\(--ui-muted\)/);
 assert.match(css,/\.board-view \.board-nav-tabs/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(html,/sitewide-polish\.css/);
 assert.match(js,/return profileStart\+header\+profileKpis\+academics\+wellbeing\+guidance/);
 assert.match(js,/SSS_RECORDS=createSSSDemoRecords\(DATA\.students\)/);
});


test('Leaders use a simple four-metric overview with grade-eligible academic checks',()=>{
 click('[data-role]',{role:'leader'});
 assert.match(node.innerHTML,/Leadership overview/);
 assert.match(node.innerHTML,/Whole school · Fictional data · Fall 2026/);
 assert.equal((node.innerHTML.match(/<article class="leader-stat">/g)||[]).length,4);
 assert.match(node.innerHTML,/Report card coverage/);
 assert.match(node.innerHTML,/leader-evidence-strip/);
 for(const name of ['IXL Mathematics','Core Phonics','F&P reading'])
  assert.ok(node.innerHTML.includes(name));
 assert.match(node.innerHTML,/Records available \/ eligible/);
 assert.match(node.innerHTML,/data-leader-panel="academics"/);
 assert.match(node.innerHTML,/data-leader-panel="patterns"/);
 events.change({target:{closest(query){
  return query==='[data-select]'?{dataset:{select:'grade'},value:'G12'}:null;
 }}});
 assert.match(node.innerHTML,/Grade 12 · Fictional data · Fall 2026/);
 assert.doesNotMatch(node.innerHTML,/leader-evidence-strip/);
 assert.equal((node.innerHTML.match(/<article class="leader-stat">/g)||[]).length,4);
});
